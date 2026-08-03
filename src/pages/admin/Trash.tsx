import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Table } from '../../components/Table';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { RotateCcw, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { formatDriveDateRange } from '../../utils/dateFormat';

interface TrashRow {
  id: string;
  name: string;
  college: string;
  driveDate: string;
  driveDay2Date?: string;
  deletedOn: string;
  candidateCount: number;
}

export const Trash: React.FC = () => {
  const { db, restoreDrive, permanentlyDeleteDrive, ensureLoaded } = useApp();

  useEffect(() => { ensureLoaded(['trashedDrives', 'candidates'], { force: true }); }, [ensureLoaded]);
  const [purgeDriveId, setPurgeDriveId] = useState<string | null>(null);
  const [purgeConfirmOpen, setPurgeConfirmOpen] = useState(false);

  const rows = useMemo<TrashRow[]>(() => {
    return db.trashedDrives
      .map(d => ({
        id: d.id,
        name: d.name,
        college: d.college,
        driveDate: d.date,
        driveDay2Date: d.day2Date,
        deletedOn: new Date(d.deletedAt!).toLocaleDateString('en-GB', {
          day: 'numeric', month: 'short', year: 'numeric',
        }),
        candidateCount: db.candidates.filter(c => c.driveId === d.id).length,
      }));
  }, [db.trashedDrives, db.candidates]);

  const handleRestore = (row: TrashRow) => {
    restoreDrive(row.id);
    toast.success(`${row.name} restored.`);
  };

  const confirmPurge = () => {
    if (!purgeDriveId) return;
    const row = rows.find(r => r.id === purgeDriveId);
    permanentlyDeleteDrive(purgeDriveId);
    toast.success(`${row?.name ?? 'Drive'} permanently deleted.`);
    setPurgeConfirmOpen(false);
    setPurgeDriveId(null);
  };

  const purgeTarget = rows.find(r => r.id === purgeDriveId);

  const columns = [
    {
      header: 'NAME',
      accessor: 'name' as const,
      sortable: true,
      render: (row: TrashRow) => (
        <div className="space-y-0.5">
          <p className="font-semibold text-sm leading-snug">{row.name}</p>
          <p className="text-xs text-muted-foreground">{row.college}</p>
        </div>
      ),
    },
    {
      header: 'DRIVE DATES',
      accessor: 'driveDate' as const,
      sortable: true,
      render: (row: TrashRow) => (
        <p className="text-sm">{formatDriveDateRange(row.driveDate, row.driveDay2Date)}</p>
      ),
    },
    {
      header: 'CANDIDATES',
      accessor: 'candidateCount' as const,
      sortable: true,
      render: (row: TrashRow) => <p className="text-sm">{row.candidateCount}</p>,
    },
    {
      header: 'DELETED ON',
      accessor: 'deletedOn' as const,
      sortable: true,
      render: (row: TrashRow) => <p className="text-sm text-muted-foreground">{row.deletedOn}</p>,
    },
    {
      header: 'ACTIONS',
      render: (row: TrashRow) => (
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5"
            onClick={() => handleRestore(row)}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Restore
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            title="Delete permanently"
            onClick={() => { setPurgeDriveId(row.id); setPurgeConfirmOpen(true); }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Trash</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Deleted drives stay here until you restore them or delete them permanently.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="border rounded-lg p-12 text-center text-sm text-muted-foreground">
          Trash is empty.
        </div>
      ) : (
        <Table
          data={rows}
          columns={columns}
          searchPlaceholder="Search Trash"
          searchKey="name"
          initialSort={{ key: 'deletedOn', direction: 'desc' }}
          exportFileName="Trash_Export"
        />
      )}

      <AlertDialog open={purgeConfirmOpen} onOpenChange={v => { setPurgeConfirmOpen(v); if (!v) setPurgeDriveId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete "{purgeTarget?.name}" permanently?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. This drive and all {purgeTarget?.candidateCount ?? 0} candidate{purgeTarget?.candidateCount === 1 ? '' : 's'} registered under it will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-white"
              onClick={confirmPurge}
            >
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
