import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Table } from '../../components/Table';
import { Button } from '@/components/ui/button';

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
  const { db } = useApp();
  const navigate = useNavigate();

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
      };
    });
  }, [db.drives, db.candidates]);

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
    </div>
  );
};
