import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Table } from '../../components/Table';
import { Modal } from '../../components/Modal';
import type { CampusDrive } from '../../types';
import { Plus, Calendar, MapPin } from 'lucide-react';

export const CampusDrives: React.FC = () => {
  const { db, createDrive } = useApp();
  const [modalOpen, setModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [college, setCollege] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [targetHiring, setTargetHiring] = useState('');
  const [spocName, setSpocName] = useState('');
  const [spocContact, setSpocContact] = useState('');
  const [description, setDescription] = useState('');

  const resetForm = () => {
    setName('');
    setCollege('');
    setDate('');
    setLocation('');
    setTargetHiring('');
    setSpocName('');
    setSpocContact('');
    setDescription('');
  };

  const handleSave = (status: CampusDrive['status']) => {
    if (!name || !college || !date || !location || !targetHiring) {
      alert('Please fill all required fields.');
      return;
    }
    createDrive({
      name,
      college,
      date,
      location,
      targetHiring: parseInt(targetHiring),
      spocName,
      spocContact,
      description,
      status
    });
    resetForm();
    setModalOpen(false);
  };

  // Define Table Columns
  const columns = [
    {
      header: 'Drive Name',
      accessor: 'name',
      sortable: true,
      render: (row: CampusDrive) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <b style={{ color: 'var(--text-primary)' }}>{row.name}</b>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ID: {row.id}</span>
        </div>
      )
    },
    { header: 'College Name', accessor: 'college', sortable: true },
    {
      header: 'Date',
      accessor: 'date',
      sortable: true,
      render: (row: CampusDrive) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Calendar size={14} className="text-secondary" />
          {row.date}
        </span>
      )
    },
    {
      header: 'Location',
      accessor: 'location',
      sortable: true,
      render: (row: CampusDrive) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <MapPin size={14} className="text-secondary" />
          {row.location}
        </span>
      )
    },
    { header: 'Target', accessor: 'targetHiring', sortable: true },
    { header: 'Registered', accessor: 'registered', sortable: true },
    { header: 'Shortlisted', accessor: 'shortlisted', sortable: true },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (row: CampusDrive) => {
        let badgeClass = 'badge ';
        if (row.status === 'Completed') badgeClass += 'success';
        else if (row.status === 'Ongoing') badgeClass += 'warning';
        else if (row.status === 'Draft') badgeClass += 'error';
        else badgeClass += 'info';
        return <span className={badgeClass}>{row.status}</span>;
      }
    }
  ];

  // Filters configurations
  const tableFilters = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { label: 'Published', value: 'Published' },
        { label: 'Ongoing', value: 'Ongoing' },
        { label: 'Completed', value: 'Completed' },
        { label: 'Draft', value: 'Draft' }
      ]
    },
    {
      key: 'location',
      label: 'Location',
      options: Array.from(new Set(db.drives.map(d => d.location))).map(loc => ({
        label: loc,
        value: loc
      }))
    }
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Campus Drives</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
            Schedule and manage campus placement drives at top engineering colleges.
          </p>
        </div>

        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={16} />
            Create Drive
          </button>
        </div>
      </div>

      {/* Drives Directory Table */}
      <Table
        data={db.drives}
        columns={columns}
        filters={tableFilters}
        searchPlaceholder="Search drives or colleges..."
        searchKey={(d) => `${d.name} ${d.college}`}
        initialSort={{ key: 'date', direction: 'desc' }}
        exportFileName="Campus_Drives_Export"
      />

      {/* Create Drive Dialog Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); resetForm(); }}
        title="Create Campus Drive"
        footer={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={() => handleSave('Draft')}>
              Save as Draft
            </button>
            <button className="btn btn-primary" onClick={() => handleSave('Published')}>
              Publish Drive
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Drive Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. IIT Madras Campus Recruitment 2026"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">College Name *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. IIT Madras"
                value={college}
                onChange={e => setCollege(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Location *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Chennai"
                value={location}
                onChange={e => setLocation(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Drive Date *</label>
              <input
                type="date"
                className="form-control"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Hiring Target *</label>
              <input
                type="number"
                className="form-control"
                placeholder="e.g. 25"
                value={targetHiring}
                onChange={e => setTargetHiring(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">College SPOC Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Prof. R. Ramanujan"
                value={spocName}
                onChange={e => setSpocName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">SPOC Contact Number</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. +91 9876543210"
                value={spocContact}
                onChange={e => setSpocContact(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description / Special Instructions</label>
            <textarea
              className="form-control"
              placeholder="Provide information on eligibility, specific test rules, or department targets..."
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
