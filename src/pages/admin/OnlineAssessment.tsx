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
import { Copy, Link as LinkIcon, Pencil, Upload, Mail, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';
import type { CampusDrive, Candidate } from '../../types';

interface TestRow {
  id: string;
  name: string;
  college: string;
  accessMode: 'in-person' | 'remote';
  group: string;
  createdOn: string;
  lastActivity: string;
  studentCount: number;
  invited: number | null;
  participationPct: number;
  finishedPct: number;
  examDate?: string;
  examStartTime?: string;
  examEndTime?: string;
  emailPendingCount: number;
  status: 'Ongoing' | 'Deactivated' | 'Finished';
  ownerInitials: string;
  ownerName: string;
  ownerColor: string;
  team: string;
  assessmentUrl: string | null;
  assessmentPassword: string | null;
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

const formatExamDate = (date?: string) => {
  if (!date) return null;
  return new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const DRIVE_STATUS_MAP: Record<string, TestRow['status']> = {
  Ongoing:   'Ongoing',
  Published: 'Ongoing',
  Completed: 'Finished',
  Draft:     'Deactivated',
};

type CsvPreviewRow = { name: string; email: string; degree: string; registrationNumber: string };

export const OnlineAssessment: React.FC = () => {
  const { db, updateDrive, bulkImportCandidates, sendRemoteInvites, markAttendance } = useApp();
  const navigate = useNavigate();

  // ── Edit drive state ─────────────────────────────────────────────────────────
  const [editOpen, setEditOpen] = useState(false);
  const [editDrive, setEditDrive] = useState<CampusDrive | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftDate, setDraftDate] = useState('');
  const [draftLocation, setDraftLocation] = useState('');
  const [draftStatus, setDraftStatus] = useState<CampusDrive['status']>('Draft');
  const [draftAccessMode, setDraftAccessMode] = useState<CampusDrive['accessMode']>('in-person');
  const [draftTarget, setDraftTarget] = useState('');
  const [draftSpocName, setDraftSpocName] = useState('');
  const [draftSpocContact, setDraftSpocContact] = useState('');
  const [draftDescription, setDraftDescription] = useState('');

  // ── CSV import state ─────────────────────────────────────────────────────────
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [importingDriveId, setImportingDriveId] = useState<string | null>(null);
  const [csvPreviewOpen, setCsvPreviewOpen] = useState(false);
  const [csvPreviewRows, setCsvPreviewRows] = useState<CsvPreviewRow[]>([]);
  const [csvParsedData, setCsvParsedData] = useState<Parameters<typeof bulkImportCandidates>[1]>([]);

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
    setEditDrive(drive);
    setDraftName(drive.name);
    setDraftDate(drive.date);
    setDraftLocation(drive.location);
    setDraftStatus(drive.status);
    setDraftAccessMode(drive.accessMode ?? 'in-person');
    setDraftTarget(String(drive.targetHiring));
    setDraftSpocName(drive.spocName);
    setDraftSpocContact(drive.spocContact);
    setDraftDescription(drive.description);
    setEditOpen(true);
  };

  const handleSave = () => {
    if (!editDrive) return;
    updateDrive({
      ...editDrive,
      name: draftName,
      date: draftDate,
      location: draftLocation,
      status: draftStatus,
      accessMode: draftAccessMode,
      targetHiring: parseInt(draftTarget) || 0,
      spocName: draftSpocName,
      spocContact: draftSpocContact,
      description: draftDescription,
    });
    setEditOpen(false);
    toast.success('Drive updated successfully.');
  };

  // ── CSV import ───────────────────────────────────────────────────────────────
  const openCsvPicker = (driveId: string) => {
    setImportingDriveId(driveId);
    setTimeout(() => csvInputRef.current?.click(), 0);
  };

  const handleCsvFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !importingDriveId) return;
    e.target.value = '';

    const drive = db.drives.find(d => d.id === importingDriveId);
    if (!drive) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim());
      const dataLines = isNaN(Number(lines[0]?.split(',')[0]?.trim())) ? lines.slice(1) : lines;

      const parsed: Parameters<typeof bulkImportCandidates>[1] = [];
      const preview: CsvPreviewRow[] = [];

      dataLines.forEach(line => {
        const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        if (cols.length < 4) return;
        const [, regNum, name, email, phone, degree, specialization, gender, dateOfBirth,
               githubUrl, linkedinUrl, resumeUrl, codingPlatformUrls,
               tenthStr, twelfthStr, diplomaStr, ugStr, pgStr, backlogHistStr, currentBacklogStr] = cols;

        const genderNorm = gender === 'Female' ? 'Female' : gender === 'Other' ? 'Other' : 'Male';

        parsed.push({
          name: name || '',
          email: email || '',
          phone: phone || '',
          degree: degree || '',
          cgpa: parseFloat(ugStr) || 0,
          college: drive.college,
          gender: genderNorm as 'Male' | 'Female' | 'Other',
          registrationNumber: regNum,
          specialization,
          dateOfBirth,
          githubUrl,
          linkedinUrl,
          resumeUrl,
          codingPlatformUrls,
          tenth: parseFloat(tenthStr) || undefined,
          twelfth: parseFloat(twelfthStr) || undefined,
          diploma: parseFloat(diplomaStr) || undefined,
          ugMarks: parseFloat(ugStr) || undefined,
          pgMarks: parseFloat(pgStr) || undefined,
          backlogHistory: parseInt(backlogHistStr) || undefined,
          currentBacklogs: parseInt(currentBacklogStr) || undefined,
        });
        preview.push({ name: name || '', email: email || '', degree: degree || '', registrationNumber: regNum || '' });
      });

      setCsvParsedData(parsed);
      setCsvPreviewRows(preview);
      setCsvPreviewOpen(true);
    };
    reader.readAsText(file);
  };

  const confirmCsvImport = () => {
    if (!importingDriveId) return;
    const imported = bulkImportCandidates(importingDriveId, csvParsedData);
    setCsvPreviewOpen(false);
    setCsvParsedData([]);
    setCsvPreviewRows([]);
    setImportingDriveId(null);
    if (imported > 0) {
      toast.success(`${imported} student${imported !== 1 ? 's' : ''} imported successfully.`);
    } else {
      toast.info('No new students added — all emails already exist in the system.');
    }
  };

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
      const driveCandidates = db.candidates.filter(c => c.college === drive.college);
      const invited   = driveCandidates.filter(c => c.assessmentStatus !== 'Not Invited');
      const completed = invited.filter(c => c.assessmentStatus === 'Completed');
      const started   = invited.filter(
        c => c.assessmentStatus === 'InProgress' || c.assessmentStatus === 'Completed'
      );
      const participationPct = invited.length
        ? Math.round((started.length / invited.length) * 100) : 0;
      const finishedPct = invited.length
        ? Math.round((completed.length / invited.length) * 100) : 0;

      const emailPendingCount = drive.accessMode === 'remote'
        ? invited.filter(c => !c.inviteEmailSentAt).length
        : 0;

      const submissionTimes = invited
        .filter(c => c.assessmentSubmissionDate)
        .map(c => new Date(c.assessmentSubmissionDate!).getTime());
      const lastTs = submissionTimes.length ? Math.max(...submissionTimes) : null;

      const createdOn = new Date(drive.date).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
      });

      const linkedAsmId = drive.assessmentId
        ?? driveCandidates.find(c => c.assessmentId)?.assessmentId;
      const linkedAsm = linkedAsmId ? db.assessments.find(a => a.id === linkedAsmId) : null;
      const assessmentUrl = linkedAsm?.slug
        ? `${window.location.origin}/take/${linkedAsm.slug}` : null;
      const assessmentPassword = linkedAsm?.accessPassword ?? null;

      return {
        id:               drive.id,
        name:             drive.name,
        college:          drive.college,
        accessMode:       drive.accessMode ?? 'in-person',
        group:            'Default Group',
        createdOn,
        lastActivity:     relativeTime(lastTs),
        studentCount:     driveCandidates.length,
        invited:          invited.length || null,
        participationPct,
        finishedPct,
        examDate:         drive.examDate,
        examStartTime:    drive.examStartTime,
        examEndTime:      drive.examEndTime,
        emailPendingCount,
        status:           DRIVE_STATUS_MAP[drive.status] ?? 'Deactivated',
        ownerInitials:    OWNER.initials,
        ownerName:        OWNER.name,
        ownerColor:       OWNER.color,
        team:             drive.status,
        assessmentUrl,
        assessmentPassword,
      };
    });
  }, [db.drives, db.candidates, db.assessments]);

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
          <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded mt-0.5 ${
            row.accessMode === 'remote'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-amber-100 text-amber-700'
          }`}>
            {row.accessMode === 'remote' ? 'Remote' : 'In-Person'}
          </span>
        </div>
      ),
    },
    {
      header: 'STUDENTS',
      accessor: 'studentCount' as const,
      sortable: true,
      render: (row: TestRow) => (
        <div className="space-y-0.5">
          <p className="text-sm font-semibold">{row.studentCount}</p>
          <p className="text-xs text-muted-foreground">
            {row.invited != null ? `${row.invited} invited` : 'none invited'}
          </p>
        </div>
      ),
    },
    {
      header: 'EXAM SCHEDULE',
      accessor: 'examDate' as const,
      sortable: true,
      render: (row: TestRow) => {
        const dateStr = formatExamDate(row.examDate);
        if (!dateStr) return <span className="text-sm text-muted-foreground">—</span>;
        const hasWindow = row.accessMode === 'in-person' && row.examStartTime && row.examEndTime;
        return (
          <div className="space-y-0.5">
            <p className="text-sm font-medium">{dateStr}</p>
            {hasWindow && (
              <p className="text-xs text-muted-foreground">{row.examStartTime} – {row.examEndTime}</p>
            )}
          </div>
        );
      },
    },
    {
      header: 'PROGRESS',
      accessor: 'participationPct' as const,
      sortable: true,
      render: (row: TestRow) => {
        if (!row.invited) return <span className="text-sm text-muted-foreground">—</span>;
        return (
          <div className="space-y-0.5">
            <p className="text-sm"><span className="font-semibold">{row.participationPct}%</span> started</p>
            <p className="text-xs text-muted-foreground">{row.finishedPct}% finished</p>
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
    {
      header: 'ACTIONS',
      accessor: 'assessmentUrl' as const,
      sortable: false,
      render: (row: TestRow) => (
        <div className="flex items-center gap-1">
          {/* Edit */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title="Edit drive"
            onClick={() => openEdit(row.id)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>

          {/* Copy test URL */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={!row.assessmentUrl}
            title={row.assessmentUrl ? 'Copy test URL' : 'No assessment linked'}
            onClick={() => row.assessmentUrl && copyToClipboard(row.assessmentUrl, 'Test URL')}
          >
            <LinkIcon className="h-3.5 w-3.5" />
          </Button>

          {/* Copy password (in-person shared password) */}
          {row.accessMode === 'in-person' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              disabled={!row.assessmentPassword}
              title={row.assessmentPassword ? 'Copy shared test password' : 'No assessment linked'}
              onClick={() => row.assessmentPassword && copyToClipboard(row.assessmentPassword, 'Password')}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          )}

          {/* Import students CSV */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title="Import students from CSV"
            onClick={() => openCsvPicker(row.id)}
          >
            <Upload className="h-3.5 w-3.5" />
          </Button>

          {/* Send email invites (remote only) */}
          {row.accessMode === 'remote' && (
            <Button
              variant="ghost"
              size="icon"
              className={`h-7 w-7 ${row.emailPendingCount > 0 ? 'text-blue-600' : ''}`}
              title={row.emailPendingCount > 0
                ? `Send invites to ${row.emailPendingCount} pending candidate${row.emailPendingCount !== 1 ? 's' : ''}`
                : 'All emails sent'}
              disabled={row.emailPendingCount === 0}
              onClick={() => {
                const count = sendRemoteInvites(row.id);
                if (count > 0) {
                  toast.success(`Test invite emails sent to ${count} candidate${count !== 1 ? 's' : ''}.`);
                } else {
                  toast.info('All candidates already have emails sent.');
                }
              }}
            >
              <Mail className="h-3.5 w-3.5" />
            </Button>
          )}

          {/* Mark attendance (in-person only) */}
          {row.accessMode === 'in-person' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title="Mark attendance"
              disabled={!row.invited}
              onClick={() => openAttendance(row.id)}
            >
              <UserCheck className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const filters = [
    {
      key:   'status',
      label: 'Status',
      options: [
        { label: 'Ongoing',     value: 'Ongoing' },
        { label: 'Deactivated', value: 'Deactivated' },
        { label: 'Finished',    value: 'Finished' },
      ],
    },
    {
      key:   'accessMode',
      label: 'Mode',
      options: [
        { label: 'In-Person', value: 'in-person' },
        { label: 'Remote',    value: 'remote' },
      ],
    },
  ];

  // ── Attendance candidates (memoised off open state) ──────────────────────────
  const importingDriveName = importingDriveId
    ? (db.drives.find(d => d.id === importingDriveId)?.college ?? '')
    : '';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Tests</h1>
      </div>

      <Table
        data={rows}
        columns={columns}
        filters={filters}
        searchPlaceholder="Search Test"
        searchKey="name"
        exportFileName="Tests_Export"
      />

      {/* Hidden CSV file input */}
      <input
        ref={csvInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleCsvFileSelect}
      />

      {/* ── Edit Drive Sheet ── */}
      <Sheet open={editOpen} onOpenChange={v => { if (!v) setEditOpen(false); }}>
        <SheetContent side="right" className="sm:max-w-lg flex flex-col p-0">
          <SheetHeader className="px-6 py-4 border-b shrink-0">
            <SheetTitle>Edit Drive</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div className="space-y-1.5">
              <Label>Drive Name</Label>
              <Input value={draftName} onChange={e => setDraftName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={draftDate} onChange={e => setDraftDate(e.target.value)} />
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
              <Label>Target Hiring</Label>
              <Input type="number" value={draftTarget} onChange={e => setDraftTarget(e.target.value)} />
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
            <Button variant="outline" className="flex-1" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSave}>
              Save Changes
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── CSV Import Preview Sheet ── */}
      <Sheet open={csvPreviewOpen} onOpenChange={v => { if (!v) { setCsvPreviewOpen(false); setImportingDriveId(null); } }}>
        <SheetContent side="right" className="sm:max-w-lg flex flex-col p-0">
          <SheetHeader className="px-6 py-4 border-b shrink-0">
            <SheetTitle>Import Students</SheetTitle>
            <p className="text-sm text-muted-foreground">
              {importingDriveName && <span className="font-medium text-foreground">{importingDriveName} · </span>}
              {csvPreviewRows.length} student{csvPreviewRows.length !== 1 ? 's' : ''} found in CSV
            </p>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
            {csvPreviewRows.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No valid rows found in CSV.</p>
            ) : (
              csvPreviewRows.map((r, i) => (
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
            <Button variant="outline" className="flex-1" onClick={() => { setCsvPreviewOpen(false); setImportingDriveId(null); }}>
              Cancel
            </Button>
            <Button className="flex-1" disabled={csvPreviewRows.length === 0} onClick={confirmCsvImport}>
              Import {csvPreviewRows.length} Student{csvPreviewRows.length !== 1 ? 's' : ''}
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
