import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Table } from '../../components/Table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from '@/components/ui/sheet';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  ArrowLeft, Pencil, Share2, Eye, Settings, UserPlus, AlignLeft, Shield, Users,
  CheckCircle2, Info, AlertTriangle, ChevronDown, ChevronRight, Plus, X, Search,
  Tag, Code, HelpCircle, Copy, Link as LinkIcon, Send, BarChart2, FileText,
  TrendingUp, Award, Download, RefreshCw, Save, ArrowUp, ArrowDown, Trash2,
} from 'lucide-react';
import type { Question, Candidate, Assessment, AssessmentSection, CampusDrive } from '../../types';
import { CodingQuestionPanel } from '../../components/CodingQuestionPanel';
import { ScrollArea } from '@/components/ui/scroll-area';
import { generateAccessPassword, generateSlug } from '../../lib/utils';

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

// ── Default experience settings ───────────────────────────────────────────────

const DEFAULT_EXP = {
  testWindow: 'anytime' as const,
  reminderEnabled: false,
  testAttempts: 1 as 1 | 3,
  shareReport: false,
  greetingNote: '',
  allowedDevices: 'computers' as const,
  integrityLevel: 'basic' as const,
};

// ── Main component ────────────────────────────────────────────────────────────

export const TestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { db, updateDrive, updateAssessment, bulkInvite } = useApp();

  // existing state
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('questions');

  // invite tab state
  const [selectedAssessment, setSelectedAssessment] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [inviteSent, setInviteSent] = useState(false);

  // evaluate drawer state
  const [evaluateCandidate, setEvaluateCandidate] = useState<Candidate | null>(null);
  const [evaluateOpen, setEvaluateOpen] = useState(false);

  // inline name edit
  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState('');

  // edit drive sheet
  const [driveEditOpen, setDriveEditOpen] = useState(false);
  const [draftDriveName, setDraftDriveName] = useState('');
  const [draftDriveDate, setDraftDriveDate] = useState('');
  const [draftDriveLocation, setDraftDriveLocation] = useState('');
  const [draftDriveStatus, setDraftDriveStatus] = useState<CampusDrive['status']>('Draft');
  const [draftDriveTarget, setDraftDriveTarget] = useState('');
  const [draftDriveSpocName, setDraftDriveSpocName] = useState('');
  const [draftDriveSpocContact, setDraftDriveSpocContact] = useState('');
  const [draftDriveDescription, setDraftDriveDescription] = useState('');

  // edit assessment sheet
  const [asmEditOpen, setAsmEditOpen] = useState(false);
  const [draftAsmName, setDraftAsmName] = useState('');
  const [draftAsmType, setDraftAsmType] = useState<Assessment['type']>('Combined');
  const [draftAsmDuration, setDraftAsmDuration] = useState('');
  const [draftAsmStatus, setDraftAsmStatus] = useState<Assessment['status']>('Draft');
  const [draftSections, setDraftSections] = useState<AssessmentSection[]>([]);

  // slug edit
  const [editingSlug, setEditingSlug] = useState(false);
  const [draftSlug, setDraftSlug] = useState('');

  // experience settings
  const [expSettings, setExpSettings] = useState({ ...DEFAULT_EXP });
  const [expDirty, setExpDirty] = useState(false);

  const drive = useMemo(() => db.drives.find(d => d.id === id), [db.drives, id]);

  // Sync experience settings when drive loads/changes
  useEffect(() => {
    if (drive) {
      setExpSettings({ ...DEFAULT_EXP, ...drive.experienceSettings });
    }
  }, [drive?.id]);

  const driveQuestionIds = drive?.questionIds ?? [];
  const driveQuestions = useMemo(
    () => db.questions.filter(q => driveQuestionIds.includes(q.id)),
    [db.questions, driveQuestionIds],
  );

  const alreadyAddedSet = useMemo(() => new Set(driveQuestionIds), [driveQuestionIds]);

  const sections = useMemo(() => {
    return SECTION_ORDER
      .map(topic => ({
        topic,
        questions: driveQuestions.filter(q => q.topic === topic),
      }))
      .filter(s => s.questions.length > 0);
  }, [driveQuestions]);

  const totalMarks = driveQuestions.reduce((s, q) => s + q.marks, 0);
  const estimatedMinutes = driveQuestions.length;

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

  const linkedAssessment = useMemo(() => {
    if (drive?.assessmentId) return db.assessments.find(a => a.id === drive.assessmentId) ?? null;
    const c = driveCandidates.find(c => c.assessmentId);
    return c ? db.assessments.find(a => a.id === c.assessmentId) ?? null : null;
  }, [db.assessments, drive, driveCandidates]);

  const assessmentUrl = linkedAssessment?.slug
    ? `${window.location.origin}/take/${linkedAssessment.slug}` : null;

  const activeAssessments = useMemo(
    () => db.assessments.filter(a => a.status === 'Active'),
    [db.assessments]
  );

  const invitedCandidates = useMemo(
    () => driveCandidates.filter(c => c.assessmentStatus !== 'Not Invited'),
    [driveCandidates]
  );

  const sectionAverages = useMemo(() => {
    const completed = driveCandidates.filter(c => c.sectionScores);
    const keys = ['aptitude', 'logical', 'technical', 'coding', 'verbal'] as const;
    return keys.map(k => {
      const vals = completed.filter(c => c.sectionScores?.[k] != null).map(c => c.sectionScores![k]!);
      return {
        section: k.charAt(0).toUpperCase() + k.slice(1),
        avg: vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '—',
        count: vals.length,
      };
    }).filter(s => s.count > 0);
  }, [driveCandidates]);

  const sortedByScore = useMemo(
    () => candidateRows.filter(r => r.status === 'Finished').sort((a, b) => b.percentage - a.percentage),
    [candidateRows]
  );

  const scoreDistribution = useMemo(() => [
    { label: '0–25%',   count: sortedByScore.filter(r => r.percentage < 25).length },
    { label: '25–50%',  count: sortedByScore.filter(r => r.percentage >= 25 && r.percentage < 50).length },
    { label: '50–75%',  count: sortedByScore.filter(r => r.percentage >= 50 && r.percentage < 75).length },
    { label: '75–100%', count: sortedByScore.filter(r => r.percentage >= 75).length },
  ], [sortedByScore]);

  const top10 = useMemo(() => sortedByScore.slice(0, 10), [sortedByScore]);
  const bottom10 = useMemo(() => [...sortedByScore].reverse().slice(0, 10), [sortedByScore]);

  // ── handlers ────────────────────────────────────────────────────────────────

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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} copied!`));
  };

  const handleInvite = () => {
    if (!selectedAssessment || !scheduleDate || !scheduleTime || !drive) return;
    bulkInvite(selectedAssessment, scheduleDate, drive.college);
    setInviteSent(true);
  };

  const exportCSV = () => {
    if (!drive) return;
    const headers = ['ID', 'Name', 'Email', 'Score', 'Percentage', 'Band', 'Aptitude', 'Logical', 'Technical', 'Coding'];
    const csvRows = driveCandidates.filter(c => c.assessmentStatus === 'Completed').map(c => {
      const pct = totalMarks > 0 ? Math.round(((c.assessmentScore ?? 0) / totalMarks) * 100) : 0;
      return [
        c.id, c.name, c.email, c.assessmentScore ?? 0, pct, scoreBand(pct),
        c.sectionScores?.aptitude ?? '', c.sectionScores?.logical ?? '',
        c.sectionScores?.technical ?? '', c.sectionScores?.coding ?? '',
      ];
    });
    const csv = [headers, ...csvRows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,﻿' + encodeURIComponent(csv);
    a.download = `${drive.name}_Scores.csv`;
    a.click();
  };

  // inline name save
  const saveInlineName = () => {
    if (!drive || !draftName.trim()) return;
    updateDrive({ ...drive, name: draftName.trim() });
    setEditingName(false);
    toast.success('Drive name updated.');
  };

  // open drive edit sheet
  const openDriveEdit = () => {
    if (!drive) return;
    setDraftDriveName(drive.name);
    setDraftDriveDate(drive.date);
    setDraftDriveLocation(drive.location);
    setDraftDriveStatus(drive.status);
    setDraftDriveTarget(String(drive.targetHiring));
    setDraftDriveSpocName(drive.spocName);
    setDraftDriveSpocContact(drive.spocContact);
    setDraftDriveDescription(drive.description);
    setDriveEditOpen(true);
  };

  const saveDriveEdit = () => {
    if (!drive) return;
    updateDrive({
      ...drive,
      name: draftDriveName,
      date: draftDriveDate,
      location: draftDriveLocation,
      status: draftDriveStatus,
      targetHiring: parseInt(draftDriveTarget) || 0,
      spocName: draftDriveSpocName,
      spocContact: draftDriveSpocContact,
      description: draftDriveDescription,
    });
    setDriveEditOpen(false);
    toast.success('Drive details updated.');
  };

  // open assessment edit sheet
  const openAsmEdit = () => {
    if (!linkedAssessment) return;
    setDraftAsmName(linkedAssessment.name);
    setDraftAsmType(linkedAssessment.type);
    setDraftAsmDuration(String(linkedAssessment.duration));
    setDraftAsmStatus(linkedAssessment.status);
    setDraftSections([...linkedAssessment.sections]);
    setAsmEditOpen(true);
  };

  const saveAsmEdit = () => {
    if (!linkedAssessment) return;
    const totalMarksCalc = draftSections.reduce((s, sec) => s + sec.marks, 0);
    updateAssessment({
      ...linkedAssessment,
      name: draftAsmName,
      type: draftAsmType,
      duration: parseInt(draftAsmDuration) || linkedAssessment.duration,
      status: draftAsmStatus,
      sections: draftSections,
      totalMarks: totalMarksCalc,
    });
    setAsmEditOpen(false);
    toast.success('Assessment updated.');
  };

  // section helpers for assessment edit
  const addSection = (secName: AssessmentSection['name']) => {
    if (draftSections.some(s => s.name === secName)) return;
    setDraftSections([...draftSections, { name: secName, questionCount: 10, marks: 20 }]);
  };
  const removeSection = (idx: number) => setDraftSections(draftSections.filter((_, i) => i !== idx));
  const changeSectionField = (idx: number, field: 'questionCount' | 'marks', value: number) => {
    const next = [...draftSections];
    next[idx] = { ...next[idx], [field]: value };
    setDraftSections(next);
  };
  const moveSection = (idx: number, dir: 'up' | 'down') => {
    if (dir === 'up' && idx === 0) return;
    if (dir === 'down' && idx === draftSections.length - 1) return;
    const next = [...draftSections];
    const swap = dir === 'up' ? idx - 1 : idx + 1;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    setDraftSections(next);
  };

  // slug save
  const saveSlug = () => {
    if (!linkedAssessment || !draftSlug.trim()) { setEditingSlug(false); return; }
    updateAssessment({ ...linkedAssessment, slug: draftSlug.trim() });
    setEditingSlug(false);
    toast.success('Test URL updated.');
  };

  // regenerate password
  const regeneratePassword = () => {
    if (!linkedAssessment) return;
    const newPass = generateAccessPassword();
    updateAssessment({ ...linkedAssessment, accessPassword: newPass });
    toast.success('Password regenerated.');
  };

  // experience settings
  const updateExp = <K extends keyof typeof DEFAULT_EXP>(key: K, value: (typeof DEFAULT_EXP)[K]) => {
    setExpSettings(prev => ({ ...prev, [key]: value }));
    setExpDirty(true);
  };

  const saveExpSettings = () => {
    if (!drive) return;
    updateDrive({ ...drive, experienceSettings: expSettings });
    setExpDirty(false);
    toast.success('Experience settings saved.');
  };

  // ── column definitions ───────────────────────────────────────────────────────

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
    {
      header: 'EVALUATE',
      accessor: 'id' as const,
      sortable: false,
      render: (row: CandidateRow) => {
        if (row.status !== 'Finished') return <span className="text-sm text-muted-foreground">—</span>;
        const candidate = driveCandidates.find(c => c.id === row.id);
        if (!candidate) return null;
        return (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 px-2"
            onClick={() => { setEvaluateCandidate(candidate); setEvaluateOpen(true); }}
          >
            <FileText className="h-3 w-3" />
            View
          </Button>
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

  const AVAILABLE_SECTIONS: AssessmentSection['name'][] = ['Aptitude', 'Logical Reasoning', 'Technical', 'Coding', 'Verbal'];

  const TAB_TRIGGER = 'flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent';

  return (
    <div className="flex flex-col min-h-full">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-background sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/online-assessment')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <span className="text-muted-foreground">Default Group</span>
          <span>/</span>
          {editingName ? (
            <Input
              autoFocus
              value={draftName}
              onChange={e => setDraftName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveInlineName(); if (e.key === 'Escape') setEditingName(false); }}
              onBlur={saveInlineName}
              className="h-7 text-sm font-medium w-64 px-2"
            />
          ) : (
            <span className="truncate max-w-[320px]">{drive.name}</span>
          )}
          <button
            title="Edit drive name"
            onClick={() => { setDraftName(drive.name); setEditingName(true); }}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            title={assessmentUrl ? 'Copy test URL' : 'No assessment linked yet'}
            disabled={!assessmentUrl}
            onClick={() => assessmentUrl && copyToClipboard(assessmentUrl, 'Test URL')}
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon"><Eye className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" title="Edit drive details" onClick={openDriveEdit}>
            <Settings className="h-4 w-4" />
          </Button>
          <Button className="gap-2" onClick={() => setActiveTab('invite')}>
            <UserPlus className="h-4 w-4" />
            Invite candidates
          </Button>
        </div>
      </div>

      {/* ── Credentials strip ── */}
      {assessmentUrl && linkedAssessment && (
        <div className="flex items-center gap-3 px-6 py-2 bg-muted/40 border-b text-sm flex-wrap">
          {/* URL / slug edit */}
          <div className="flex items-center gap-2">
            <LinkIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground">Test URL:</span>
            {editingSlug ? (
              <div className="flex items-center rounded-md border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring">
                <span className="pl-2 pr-1 text-xs text-muted-foreground whitespace-nowrap select-none">/take/</span>
                <input
                  autoFocus
                  className="bg-transparent text-xs font-mono outline-none pr-2 py-1 w-40"
                  value={draftSlug}
                  onChange={e => setDraftSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  onKeyDown={e => { if (e.key === 'Enter') saveSlug(); if (e.key === 'Escape') setEditingSlug(false); }}
                  onBlur={saveSlug}
                />
              </div>
            ) : (
              <code className="text-xs font-mono text-foreground bg-background border px-2 py-0.5 rounded truncate max-w-xs">
                {assessmentUrl}
              </code>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              title="Edit URL slug"
              onClick={() => { setDraftSlug(linkedAssessment.slug ?? ''); setEditingSlug(true); }}
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => copyToClipboard(assessmentUrl, 'Test URL')}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
          <div className="w-px h-4 bg-border" />
          {/* Password edit */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Password:</span>
            <code className="text-xs font-mono font-semibold text-foreground bg-background border px-2 py-0.5 rounded">
              {linkedAssessment.accessPassword}
            </code>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => copyToClipboard(linkedAssessment.accessPassword!, 'Password')}
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              title="Regenerate password"
              onClick={regeneratePassword}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
          <div className="w-px h-4 bg-border" />
          {/* Assessment name → opens edit */}
          <span className="text-xs text-muted-foreground">
            Assessment:{' '}
            <button
              className="font-medium text-foreground hover:text-primary underline-offset-2 hover:underline transition-colors"
              onClick={openAsmEdit}
              title="Edit assessment"
            >
              {linkedAssessment.name}
            </button>
            <button
              className="ml-1.5 text-muted-foreground hover:text-foreground transition-colors"
              onClick={openAsmEdit}
              title="Edit assessment"
            >
              <Pencil className="inline h-3 w-3" />
            </button>
          </span>
        </div>
      )}

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <div className="border-b bg-background">
          <TabsList className="h-auto rounded-none bg-transparent p-0 px-6 gap-0">
            <TabsTrigger value="questions" className={TAB_TRIGGER}>
              <AlignLeft className="h-4 w-4" />
              Questions
            </TabsTrigger>
            <TabsTrigger value="invite" className={TAB_TRIGGER}>
              <UserPlus className="h-4 w-4" />
              Invite
            </TabsTrigger>
            <TabsTrigger value="experience" className={TAB_TRIGGER}>
              <Shield className="h-4 w-4" />
              Experience
            </TabsTrigger>
            <TabsTrigger value="candidates" className={TAB_TRIGGER}>
              <Users className="h-4 w-4" />
              Candidates
            </TabsTrigger>
            <TabsTrigger value="reports" className={TAB_TRIGGER}>
              <BarChart2 className="h-4 w-4" />
              Reports
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ── Questions Tab ── */}
        <TabsContent value="questions" className="m-0 p-6">
          <div className="flex gap-6">
            {/* Left: question list */}
            <div className="flex-1 min-w-0">
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
              <div className="w-80 shrink-0 border rounded-lg self-start sticky top-24 overflow-hidden">
                <div className="flex items-start justify-between gap-2 p-4 border-b">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-xs text-muted-foreground">Section: {selectedQuestion.topic}</p>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                        selectedQuestion.difficulty === 'Easy' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' :
                        selectedQuestion.difficulty === 'Medium' ? 'text-amber-600 bg-amber-50 border-amber-200' :
                        'text-red-600 bg-red-50 border-red-200'
                      }`}>{selectedQuestion.difficulty}</span>
                      <span className="text-[10px] font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded border">
                        {selectedQuestion.marks} pts
                      </span>
                    </div>
                    <h3 className="font-semibold text-sm leading-snug">
                      {selectedQuestion.title || selectedQuestion.text}
                    </h3>
                  </div>
                  <button
                    className="text-muted-foreground hover:text-foreground shrink-0"
                    onClick={() => setSelectedQuestion(null)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {selectedQuestion.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 px-4 py-3 border-b">
                    {selectedQuestion.tags.map(tag => (
                      <span key={tag} className="text-xs bg-muted px-2 py-0.5 rounded">{tag}</span>
                    ))}
                  </div>
                )}

                {selectedQuestion.type === 'Coding' && (
                  <div className="max-h-[60vh]">
                    <CodingQuestionPanel question={selectedQuestion} />
                  </div>
                )}

                {selectedQuestion.options && (
                  <div className="p-4 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Options {selectedQuestion.type === 'Multiple Select' ? '(Multiple Correct)' : ''}
                    </p>
                    {selectedQuestion.options.map((opt, i) => {
                      const isCorrect = selectedQuestion.correctOptions?.includes(i);
                      return (
                        <div
                          key={i}
                          className={`flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm ${
                            isCorrect ? 'bg-emerald-50 border border-emerald-200' : 'bg-muted/40 border border-transparent'
                          }`}
                        >
                          <span className={isCorrect ? 'text-emerald-700 font-medium' : 'text-foreground'}>
                            {opt}
                          </span>
                          {isCorrect && (
                            <span className="shrink-0 text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded">
                              ✓ Correct
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {['SQL', 'Descriptive'].includes(selectedQuestion.type) && (
                  <div className="p-4 space-y-2">
                    <span className="inline-block text-[10px] font-bold uppercase tracking-wide text-primary bg-primary/10 px-2 py-0.5 rounded">
                      {selectedQuestion.type === 'SQL' ? 'SQL Query' : 'Descriptive'}
                    </span>
                    <p className="text-sm text-muted-foreground leading-relaxed">{selectedQuestion.text}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ── Invite Tab ── */}
        <TabsContent value="invite" className="m-0 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left: configurator */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Invite Configurator</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Select Assessment</Label>
                  <Select
                    value={selectedAssessment}
                    onValueChange={v => { setSelectedAssessment(v); setInviteSent(false); }}
                  >
                    <SelectTrigger><SelectValue placeholder="Choose an active assessment…" /></SelectTrigger>
                    <SelectContent>
                      {activeAssessments.length === 0 ? (
                        <SelectItem value="__none" disabled>No active assessments</SelectItem>
                      ) : (
                        activeAssessments.map(asm => (
                          <SelectItem key={asm.id} value={asm.id}>
                            {asm.name} ({asm.duration} min)
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Exam Date</Label>
                  <Input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} />
                </div>

                <div className="space-y-1.5">
                  <Label>Start Time</Label>
                  <Input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} />
                </div>

                <div className="rounded-lg bg-muted/60 px-3 py-2 text-sm text-muted-foreground">
                  Inviting candidates from{' '}
                  <span className="font-semibold text-foreground">{drive.college}</span>
                </div>

                {inviteSent ? (
                  <Alert className="border-emerald-500 bg-emerald-50 text-emerald-800">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <AlertDescription className="font-semibold">
                      Invitations dispatched successfully!
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Button
                    className="w-full gap-2"
                    disabled={!selectedAssessment || !scheduleDate || !scheduleTime}
                    onClick={handleInvite}
                  >
                    <Send className="h-4 w-4" />
                    Send Invitations
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Right: invited candidates */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-base">
                  Invited Candidates
                  {invitedCandidates.length > 0 && (
                    <span className="ml-2 text-xs font-normal bg-muted text-muted-foreground rounded-full px-2 py-0.5">
                      {invitedCandidates.length}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {invitedCandidates.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed py-16 text-center text-muted-foreground">
                    <Users className="h-10 w-10 opacity-40" />
                    <div>
                      <p className="font-semibold text-sm">No candidates invited yet</p>
                      <p className="text-xs mt-1">Configure and send invitations to see credentials here.</p>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-xs text-muted-foreground uppercase tracking-wide">
                          <th className="text-left py-2 pr-4 font-medium">Candidate</th>
                          <th className="text-left py-2 pr-4 font-medium">ID</th>
                          <th className="text-left py-2 pr-4 font-medium">Password</th>
                          <th className="text-left py-2 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {invitedCandidates.map(c => (
                          <tr key={c.id} className="hover:bg-muted/30">
                            <td className="py-2.5 pr-4">
                              <p className="font-medium">{c.name}</p>
                              <p className="text-xs text-muted-foreground">{c.email}</p>
                            </td>
                            <td className="py-2.5 pr-4 font-mono text-xs text-muted-foreground">{c.id}</td>
                            <td className="py-2.5 pr-4">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-semibold text-primary text-xs">
                                  {c.assessmentPassword ?? '—'}
                                </span>
                                {c.assessmentPassword && (
                                  <button
                                    className="text-muted-foreground hover:text-foreground"
                                    onClick={() => copyToClipboard(c.assessmentPassword!, 'Password')}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5">
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                                c.assessmentStatus === 'Completed' ? 'bg-green-100 text-green-700' :
                                c.assessmentStatus === 'InProgress' ? 'bg-amber-100 text-amber-700' :
                                'bg-muted text-muted-foreground'
                              }`}>
                                {c.assessmentStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Experience Tab ── */}
        <TabsContent value="experience" className="m-0 p-6">
          <div className="max-w-3xl space-y-4">
            {/* Candidate experience */}
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
              <div className="flex-1 space-y-4 text-sm">
                {/* Test window */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-500 shrink-0" />
                    <span className="font-medium">Test window:</span>
                  </div>
                  <Select
                    value={expSettings.testWindow}
                    onValueChange={v => updateExp('testWindow', v as 'anytime' | 'scheduled')}
                  >
                    <SelectTrigger className="h-8 text-xs w-52">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="anytime">Candidates can take anytime</SelectItem>
                      <SelectItem value="scheduled">Scheduled window only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Reminder */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-500 shrink-0" />
                    <span className="font-medium">Email reminder:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={expSettings.reminderEnabled}
                      onCheckedChange={v => updateExp('reminderEnabled', v)}
                    />
                    <span className="text-xs text-muted-foreground">
                      {expSettings.reminderEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>

                {/* Test attempts */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    <span className="font-medium">Test attempts:</span>
                  </div>
                  <Select
                    value={String(expSettings.testAttempts)}
                    onValueChange={v => updateExp('testAttempts', parseInt(v) as 1 | 3)}
                  >
                    <SelectTrigger className="h-8 text-xs w-52">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 attempt only</SelectItem>
                      <SelectItem value="3">Up to 3 attempts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Share Report */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    <span className="font-medium">Share report:</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={expSettings.shareReport}
                      onCheckedChange={v => updateExp('shareReport', v)}
                    />
                    <span className="text-xs text-muted-foreground">
                      {expSettings.shareReport ? 'Shared with candidates' : 'Not shared'}
                    </span>
                  </div>
                </div>

                {/* Greeting note */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-500 shrink-0" />
                    <span className="font-medium">Greet candidates:</span>
                  </div>
                  <Textarea
                    placeholder="Add a personalized welcome note before candidates start…"
                    value={expSettings.greetingNote}
                    onChange={e => updateExp('greetingNote', e.target.value)}
                    rows={2}
                    className="text-xs resize-none"
                  />
                </div>

                {/* Candidate device */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    <span className="font-medium">Candidate device:</span>
                  </div>
                  <Select
                    value={expSettings.allowedDevices}
                    onValueChange={v => updateExp('allowedDevices', v as 'computers' | 'all')}
                  >
                    <SelectTrigger className="h-8 text-xs w-52">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="computers">Computers only</SelectItem>
                      <SelectItem value="all">All devices</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Integrity experience */}
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
              <div className="flex-1 text-sm space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                    <span className="font-medium">Integrity level:</span>
                  </div>
                  <Select
                    value={expSettings.integrityLevel}
                    onValueChange={v => updateExp('integrityLevel', v as 'basic' | 'ai-proctoring' | 'custom')}
                  >
                    <SelectTrigger className="h-8 text-xs w-52">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic (fullscreen + switch alerts)</SelectItem>
                      <SelectItem value="ai-proctoring">AI Proctoring</SelectItem>
                      <SelectItem value="custom">Custom monitoring</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-muted-foreground leading-relaxed text-xs">
                  {expSettings.integrityLevel === 'basic' && 'Full screen, screen switch alerts, and copy restrictions. Minimal protection.'}
                  {expSettings.integrityLevel === 'ai-proctoring' && 'AI-powered webcam monitoring, suspicious behaviour detection, and automatic flagging.'}
                  {expSettings.integrityLevel === 'custom' && 'Configure custom monitoring rules, allowed resources, and manual review workflows.'}
                </p>
              </div>
            </div>

            {/* Save button */}
            <div className="flex justify-end">
              <Button
                className="gap-2"
                onClick={saveExpSettings}
                disabled={!expDirty}
              >
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
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
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground">
              <Users className="h-8 w-8 opacity-40" />
              <p className="text-sm">No candidates invited yet.</p>
              <Button size="sm" variant="outline" onClick={() => setActiveTab('invite')}>
                Go to Invite tab
              </Button>
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

        {/* ── Reports Tab ── */}
        <TabsContent value="reports" className="m-0 p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Score distribution */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Score Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sortedByScore.length === 0 ? (
                  <div className="flex items-center justify-center h-28 text-muted-foreground text-sm">
                    No completed assessments yet.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {scoreDistribution.map(band => (
                      <div key={band.label} className="flex items-center gap-3 text-sm">
                        <span className="w-16 text-xs text-muted-foreground shrink-0">{band.label}</span>
                        <div className="flex-1 h-5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary/70 rounded-full transition-all"
                            style={{
                              width: `${sortedByScore.length > 0 ? (band.count / sortedByScore.length) * 100 : 0}%`,
                            }}
                          />
                        </div>
                        <span className="w-8 text-right text-xs font-semibold shrink-0">{band.count}</span>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground pt-1">
                      Based on {sortedByScore.length} completed submission{sortedByScore.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Section averages */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-primary" />
                  Section Averages
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sectionAverages.length === 0 ? (
                  <div className="flex items-center justify-center h-28 text-muted-foreground text-sm">
                    No section data yet.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sectionAverages.map(s => (
                      <div key={s.section} className="flex items-center justify-between text-sm border rounded px-3 py-2">
                        <span className="text-muted-foreground">{s.section}</span>
                        <div className="text-right">
                          <span className="font-semibold">{s.avg} pts</span>
                          <span className="text-xs text-muted-foreground ml-2">({s.count} resp.)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top 10 / Bottom 10 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Award className="h-4 w-4 text-amber-500" />
                  Top 10 Candidates
                </CardTitle>
              </CardHeader>
              <CardContent>
                {top10.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No completed assessments.</p>
                ) : (
                  <div className="space-y-1">
                    {top10.map((r, i) => (
                      <div key={r.id} className="flex items-center justify-between text-sm py-2 border-b last:border-b-0">
                        <div className="flex items-center gap-2">
                          <span className="w-5 text-xs text-muted-foreground shrink-0">#{i + 1}</span>
                          <div>
                            <p className="font-medium text-sm">{r.name}</p>
                            <p className="text-xs text-muted-foreground">{r.email}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded shrink-0 ${scoreBandColor(r.band)}`}>
                          {r.percentage}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-red-400" />
                  Bottom 10 Candidates
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bottom10.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No completed assessments.</p>
                ) : (
                  <div className="space-y-1">
                    {bottom10.map((r, i) => (
                      <div key={r.id} className="flex items-center justify-between text-sm py-2 border-b last:border-b-0">
                        <div className="flex items-center gap-2">
                          <span className="w-5 text-xs text-muted-foreground shrink-0">{i + 1}</span>
                          <div>
                            <p className="font-medium text-sm">{r.name}</p>
                            <p className="text-xs text-muted-foreground">{r.email}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded shrink-0 ${scoreBandColor(r.band)}`}>
                          {r.percentage}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Export */}
          <div className="flex justify-end">
            <Button
              variant="outline"
              className="gap-2"
              onClick={exportCSV}
              disabled={sortedByScore.length === 0}
            >
              <Download className="h-4 w-4" />
              Export Scores CSV
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Question picker sheet ── */}
      <QuestionPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        allQuestions={db.questions}
        alreadyAdded={alreadyAddedSet}
        onAdd={addQuestions}
      />

      {/* ── Evaluate drawer ── */}
      <Sheet open={evaluateOpen} onOpenChange={open => { if (!open) { setEvaluateOpen(false); setEvaluateCandidate(null); } }}>
        <SheetContent side="right" className="sm:max-w-md flex flex-col p-0">
          <SheetHeader className="px-6 py-4 border-b shrink-0">
            <SheetTitle>{evaluateCandidate?.name ?? 'Evaluate Candidate'}</SheetTitle>
            {evaluateCandidate && (
              <p className="text-sm text-muted-foreground">{evaluateCandidate.email}</p>
            )}
          </SheetHeader>

          {evaluateCandidate && (
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Score overview */}
              <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/30">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Score</p>
                  <p className="text-3xl font-bold">{evaluateCandidate.assessmentScore ?? 0}</p>
                  <p className="text-xs text-muted-foreground">out of {totalMarks}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Percentage</p>
                  {(() => {
                    const pct = totalMarks > 0
                      ? Math.round(((evaluateCandidate.assessmentScore ?? 0) / totalMarks) * 100)
                      : 0;
                    const band = scoreBand(pct);
                    return (
                      <>
                        <p className="text-3xl font-bold">{pct}%</p>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${scoreBandColor(band)}`}>
                          {band}
                        </span>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Rank & percentile */}
              {evaluateCandidate.assessmentRank != null && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Rank</p>
                    <p className="text-2xl font-bold">#{evaluateCandidate.assessmentRank}</p>
                  </div>
                  <div className="rounded-lg border p-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Percentile</p>
                    <p className="text-2xl font-bold">{evaluateCandidate.assessmentPercentile}%</p>
                  </div>
                </div>
              )}

              {/* Section breakdown */}
              {evaluateCandidate.sectionScores && (
                <div>
                  <p className="text-sm font-semibold mb-2">Section Breakdown</p>
                  <div className="space-y-2">
                    {(Object.entries(evaluateCandidate.sectionScores) as [string, number | undefined][])
                      .filter(([, v]) => v != null)
                      .map(([section, score]) => (
                        <div key={section} className="flex items-center justify-between text-sm border rounded px-3 py-2">
                          <span className="capitalize text-muted-foreground">{section}</span>
                          <span className="font-semibold">{score} pts</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Assessment meta */}
              {linkedAssessment && (
                <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1.5">
                  <p className="font-semibold">{linkedAssessment.name}</p>
                  <p className="text-muted-foreground">
                    {linkedAssessment.duration} min &middot; {linkedAssessment.totalMarks} total marks
                  </p>
                  {evaluateCandidate.assessmentDurationUsed != null && (
                    <p className="text-muted-foreground">
                      Time used:{' '}
                      {Math.floor(evaluateCandidate.assessmentDurationUsed / 60)} min{' '}
                      {evaluateCandidate.assessmentDurationUsed % 60}s
                    </p>
                  )}
                  {evaluateCandidate.assessmentSubmissionDate && (
                    <p className="text-muted-foreground">
                      Submitted:{' '}
                      {new Date(evaluateCandidate.assessmentSubmissionDate).toLocaleString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                        hour: 'numeric', minute: '2-digit', hour12: true,
                      })}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Edit Drive Sheet ── */}
      <Sheet open={driveEditOpen} onOpenChange={v => { if (!v) setDriveEditOpen(false); }}>
        <SheetContent side="right" className="sm:max-w-lg flex flex-col p-0">
          <SheetHeader className="px-6 py-4 border-b shrink-0">
            <SheetTitle>Edit Drive Details</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div className="space-y-1.5">
              <Label>Drive Name</Label>
              <Input value={draftDriveName} onChange={e => setDraftDriveName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input type="date" value={draftDriveDate} onChange={e => setDraftDriveDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Input value={draftDriveLocation} onChange={e => setDraftDriveLocation(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={draftDriveStatus} onValueChange={v => setDraftDriveStatus(v as CampusDrive['status'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Published">Published</SelectItem>
                  <SelectItem value="Ongoing">Ongoing</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Target Hiring</Label>
              <Input type="number" value={draftDriveTarget} onChange={e => setDraftDriveTarget(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>SPOC Name</Label>
              <Input value={draftDriveSpocName} onChange={e => setDraftDriveSpocName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>SPOC Contact</Label>
              <Input value={draftDriveSpocContact} onChange={e => setDraftDriveSpocContact(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={draftDriveDescription}
                onChange={e => setDraftDriveDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <SheetFooter className="px-6 py-4 border-t shrink-0 flex-row gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setDriveEditOpen(false)}>Cancel</Button>
            <Button className="flex-1" onClick={saveDriveEdit}>Save Changes</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── Edit Assessment Sheet ── */}
      <Sheet open={asmEditOpen} onOpenChange={v => { if (!v) setAsmEditOpen(false); }}>
        <SheetContent side="right" className="sm:max-w-lg flex flex-col p-0">
          <SheetHeader className="px-6 py-4 border-b shrink-0">
            <SheetTitle>Edit Assessment</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div className="space-y-1.5">
              <Label>Assessment Name</Label>
              <Input value={draftAsmName} onChange={e => setDraftAsmName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={draftAsmType} onValueChange={v => setDraftAsmType(v as Assessment['type'])}>
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
              <Label>Duration (minutes)</Label>
              <Input type="number" value={draftAsmDuration} onChange={e => setDraftAsmDuration(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={draftAsmStatus} onValueChange={v => setDraftAsmStatus(v as Assessment['status'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sections editor */}
            <div className="space-y-2">
              <Label>Sections</Label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_SECTIONS.map(secName => {
                  const isAdded = draftSections.some(s => s.name === secName);
                  return (
                    <Button
                      key={secName}
                      size="sm"
                      variant={isAdded ? 'secondary' : 'outline'}
                      disabled={isAdded}
                      className="h-7 text-xs"
                      onClick={() => addSection(secName)}
                    >
                      + {secName}
                    </Button>
                  );
                })}
              </div>
              {draftSections.length > 0 && (
                <div className="space-y-2 mt-2">
                  {draftSections.map((sec, idx) => (
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
                              onChange={e => changeSectionField(idx, 'questionCount', parseInt(e.target.value) || 0)}
                            />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground">Marks:</span>
                            <Input
                              type="number"
                              className="h-6 w-14 text-xs px-1"
                              value={sec.marks}
                              onChange={e => changeSectionField(idx, 'marks', parseInt(e.target.value) || 0)}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <Button variant="ghost" size="icon" className="h-6 w-6" disabled={idx === 0} onClick={() => moveSection(idx, 'up')}>
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" disabled={idx === draftSections.length - 1} onClick={() => moveSection(idx, 'down')}>
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => removeSection(idx)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground">
                    Total marks: {draftSections.reduce((s, sec) => s + sec.marks, 0)}
                  </p>
                </div>
              )}
            </div>
          </div>
          <SheetFooter className="px-6 py-4 border-t shrink-0 flex-row gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setAsmEditOpen(false)}>Cancel</Button>
            <Button className="flex-1" onClick={saveAsmEdit}>Save Changes</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
};
