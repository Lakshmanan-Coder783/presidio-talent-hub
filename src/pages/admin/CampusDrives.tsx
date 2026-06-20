import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Table } from '../../components/Table';
import { Modal } from '../../components/Modal';
import type { CampusDrive } from '../../types';
import { Plus, Calendar, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

const driveStatusVariant = (status: CampusDrive['status']) => {
  switch (status) {
    case 'Completed': return 'default';
    case 'Ongoing': return 'secondary';
    case 'Published': return 'outline';
    case 'Draft': return 'destructive';
    default: return 'outline';
  }
};

export const CampusDrives: React.FC = () => {
  const { db, createDrive } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [college, setCollege] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [targetHiring, setTargetHiring] = useState('');
  const [spocName, setSpocName] = useState('');
  const [spocContact, setSpocContact] = useState('');
  const [description, setDescription] = useState('');

  const resetForm = () => {
    setName(''); setCollege(''); setDate(''); setLocation('');
    setTargetHiring(''); setSpocName(''); setSpocContact(''); setDescription('');
  };

  const handleSave = (status: CampusDrive['status']) => {
    if (!name || !college || !date || !location || !targetHiring) {
      alert('Please fill all required fields.');
      return;
    }
    createDrive({ name, college, date, location, targetHiring: parseInt(targetHiring), spocName, spocContact, description, status, accessMode: 'in-person' });
    resetForm();
    setModalOpen(false);
  };

  const columns = [
    {
      header: 'Drive Name',
      accessor: 'name' as const,
      sortable: true,
      render: (row: CampusDrive) => (
        <div>
          <p className="font-semibold text-sm">{row.name}</p>
          <p className="text-xs text-muted-foreground">ID: {row.id}</p>
        </div>
      ),
    },
    { header: 'College', accessor: 'college' as const, sortable: true },
    {
      header: 'Date',
      accessor: 'date' as const,
      sortable: true,
      render: (row: CampusDrive) => (
        <span className="flex items-center gap-1.5 text-sm">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          {row.date}
        </span>
      ),
    },
    {
      header: 'Location',
      accessor: 'location' as const,
      sortable: true,
      render: (row: CampusDrive) => (
        <span className="flex items-center gap-1.5 text-sm">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
          {row.location}
        </span>
      ),
    },
    { header: 'Target', accessor: 'targetHiring' as const, sortable: true },
    { header: 'Registered', accessor: 'registered' as const, sortable: true },
    { header: 'Selected', accessor: 'selected' as const, sortable: true },
    {
      header: 'Status',
      accessor: 'status' as const,
      sortable: true,
      render: (row: CampusDrive) => (
        <Badge variant={driveStatusVariant(row.status)}>{row.status}</Badge>
      ),
    },
  ];

  const tableFilters = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { label: 'Published', value: 'Published' },
        { label: 'Ongoing', value: 'Ongoing' },
        { label: 'Completed', value: 'Completed' },
        { label: 'Draft', value: 'Draft' },
      ],
    },
    {
      key: 'location',
      label: 'Location',
      options: Array.from(new Set(db.drives.map(d => d.location))).map(loc => ({ label: loc, value: loc })),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Campus Drives</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Schedule and manage campus placement drives at top engineering colleges.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Drive
        </Button>
      </div>

      <Table
        data={db.drives}
        columns={columns}
        filters={tableFilters}
        searchPlaceholder="Search drives or colleges..."
        searchKey={d => `${d.name} ${d.college}`}
        initialSort={{ key: 'date', direction: 'desc' }}
        exportFileName="Campus_Drives_Export"
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); resetForm(); }}
        title="Create Campus Drive"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleSave('Draft')}>Save as Draft</Button>
            <Button onClick={() => handleSave('Published')}>Publish Drive</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Drive Name *</Label>
            <Input placeholder="e.g. IIT Madras Campus Recruitment 2026" value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>College Name *</Label>
              <Input placeholder="e.g. IIT Madras" value={college} onChange={e => setCollege(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Location *</Label>
              <Input placeholder="e.g. Chennai" value={location} onChange={e => setLocation(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Drive Date *</Label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Hiring Target *</Label>
              <Input type="number" placeholder="e.g. 25" value={targetHiring} onChange={e => setTargetHiring(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>SPOC Name</Label>
              <Input placeholder="e.g. Prof. R. Ramanujan" value={spocName} onChange={e => setSpocName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>SPOC Contact</Label>
              <Input placeholder="+91 9876543210" value={spocContact} onChange={e => setSpocContact(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Description / Instructions</Label>
            <Textarea
              placeholder="Eligibility criteria, test rules, department targets..."
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
