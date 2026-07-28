import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Table } from '../../components/Table';
import { Modal } from '../../components/Modal';
import type { Assessment, AssessmentSection } from '../../types';
import { generateSlug, generateAccessPassword } from '../../lib/utils';
import { toast } from 'sonner';
import {
  Plus, Trash2, ArrowUp, ArrowDown, ClipboardCopy, Settings,
  RefreshCw, Copy, CheckCircle2, Link as LinkIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

const statusVariant = (status: Assessment['status']) => {
  if (status === 'Active') return 'default';
  if (status === 'Closed') return 'destructive';
  return 'secondary';
};

export const Assessments: React.FC = () => {
  const { db, createAssessment } = useApp();
  const navigate = useNavigate();

  const [builderOpen, setBuilderOpen] = useState(false);

  // Builder form state
  const [name, setName] = useState('');
  const [type, setType] = useState<Assessment['type']>('Combined');
  const [duration, setDuration] = useState('60');
  const [activeSections, setActiveSections] = useState<AssessmentSection[]>([]);
  const [slug, setSlug] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [accessPassword, setAccessPassword] = useState('');

  // Post-creation dialog
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [createdAssessment, setCreatedAssessment] = useState<Assessment | null>(null);

  // Credentials-viewer dialog (for existing assessments)
  const [credDialogOpen, setCredDialogOpen] = useState(false);
  const [credAssessment, setCredAssessment] = useState<Assessment | null>(null);

  const availableSections: AssessmentSection['name'][] = ['Aptitude', 'Logical Reasoning', 'Technical', 'Coding', 'Verbal'];

  // Auto-derive slug from name unless manually edited
  useEffect(() => {
    if (!slugManuallyEdited) {
      setSlug(generateSlug(name));
    }
  }, [name, slugManuallyEdited]);

  const openBuilder = () => {
    setAccessPassword(generateAccessPassword());
    setSlugManuallyEdited(false);
    setBuilderOpen(true);
  };

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

  const resetBuilderForm = () => {
    setName('');
    setType('Combined');
    setDuration('60');
    setActiveSections([]);
    setSlug('');
    setSlugManuallyEdited(false);
    setAccessPassword('');
  };

  const handleSaveAssessment = async (status: Assessment['status']) => {
    if (!name || !duration || activeSections.length === 0) {
      alert('Fill all fields and add at least one section.');
      return;
    }
    if (!slug) {
      alert('Please provide a URL slug.');
      return;
    }
    const slugExists = db.assessments.some(a => a.slug === slug);
    if (slugExists) {
      alert('This slug is already in use. Please choose a different one.');
      return;
    }
    const totalMarks = activeSections.reduce((s, sec) => s + sec.marks, 0);
    const newAsm = await createAssessment({
      name, type, duration: parseInt(duration), totalMarks,
      status, sections: activeSections, questionIds: [],
      slug, accessPassword,
    });
    if (!newAsm) return;
    setBuilderOpen(false);
    resetBuilderForm();

    if (status === 'Active') {
      setCreatedAssessment(newAsm);
      setSuccessDialogOpen(true);
    } else {
      toast.success('Draft saved successfully.');
    }
  };

  const handleClone = (asm: Assessment) => {
    createAssessment({
      ...asm,
      name: `${asm.name} (Copy)`,
      status: 'Draft',
      slug: generateSlug(`${asm.name}-copy-${Date.now()}`),
      accessPassword: generateAccessPassword(),
    });
    toast.success('Assessment cloned as Draft.');
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} copied!`));
  };

  const testUrl = (s?: string) => s ? `${window.location.origin}/take/${s}` : '';

  const columns = [
    {
      header: 'Assessment Name',
      accessor: 'name' as const,
      sortable: true,
      render: (row: Assessment) => (
        <div>
          <p className="font-semibold text-sm">{row.name}</p>
          <p className="text-xs text-muted-foreground">{row.id}{row.slug ? ` · /take/${row.slug}` : ''}</p>
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
          {row.slug && (
            <Button
              variant="ghost" size="icon" className="h-7 w-7"
              title="View credentials"
              onClick={() => { setCredAssessment(row); setCredDialogOpen(true); }}
            >
              <LinkIcon className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleClone(row)} title="Clone">
            <ClipboardCopy className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/admin/online-assessment/${row.id}`)} title="Configure">
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
        <Button onClick={openBuilder} className="gap-2">
          <Plus className="h-4 w-4" />
          Assessment Builder
        </Button>
      </div>

      <Table
        data={db.assessments}
        columns={columns}
        filters={filters}
        searchPlaceholder="Search assessments..."
        searchKey="name"
        initialSort={{ key: 'id', direction: 'desc' }}
        exportFileName="Assessments_Export"
      />

      {/* ── Assessment Builder Modal ── */}
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

            {/* Slug */}
            <div className="space-y-1.5">
              <Label>Test URL Slug *</Label>
              <div className="flex items-center rounded-md border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                <span className="pl-3 pr-1 text-xs text-muted-foreground whitespace-nowrap select-none">/take/</span>
                <input
                  className="flex-1 h-9 bg-transparent pr-3 text-sm outline-none"
                  placeholder="auto-generated-from-name"
                  value={slug}
                  onChange={e => {
                    setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                    setSlugManuallyEdited(true);
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">Auto-generated from name. Edit to customise.</p>
            </div>

            {/* Access Password */}
            <div className="space-y-1.5">
              <Label>Test Access Password</Label>
              <div className="flex gap-2">
                <Input
                  value={accessPassword}
                  readOnly
                  className="font-mono font-semibold tracking-widest"
                />
                <Button
                  type="button" variant="outline" size="icon"
                  onClick={() => setAccessPassword(generateAccessPassword())}
                  title="Regenerate password"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Shared password all candidates use at the test URL.</p>
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

      {/* ── Success Dialog (shown after activating a new assessment) ── */}
      <Dialog open={successDialogOpen} onOpenChange={open => { if (!open) setSuccessDialogOpen(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <DialogTitle>Assessment Created!</DialogTitle>
            </div>
            <DialogDescription>
              Share the URL and password below with candidates so they can access this test.
            </DialogDescription>
          </DialogHeader>

          {createdAssessment && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Candidate Test URL
                </Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={testUrl(createdAssessment.slug)}
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline" size="icon"
                    onClick={() => copyToClipboard(testUrl(createdAssessment.slug), 'URL')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Test Access Password
                </Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={createdAssessment.accessPassword ?? ''}
                    className="font-mono font-semibold tracking-widest"
                  />
                  <Button
                    variant="outline" size="icon"
                    onClick={() => copyToClipboard(createdAssessment.accessPassword ?? '', 'Password')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 p-3 text-xs text-amber-700 dark:text-amber-400">
                <strong>Security note:</strong> Share these credentials only with intended candidates.
                You can always retrieve them via the <LinkIcon className="inline h-3 w-3 mx-0.5" /> icon on the assessments table.
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSuccessDialogOpen(false)}>Close</Button>
            <Button onClick={() => {
              setSuccessDialogOpen(false);
              navigate(`/admin/online-assessment/${createdAssessment?.id}`);
            }}>
              Open Test Setup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Credentials Viewer Dialog (for existing assessments) ── */}
      <Dialog open={credDialogOpen} onOpenChange={open => { if (!open) setCredDialogOpen(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              Access Credentials
            </DialogTitle>
            {credAssessment && (
              <DialogDescription>{credAssessment.name}</DialogDescription>
            )}
          </DialogHeader>

          {credAssessment?.slug ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Candidate Test URL
                </Label>
                <div className="flex gap-2">
                  <Input readOnly value={testUrl(credAssessment.slug)} className="font-mono text-xs" />
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(testUrl(credAssessment.slug), 'URL')}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Test Access Password
                </Label>
                <div className="flex gap-2">
                  <Input readOnly value={credAssessment.accessPassword ?? '—'} className="font-mono font-semibold tracking-widest" />
                  {credAssessment.accessPassword && (
                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(credAssessment.accessPassword!, 'Password')}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No shareable URL configured for this assessment.</p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setCredDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
