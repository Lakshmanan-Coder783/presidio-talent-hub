import React, { useMemo, useState } from 'react';
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
import { Copy, Link as LinkIcon, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import type { CampusDrive } from '../../types';

interface TestRow {
  id: string;
  name: string;
  group: string;
  createdOn: string;
  lastActivity: string;
  invited: number | null;
  participationPct: number;
  finishedPct: number;
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

const DRIVE_STATUS_MAP: Record<string, TestRow['status']> = {
  Ongoing:   'Ongoing',
  Published: 'Ongoing',
  Completed: 'Finished',
  Draft:     'Deactivated',
};

export const OnlineAssessment: React.FC = () => {
  const { db, updateDrive } = useApp();
  const navigate = useNavigate();

  const [editOpen, setEditOpen] = useState(false);
  const [editDrive, setEditDrive] = useState<CampusDrive | null>(null);

  // Draft form state
  const [draftName, setDraftName] = useState('');
  const [draftDate, setDraftDate] = useState('');
  const [draftLocation, setDraftLocation] = useState('');
  const [draftStatus, setDraftStatus] = useState<CampusDrive['status']>('Draft');
  const [draftTarget, setDraftTarget] = useState('');
  const [draftSpocName, setDraftSpocName] = useState('');
  const [draftSpocContact, setDraftSpocContact] = useState('');
  const [draftDescription, setDraftDescription] = useState('');

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} copied!`));
  };

  const openEdit = (driveId: string) => {
    const drive = db.drives.find(d => d.id === driveId);
    if (!drive) return;
    setEditDrive(drive);
    setDraftName(drive.name);
    setDraftDate(drive.date);
    setDraftLocation(drive.location);
    setDraftStatus(drive.status);
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
      targetHiring: parseInt(draftTarget) || 0,
      spocName: draftSpocName,
      spocContact: draftSpocContact,
      description: draftDescription,
    });
    setEditOpen(false);
    toast.success('Drive updated successfully.');
  };

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
        id:            drive.id,
        name:          drive.name,
        group:         'Default Group',
        createdOn,
        lastActivity:  relativeTime(lastTs),
        invited:       invited.length || null,
        participationPct,
        finishedPct,
        status:        DRIVE_STATUS_MAP[drive.status] ?? 'Deactivated',
        ownerInitials: OWNER.initials,
        ownerName:     OWNER.name,
        ownerColor:    OWNER.color,
        team:          drive.status,
        assessmentUrl,
        assessmentPassword,
      };
    });
  }, [db.drives, db.candidates, db.assessments]);

  const columns = [
    {
      header: 'NAME',
      accessor: 'name' as const,
      sortable: true,
      render: (row: TestRow) => (
        <button
          className="text-left group"
          onClick={() => navigate(`/admin/online-assessment/${row.id}`)}
        >
          <p className="font-semibold text-sm group-hover:text-primary transition-colors">{row.name}</p>
          <p className="text-xs text-muted-foreground">{row.group}</p>
        </button>
      ),
    },
    {
      header: 'CREATED ON',
      accessor: 'createdOn' as const,
      sortable: true,
      render: (row: TestRow) => (
        <span className="text-sm text-muted-foreground">{row.createdOn}</span>
      ),
    },
    {
      header: 'LAST ACTIVITY',
      accessor: 'lastActivity' as const,
      sortable: false,
      render: (row: TestRow) => (
        <span className="text-sm text-muted-foreground">{row.lastActivity}</span>
      ),
    },
    {
      header: 'INVITED',
      accessor: 'invited' as const,
      sortable: true,
      render: (row: TestRow) => (
        <span className="text-sm">{row.invited != null ? row.invited : '–'}</span>
      ),
    },
    {
      header: 'CANDIDATE PARTICIPATION',
      accessor: 'participationPct' as const,
      sortable: true,
      render: (row: TestRow) => (
        <div className="w-36 h-2 bg-gray-100 rounded-full overflow-hidden flex">
          <div
            className="h-full bg-green-500"
            style={{ width: `${row.finishedPct}%` }}
          />
          {row.participationPct > row.finishedPct && (
            <div
              className="h-full bg-amber-400"
              style={{ width: `${row.participationPct - row.finishedPct}%` }}
            />
          )}
        </div>
      ),
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
          <span className="text-sm truncate max-w-[140px]">{row.ownerName}</span>
        </div>
      ),
    },
    {
      header: 'ACTIONS',
      accessor: 'assessmentUrl' as const,
      sortable: false,
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
            className="h-7 w-7"
            disabled={!row.assessmentUrl}
            title={row.assessmentUrl ? `Copy URL` : 'No assessment linked'}
            onClick={() => row.assessmentUrl && copyToClipboard(row.assessmentUrl, 'Test URL')}
          >
            <LinkIcon className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={!row.assessmentPassword}
            title={row.assessmentPassword ? 'Copy password' : 'No assessment linked'}
            onClick={() => row.assessmentPassword && copyToClipboard(row.assessmentPassword, 'Password')}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
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
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Tests</h1>
        <Button>Start evaluation</Button>
      </div>

      <Table
        data={rows}
        columns={columns}
        filters={filters}
        searchPlaceholder="Search Test"
        searchKey="name"
        exportFileName="Tests_Export"
      />

      {/* Edit Drive Sheet */}
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
    </div>
  );
};
