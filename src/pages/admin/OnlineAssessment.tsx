import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Table } from '../../components/Table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from '@/components/ui/sheet';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { UserCheck, UserX, ExternalLink, FileText, Plus, Upload, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { CampusDrive, Candidate, CollegeStudent } from '../../types';
import { parseStudentFile, type ParsedStudentRow } from '../../utils/parseStudentFile';
import { computeDriveStatus, getDriveLinkedAssessment, getDriveDisplayName, isTwoBatchDrive } from '../../utils/driveStatus';
import { getVisibleDrives, canEditDriveConfig, canCreateDrive } from '../../utils/permissions';
import { formatDriveDateRange } from '../../utils/dateFormat';

interface TestRow {
  id: string;
  name: string;
  displayName: string;
  college: string;
  group: string;
  createdOn: string;
  createdAt: string;
  lastActivity: string;
  registered: number;
  driveDate: string;
  driveDay2Date?: string;
  pipelineProgress: number;
  status: CampusDrive['status'];
  ownerInitials: string;
  ownerName: string;
  team: string;
}

const getInitials = (name: string): string =>
  name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

const relativeTime = (ts: number | null): string => {
  if (!ts) return '—';
  const days = Math.floor((Date.now() - ts) / 86_400_000);
  if (days < 1)  return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30)  return `${days} days ago`;
  if (days < 60)  return 'a month ago';
  return `${Math.floor(days / 30)} months ago`;
};


const computePipelineProgress = (candidates: Candidate[]): number => {
  const rank = (c: Candidate): number => {
    if (c.funnelStage === 'Whiteboard Interview' || c.funnelStage === 'Offered' || c.funnelStage === 'Joined' || c.whiteboardFinalResult !== undefined) return 100;
    if (c.funnelStage === 'Coding Exercise') return 75;
    if (c.funnelStage === 'Interview') return 50;
    if (c.assessmentStatus === 'Completed' || c.assessmentStatus === 'InProgress') return 25;
    return 0;
  };
  return candidates.reduce((max, c) => Math.max(max, rank(c)), 0);
};

export const OnlineAssessment: React.FC = () => {
  const { db, currentUser, updateDrive, createDrive, deleteDrive, markAttendance, importCollegeStudents, bulkImportCandidates, loadCampusDrivePage } = useApp();

  useEffect(() => { loadCampusDrivePage(); }, [loadCampusDrivePage]);
  const navigate = useNavigate();
  const canEditDrives = canEditDriveConfig(currentUser?.user);
  const canCreateDrives = canCreateDrive(currentUser?.user);
  const visibleDrives = useMemo(() => getVisibleDrives(currentUser?.user, db), [currentUser?.user, db]);

  // ── Delete drive state ───────────────────────────────────────────────────────
  const [deleteDriveId, setDeleteDriveId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // ── Edit / Create drive state ────────────────────────────────────────────────
  const [editOpen, setEditOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editDrive, setEditDrive] = useState<CampusDrive | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftCollege, setDraftCollege] = useState('');
  const [draftRole, setDraftRole] = useState('');
  const [draftDate, setDraftDate] = useState('');
  const [draftDay2Date, setDraftDay2Date] = useState('');
  const [draftLocation, setDraftLocation] = useState('');

  const [draftOaBatchMode, setDraftOaBatchMode] = useState<'single' | 'two'>('single');

  // ── College student pool state ───────────────────────────────────────────────
  const collegeFileInputRef = useRef<HTMLInputElement>(null);
  const [activeImportCollege, setActiveImportCollege] = useState<string | null>(null);
  const [viewStudentsCollege, setViewStudentsCollege] = useState<string | null>(null);
  const [collegeCsvPreview, setCollegeCsvPreview] = useState<ParsedStudentRow[]>([]);
  const [collegeCsvPreviewOpen, setCollegeCsvPreviewOpen] = useState(false);
  const [pendingImportCollege, setPendingImportCollege] = useState<string | null>(null);

  // ── Attendance sheet state ───────────────────────────────────────────────────
  const [attendanceDriveId, setAttendanceDriveId] = useState<string | null>(null);
  const [attendanceOpen, setAttendanceOpen] = useState(false);

  // ── Students database (per-drive) import state ──────────────────────────────
  type DriveCsvImportRow = Parameters<typeof bulkImportCandidates>[1][number] & {
    onlineAssessmentBatch?: 'Batch 1' | 'Batch 2';
  };
  const driveFileInputRef = useRef<HTMLInputElement>(null);
  const [activeImportDriveId, setActiveImportDriveId] = useState<string | null>(null);
  const [driveCsvPreviewOpen, setDriveCsvPreviewOpen] = useState(false);
  const [driveCsvParsedData, setDriveCsvParsedData] = useState<DriveCsvImportRow[]>([]);
  const [driveCsvImportBatch, setDriveCsvImportBatch] = useState<'file' | 'Batch 1' | 'Batch 2'>('file');

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} copied!`));
  };

  // ── Edit drive ───────────────────────────────────────────────────────────────
  const openEdit = (driveId: string) => {
    const drive = db.drives.find(d => d.id === driveId);
    if (!drive) return;
    setIsCreating(false);
    setEditDrive(drive);
    setDraftName(drive.name);
    setDraftCollege(drive.college);
    setDraftRole(drive.role ?? '');
    setDraftDate(drive.date);
    setDraftDay2Date(drive.day2Date ?? '');
    setDraftLocation(drive.location);
    setEditOpen(true);
  };

  const openCreate = () => {
    setIsCreating(true);
    setEditDrive(null);
    setDraftName('');
    setDraftCollege('');
    setDraftRole('');
    setDraftDate('');
    setDraftDay2Date('');
    setDraftLocation('');
    setDraftOaBatchMode('single');
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (isCreating) {
      if (!draftName || !draftCollege || !draftDate || !draftLocation) {
        toast.error('Please fill all required fields.');
        return;
      }
      const drive = await createDrive({
        name: draftName,
        college: draftCollege,
        role: draftRole || undefined,
        date: draftDate,
        day2Date: draftDay2Date || undefined,
        location: draftLocation,
        description: '',
        status: 'Draft',
        oaBatchMode: draftOaBatchMode,
      });
      if (drive) toast.success('Drive created successfully.');
    } else {
      if (!editDrive) return;
      updateDrive({
        ...editDrive,
        name: draftName,
        role: draftRole || undefined,
        date: draftDate,
        day2Date: draftDay2Date || undefined,
        location: draftLocation,
      });
      toast.success('Drive updated successfully.');
    }
    setEditOpen(false);
    setIsCreating(false);
  };

  const confirmDeleteDrive = () => {
    if (!deleteDriveId) return;
    deleteDrive(deleteDriveId);
    toast.success('Drive moved to Trash.');
    setDeleteConfirmOpen(false);
    setDeleteDriveId(null);
  };

  // ── College student pool import ──────────────────────────────────────────────
  const openCollegeFilePicker = (college: string) => {
    setActiveImportCollege(college);
    setTimeout(() => collegeFileInputRef.current?.click(), 0);
  };

  const handleCollegeFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeImportCollege) return;
    e.target.value = '';
    const college = activeImportCollege;
    try {
      const rows = await parseStudentFile(file);
      setCollegeCsvPreview(rows);
      setPendingImportCollege(college);
      setCollegeCsvPreviewOpen(true);
    } catch {
      toast.error('Failed to parse file. Please check the format.');
      setActiveImportCollege(null);
    }
  };

  const confirmCollegeImport = async () => {
    if (!pendingImportCollege) return;
    const count = await importCollegeStudents(pendingImportCollege, collegeCsvPreview);
    setCollegeCsvPreviewOpen(false);
    setCollegeCsvPreview([]);
    setPendingImportCollege(null);
    setActiveImportCollege(null);
    if (count > 0) {
      toast.success(`${count} student${count !== 1 ? 's' : ''} added to ${pendingImportCollege} pool.`);
    } else {
      toast.info('No new students — all emails already exist in this college pool.');
    }
  };

  // ── Students database (per-drive) import ─────────────────────────────────────
  const openDriveFilePicker = (driveId: string) => {
    setActiveImportDriveId(driveId);
    setTimeout(() => driveFileInputRef.current?.click(), 0);
  };

  const handleDriveFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeImportDriveId) return;
    e.target.value = '';
    const drive = db.drives.find(d => d.id === activeImportDriveId);
    if (!drive) return;
    try {
      const rows = await parseStudentFile(file);
      setDriveCsvParsedData(rows.map(r => ({ ...r, college: drive.college })));
      setDriveCsvImportBatch('file');
      setDriveCsvPreviewOpen(true);
    } catch {
      toast.error('Failed to parse file. Please check the format.');
      setActiveImportDriveId(null);
    }
  };

  // "file" defers to each row's own "Online Assessment Batch" column (blank -> Batch 1);
  // an explicit Batch 1/Batch 2 selection overrides every row in this import.
  const resolveImportBatch = (
    row: { onlineAssessmentBatch?: 'Batch 1' | 'Batch 2' },
    override: 'file' | 'Batch 1' | 'Batch 2',
  ): 'Batch 1' | 'Batch 2' =>
    override === 'file' ? (row.onlineAssessmentBatch ?? 'Batch 1') : override;

  const confirmDriveCsvImport = async () => {
    if (!activeImportDriveId) return;
    const rowsWithBatch = driveCsvParsedData.map(r => ({ ...r, batch: resolveImportBatch(r, driveCsvImportBatch) }));
    const { imported, updated } = await bulkImportCandidates(activeImportDriveId, rowsWithBatch);
    setDriveCsvPreviewOpen(false);
    setDriveCsvParsedData([]);
    setActiveImportDriveId(null);
    if (imported > 0 || updated > 0) {
      const parts = [
        imported > 0 ? `${imported} new` : null,
        updated > 0 ? `${updated} updated` : null,
      ].filter(Boolean);
      toast.success(`${parts.join(', ')} student${imported + updated !== 1 ? 's' : ''}.`);
    } else {
      toast.info('No changes — nothing new or different from what\'s already registered.');
    }
  };

  const studentColumns = [
    { header: 'Name', accessor: 'name' as const, sortable: true },
    { header: 'Reg. No', accessor: 'registrationNumber' as const },
    { header: 'Email', accessor: 'email' as const },
    { header: 'Degree', accessor: 'degree' as const },
    { header: 'CGPA / UG%', accessor: 'cgpa' as const, sortable: true },
    {
      header: 'GitHub',
      render: (row: CollegeStudent) =>
        row.githubUrl ? (
          <a href={row.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm hover:underline">
            <ExternalLink className="h-3.5 w-3.5" />GitHub
          </a>
        ) : <span className="text-muted-foreground text-sm">—</span>,
    },
    {
      header: 'LinkedIn',
      render: (row: CollegeStudent) =>
        row.linkedinUrl ? (
          <a href={row.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
            <ExternalLink className="h-3.5 w-3.5" />LinkedIn
          </a>
        ) : <span className="text-muted-foreground text-sm">—</span>,
    },
    {
      header: 'Resume',
      render: (row: CollegeStudent) =>
        row.resumeUrl ? (
          <a href={row.resumeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-emerald-600 hover:underline">
            <FileText className="h-3.5 w-3.5" />Open
          </a>
        ) : <span className="text-muted-foreground text-sm">—</span>,
    },
  ];

  // ── Students database preview (spreadsheet-style) ────────────────────────────
  type DriveDbPreviewRow = { sno: number } & DriveCsvImportRow;

  const driveCsvPreviewTableData = useMemo<DriveDbPreviewRow[]>(
    () => driveCsvParsedData.map((r, i) => ({ sno: i + 1, ...r })),
    [driveCsvParsedData]
  );

  const driveDbPreviewColumns = [
    { header: 'S.No', accessor: 'sno' as const, sortable: true },
    { header: 'Reg. No', accessor: 'registrationNumber' as const, sortable: true },
    { header: 'Name', accessor: 'name' as const, sortable: true },
    { header: 'Email', accessor: 'email' as const },
    { header: 'Phone', accessor: 'phone' as const },
    { header: 'Degree', accessor: 'degree' as const, sortable: true },
    { header: 'Specialization', accessor: 'specialization' as const },
    { header: 'Gender', accessor: 'gender' as const },
    { header: 'DOB', accessor: 'dateOfBirth' as const },
    ...(isTwoBatchDrive(db.drives.find(d => d.id === activeImportDriveId)) ? [{
      header: 'Batch',
      render: (row: DriveDbPreviewRow) => (
        <span className="text-sm font-medium">{resolveImportBatch(row, driveCsvImportBatch)}</span>
      ),
    }] : []),
    {
      header: 'GitHub',
      render: (row: DriveDbPreviewRow) =>
        row.githubUrl ? (
          <a href={row.githubUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm hover:underline">
            <ExternalLink className="h-3.5 w-3.5" />GitHub
          </a>
        ) : <span className="text-muted-foreground text-sm">—</span>,
    },
    {
      header: 'LinkedIn',
      render: (row: DriveDbPreviewRow) =>
        row.linkedinUrl ? (
          <a href={row.linkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
            <ExternalLink className="h-3.5 w-3.5" />LinkedIn
          </a>
        ) : <span className="text-muted-foreground text-sm">—</span>,
    },
    {
      header: 'Resume',
      render: (row: DriveDbPreviewRow) =>
        row.resumeUrl ? (
          <a href={row.resumeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-emerald-600 hover:underline">
            <FileText className="h-3.5 w-3.5" />Open
          </a>
        ) : <span className="text-muted-foreground text-sm">—</span>,
    },
    { header: 'Coding Platforms', accessor: 'codingPlatformUrls' as const },
    { header: '10th', accessor: 'tenth' as const, sortable: true },
    { header: '12th', accessor: 'twelfth' as const, sortable: true },
    { header: 'Diploma', accessor: 'diploma' as const, sortable: true },
    { header: 'UG Marks', accessor: 'ugMarks' as const, sortable: true },
    { header: 'PG Marks', accessor: 'pgMarks' as const, sortable: true },
    { header: 'Backlog History', accessor: 'backlogHistory' as const, sortable: true },
    { header: 'Current Backlogs', accessor: 'currentBacklogs' as const, sortable: true },
  ];

  // ── Attendance sheet ─────────────────────────────────────────────────────────
  const openAttendance = (driveId: string) => {
    setAttendanceDriveId(driveId);
    setAttendanceOpen(true);
  };

  const attendanceDrive = attendanceDriveId ? db.drives.find(d => d.id === attendanceDriveId) : null;
  const attendanceCandidates = attendanceDrive
    ? db.candidates.filter(c => c.college === attendanceDrive.college && c.assessmentStatus !== 'Not Invited')
    : [];

  // ── Rows ──────────────────────────────────────────────────────────────────────
  const rows = useMemo<TestRow[]>(() => {
    return visibleDrives.map((drive) => {
      const driveCandidates = db.candidates.filter(c => c.driveId === drive.id);

      const submissionTimes = driveCandidates
        .filter(c => c.assessmentSubmissionDate)
        .map(c => new Date(c.assessmentSubmissionDate!).getTime());
      const lastTs = submissionTimes.length ? Math.max(...submissionTimes) : null;

      const createdOn = new Date(drive.date).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
      });

      const isPublished = getDriveLinkedAssessment(drive, driveCandidates, db.assessments)?.status === 'Active';
      const liveStatus = computeDriveStatus(driveCandidates, isPublished);

      const owner = drive.createdByUserId ? db.users.find(u => u.id === drive.createdByUserId) : undefined;
      const ownerName = owner?.name ?? '—';

      return {
        id:               drive.id,
        name:             drive.name,
        displayName:      getDriveDisplayName(drive),
        college:          drive.college,
        group:            'Default Group',
        createdOn,
        createdAt:        drive.createdAt,
        lastActivity:     relativeTime(lastTs),
        registered:       driveCandidates.length,
        driveDate:        drive.date,
        driveDay2Date:    drive.day2Date,
        pipelineProgress: computePipelineProgress(driveCandidates),
        status:           liveStatus,
        ownerInitials:    owner ? getInitials(ownerName) : '—',
        ownerName,
        team:             liveStatus,
      };
    });
  }, [visibleDrives, db.candidates, db.assessments, db.users]);

  // ── Columns ──────────────────────────────────────────────────────────────────
  const columns = [
    {
      header: 'NAME',
      accessor: 'name' as const,
      sortable: true,
      render: (row: TestRow) => (
        <div className="space-y-0.5">
          <button
            className="text-left group"
            onClick={() => navigate(`/admin/online-assessment/${row.id}`)}
          >
            <p className="font-semibold text-sm group-hover:text-primary transition-colors leading-snug">{row.displayName}</p>
          </button>
          <p className="text-xs text-muted-foreground">{row.college}</p>
        </div>
      ),
    },
    {
      header: 'REGISTERED',
      accessor: 'registered' as const,
      sortable: true,
      render: (row: TestRow) => (
        <p className="text-sm font-semibold">{row.registered}</p>
      ),
    },
    {
      header: 'STUDENTS DATABASE',
      render: (row: TestRow) => (
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 h-7 text-xs"
          onClick={() => openDriveFilePicker(row.id)}
        >
          <Upload className="h-3 w-3" />
          Upload
        </Button>
      ),
    },
    {
      header: 'DRIVE DATES',
      accessor: 'driveDate' as const,
      sortable: true,
      render: (row: TestRow) => (
        <p className="text-sm font-medium">{formatDriveDateRange(row.driveDate, row.driveDay2Date)}</p>
      ),
    },
    {
      header: 'PROGRESS',
      accessor: 'pipelineProgress' as const,
      sortable: true,
      render: (row: TestRow) => {
        const stages = ['Online Test', 'Interview', 'Coding Round', 'Whiteboarding'];
        const stageIdx = row.pipelineProgress / 25 - 1;
        const label = stageIdx >= 0 ? stages[stageIdx] : null;
        return (
          <div className="space-y-1 min-w-[110px]">
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${row.pipelineProgress}%` }}
                />
              </div>
              <span className="text-xs font-semibold tabular-nums w-8 text-right">
                {row.pipelineProgress}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{label ?? '—'}</p>
          </div>
        );
      },
    },
    {
      header: 'STATUS',
      accessor: 'status' as const,
      sortable: true,
      render: (row: TestRow) => {
        const cls =
          row.status === 'Ongoing'   ? 'text-amber-600 font-medium' :
          row.status === 'Completed' ? 'text-foreground font-medium' :
          row.status === 'Draft'     ? 'text-muted-foreground italic' :
                                        'text-muted-foreground';
        return <span className={`text-sm ${cls}`}>{row.status}</span>;
      },
    },
    {
      header: 'OWNER',
      accessor: 'ownerName' as const,
      sortable: true,
      render: (row: TestRow) => (
        <div className="flex items-center gap-2">
          <span className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground bg-primary shrink-0">
            {row.ownerInitials}
          </span>
          <span className="text-sm truncate max-w-[120px]">{row.ownerName}</span>
        </div>
      ),
    },
    ...(canEditDrives ? [{
      header: 'ACTIONS',
      render: (row: TestRow) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title="Edit drive"
            onClick={() => openEdit(row.id)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            title="Delete drive"
            onClick={() => { setDeleteDriveId(row.id); setDeleteConfirmOpen(true); }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    }] : []),
  ];

  const filters = [
    {
      key:   'status',
      label: 'All Status',
      options: [
        { label: 'Ongoing',   value: 'Ongoing' },
        { label: 'Completed', value: 'Completed' },
        { label: 'Draft',     value: 'Draft' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Tests</h1>
        {canCreateDrives && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            New Drive
          </Button>
        )}
      </div>

      <Table
        data={rows}
        columns={columns}
        filters={filters}
        searchPlaceholder="Search Test"
        searchKey="name"
        initialSort={{ key: 'createdAt', direction: 'desc' }}
        exportFileName="Tests_Export"
        toolbarAction={
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate('/admin/trash')}>
            <Trash2 className="h-4 w-4" />
            Trash
          </Button>
        }
      />

      {/* ── Delete Drive confirmation ── */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={v => { setDeleteConfirmOpen(v); if (!v) setDeleteDriveId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move this drive to Trash?</AlertDialogTitle>
            <AlertDialogDescription>
              This drive and its candidates will be moved to Trash and hidden from this list. You can restore it anytime from Trash, or delete it permanently from there.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-white"
              onClick={confirmDeleteDrive}
            >
              Move to Trash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Hidden file input for college student pool import */}
      <input
        ref={collegeFileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={handleCollegeFileChange}
      />

      {/* Hidden file input for per-drive students database import */}
      <input
        ref={driveFileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={handleDriveFileChange}
      />

      {/* ── Edit / Create Drive Sheet ── */}
      <Sheet open={editOpen} onOpenChange={v => { if (!v) { setEditOpen(false); setIsCreating(false); } }}>
        <SheetContent side="center" className="sm:max-w-lg flex flex-col p-0">
          <SheetHeader className="px-6 py-4 border-b shrink-0">
            <SheetTitle>{isCreating ? 'Create New Drive' : 'Edit Drive'}</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div className="space-y-1.5">
              <Label>Drive Name {isCreating && '*'}</Label>
              <Input
                placeholder={isCreating ? 'e.g. IIT Madras Campus Recruitment 2026' : ''}
                value={draftName}
                onChange={e => setDraftName(e.target.value)}
              />
            </div>

            {isCreating && (
              <div className="space-y-1.5">
                <Label>College Name *</Label>
                <Input
                  placeholder="e.g. Kongu Engineering College"
                  value={draftCollege}
                  onChange={e => setDraftCollege(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Role / Position</Label>
              <Input
                placeholder="e.g. Associate Engineer"
                value={draftRole}
                onChange={e => setDraftRole(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Day 1 Date</Label>
                <p className="text-xs text-muted-foreground -mt-1">Pre-placement & Online Test</p>
                <Input type="date" value={draftDate} onChange={e => setDraftDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Day 2 Date</Label>
                <p className="text-xs text-muted-foreground -mt-1">Interview, Coding & Whiteboarding</p>
                <Input type="date" value={draftDay2Date} onChange={e => setDraftDay2Date(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Input value={draftLocation} onChange={e => setDraftLocation(e.target.value)} />
            </div>
            {isCreating && (
              <div className="space-y-1.5">
                <Label>Online Assessment</Label>
                <p className="text-xs text-muted-foreground -mt-1">
                  Some colleges split candidates across a morning and afternoon session when there
                  aren't enough systems to test everyone at once — each batch gets its own link,
                  password, and question set.
                </p>
                <RadioGroup
                  value={draftOaBatchMode}
                  onValueChange={v => setDraftOaBatchMode(v as 'single' | 'two')}
                  className="pt-1"
                >
                  <div className="flex items-start gap-2">
                    <RadioGroupItem value="single" id="oa-batch-single" className="mt-0.5" />
                    <Label htmlFor="oa-batch-single" className="font-normal cursor-pointer">
                      <span className="font-medium">Single Batch</span>
                      <span className="block text-xs text-muted-foreground">One test for all candidates.</span>
                    </Label>
                  </div>
                  <div className="flex items-start gap-2">
                    <RadioGroupItem value="two" id="oa-batch-two" className="mt-0.5" />
                    <Label htmlFor="oa-batch-two" className="font-normal cursor-pointer">
                      <span className="font-medium">Two Batches</span>
                      <span className="block text-xs text-muted-foreground">Separate morning/afternoon tests.</span>
                    </Label>
                  </div>
                </RadioGroup>
                <p className="text-xs text-muted-foreground">
                  You can assign a SPOC afterward from the drive's Access tab, and switch this later
                  from Edit Drive Details if the plan changes.
                </p>
              </div>
            )}
          </div>

          <SheetFooter className="px-6 py-4 border-t shrink-0 flex-row gap-2">
            {isCreating ? (
              <Button className="flex-1" onClick={() => handleSave()}>
                Create Drive
              </Button>
            ) : (
              <>
                <Button variant="outline" className="flex-1" onClick={() => setEditOpen(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={() => handleSave()}>
                  Save Changes
                </Button>
              </>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── College Import Preview Sheet ── */}
      <Sheet open={collegeCsvPreviewOpen} onOpenChange={v => { if (!v) { setCollegeCsvPreviewOpen(false); setPendingImportCollege(null); setCollegeCsvPreview([]); setActiveImportCollege(null); } }}>
        <SheetContent side="center" className="sm:max-w-lg flex flex-col p-0">
          <SheetHeader className="px-6 py-4 border-b shrink-0">
            <SheetTitle>Import to College Pool</SheetTitle>
            <p className="text-sm text-muted-foreground">
              {pendingImportCollege && <span className="font-medium text-foreground">{pendingImportCollege} · </span>}
              {collegeCsvPreview.length} student{collegeCsvPreview.length !== 1 ? 's' : ''} found in file
            </p>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
            {collegeCsvPreview.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No valid rows found in file.</p>
            ) : (
              collegeCsvPreview.map((r, i) => (
                <div key={i} className="flex items-start justify-between border rounded px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium">{r.name}</p>
                    <p className="text-xs text-muted-foreground">{r.email}</p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p>{r.degree}</p>
                    {r.registrationNumber && <p>#{r.registrationNumber}</p>}
                  </div>
                </div>
              ))
            )}
          </div>
          <SheetFooter className="px-6 py-4 border-t shrink-0 flex-row gap-2">
            <Button variant="outline" className="flex-1" onClick={() => { setCollegeCsvPreviewOpen(false); setPendingImportCollege(null); setCollegeCsvPreview([]); setActiveImportCollege(null); }}>
              Cancel
            </Button>
            <Button className="flex-1" disabled={collegeCsvPreview.length === 0} onClick={confirmCollegeImport}>
              Import {collegeCsvPreview.length} Student{collegeCsvPreview.length !== 1 ? 's' : ''}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── Students Database (per-drive) Import Preview Sheet ── */}
      <Sheet open={driveCsvPreviewOpen} onOpenChange={v => { if (!v) { setDriveCsvPreviewOpen(false); setActiveImportDriveId(null); setDriveCsvParsedData([]); } }}>
        <SheetContent side="center" className="sm:max-w-[95vw] flex flex-col p-0">
          <SheetHeader className="px-6 py-4 border-b shrink-0">
            <SheetTitle>Import Students Database</SheetTitle>
            <p className="text-sm text-muted-foreground">
              {activeImportDriveId && (
                <span className="font-medium text-foreground">
                  {db.drives.find(d => d.id === activeImportDriveId)?.name} ·{' '}
                </span>
              )}
              {driveCsvParsedData.length} student{driveCsvParsedData.length !== 1 ? 's' : ''} found in file
            </p>
            {isTwoBatchDrive(db.drives.find(d => d.id === activeImportDriveId)) && (
              <div className="flex items-center gap-2 pt-2">
                <Label className="text-sm font-normal shrink-0">Batch</Label>
                <Select value={driveCsvImportBatch} onValueChange={v => setDriveCsvImportBatch(v as 'file' | 'Batch 1' | 'Batch 2')}>
                  <SelectTrigger className="w-[200px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="file">Use file's column</SelectItem>
                    <SelectItem value="Batch 1">Force Batch 1</SelectItem>
                    <SelectItem value="Batch 2">Force Batch 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {driveCsvParsedData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No valid rows found in file.</p>
            ) : (
              <Table
                data={driveCsvPreviewTableData}
                columns={driveDbPreviewColumns}
                searchPlaceholder="Search students…"
                searchKey="name"
                exportFileName="Students_Preview"
              />
            )}
          </div>
          <SheetFooter className="px-6 py-4 border-t shrink-0 flex-row gap-2">
            <Button variant="outline" className="flex-1" onClick={() => { setDriveCsvPreviewOpen(false); setActiveImportDriveId(null); setDriveCsvParsedData([]); }}>
              Cancel
            </Button>
            <Button className="flex-1" disabled={driveCsvParsedData.length === 0} onClick={confirmDriveCsvImport}>
              Import {driveCsvParsedData.length} Student{driveCsvParsedData.length !== 1 ? 's' : ''}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── College Student Pool Sheet ── */}
      <Sheet open={!!viewStudentsCollege} onOpenChange={v => { if (!v) setViewStudentsCollege(null); }}>
        <SheetContent side="center" className="sm:max-w-4xl flex flex-col p-0">
          <SheetHeader className="px-6 py-4 border-b shrink-0">
            <SheetTitle>Student Pool — {viewStudentsCollege}</SheetTitle>
            <p className="text-sm text-muted-foreground">
              {(db.collegeStudents ?? []).filter(s => s.college === viewStudentsCollege).length} students imported
            </p>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {viewStudentsCollege && (
              <Table
                data={(db.collegeStudents ?? []).filter(s => s.college === viewStudentsCollege)}
                columns={studentColumns}
                searchPlaceholder="Search students..."
                searchKey={s => `${s.name} ${s.email} ${s.degree} ${s.registrationNumber ?? ''}`}
                exportFileName={`${viewStudentsCollege}_Students`}
              />
            )}
          </div>
          <SheetFooter className="px-6 py-4 border-t shrink-0">
            <Button className="w-full" variant="outline" onClick={() => setViewStudentsCollege(null)}>
              Close
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── Attendance Sheet (in-person) ── */}
      <Sheet open={attendanceOpen} onOpenChange={v => { if (!v) { setAttendanceOpen(false); setAttendanceDriveId(null); } }}>
        <SheetContent side="center" className="sm:max-w-md flex flex-col p-0">
          <SheetHeader className="px-6 py-4 border-b shrink-0">
            <SheetTitle>Mark Attendance</SheetTitle>
            {attendanceDrive && (
              <p className="text-sm text-muted-foreground">{attendanceDrive.college}</p>
            )}
          </SheetHeader>

          <div className="px-6 py-3 border-b shrink-0 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {attendanceCandidates.filter((c: Candidate) => c.attendanceMarked).length} / {attendanceCandidates.length} present
            </p>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs gap-1.5"
              onClick={() => {
                attendanceCandidates.forEach((c: Candidate) => {
                  if (!c.attendanceMarked) markAttendance(c.id, true);
                });
                toast.success('All candidates marked as present.');
              }}
            >
              <UserCheck className="h-3 w-3" />
              Mark All Present
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-3 space-y-1.5">
            {attendanceCandidates.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm gap-2">
                <p>No invited candidates yet.</p>
                <p className="text-xs">Invite candidates first from the drive's Invite tab.</p>
              </div>
            ) : (
              attendanceCandidates.map((c: Candidate) => (
                <div key={c.id} className="flex items-center justify-between border rounded px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.email}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`h-7 text-xs gap-1 px-2 ${c.attendanceMarked ? 'text-green-600' : 'text-muted-foreground'}`}
                    onClick={() => markAttendance(c.id, !c.attendanceMarked)}
                  >
                    {c.attendanceMarked
                      ? <><UserCheck className="h-3 w-3" /> Present</>
                      : <><UserX className="h-3 w-3" /> Absent</>
                    }
                  </Button>
                </div>
              ))
            )}
          </div>

          <SheetFooter className="px-6 py-4 border-t shrink-0">
            <Button className="w-full" onClick={() => { setAttendanceOpen(false); setAttendanceDriveId(null); }}>
              Done
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};
