import React, { useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Table } from '../../components/Table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from '@/components/ui/sheet';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { UserCheck, UserX, ExternalLink, FileText, Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { CampusDrive, Candidate, CollegeStudent } from '../../types';
import { parseStudentFile, type ParsedStudentRow } from '../../utils/parseStudentFile';

interface TestRow {
  id: string;
  name: string;
  college: string;
  accessMode: 'in-person' | 'remote';
  group: string;
  createdOn: string;
  lastActivity: string;
  registered: number;
  driveDate: string;
  driveDay2Date?: string;
  pipelineProgress: number;
  status: 'Ongoing' | 'Finished';
  ownerInitials: string;
  ownerName: string;
  ownerColor: string;
  team: string;
}

const OWNER = { initials: 'LM', name: 'Lakshmanan M', color: 'bg-blue-600' };

const relativeTime = (ts: number | null): string => {
  if (!ts) return '—';
  const days = Math.floor((Date.now() - ts) / 86_400_000);
  if (days < 1)  return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30)  return `${days} days ago`;
  if (days < 60)  return 'a month ago';
  return `${Math.floor(days / 30)} months ago`;
};


const DRIVE_STATUS_MAP: Record<string, TestRow['status']> = {
  Ongoing:   'Ongoing',
  Published: 'Ongoing',
  Completed: 'Finished',
  Draft:     'Ongoing',
};

const computePipelineProgress = (candidates: Candidate[]): number => {
  if (candidates.some(c => c.whiteboardFinalResult !== undefined)) return 100;
  if (candidates.some(c => c.codingShortlisted !== undefined)) return 75;
  if (candidates.some(c => c.interviewShortlisted !== undefined)) return 50;
  if (candidates.some(c => c.assessmentStatus === 'Completed')) return 25;
  return 0;
};

export const OnlineAssessment: React.FC = () => {
  const { db, updateDrive, createDrive, markAttendance, importCollegeStudents } = useApp();
  const navigate = useNavigate();

  // ── Edit / Create drive state ────────────────────────────────────────────────
  const [editOpen, setEditOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editDrive, setEditDrive] = useState<CampusDrive | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftCollege, setDraftCollege] = useState('');
  const [draftDate, setDraftDate] = useState('');
  const [draftDay2Date, setDraftDay2Date] = useState('');
  const [draftLocation, setDraftLocation] = useState('');
  const [draftStatus, setDraftStatus] = useState<CampusDrive['status']>('Draft');
  const [draftAccessMode, setDraftAccessMode] = useState<CampusDrive['accessMode']>('in-person');

  const [draftSpocName, setDraftSpocName] = useState('');
  const [draftSpocContact, setDraftSpocContact] = useState('');
  const [draftDescription, setDraftDescription] = useState('');

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
    setDraftDate(drive.date);
    setDraftDay2Date(drive.day2Date ?? '');
    setDraftLocation(drive.location);
    setDraftStatus(drive.status);
    setDraftAccessMode(drive.accessMode ?? 'in-person');

    setDraftSpocName(drive.spocName);
    setDraftSpocContact(drive.spocContact);
    setDraftDescription(drive.description);
    setEditOpen(true);
  };

  const openCreate = () => {
    setIsCreating(true);
    setEditDrive(null);
    setDraftName('');
    setDraftCollege('');
    setDraftDate('');
    setDraftDay2Date('');
    setDraftLocation('');
    setDraftStatus('Draft');
    setDraftAccessMode('in-person');

    setDraftSpocName('');
    setDraftSpocContact('');
    setDraftDescription('');
    setEditOpen(true);
  };

  const handleSave = (statusOverride?: CampusDrive['status']) => {
    const effectiveStatus = statusOverride ?? draftStatus;
    if (isCreating) {
      if (!draftName || !draftCollege || !draftDate || !draftLocation) {
        toast.error('Please fill all required fields.');
        return;
      }
      createDrive({
        name: draftName,
        college: draftCollege,
        date: draftDate,
        day2Date: draftDay2Date || undefined,
        location: draftLocation,
        spocName: draftSpocName,
        spocContact: draftSpocContact,
        description: draftDescription,
        status: effectiveStatus,
        accessMode: draftAccessMode,
      });
      toast.success('Drive created successfully.');
    } else {
      if (!editDrive) return;
      updateDrive({
        ...editDrive,
        name: draftName,
        date: draftDate,
        day2Date: draftDay2Date || undefined,
        location: draftLocation,
        status: effectiveStatus,
        accessMode: draftAccessMode,
        spocName: draftSpocName,
        spocContact: draftSpocContact,
        description: draftDescription,
      });
      toast.success('Drive updated successfully.');
    }
    setEditOpen(false);
    setIsCreating(false);
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

  const confirmCollegeImport = () => {
    if (!pendingImportCollege) return;
    const count = importCollegeStudents(pendingImportCollege, collegeCsvPreview);
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
    return db.drives.map((drive) => {
      const driveCandidates = db.candidates.filter(c => c.driveId === drive.id);

      const submissionTimes = driveCandidates
        .filter(c => c.assessmentSubmissionDate)
        .map(c => new Date(c.assessmentSubmissionDate!).getTime());
      const lastTs = submissionTimes.length ? Math.max(...submissionTimes) : null;

      const createdOn = new Date(drive.date).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
      });

      return {
        id:               drive.id,
        name:             drive.name,
        college:          drive.college,
        accessMode:       drive.accessMode ?? 'in-person',
        group:            'Default Group',
        createdOn,
        lastActivity:     relativeTime(lastTs),
        registered:       drive.registered,
        driveDate:        drive.date,
        driveDay2Date:    drive.day2Date,
        pipelineProgress: computePipelineProgress(driveCandidates),
        status:           DRIVE_STATUS_MAP[drive.status] ?? 'Ongoing',
        ownerInitials:    OWNER.initials,
        ownerName:        OWNER.name,
        ownerColor:       OWNER.color,
        team:             drive.status,
      };
    });
  }, [db.drives, db.candidates]);

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
            <p className="font-semibold text-sm group-hover:text-primary transition-colors leading-snug">{row.name}</p>
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
      header: 'DRIVE DATES',
      accessor: 'driveDate' as const,
      sortable: true,
      render: (row: TestRow) => {
        const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', {
          day: 'numeric', month: 'short', year: 'numeric',
        });
        return (
          <div className="space-y-0.5">
            <p className="text-sm font-medium">{fmt(row.driveDate)}</p>
            {row.driveDay2Date && (
              <p className="text-xs text-muted-foreground">{fmt(row.driveDay2Date)}</p>
            )}
          </div>
        );
      },
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
          row.status === 'Ongoing'  ? 'text-amber-600 font-medium' :
          row.status === 'Finished' ? 'text-foreground font-medium' :
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
          <span
            className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${row.ownerColor}`}
          >
            {row.ownerInitials}
          </span>
          <span className="text-sm truncate max-w-[120px]">{row.ownerName}</span>
        </div>
      ),
    },
  ];

  const filters = [
    {
      key:   'status',
      label: 'All Status',
      options: [
        { label: 'Ongoing',  value: 'Ongoing' },
        { label: 'Finished', value: 'Finished' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Tests</h1>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          New Drive
        </Button>
      </div>

      <Table
        data={rows}
        columns={columns}
        filters={filters}
        searchPlaceholder="Search Test"
        searchKey="name"
        exportFileName="Tests_Export"
      />

      {/* Hidden file input for college student pool import */}
      <input
        ref={collegeFileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={handleCollegeFileChange}
      />

      {/* ── Edit / Create Drive Sheet ── */}
      <Sheet open={editOpen} onOpenChange={v => { if (!v) { setEditOpen(false); setIsCreating(false); } }}>
        <SheetContent side="right" className="sm:max-w-lg flex flex-col p-0">
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
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={draftStatus} onValueChange={v => setDraftStatus(v as CampusDrive['status'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Published">Published</SelectItem>
                  <SelectItem value="Ongoing">Ongoing</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Access Mode</Label>
              <Select value={draftAccessMode} onValueChange={v => setDraftAccessMode(v as CampusDrive['accessMode'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in-person">In-Person (team visits college)</SelectItem>
                  <SelectItem value="remote">Remote (online pre-placement)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {draftAccessMode === 'in-person'
                  ? 'Students log in with the shared test password given in the lab.'
                  : 'Students receive the test link via email and log in with their individual password.'}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>SPOC Name</Label>
              <Input value={draftSpocName} onChange={e => setDraftSpocName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>SPOC Contact</Label>
              <Input value={draftSpocContact} onChange={e => setDraftSpocContact(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={draftDescription}
                onChange={e => setDraftDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <SheetFooter className="px-6 py-4 border-t shrink-0 flex-row gap-2">
            {isCreating ? (
              <>
                <Button variant="outline" className="flex-1" onClick={() => handleSave('Draft')}>
                  Save as Draft
                </Button>
                <Button className="flex-1" onClick={() => handleSave('Published')}>
                  Publish Drive
                </Button>
              </>
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
        <SheetContent side="right" className="sm:max-w-lg flex flex-col p-0">
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

      {/* ── College Student Pool Sheet ── */}
      <Sheet open={!!viewStudentsCollege} onOpenChange={v => { if (!v) setViewStudentsCollege(null); }}>
        <SheetContent side="right" className="sm:max-w-4xl flex flex-col p-0">
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
        <SheetContent side="right" className="sm:max-w-md flex flex-col p-0">
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
