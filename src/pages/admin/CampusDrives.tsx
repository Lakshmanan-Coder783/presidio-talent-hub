import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Table } from '../../components/Table';
import { Modal } from '../../components/Modal';
import type { CampusDrive, CollegeStudent } from '../../types';
import {
  Plus, Calendar, MapPin, Upload, Eye, Users,
  ExternalLink, FileText, ChevronDown, ChevronRight, Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { parseStudentFile } from '../../utils/parseStudentFile';
import { toast } from 'sonner';

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
  const { db, createDrive, importCollegeStudents, deleteCollegeStudents } = useApp();

  // Create drive modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [college, setCollege] = useState('');
  const [date, setDate] = useState('');
  const [day2Date, setDay2Date] = useState('');
  const [location, setLocation] = useState('');

  const [spocName, setSpocName] = useState('');
  const [spocEmail, setSpocEmail] = useState('');
  const [description, setDescription] = useState('');

  // College student pool state
  const [studentModalCollege, setStudentModalCollege] = useState<string | null>(null);
  const [importingCollege, setImportingCollege] = useState<string | null>(null);
  const [expandedColleges, setExpandedColleges] = useState<Set<string>>(new Set());
  const [collegeSearch, setCollegeSearch] = useState('');

  const resetForm = () => {
    setName(''); setCollege(''); setDate(''); setDay2Date(''); setLocation('');
    setSpocName(''); setSpocEmail(''); setDescription('');
  };

  const handleSave = (status: CampusDrive['status']) => {
    if (!name || !college || !date || !location) {
      alert('Please fill all required fields.');
      return;
    }
    createDrive({ name, college, date, day2Date: day2Date || undefined, location, spocName, spocEmail, description, status, accessMode: 'in-person' });
    resetForm();
    setModalOpen(false);
  };

  const toggleCollege = (c: string) => {
    setExpandedColleges(prev => {
      const next = new Set(prev);
      next.has(c) ? next.delete(c) : next.add(c);
      return next;
    });
  };

  const drivesByCollege = useMemo(() => {
    const map = db.drives.reduce((m, d) => {
      if (!m.has(d.college)) m.set(d.college, []);
      m.get(d.college)!.push(d);
      return m;
    }, new Map<string, CampusDrive[]>());
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [db.drives]);

  const filteredColleges = useMemo(() => {
    if (!collegeSearch.trim()) return drivesByCollege;
    const q = collegeSearch.toLowerCase();
    return drivesByCollege.filter(([c]) => c.toLowerCase().includes(q));
  }, [drivesByCollege, collegeSearch]);

  const handleStudentFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    targetCollege: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setImportingCollege(targetCollege);
    try {
      const rows = await parseStudentFile(file);
      const count = importCollegeStudents(targetCollege, rows);
      if (count > 0) {
        toast.success(`${count} student${count !== 1 ? 's' : ''} added to ${targetCollege}.`);
      } else {
        toast.info('No new students added — all emails already exist in this college pool.');
      }
    } catch {
      toast.error('Failed to parse file. Please check the format.');
    } finally {
      setImportingCollege(null);
    }
  };

  const driveColumns = [
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

  const studentColumns = [
    { header: 'Name', accessor: 'name' as const, sortable: true },
    { header: 'Reg. No', accessor: 'registrationNumber' as const },
    { header: 'Email', accessor: 'email' as const },
    { header: 'Degree', accessor: 'degree' as const, sortable: true },
    { header: 'Specialization', accessor: 'specialization' as const },
    {
      header: 'CGPA / UG%',
      accessor: 'cgpa' as const,
      sortable: true,
      render: (row: CollegeStudent) => row.cgpa || '—',
    },
    {
      header: 'GitHub',
      render: (row: CollegeStudent) =>
        row.githubUrl ? (
          <a
            href={row.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-foreground hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            GitHub
          </a>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        ),
    },
    {
      header: 'LinkedIn',
      render: (row: CollegeStudent) =>
        row.linkedinUrl ? (
          <a
            href={row.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            LinkedIn
          </a>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        ),
    },
    {
      header: 'Resume',
      render: (row: CollegeStudent) =>
        row.resumeUrl ? (
          <a
            href={row.resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-emerald-600 hover:underline"
          >
            <FileText className="h-3.5 w-3.5" />
            Open
          </a>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        ),
    },
  ];

  const modalStudents = studentModalCollege
    ? (db.collegeStudents ?? []).filter(s => s.college === studentModalCollege)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Campus Drives</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Schedule and manage campus placement drives. Import student databases per college.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Drive
        </Button>
      </div>

      <Input
        placeholder="Search colleges..."
        value={collegeSearch}
        onChange={e => setCollegeSearch(e.target.value)}
        className="max-w-sm"
      />

      <div className="space-y-3">
        {filteredColleges.map(([collegeName, drives]) => {
          const poolStudents = (db.collegeStudents ?? []).filter(s => s.college === collegeName);
          const isExpanded = expandedColleges.has(collegeName);

          return (
            <div key={collegeName} className="rounded-lg border bg-card shadow-sm overflow-hidden">
              {/* College header */}
              <div className="flex items-center justify-between px-4 py-3 bg-muted/30">
                <button
                  className="flex items-center gap-2 font-semibold text-sm text-left hover:text-primary transition-colors"
                  onClick={() => toggleCollege(collegeName)}
                >
                  {isExpanded
                    ? <ChevronDown className="h-4 w-4 shrink-0" />
                    : <ChevronRight className="h-4 w-4 shrink-0" />}
                  {collegeName}
                  <Badge variant="outline" className="ml-1 text-xs font-normal">
                    {drives.length} drive{drives.length !== 1 ? 's' : ''}
                  </Badge>
                </button>

                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    {poolStudents.length} in pool
                  </span>

                  {/* Hidden file input per college */}
                  <input
                    type="file"
                    id={`file-${collegeName}`}
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                    onChange={e => handleStudentFileChange(e, collegeName)}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={importingCollege === collegeName}
                    onClick={() => document.getElementById(`file-${collegeName}`)?.click()}
                    className="gap-1.5 h-7 text-xs"
                  >
                    <Upload className="h-3 w-3" />
                    {importingCollege === collegeName ? 'Importing…' : 'Import Students'}
                  </Button>

                  {poolStudents.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 h-7 text-xs"
                      onClick={() => setStudentModalCollege(collegeName)}
                    >
                      <Eye className="h-3 w-3" />
                      View Students
                    </Button>
                  )}
                </div>
              </div>

              {/* Expanded drives table */}
              {isExpanded && (
                <div className="p-4">
                  <Table
                    data={drives}
                    columns={driveColumns}
                    searchPlaceholder="Search drives..."
                    searchKey={d => `${d.name} ${d.location}`}
                    initialSort={{ key: 'date', direction: 'desc' }}
                    exportFileName={`${collegeName}_Drives`}
                  />
                </div>
              )}
            </div>
          );
        })}

        {filteredColleges.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No colleges found matching "{collegeSearch}".
          </div>
        )}
      </div>

      {/* Student pool modal */}
      {studentModalCollege && (
        <Modal
          isOpen
          onClose={() => setStudentModalCollege(null)}
          title={`Student Pool — ${studentModalCollege}`}
          footer={
            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  deleteCollegeStudents(studentModalCollege);
                  setStudentModalCollege(null);
                  toast.success(`Student pool for ${studentModalCollege} cleared.`);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear Pool
              </Button>
              <Button variant="outline" size="sm" onClick={() => setStudentModalCollege(null)}>
                Close
              </Button>
            </div>
          }
        >
          <Table
            data={modalStudents}
            columns={studentColumns}
            searchPlaceholder="Search students..."
            searchKey={s => `${s.name} ${s.email} ${s.degree} ${s.registrationNumber ?? ''}`}
            exportFileName={`${studentModalCollege}_Students`}
          />
        </Modal>
      )}

      {/* Create drive modal */}
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
              <Label>Day 1 Date *</Label>
              <p className="text-xs text-muted-foreground -mt-1">Pre-placement & Online Test</p>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Day 2 Date</Label>
              <p className="text-xs text-muted-foreground -mt-1">Interview, Coding & Whiteboarding</p>
              <Input type="date" value={day2Date} onChange={e => setDay2Date(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>SPOC Name</Label>
              <Input placeholder="e.g. Prof. R. Ramanujan" value={spocName} onChange={e => setSpocName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>SPOC Email</Label>
              <Input type="email" placeholder="spoc@college.edu.in" value={spocEmail} onChange={e => setSpocEmail(e.target.value)} />
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
