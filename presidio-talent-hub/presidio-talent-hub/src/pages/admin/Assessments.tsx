import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Table } from '../../components/Table';
import { Modal } from '../../components/Modal';
import type { Assessment, AssessmentSection } from '../../types';
import { Plus, Trash2, ArrowUp, ArrowDown, ClipboardCopy, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const statusVariant = (status: Assessment['status']) => {
  if (status === 'Active') return 'default';
  if (status === 'Closed') return 'destructive';
  return 'secondary';
};

export const Assessments: React.FC = () => {
  const { db } = useApp();
  const [assessmentsList, setAssessmentsList] = useState<Assessment[]>(db.assessments);
  const [builderOpen, setBuilderOpen] = useState(false);

  const [name, setName] = useState('');
  const [type, setType] = useState<Assessment['type']>('Combined');
  const [duration, setDuration] = useState('60');
  const [activeSections, setActiveSections] = useState<AssessmentSection[]>([]);

  const availableSections: AssessmentSection['name'][] = ['Aptitude', 'Logical Reasoning', 'Technical', 'Coding', 'Verbal'];

  const handleAddSection = (secName: AssessmentSection['name']) => {
    if (activeSections.some(s => s.name === secName)) return;
    setActiveSections([...activeSections, { name: secName, questionCount: 10, marks: 20 }]);
  };

  const handleRemoveSection = (idx: number) => setActiveSections(activeSections.filter((_, i) => i !== idx));

  const handleSectionChange = (idx: number, field: 'questionCount' | 'marks', value: number) => {
    const next = [...activeSections];
    next[idx] = { ...next[idx], [field]: value };
    setActiveSections(next);
  };

  const handleMoveSection = (idx: number, dir: 'up' | 'down') => {
    if (dir === 'up' && idx === 0) return;
    if (dir === 'down' && idx === activeSections.length - 1) return;
    const next = [...activeSections];
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    setActiveSections(next);
  };

  const resetBuilderForm = () => { setName(''); setType('Combined'); setDuration('60'); setActiveSections([]); };

  const handleSaveAssessment = (status: Assessment['status']) => {
    if (!name || !duration || activeSections.length === 0) {
      alert('Fill all fields and add at least one section.');
      return;
    }
    const totalMarks = activeSections.reduce((s, sec) => s + sec.marks, 0);
    setAssessmentsList([
      {
        id: `ASM-${2000 + assessmentsList.length + 1}`,
        name, type, duration: parseInt(duration), totalMarks,
        candidatesAssignedCount: 0, status, sections: activeSections, questionIds: [],
      },
      ...assessmentsList,
    ]);
    setBuilderOpen(false);
    resetBuilderForm();
  };

  const handleClone = (asm: Assessment) => {
    setAssessmentsList([
      { ...asm, id: `ASM-${2000 + assessmentsList.length + 1}`, name: `${asm.name} (Copy)`, candidatesAssignedCount: 0, status: 'Draft' },
      ...assessmentsList,
    ]);
  };

  const columns = [
    {
      header: 'Assessment Name',
      accessor: 'name' as const,
      sortable: true,
      render: (row: Assessment) => (
        <div>
          <p className="font-semibold text-sm">{row.name}</p>
          <p className="text-xs text-muted-foreground">{row.id}</p>
        </div>
      ),
    },
    { header: 'Type', accessor: 'type' as const, sortable: true },
    { header: 'Duration', accessor: 'duration' as const, sortable: true, render: (row: Assessment) => `${row.duration} mins` },
    { header: 'Total Marks', accessor: 'totalMarks' as const, sortable: true, render: (row: Assessment) => `${row.totalMarks} pts` },
    { header: 'Candidates', accessor: 'candidatesAssignedCount' as const, sortable: true },
    {
      header: 'Status',
      accessor: 'status' as const,
      sortable: true,
      render: (row: Assessment) => <Badge variant={statusVariant(row.status)}>{row.status}</Badge>,
    },
    {
      header: 'Actions',
      render: (row: Assessment) => (
        <div className="flex gap-1.5">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleClone(row)} title="Clone">
            <ClipboardCopy className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => alert(`Editor: ${row.name}`)} title="Configure">
            <Settings className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const filters = [
    {
      key: 'status', label: 'Status',
      options: [{ label: 'Active', value: 'Active' }, { label: 'Draft', value: 'Draft' }, { label: 'Closed', value: 'Closed' }],
    },
    {
      key: 'type', label: 'Type',
      options: [
        { label: 'Combined', value: 'Combined' }, { label: 'Coding', value: 'Coding' },
        { label: 'Aptitude', value: 'Aptitude' }, { label: 'Technical', value: 'Technical' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Assessments Portal</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Build, clone, and schedule screening exams and coding evaluations.
          </p>
        </div>
        <Button onClick={() => setBuilderOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Assessment Builder
        </Button>
      </div>

      <Table
        data={assessmentsList}
        columns={columns}
        filters={filters}
        searchPlaceholder="Search assessments..."
        searchKey="name"
        initialSort={{ key: 'id', direction: 'desc' }}
        exportFileName="Assessments_Export"
      />

      <Modal
        isOpen={builderOpen}
        onClose={() => { setBuilderOpen(false); resetBuilderForm(); }}
        title="Assessment Builder"
        size="lg"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleSaveAssessment('Draft')}>Save Draft</Button>
            <Button onClick={() => handleSaveAssessment('Active')}>Save & Activate</Button>
          </div>
        }
      >
        <div className="grid grid-cols-2 gap-6">
          {/* Left: general config */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Assessment Name *</Label>
              <Input placeholder="e.g. SDE-1 Java Screening" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Type *</Label>
              <Select value={type} onValueChange={v => setType(v as Assessment['type'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Combined">Combined Test</SelectItem>
                  <SelectItem value="Coding">Coding Assessment</SelectItem>
                  <SelectItem value="Aptitude">Aptitude Test</SelectItem>
                  <SelectItem value="Technical">Technical MCQ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Duration (minutes) *</Label>
              <Input type="number" value={duration} onChange={e => setDuration(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Add Sections</Label>
              <div className="flex flex-wrap gap-2 pt-1">
                {availableSections.map(secName => {
                  const isAdded = activeSections.some(s => s.name === secName);
                  return (
                    <Button
                      key={secName}
                      size="sm"
                      variant={isAdded ? 'secondary' : 'outline'}
                      disabled={isAdded}
                      className="h-7 text-xs"
                      onClick={() => handleAddSection(secName)}
                    >
                      + {secName}
                    </Button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: section stack */}
          <div className="pl-4 border-l flex flex-col">
            <p className="font-semibold text-sm mb-3">Sections Stack</p>
            {activeSections.length === 0 ? (
              <div className="flex-1 flex items-center justify-center rounded-lg border-2 border-dashed p-8 text-center text-sm text-muted-foreground">
                Add sections from the left to build the exam structure.
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto max-h-72">
                {activeSections.map((sec, idx) => (
                  <div key={sec.name} className="flex items-center gap-2 rounded-lg border bg-card p-3">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{idx + 1}. {sec.name}</p>
                      <div className="flex gap-3 mt-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground">Qs:</span>
                          <Input
                            type="number"
                            className="h-6 w-14 text-xs px-1"
                            value={sec.questionCount}
                            onChange={e => handleSectionChange(idx, 'questionCount', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-muted-foreground">Marks:</span>
                          <Input
                            type="number"
                            className="h-6 w-14 text-xs px-1"
                            value={sec.marks}
                            onChange={e => handleSectionChange(idx, 'marks', parseInt(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <Button variant="ghost" size="icon" className="h-6 w-6" disabled={idx === 0} onClick={() => handleMoveSection(idx, 'up')}><ArrowUp className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" disabled={idx === activeSections.length - 1} onClick={() => handleMoveSection(idx, 'down')}><ArrowDown className="h-3 w-3" /></Button>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleRemoveSection(idx)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
