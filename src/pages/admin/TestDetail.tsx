import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Table } from '../../components/Table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from '@/components/ui/sheet';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Pencil,
  Share2,
  Eye,
  Settings,
  UserPlus,
  AlignLeft,
  Shield,
  Users,
  CheckCircle2,
  Info,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Plus,
  X,
  Search,
  Tag,
  Code,
  HelpCircle,
} from 'lucide-react';
import type { Question } from '../../types';

// ── helpers ──────────────────────────────────────────────────────────────────

const SECTION_ORDER: Question['topic'][] = [
  'Aptitude', 'Logical Reasoning', 'Technical', 'Coding', 'Verbal',
];

const difficultyColor = (d: Question['difficulty']) => {
  if (d === 'Easy') return 'bg-green-100 text-green-700';
  if (d === 'Hard') return 'bg-red-100 text-red-700';
  return 'bg-amber-100 text-amber-700';
};

const topicColor = (t: Question['topic']) => {
  const map: Record<string, string> = {
    Aptitude: 'bg-purple-100 text-purple-700',
    'Logical Reasoning': 'bg-blue-100 text-blue-700',
    Technical: 'bg-cyan-100 text-cyan-700',
    Coding: 'bg-orange-100 text-orange-700',
    Verbal: 'bg-pink-100 text-pink-700',
  };
  return map[t] ?? 'bg-gray-100 text-gray-700';
};

const scoreBand = (pct: number) => {
  if (pct >= 75) return 'Excellent';
  if (pct >= 50) return 'Good';
  if (pct >= 25) return 'Average';
  return 'Poor';
};

const scoreBandColor = (band: string) => {
  if (band === 'Excellent') return 'bg-green-100 text-green-700';
  if (band === 'Good') return 'bg-blue-100 text-blue-700';
  if (band === 'Average') return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
};

// ── types ─────────────────────────────────────────────────────────────────────

interface CandidateRow {
  id: string;
  name: string;
  email: string;
  status: string;
  startTime: string;
  percentage: number;
  band: string;
}

// ── Question picker sheet ─────────────────────────────────────────────────────

interface QuestionPickerProps {
  open: boolean;
  onClose: () => void;
  allQuestions: Question[];
  alreadyAdded: Set<string>;
  onAdd: (ids: string[]) => void;
}

const QuestionPicker: React.FC<QuestionPickerProps> = ({
  open, onClose, allQuestions, alreadyAdded, onAdd,
}) => {
  const [search, setSearch] = useState('');
  const [topicFilter, setTopicFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [diffFilter, setDiffFilter] = useState('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    return allQuestions.filter(q => {
      if (topicFilter !== 'all' && q.topic !== topicFilter) return false;
      if (typeFilter !== 'all' && q.type !== typeFilter) return false;
      if (diffFilter !== 'all' && q.difficulty !== diffFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!q.text.toLowerCase().includes(s) && !q.tags.some(t => t.toLowerCase().includes(s))) return false;
      }
      return true;
    });
  }, [allQuestions, topicFilter, typeFilter, diffFilter, search]);

  const toggle = (id: string) => {
    if (alreadyAdded.has(id)) return;
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleAdd = () => {
    onAdd(Array.from(selected));
    setSelected(new Set());
    onClose();
  };

  const handleClose = () => {
    setSelected(new Set());
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) handleClose(); }}>
      <SheetContent side="right" className="sm:max-w-2xl flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b shrink-0">
          <SheetTitle>Add questions from bank</SheetTitle>
        </SheetHeader>

        {/* Filters */}
        <div className="px-6 py-3 border-b shrink-0 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by text or tag…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <div className="flex gap-2">
            <Select value={topicFilter} onValueChange={setTopicFilter}>
              <SelectTrigger className="h-8 text-xs flex-1"><SelectValue placeholder="Topic" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Topics</SelectItem>
                {(['Aptitude', 'Logical Reasoning', 'Technical', 'Coding', 'Verbal'] as const).map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-8 text-xs flex-1"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {(['MCQ', 'Multiple Select', 'Coding', 'SQL', 'Descriptive'] as const).map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={diffFilter} onValueChange={setDiffFilter}>
              <SelectTrigger className="h-8 text-xs flex-1"><SelectValue placeholder="Difficulty" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {(['Easy', 'Medium', 'Hard'] as const).map(d => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Question list */}
        <div className="flex-1 overflow-y-auto divide-y">
          {filtered.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">No questions match your filters.</p>
          ) : (
            filtered.map(q => {
              const isAdded = alreadyAdded.has(q.id);
              const isSelected = selected.has(q.id);
              return (
                <button
                  key={q.id}
                  className={`w-full flex items-start gap-3 px-6 py-3 text-left transition-colors
                    ${isAdded ? 'opacity-60 cursor-default bg-muted/30' : 'hover:bg-muted/40 cursor-pointer'}
                    ${isSelected ? 'bg-primary/5' : ''}
                  `}
                  onClick={() => toggle(q.id)}
                  disabled={isAdded}
                >
                  {/* Checkbox */}
                  <div className={`mt-0.5 h-4 w-4 shrink-0 rounded border-2 flex items-center justify-center
                    ${isAdded ? 'border-green-500 bg-green-500' : isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'}`}
                  >
                    {(isAdded || isSelected) && (
                      <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug line-clamp-2">{q.text}</p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {q.tags.slice(0, 3).map(t => (
                        <span key={t} className="inline-flex items-center gap-1 text-[10px] rounded border bg-muted px-1.5 py-0.5 text-muted-foreground">
                          <Tag className="h-2 w-2" />{t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${topicColor(q.topic)}`}>{q.topic}</span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${difficultyColor(q.difficulty)}`}>{q.difficulty}</span>
                    <span className="text-[10px] text-muted-foreground">{q.marks} pts</span>
                    {isAdded && <span className="text-[10px] font-semibold text-green-600">Added</span>}
                    {!isAdded && (
                      <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                        {q.type === 'Coding' ? <Code className="h-2.5 w-2.5" /> : <HelpCircle className="h-2.5 w-2.5" />}
                        {q.type}
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        <SheetFooter className="px-6 py-4 border-t shrink-0 flex-row gap-2">
          <Button variant="outline" onClick={handleClose} className="flex-1">Cancel</Button>
          <Button
            onClick={handleAdd}
            disabled={selected.size === 0}
            className="flex-1"
          >
            Add {selected.size > 0 ? `${selected.size} question${selected.size > 1 ? 's' : ''}` : 'questions'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

export const TestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { db, updateDrive } = useApp();

  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const drive = useMemo(() => db.drives.find(d => d.id === id), [db.drives, id]);

  // Questions directly from the drive's own question list
  const driveQuestionIds = drive?.questionIds ?? [];
  const driveQuestions = useMemo(
    () => db.questions.filter(q => driveQuestionIds.includes(q.id)),
    [db.questions, driveQuestionIds],
  );

  const alreadyAddedSet = useMemo(() => new Set(driveQuestionIds), [driveQuestionIds]);

  // Group questions by topic section
  const sections = useMemo(() => {
    return SECTION_ORDER
      .map(topic => ({
        topic,
        questions: driveQuestions.filter(q => q.topic === topic),
      }))
      .filter(s => s.questions.length > 0);
  }, [driveQuestions]);

  const totalMarks = driveQuestions.reduce((s, q) => s + q.marks, 0);
  const estimatedMinutes = driveQuestions.length; // ~1 min per question

  // Candidate data for Candidates tab
  const driveCandidates = useMemo(
    () => (drive ? db.candidates.filter(c => c.college === drive.college) : []),
    [db.candidates, drive],
  );

  const candidateRows = useMemo<CandidateRow[]>(() => {
    return driveCandidates
      .filter(c => c.assessmentStatus !== 'Not Invited')
      .map(c => {
        const pct = c.assessmentScore != null && totalMarks > 0
          ? Math.round((c.assessmentScore / totalMarks) * 100)
          : 0;
        const band = scoreBand(pct);
        const statusLabel =
          c.assessmentStatus === 'Completed' ? 'Finished' :
          c.assessmentStatus === 'InProgress' ? 'In Progress' : 'Pending';
        const startTime = c.assessmentSubmissionDate
          ? new Date(c.assessmentSubmissionDate).toLocaleString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
              hour: 'numeric', minute: '2-digit', hour12: true,
            })
          : '—';
        return { id: c.id, name: c.name, email: c.email, status: statusLabel, startTime, percentage: pct, band };
      });
  }, [driveCandidates, totalMarks]);

  const overview = useMemo(() => {
    const invited = candidateRows.length;
    const completed = candidateRows.filter(r => r.status === 'Finished').length;
    const started = candidateRows.filter(r => r.status !== 'Pending').length;
    const participationPct = invited ? Math.round((started / invited) * 100) : 0;
    const counts = { Poor: 0, Average: 0, Good: 0, Excellent: 0 };
    for (const r of candidateRows) counts[r.band as keyof typeof counts]++;
    const bandPct = (k: keyof typeof counts) =>
      invited ? ((counts[k] / invited) * 100).toFixed(2) + '%' : '0%';
    return { invited, completed, participationPct, bandPct };
  }, [candidateRows]);

  // Handlers
  const toggleSection = (topic: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      next.has(topic) ? next.delete(topic) : next.add(topic);
      return next;
    });
  };

  const collapseAll = () => {
    setCollapsedSections(new Set(sections.map(s => s.topic)));
  };

  const removeQuestion = (qId: string) => {
    if (!drive) return;
    updateDrive({ ...drive, questionIds: driveQuestionIds.filter(id => id !== qId) });
    if (selectedQuestion?.id === qId) setSelectedQuestion(null);
  };

  const addQuestions = (ids: string[]) => {
    if (!drive) return;
    const unique = ids.filter(id => !alreadyAddedSet.has(id));
    if (unique.length === 0) return;
    updateDrive({ ...drive, questionIds: [...driveQuestionIds, ...unique] });
  };

  const candidateColumns = [
    {
      header: 'CANDIDATE',
      accessor: 'name' as const,
      sortable: true,
      render: (row: CandidateRow) => (
        <div>
          <p className="font-semibold text-sm">{row.name}</p>
          <p className="text-xs text-muted-foreground">{row.email}</p>
        </div>
      ),
    },
    {
      header: 'STATUS',
      accessor: 'status' as const,
      sortable: true,
      render: (row: CandidateRow) => {
        const cls =
          row.status === 'Finished' ? 'text-green-600 font-medium' :
          row.status === 'In Progress' ? 'text-amber-600 font-medium' :
          'text-muted-foreground';
        return <span className={`text-sm ${cls}`}>{row.status}</span>;
      },
    },
    {
      header: 'START TIME',
      accessor: 'startTime' as const,
      sortable: false,
      render: (row: CandidateRow) => (
        <span className="text-sm text-muted-foreground">{row.startTime}</span>
      ),
    },
    {
      header: 'PERCENTAGE',
      accessor: 'percentage' as const,
      sortable: true,
      render: (row: CandidateRow) => (
        <span className="text-sm">{row.status === 'Pending' ? '—' : `${row.percentage}%`}</span>
      ),
    },
    {
      header: 'SCORE BAND',
      accessor: 'band' as const,
      sortable: true,
      render: (row: CandidateRow) => {
        if (row.status === 'Pending') return <span className="text-sm text-muted-foreground">—</span>;
        return (
          <span className={`text-xs font-semibold px-2 py-1 rounded ${scoreBandColor(row.band)}`}>
            {row.band}
          </span>
        );
      },
    },
  ];

  const candidateFilters = [
    {
      key: 'status', label: 'Status',
      options: [
        { label: 'Finished', value: 'Finished' },
        { label: 'In Progress', value: 'In Progress' },
        { label: 'Pending', value: 'Pending' },
      ],
    },
    {
      key: 'band', label: 'Score Band',
      options: [
        { label: 'Excellent', value: 'Excellent' },
        { label: 'Good', value: 'Good' },
        { label: 'Average', value: 'Average' },
        { label: 'Poor', value: 'Poor' },
      ],
    },
  ];

  if (!drive) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Test not found.
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-background sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/online-assessment')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <span className="text-muted-foreground">Default Group</span>
          <span>/</span>
          <span className="truncate max-w-[320px]">{drive.name}</span>
          <Pencil className="h-3.5 w-3.5 text-muted-foreground cursor-pointer" />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon"><Share2 className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon"><Eye className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon"><Settings className="h-4 w-4" /></Button>
          <Button className="gap-2">
            <UserPlus className="h-4 w-4" />
            Invite candidates
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="questionnaire" className="flex-1">
        <div className="border-b bg-background">
          <TabsList className="h-auto rounded-none bg-transparent p-0 px-6 gap-0">
            <TabsTrigger
              value="questionnaire"
              className="flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent"
            >
              <AlignLeft className="h-4 w-4" />
              Questionnaire
            </TabsTrigger>
            <TabsTrigger
              value="integrity"
              className="flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent"
            >
              <Shield className="h-4 w-4" />
              Integrity &amp; experience
            </TabsTrigger>
            <TabsTrigger
              value="candidates"
              className="flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent"
            >
              <Users className="h-4 w-4" />
              Candidates
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ── Questionnaire Tab ── */}
        <TabsContent value="questionnaire" className="m-0 p-6">
          <div className="flex gap-6">
            {/* Left: question list */}
            <div className="flex-1 min-w-0">
              {/* Toolbar */}
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  {driveQuestions.length} questions &middot; {totalMarks} marks &middot; ~{estimatedMinutes} min
                </p>
                <div className="flex items-center gap-2">
                  {driveQuestions.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={collapseAll}>
                      Collapse all
                    </Button>
                  )}
                  <Button size="sm" className="gap-1.5" onClick={() => setPickerOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Add questions
                  </Button>
                </div>
              </div>

              {driveQuestions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 gap-3 border-2 border-dashed rounded-lg text-muted-foreground">
                  <p className="text-sm">No questions added to this test yet.</p>
                  <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setPickerOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Add from question bank
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {sections.map((sec, sIdx) => {
                    const collapsed = collapsedSections.has(sec.topic);
                    const sectionMarks = sec.questions.reduce((s, q) => s + q.marks, 0);
                    return (
                      <div key={sec.topic} className="border rounded-lg overflow-hidden">
                        {/* Section header */}
                        <button
                          className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted/60 text-left"
                          onClick={() => toggleSection(sec.topic)}
                        >
                          <div className="flex items-center gap-3">
                            {collapsed
                              ? <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                            <span className="font-semibold text-sm">{sIdx + 1}. {sec.topic}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Total Marks: {sectionMarks}</span>
                            <span>{sec.questions.length} question{sec.questions.length !== 1 ? 's' : ''}</span>
                          </div>
                        </button>

                        {!collapsed && (
                          <div className="divide-y">
                            {sec.questions.map((q, qIdx) => (
                              <div
                                key={q.id}
                                className={`group flex items-center gap-3 px-4 py-3 transition-colors cursor-pointer
                                  ${selectedQuestion?.id === q.id ? 'bg-primary/5 border-l-2 border-primary' : 'hover:bg-muted/30'}`}
                                onClick={() => setSelectedQuestion(q)}
                              >
                                <span className="text-xs text-muted-foreground w-6 shrink-0">#{qIdx + 1}</span>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded shrink-0 ${topicColor(q.topic)}`}>
                                  {q.topic}
                                </span>
                                <span className="text-sm flex-1 truncate">{q.text}</span>
                                <span className="text-xs text-muted-foreground shrink-0">{q.type}</span>
                                <span className="text-xs text-muted-foreground shrink-0">{q.marks} pts</span>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded shrink-0 ${difficultyColor(q.difficulty)}`}>
                                  {q.difficulty}
                                </span>
                                <button
                                  className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50 hover:text-red-500"
                                  title="Remove question"
                                  onClick={e => { e.stopPropagation(); removeQuestion(q.id); }}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: question preview */}
            {selectedQuestion && (
              <div className="w-80 shrink-0 border rounded-lg p-4 space-y-4 self-start sticky top-24">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Section: {selectedQuestion.topic}</p>
                    <h3 className="font-semibold text-sm leading-snug">{selectedQuestion.text}</h3>
                  </div>
                  <button
                    className="text-muted-foreground hover:text-foreground shrink-0 ml-2"
                    onClick={() => setSelectedQuestion(null)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {selectedQuestion.tags.map(tag => (
                    <span key={tag} className="text-xs bg-muted px-2 py-0.5 rounded">{tag}</span>
                  ))}
                </div>
                {selectedQuestion.options && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Options</p>
                    {selectedQuestion.options.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedQuestion.correctOptions?.includes(i) ? 'border-primary bg-primary' : 'border-muted-foreground'}`}>
                          {selectedQuestion.correctOptions?.includes(i) && (
                            <div className="h-1.5 w-1.5 rounded-full bg-white" />
                          )}
                        </div>
                        <span className="text-sm">{opt}</span>
                      </div>
                    ))}
                  </div>
                )}
                {selectedQuestion.type === 'Coding' && (
                  <div className="text-xs text-muted-foreground bg-muted rounded p-3">
                    <p className="font-medium mb-1">Coding Challenge</p>
                    <p>{selectedQuestion.testCases?.length ?? 0} test cases</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Integrity & Experience Tab ── */}
        <TabsContent value="integrity" className="m-0 p-6">
          <div className="max-w-3xl space-y-4">
            <div className="border rounded-lg p-6 flex gap-8">
              <div className="w-56 shrink-0">
                <h3 className="font-semibold text-base mb-1">Candidate experience</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Set the core rules for how the test runs and how candidates experience it
                </p>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-sm text-green-600">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Look's good!</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-blue-600">
                    <Info className="h-4 w-4" />
                    <span>Might need your attention</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 space-y-3 text-sm">
                {[
                  { icon: <Info className="h-4 w-4 text-blue-500" />, label: 'Test window:', value: 'Candidates can take the test anytime' },
                  { icon: <Info className="h-4 w-4 text-blue-500" />, label: 'Reminder:', value: 'No email reminder will be sent to candidates' },
                  { icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, label: 'Test attempts:', value: 'Candidates get only one attempt' },
                  { icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, label: 'Share Report:', value: 'Not shared with candidates' },
                  { icon: <Info className="h-4 w-4 text-blue-500" />, label: 'Greet Candidates:', value: 'Add a personalized welcome note before candidates start' },
                  { icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, label: 'Candidate device:', value: 'Test allowed only on computers' },
                ].map(item => (
                  <div key={item.label} className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0">{item.icon}</span>
                    <span className="font-medium shrink-0">{item.label}</span>
                    <span className="text-muted-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border rounded-lg p-6 flex gap-8">
              <div className="w-56 shrink-0">
                <h3 className="font-semibold text-base mb-1">Integrity experience</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Secure your test with AI proctoring or custom monitoring to prevent cheating
                </p>
                <div className="flex items-center gap-1.5 text-sm text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Action needed</span>
                </div>
              </div>
              <div className="flex-1 text-sm">
                <div className="flex items-start gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                  <span className="font-medium">Basic integrity settings</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  Full screen, screen switch alerts, and copy restrictions. Minimal protection.
                  Good for low-stakes tests but easy to bypass.
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Candidates Tab ── */}
        <TabsContent value="candidates" className="m-0 p-6 space-y-6">
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-sm mb-4">Overview</h3>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-3 uppercase tracking-wide">Test progress</p>
                <div className="flex gap-6 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Invited</p>
                    <p className="font-bold text-lg">{overview.invited}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />Completed
                    </p>
                    <p className="font-bold text-lg">{overview.completed}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Participation</p>
                    <p className="font-bold text-lg">{overview.participationPct}%</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-3 uppercase tracking-wide">Score bands</p>
                <div className="flex gap-4 text-sm">
                  {(['Poor', 'Average', 'Good', 'Excellent'] as const).map(band => (
                    <div key={band}>
                      <p className="text-xs text-muted-foreground">{band}</p>
                      <p className="font-semibold">{overview.bandPct(band)}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-3 uppercase tracking-wide">Candidate feedback</p>
                <p className="text-sm text-muted-foreground">No feedback collected yet.</p>
              </div>
            </div>
          </div>

          {candidateRows.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              No candidates invited yet.
            </div>
          ) : (
            <Table
              data={candidateRows}
              columns={candidateColumns}
              filters={candidateFilters}
              searchPlaceholder="Search candidates"
              searchKey="name"
              exportFileName={`${drive.name}_Candidates`}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Question picker sheet */}
      <QuestionPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        allQuestions={db.questions}
        alreadyAdded={alreadyAddedSet}
        onAdd={addQuestions}
      />
    </div>
  );
};
