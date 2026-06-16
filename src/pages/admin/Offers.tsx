import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Table } from '../../components/Table';
import type { Offer } from '../../types';
import { Award, Briefcase, UserCheck, HeartHandshake } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const offerStatusVariant = (status: Offer['status']): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (status === 'Joined' || status === 'Accepted') return 'default';
  if (status === 'Declined') return 'destructive';
  return 'secondary';
};

export const Offers: React.FC = () => {
  const { db, updateOfferStatus } = useApp();

  const stats = useMemo(() => {
    const total = db.offers.length;
    const accepted = db.offers.filter(o => o.status === 'Accepted' || o.status === 'Joined').length;
    const joined = db.offers.filter(o => o.status === 'Joined').length;
    const declined = db.offers.filter(o => o.status === 'Declined').length;
    const acceptRate = Math.round((accepted / (total || 1)) * 100);
    const joinRate = Math.round((joined / (accepted || 1)) * 100);
    return { total, accepted, joined, declined, acceptRate, joinRate };
  }, [db]);

  const kpis = [
    {
      label: 'Total Offers Released', value: stats.total,
      sub: 'Current campus cycle', icon: Briefcase,
      iconClass: 'text-primary bg-primary/10',
    },
    {
      label: 'Offers Accepted', value: stats.accepted,
      sub: `${stats.acceptRate}% Accept Rate`, icon: HeartHandshake,
      iconClass: 'text-emerald-600 bg-emerald-50',
    },
    {
      label: 'Candidates Joined', value: stats.joined,
      sub: `${stats.joinRate}% Joining Rate`, icon: UserCheck,
      iconClass: 'text-violet-600 bg-violet-50',
    },
    {
      label: 'Offers Declined', value: stats.declined,
      sub: `${Math.round((stats.declined / (stats.total || 1)) * 100)}% Decline Rate`, icon: Award,
      iconClass: 'text-destructive bg-destructive/10',
    },
  ];

  const columns = [
    { header: 'Offer ID', accessor: 'id' as const, sortable: true },
    { header: 'Candidate Name', accessor: 'candidateName' as const, sortable: true },
    { header: 'College', accessor: 'college' as const, sortable: true },
    { header: 'CTC (LPA)', accessor: 'ctc' as const, sortable: true, render: (row: Offer) => `${row.ctc} LPA` },
    { header: 'Released Date', accessor: 'dateReleased' as const, sortable: true },
    {
      header: 'Status',
      accessor: 'status' as const,
      render: (row: Offer) => <Badge variant={offerStatusVariant(row.status)}>{row.status}</Badge>,
    },
    {
      header: 'Update Status',
      render: (row: Offer) => (
        <Select
          value={row.status}
          onValueChange={v => updateOfferStatus(row.candidateId, v as Offer['status'])}
        >
          <SelectTrigger className="h-8 w-32 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Offered">Offered</SelectItem>
            <SelectItem value="Accepted">Accepted</SelectItem>
            <SelectItem value="Declined">Declined</SelectItem>
            <SelectItem value="Joined">Joined</SelectItem>
          </SelectContent>
        </Select>
      ),
    },
  ];

  const tableFilters = [
    {
      key: 'status', label: 'Status',
      options: [
        { label: 'Offered', value: 'Offered' },
        { label: 'Accepted', value: 'Accepted' },
        { label: 'Declined', value: 'Declined' },
        { label: 'Joined', value: 'Joined' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Offer Management</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Release corporate offers, monitor candidate decisions, and manage corporate joining compliance metrics.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(({ label, value, sub, icon: Icon, iconClass }) => (
          <Card key={label}>
            <CardContent className="pt-5 pb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground font-medium">{label}</p>
                <p className="text-3xl font-black mt-0.5 leading-none">{value}</p>
                <p className="text-xs text-muted-foreground mt-1">{sub}</p>
              </div>
              <div className={`rounded-xl p-3 shrink-0 ${iconClass}`}>
                <Icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Table
        data={db.offers}
        columns={columns}
        filters={tableFilters}
        searchPlaceholder="Search offers by candidate or college..."
        searchKey={(o: Offer) => `${o.candidateName} ${o.college}`}
        initialSort={{ key: 'id', direction: 'desc' }}
        exportFileName="Campus_Offers_Audit"
      />
    </div>
  );
};
