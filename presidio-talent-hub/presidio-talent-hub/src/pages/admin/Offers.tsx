import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Table } from '../../components/Table';
import type { Offer } from '../../types';
import { Award, Briefcase, UserCheck, HeartHandshake } from 'lucide-react';

export const Offers: React.FC = () => {
  const { db, updateOfferStatus } = useApp();

  // 1. Calculations
  const stats = useMemo(() => {
    const total = db.offers.length;
    const accepted = db.offers.filter(o => o.status === 'Accepted' || o.status === 'Joined').length;
    const joined = db.offers.filter(o => o.status === 'Joined').length;
    const declined = db.offers.filter(o => o.status === 'Declined').length;
    const pending = db.offers.filter(o => o.status === 'Offered').length;

    const acceptRate = Math.round((accepted / (total || 1)) * 100);
    const joinRate = Math.round((joined / (accepted || 1)) * 100);

    return {
      total,
      accepted,
      joined,
      declined,
      pending,
      acceptRate,
      joinRate
    };
  }, [db]);

  const handleStatusChange = (candidateId: string, status: Offer['status']) => {
    updateOfferStatus(candidateId, status);
  };

  const columns = [
    { header: 'Offer ID', accessor: 'id', sortable: true },
    { header: 'Candidate Name', accessor: 'candidateName', sortable: true },
    { header: 'College', accessor: 'college', sortable: true },
    { header: 'CTC (LPA)', accessor: 'ctc', sortable: true, render: (row: Offer) => `${row.ctc} LPA` },
    {
      header: 'Released Date',
      accessor: 'dateReleased',
      sortable: true
    },
    {
      header: 'Offer Status',
      accessor: 'status',
      render: (row: Offer) => {
        let badgeClass = 'badge ';
        if (row.status === 'Joined') badgeClass += 'success';
        else if (row.status === 'Accepted') badgeClass += 'success';
        else if (row.status === 'Declined') badgeClass += 'error';
        else badgeClass += 'warning';
        return <span className={badgeClass}>{row.status}</span>;
      }
    },
    {
      header: 'Actions',
      render: (row: Offer) => (
        <select
          className="select-filter"
          style={{ padding: '4px 8px', fontSize: '0.75rem', fontWeight: 600 }}
          value={row.status}
          onChange={e => handleStatusChange(row.candidateId, e.target.value as any)}
        >
          <option value="Offered">Offered</option>
          <option value="Accepted">Accepted</option>
          <option value="Declined">Declined</option>
          <option value="Joined">Joined</option>
        </select>
      )
    }
  ];

  const tableFilters = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { label: 'Offered', value: 'Offered' },
        { label: 'Accepted', value: 'Accepted' },
        { label: 'Declined', value: 'Declined' },
        { label: 'Joined', value: 'Joined' }
      ]
    }
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Offer Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
            Release corporate offers, monitor candidate decisions, and manage corporate joining compliance metrics.
          </p>
        </div>
      </div>

      {/* Offer metrics row */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: '28px' }}>
        <div className="kpi-card">
          <div className="kpi-data">
            <span className="kpi-label">Total Offers Released</span>
            <span className="kpi-value">{stats.total}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Current campus cycle</span>
          </div>
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary-blue)' }}>
            <Briefcase size={22} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-data">
            <span className="kpi-label">Offers Accepted</span>
            <span className="kpi-value">{stats.accepted}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>{stats.acceptRate}% Accept Rate</span>
          </div>
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)' }}>
            <HeartHandshake size={22} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-data">
            <span className="kpi-label">Candidates Joined</span>
            <span className="kpi-value">{stats.joined}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--primary-blue)', fontWeight: 600 }}>{stats.joinRate}% Joining Rate</span>
          </div>
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
            <UserCheck size={22} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-data">
            <span className="kpi-label">Offers Declined</span>
            <span className="kpi-value">{stats.declined}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--error)', fontWeight: 600 }}>
              {Math.round((stats.declined / (stats.total || 1)) * 100)}% decline rate
            </span>
          </div>
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)' }}>
            <Award size={22} />
          </div>
        </div>
      </div>

      {/* Offers directory Table */}
      <Table
        data={db.offers}
        columns={columns}
        filters={tableFilters}
        searchPlaceholder="Search offers by candidate or college..."
        searchKey={(o) => `${o.candidateName} ${o.college}`}
        initialSort={{ key: 'id', direction: 'desc' }}
        exportFileName="Campus_Offers_Audit"
      />
    </div>
  );
};
