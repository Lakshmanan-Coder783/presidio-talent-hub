import React, { useMemo, useState, useEffect, useRef } from 'react';
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
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
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
  Upload, UserCheck, UserX, Mail, ExternalLink,
} from 'lucide-react';
import type { Question, Candidate, Assessment, AssessmentSection, CampusDrive, CollegeStudent } from '../../types';
import { CodingQuestionPanel } from '../../components/CodingQuestionPanel';
import { generateAccessPassword } from '../../lib/utils';
import { parseStudentFile } from '../../utils/parseStudentFile';

// ── helpers ──────────────────────────────────────────────────────────────────

const SECTION_ORDER: Question['topic'][] = [
  'Quants', 'Logical', 'C/C++', 'OOPs', 'SQL', 'HTML/CSS/JS',
  'Subjective', 'SQL Query', 'Coding',
  'Aptitude', 'Logical Reasoning', 'Technical', 'Verbal',
];

const SESSIONS: { name: string; topics: Question['topic'][] }[] = [
  { name: 'Session 1 – MCQ Round',      topics: ['Quants', 'Logical', 'C/C++', 'OOPs', 'SQL', 'HTML/CSS/JS', 'Aptitude', 'Logical Reasoning', 'Technical', 'Verbal'] },
  { name: 'Session 2 – Practical Round', topics: ['Subjective', 'SQL Query', 'Coding'] },
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
    Quants: 'bg-purple-100 text-purple-700',
    Logical: 'bg-blue-100 text-blue-700',
    'C/C++': 'bg-green-100 text-green-700',
    OOPs: 'bg-indigo-100 text-indigo-700',
    SQL: 'bg-teal-100 text-teal-700',
    'HTML/CSS/JS': 'bg-yellow-100 text-yellow-700',
    Subjective: 'bg-rose-100 text-rose-700',
    'SQL Query': 'bg-emerald-100 text-emerald-700',
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

interface InterviewDraft {
  panel: string;
  panelMembers: string;
  timeSlot: string;
  aptitudeScore: string;
  aptitudeComments: string;
  technicalScore: string;
  technicalComments: string;
  problemSolvingScore: string;
  problemSolvingComments: string;
  communicationScore: string;
  communicationComments: string;
  anyOther: string;
  overallFeedback: string;
}

interface CodingDraft {
  panel: string;
  panelMembers: string;
  timeSlot: string;
  exerciseStartTime: string;
  techStack: string;
  exerciseGiven: string;
  exerciseReview: string;
  checkpoint1: string;
  checkpoint2: string;
  checkpoint3: string;
}

interface WhiteboardDraft {
  culturalFit: string;
  comments: string;
  finalResult: string;
}

const BLANK_IV: InterviewDraft = {
  panel: '', panelMembers: '', timeSlot: '',
  aptitudeScore: '', aptitudeComments: '',
  technicalScore: '', technicalComments: '',
  problemSolvingScore: '', problemSolvingComments: '',
  communicationScore: '', communicationComments: '',
  anyOther: '', overallFeedback: '',
};

const BLANK_CD: CodingDraft = {
  panel: '', panelMembers: '', timeSlot: '',
  exerciseStartTime: '', techStack: '', exerciseGiven: '',
  exerciseReview: '', checkpoint1: '', checkpoint2: '', checkpoint3: '',
};

const BLANK_WB: WhiteboardDraft = { culturalFit: '', comments: '', finalResult: '' };

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
      <SheetContent side="center" className="sm:max-w-2xl flex flex-col p-0">
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
                {(['Quants', 'Logical', 'C/C++', 'OOPs', 'SQL', 'HTML/CSS/JS', 'Subjective', 'SQL Query', 'Coding', 'Aptitude', 'Logical Reasoning', 'Technical', 'Verbal'] as const).map(t => (
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

// ── College pool picker sheet ─────────────────────────────────────────────────

interface CollegePoolPickerProps {
  open: boolean;
  onClose: () => void;
  driveId: string;
  college: string;
}

const CollegePoolPicker: React.FC<CollegePoolPickerProps> = ({ open, onClose, driveId, college }) => {
  const { db, importCollegeStudents, bulkImportCandidates } = useApp();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const csvInputRef = useRef<HTMLInputElement>(null);

  const existingEmails = useMemo(
    () => new Set(db.candidates.map(c => c.email.toLowerCase())),
    [db.candidates]
  );

  const poolStudents = useMemo(
    () => db.collegeStudents.filter(s => s.college === college),
    [db.collegeStudents, college]
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return poolStudents;
    const q = search.toLowerCase();
    return poolStudents.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      (s.registrationNumber ?? '').toLowerCase().includes(q)
    );
  }, [poolStudents, search]);

  const toggle = (student: CollegeStudent) => {
    if (existingEmails.has(student.email.toLowerCase())) return;
    setSelected(prev => {
      const next = new Set(prev);
      next.has(student.id) ? next.delete(student.id) : next.add(student.id);
      return next;
    });
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    try {
      const rows = await parseStudentFile(file);
      const count = importCollegeStudents(college, rows);
      if (count > 0) {
        toast.success(`${count} student${count !== 1 ? 's' : ''} added to ${college} pool.`);
      } else {
        toast.info('No new students — all emails already exist in this college pool.');
      }
    } catch {
      toast.error('Failed to parse file. Please check the format.');
    }
  };

  const handleClose = () => {
    setSelected(new Set());
    setSearch('');
    onClose();
  };

  const handleAddToDrive = () => {
    const chosen = poolStudents.filter(s => selected.has(s.id));
    if (chosen.length === 0) return;

    const rows: Parameters<typeof bulkImportCandidates>[1] = chosen.map(s => ({
      name: s.name,
      email: s.email,
      phone: s.phone,
      degree: s.degree,
      cgpa: s.cgpa,
      college,
      gender: s.gender,
      registrationNumber: s.registrationNumber,
      specialization: s.specialization,
      dateOfBirth: s.dateOfBirth,
      githubUrl: s.githubUrl,
      linkedinUrl: s.linkedinUrl,
      resumeUrl: s.resumeUrl,
      codingPlatformUrls: s.codingPlatformUrls,
      tenth: s.tenth,
      twelfth: s.twelfth,
      diploma: s.diploma,
      ugMarks: s.ugMarks,
      pgMarks: s.pgMarks,
      backlogHistory: s.backlogHistory,
      currentBacklogs: s.currentBacklogs,
    }));

    const imported = bulkImportCandidates(driveId, rows);
    if (imported > 0) {
      toast.success(`${imported} student${imported !== 1 ? 's' : ''} added to the drive.`);
    } else {
      toast.info('No new candidates — all selected students already exist in a drive.');
    }
    handleClose();
  };

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) handleClose(); }}>
      <SheetContent side="center" className="sm:max-w-2xl flex flex-col p-0">
        <SheetHeader className="px-6 py-4 border-b shrink-0">
          <SheetTitle>College Pool — {college}</SheetTitle>
          <p className="text-sm text-muted-foreground">{poolStudents.length} student{poolStudents.length !== 1 ? 's' : ''} in pool</p>
        </SheetHeader>

        <div className="px-6 py-3 border-b shrink-0 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email or reg. no…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={handleCsvUpload}
          />
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-9 text-xs shrink-0"
            onClick={() => csvInputRef.current?.click()}
          >
            <Upload className="h-3.5 w-3.5" />
            Upload CSV
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y">
          {filtered.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              {poolStudents.length === 0
                ? `No students in the pool for ${college} yet — upload a CSV to add some.`
                : 'No students match your search.'}
            </p>
          ) : (
            filtered.map(s => {
              const isAdded = existingEmails.has(s.email.toLowerCase());
              const isSelected = selected.has(s.id);
              return (
                <button
                  key={s.id}
                  className={`w-full flex items-start gap-3 px-6 py-3 text-left transition-colors
                    ${isAdded ? 'opacity-60 cursor-default bg-muted/30' : 'hover:bg-muted/40 cursor-pointer'}
                    ${isSelected ? 'bg-primary/5' : ''}
                  `}
                  onClick={() => toggle(s)}
                  disabled={isAdded}
                >
                  <div className={`mt-0.5 h-4 w-4 shrink-0 rounded border-2 flex items-center justify-center
                    ${isAdded ? 'border-green-500 bg-green-500' : isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'}`}
                  >
                    {(isAdded || isSelected) && (
                      <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.email}</p>
                  </div>

                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <span className="text-xs text-muted-foreground">{s.degree}</span>
                    <span className="text-xs text-muted-foreground">CGPA {s.cgpa || '—'}</span>
                    {isAdded && <span className="text-[10px] font-semibold text-green-600">Already added</span>}
                  </div>
                </button>
              );
            })
          )}
        </div>

        <SheetFooter className="px-6 py-4 border-t shrink-0 flex-row gap-2">
          <Button variant="outline" onClick={handleClose} className="flex-1">Cancel</Button>
          <Button
            onClick={handleAddToDrive}
            disabled={selected.size === 0}
            className="flex-1"
          >
            Add {selected.size > 0 ? `${selected.size} student${selected.size > 1 ? 's' : ''}` : 'to Drive'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

// ── Default experience settings ───────────────────────────────────────────────

const DEFAULT_EXP: {
  testWindow: 'anytime' | 'scheduled';
  reminderEnabled: boolean;
  testAttempts: 1 | 3;
  shareReport: boolean;
  greetingNote: string;
  allowedDevices: 'computers' | 'all';
  integrityLevel: 'basic' | 'ai-proctoring' | 'custom';
} = {
  testWindow: 'anytime',
  reminderEnabled: false,
  testAttempts: 1,
  shareReport: false,
  greetingNote: '',
  allowedDevices: 'computers',
  integrityLevel: 'basic',
};

// ── Main component ────────────────────────────────────────────────────────────

export const TestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { db, updateDrive, updateAssessment, updateQuestion, updateCandidate, bulkUpdateCandidates, bulkInvite, bulkImportCandidates, markAttendance, sendRemoteInvites } = useApp();

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

  // question inline edit
  const [editingQuestion, setEditingQuestion] = useState(false);
  const [editDraft, setEditDraft] = useState<Partial<Question>>({});

  // edit drive sheet
  const [driveEditOpen, setDriveEditOpen] = useState(false);
  const [draftDriveName, setDraftDriveName] = useState('');
  const [draftDriveDate, setDraftDriveDate] = useState('');
  const [draftDriveDay2Date, setDraftDriveDay2Date] = useState('');
  const [draftDriveLocation, setDraftDriveLocation] = useState('');
  const [draftDriveStatus, setDraftDriveStatus] = useState<CampusDrive['status']>('Draft');
  const [draftDriveAccessMode, setDraftDriveAccessMode] = useState<CampusDrive['accessMode']>('in-person');
  const [draftDriveExamStart, setDraftDriveExamStart] = useState('');
  const [draftDriveExamEnd, setDraftDriveExamEnd] = useState('');

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

  // CSV import
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [csvPreviewOpen, setCsvPreviewOpen] = useState(false);
  const [csvPreviewRows, setCsvPreviewRows] = useState<{ name: string; email: string; degree: string; registrationNumber: string }[]>([]);
  const [csvParsedData, setCsvParsedData] = useState<Parameters<typeof bulkImportCandidates>[1]>([]);

  // College pool picker
  const [collegePoolOpen, setCollegePoolOpen] = useState(false);

  // experience settings
  const [expSettings, setExpSettings] = useState({ ...DEFAULT_EXP });
  const [expDirty, setExpDirty] = useState(false);

  // OA shortlisting
  const [cutoffInput, setCutoffInput] = useState('40');
  const [shortlistSelection, setShortlistSelection] = useState<Set<string>>(new Set());
  const [aiEvaluating, setAiEvaluating] = useState(false);

  // Interview Round sheet
  const [interviewSheetOpen, setInterviewSheetOpen] = useState(false);
  const [interviewCandidate, setInterviewCandidate] = useState<Candidate | null>(null);
  const [ivDraft, setIvDraft] = useState<InterviewDraft>({ ...BLANK_IV });

  // Coding Round sheet
  const [codingSheetOpen, setCodingSheetOpen] = useState(false);
  const [codingCandidate, setCodingCandidate] = useState<Candidate | null>(null);
  const [cdDraft, setCdDraft] = useState<CodingDraft>({ ...BLANK_CD });

  // Whiteboarding sheet
  const [wbSheetOpen, setWbSheetOpen] = useState(false);
  const [wbCandidate, setWbCandidate] = useState<Candidate | null>(null);
  const [wbDraft, setWbDraft] = useState<WhiteboardDraft>({ ...BLANK_WB });

  // ── Publish confirmation & success ───────────────────────────────────────────
  const [confirmPublishOpen, setConfirmPublishOpen] = useState(false);
  const [publishSuccessOpen, setPublishSuccessOpen] = useState(false);

  const drive = useMemo(() => db.drives.find(d => d.id === id), [db.drives, id]);

  // Sync experience settings when drive loads/changes
  useEffect(() => {
    if (drive) {
      setExpSettings({ ...DEFAULT_EXP, ...drive.experienceSettings });
      setCutoffInput(String(drive.cutoffPercentage ?? 40));
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
    () => (drive ? db.candidates.filter(c => c.driveId === drive.id) : []),
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

  // Recruitment pipeline candidate sets
  const interviewCandidates = useMemo(
    () => driveCandidates.filter(c => c.oaShortlisted === true),
    [driveCandidates],
  );
  const codingRoundCandidates = useMemo(
    () => driveCandidates.filter(c => c.interviewShortlisted === true),
    [driveCandidates],
  );
  const whiteboardCandidates = useMemo(
    () => driveCandidates.filter(c => c.codingShortlisted === true),
    [driveCandidates],
  );

  // ── handlers ────────────────────────────────────────────────────────────────

  const handleConfirmPublish = () => {
    if (!drive) return;
    updateDrive({ ...drive, status: 'Published' });
    if (linkedAssessment) updateAssessment({ ...linkedAssessment, status: 'Active' });
    setConfirmPublishOpen(false);
    setPublishSuccessOpen(true);
  };

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
    bulkInvite(selectedAssessment, scheduleDate, drive.id);
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

  // ── OA shortlisting handlers ─────────────────────────────────────────────────

  const applyCutoff = () => {
    const pct = parseInt(cutoffInput) || 0;
    if (drive) updateDrive({ ...drive, cutoffPercentage: pct });
    const ids = new Set(
      candidateRows
        .filter(r => r.status === 'Finished' && r.percentage >= pct)
        .map(r => r.id)
    );
    setShortlistSelection(ids);
    toast.success(`Cutoff applied — ${ids.size} candidate${ids.size !== 1 ? 's' : ''} auto-selected.`);
  };

  const toggleShortlistCandidate = (id: string) => {
    setShortlistSelection(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const confirmOaShortlist = () => {
    if (!drive) return;
    const count = shortlistSelection.size;
    const updates = driveCandidates
      .filter(c => shortlistSelection.has(c.id))
      .map(c => ({ ...c, oaShortlisted: true, funnelStage: 'Interview' as const }));
    bulkUpdateCandidates(updates);
    setShortlistSelection(new Set());
    toast.success(`${count} candidate${count !== 1 ? 's' : ''} shortlisted for Interview Round.`);
  };

  const generateAiEvaluation = (candidate: Candidate) => {
    const coding = candidate.sectionScores?.coding ?? 0;
    const sql = candidate.sectionScores?.sqlQuery ?? candidate.sectionScores?.sql ?? 0;
    const subjective = candidate.sectionScores?.subjective ?? 0;

    const toRating = (score: number, max = 20) => Math.min(10, Math.max(1, Math.round((score / max) * 10)));
    const codingRating = toRating(coding);
    const sqlRating = toRating(sql);
    const subjectiveRating = toRating(subjective);
    const overall = Math.round((codingRating + sqlRating + subjectiveRating) / 3);

    const codingFeedback =
      codingRating >= 8 ? 'Demonstrates strong algorithmic thinking with clean, well-optimised solutions. Edge cases are handled properly and the code is readable.' :
      codingRating >= 5 ? 'Shows adequate coding ability. Working solutions are present but some edge cases are missed. Readability and efficiency could be improved.' :
      'Basic attempts present but struggles with complex logic and edge case handling. Foundational practice recommended.';

    const sqlFeedback =
      sqlRating >= 8 ? 'Excellent command of SQL — joins, subqueries, and aggregations are used correctly and efficiently.' :
      sqlRating >= 5 ? 'Functional SQL knowledge demonstrated. Some queries could be optimised; complex joins need refinement.' :
      'Limited SQL proficiency. Simple queries attempted but multi-table operations need improvement.';

    const subjectiveFeedback =
      subjectiveRating >= 8 ? 'Articulate and structured responses that show deep conceptual understanding and strong communication skills.' :
      subjectiveRating >= 5 ? 'Responses show reasonable understanding of concepts but could benefit from more precise and structured explanations.' :
      'Responses lack depth and clarity. Conceptual understanding needs strengthening.';

    const summaries = [
      `Overall, this candidate shows ${overall >= 7 ? 'strong' : overall >= 5 ? 'moderate' : 'limited'} practical skills. `,
      overall >= 7
        ? 'A confident recommendation for the interview round based on practical performance.'
        : overall >= 5
        ? 'Consider for interview with specific focus areas to probe during the discussion.'
        : 'Recommend careful consideration; practical round performance is below average.',
    ];

    return {
      codingScore: codingRating,
      codingFeedback,
      sqlScore: sqlRating,
      sqlFeedback,
      subjectiveScore: subjectiveRating,
      subjectiveFeedback,
      overallPracticalScore: overall,
      summary: summaries.join(''),
      evaluatedAt: new Date().toISOString(),
    };
  };

  const runAiEvaluation = () => {
    if (!evaluateCandidate) return;
    setAiEvaluating(true);
    setTimeout(() => {
      const evaluation = generateAiEvaluation(evaluateCandidate);
      const updated = { ...evaluateCandidate, practicalAiEvaluation: evaluation };
      updateCandidate(updated);
      setEvaluateCandidate(updated);
      setAiEvaluating(false);
      toast.success('AI evaluation complete.');
    }, 1800);
  };

  // ── Interview Round handlers ──────────────────────────────────────────────────

  const openInterviewSheet = (candidate: Candidate) => {
    setInterviewCandidate(candidate);
    setIvDraft({
      panel: candidate.interviewPanel ?? '',
      panelMembers: candidate.interviewPanelMembers ?? '',
      timeSlot: candidate.interviewTimeSlot ?? '',
      aptitudeScore: String(candidate.interviewAptitudeScore ?? ''),
      aptitudeComments: candidate.interviewAptitudeComments ?? '',
      technicalScore: String(candidate.interviewTechnicalScore ?? ''),
      technicalComments: candidate.interviewTechnicalComments ?? '',
      problemSolvingScore: String(candidate.interviewProblemSolvingScore ?? ''),
      problemSolvingComments: candidate.interviewProblemSolvingComments ?? '',
      communicationScore: String(candidate.interviewCommunicationScore ?? ''),
      communicationComments: candidate.interviewCommunicationComments ?? '',
      anyOther: candidate.interviewAnyOther ?? '',
      overallFeedback: candidate.interviewOverallFeedback ?? '',
    });
    setInterviewSheetOpen(true);
  };

  const saveInterviewFeedback = (decision: 'shortlist' | 'reject') => {
    if (!interviewCandidate) return;
    updateCandidate({
      ...interviewCandidate,
      interviewPanel: ivDraft.panel,
      interviewPanelMembers: ivDraft.panelMembers,
      interviewTimeSlot: ivDraft.timeSlot,
      interviewAptitudeScore: parseFloat(ivDraft.aptitudeScore) || undefined,
      interviewAptitudeComments: ivDraft.aptitudeComments,
      interviewTechnicalScore: parseFloat(ivDraft.technicalScore) || undefined,
      interviewTechnicalComments: ivDraft.technicalComments,
      interviewProblemSolvingScore: parseFloat(ivDraft.problemSolvingScore) || undefined,
      interviewProblemSolvingComments: ivDraft.problemSolvingComments,
      interviewCommunicationScore: parseFloat(ivDraft.communicationScore) || undefined,
      interviewCommunicationComments: ivDraft.communicationComments,
      interviewAnyOther: ivDraft.anyOther,
      interviewOverallFeedback: ivDraft.overallFeedback,
      interviewShortlisted: decision === 'shortlist',
      interviewStatus: decision === 'shortlist' ? 'Passed' : 'Failed',
      funnelStage: decision === 'shortlist' ? 'Coding Exercise' : interviewCandidate.funnelStage,
    });
    setInterviewSheetOpen(false);
    toast.success(decision === 'shortlist' ? 'Shortlisted for Coding Round.' : 'Candidate rejected.');
  };

  // ── Coding Round handlers ────────────────────────────────────────────────────

  const openCodingSheet = (candidate: Candidate) => {
    setCodingCandidate(candidate);
    setCdDraft({
      panel: candidate.codingPanel ?? '',
      panelMembers: candidate.codingPanelMembers ?? '',
      timeSlot: candidate.codingTimeSlot ?? '',
      exerciseStartTime: candidate.codingExerciseStartTime ?? '',
      techStack: candidate.codingTechStack ?? '',
      exerciseGiven: candidate.codingExerciseGiven === true ? 'yes' : candidate.codingExerciseGiven === false ? 'no' : '',
      exerciseReview: candidate.codingExerciseReview ?? '',
      checkpoint1: candidate.codingCheckpoint1 ?? '',
      checkpoint2: candidate.codingCheckpoint2 ?? '',
      checkpoint3: candidate.codingCheckpoint3 ?? '',
    });
    setCodingSheetOpen(true);
  };

  const saveCodingFeedback = (decision: 'shortlist' | 'reject') => {
    if (!codingCandidate) return;
    updateCandidate({
      ...codingCandidate,
      codingPanel: cdDraft.panel,
      codingPanelMembers: cdDraft.panelMembers,
      codingTimeSlot: cdDraft.timeSlot,
      codingExerciseStartTime: cdDraft.exerciseStartTime,
      codingTechStack: cdDraft.techStack,
      codingExerciseGiven: cdDraft.exerciseGiven === 'yes' ? true : cdDraft.exerciseGiven === 'no' ? false : undefined,
      codingExerciseReview: cdDraft.exerciseReview,
      codingCheckpoint1: cdDraft.checkpoint1,
      codingCheckpoint2: cdDraft.checkpoint2,
      codingCheckpoint3: cdDraft.checkpoint3,
      codingShortlisted: decision === 'shortlist',
      funnelStage: decision === 'shortlist' ? 'Whiteboard Interview' : codingCandidate.funnelStage,
    });
    setCodingSheetOpen(false);
    toast.success(decision === 'shortlist' ? 'Shortlisted for Whiteboarding.' : 'Candidate rejected.');
  };

  // ── Whiteboarding handlers ────────────────────────────────────────────────────

  const openWbSheet = (candidate: Candidate) => {
    setWbCandidate(candidate);
    setWbDraft({
      culturalFit: candidate.whiteboardSelectedForCulturalFit === true ? 'yes' : candidate.whiteboardSelectedForCulturalFit === false ? 'no' : '',
      comments: candidate.whiteboardComments ?? '',
      finalResult: candidate.whiteboardFinalResult ?? '',
    });
    setWbSheetOpen(true);
  };

  const saveWbFeedback = () => {
    if (!wbCandidate) return;
    const result = wbDraft.finalResult as Candidate['whiteboardFinalResult'] | '';
    updateCandidate({
      ...wbCandidate,
      whiteboardSelectedForCulturalFit: wbDraft.culturalFit === 'yes' ? true : wbDraft.culturalFit === 'no' ? false : undefined,
      whiteboardComments: wbDraft.comments,
      whiteboardFinalResult: result || undefined,
      funnelStage: result === 'Selected' ? 'Offered' : wbCandidate.funnelStage,
      offerStatus: result === 'Selected' ? 'None' : wbCandidate.offerStatus,
    });
    setWbSheetOpen(false);
    toast.success('Whiteboarding result saved.');
  };

  const handleCsvFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!drive) return;
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim());
      // Skip header row if first cell is non-numeric (e.g. "S.No")
      const dataLines = isNaN(Number(lines[0]?.split(',')[0]?.trim())) ? lines.slice(1) : lines;

      const parsed: Parameters<typeof bulkImportCandidates>[1] = [];
      const preview: { name: string; email: string; degree: string; registrationNumber: string }[] = [];

      dataLines.forEach(line => {
        const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        if (cols.length < 4) return;
        const [, regNum, name, email, phone, degree, specialization, gender, dateOfBirth,
               githubUrl, linkedinUrl, resumeUrl, codingPlatformUrls,
               tenthStr, twelfthStr, diplomaStr, ugStr, pgStr, backlogHistStr, currentBacklogStr] = cols;

        const genderNorm = gender === 'Female' ? 'Female' : gender === 'Other' ? 'Other' : 'Male';

        parsed.push({
          name: name || '',
          email: email || '',
          phone: phone || '',
          degree: degree || '',
          cgpa: parseFloat(ugStr) || 0,
          college: drive.college,
          gender: genderNorm as 'Male' | 'Female' | 'Other',
          registrationNumber: regNum,
          specialization,
          dateOfBirth,
          githubUrl,
          linkedinUrl,
          resumeUrl,
          codingPlatformUrls,
          tenth: parseFloat(tenthStr) || undefined,
          twelfth: parseFloat(twelfthStr) || undefined,
          diploma: parseFloat(diplomaStr) || undefined,
          ugMarks: parseFloat(ugStr) || undefined,
          pgMarks: parseFloat(pgStr) || undefined,
          backlogHistory: parseInt(backlogHistStr) || undefined,
          currentBacklogs: parseInt(currentBacklogStr) || undefined,
        });
        preview.push({ name: name || '', email: email || '', degree: degree || '', registrationNumber: regNum || '' });
      });

      setCsvParsedData(parsed);
      setCsvPreviewRows(preview);
      setCsvPreviewOpen(true);
    };
    reader.readAsText(file);
  };

  const confirmCsvImport = () => {
    if (!drive) return;
    const imported = bulkImportCandidates(drive.id, csvParsedData);
    setCsvPreviewOpen(false);
    setCsvParsedData([]);
    setCsvPreviewRows([]);
    if (imported > 0) {
      toast.success(`${imported} student${imported !== 1 ? 's' : ''} imported successfully.`);
    } else {
      toast.info('No new students added — all emails already exist in the system.');
    }
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
    setDraftDriveDay2Date(drive.day2Date ?? '');
    setDraftDriveLocation(drive.location);
    setDraftDriveStatus(drive.status);
    setDraftDriveAccessMode(drive.accessMode ?? 'in-person');
    setDraftDriveExamStart(drive.examStartTime ?? '');
    setDraftDriveExamEnd(drive.examEndTime ?? '');

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
      day2Date: draftDriveDay2Date || undefined,
      location: draftDriveLocation,
      status: draftDriveStatus,
      accessMode: draftDriveAccessMode,
      examStartTime: draftDriveAccessMode === 'in-person' && draftDriveExamStart ? draftDriveExamStart : undefined,
      examEndTime: draftDriveAccessMode === 'in-person' && draftDriveExamEnd ? draftDriveExamEnd : undefined,
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
      header: 'SHORTLIST',
      accessor: 'id' as const,
      sortable: false,
      render: (row: CandidateRow) => {
        if (row.status !== 'Finished') return null;
        const alreadyShortlisted = driveCandidates.find(c => c.id === row.id)?.oaShortlisted;
        const checked = shortlistSelection.has(row.id);
        return (
          <div className="flex items-center justify-center">
            {alreadyShortlisted ? (
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                Confirmed
              </span>
            ) : (
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 accent-primary cursor-pointer"
                checked={checked}
                onChange={() => toggleShortlistCandidate(row.id)}
              />
            )}
          </div>
        );
      },
    },
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
    ...(drive?.accessMode === 'in-person' ? [{
      header: 'ATTENDANCE',
      accessor: 'id' as const,
      sortable: false,
      render: (row: CandidateRow) => {
        const candidate = driveCandidates.find(c => c.id === row.id);
        if (!candidate) return null;
        const present = candidate.attendanceMarked === true;
        return (
          <Button
            variant="ghost"
            size="sm"
            className={`h-7 text-xs gap-1 px-2 ${present ? 'text-green-600' : 'text-muted-foreground'}`}
            onClick={() => markAttendance(candidate.id, !present)}
          >
            {present ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
            {present ? 'Present' : 'Absent'}
          </Button>
        );
      },
    }] : []),
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

  const AVAILABLE_SECTIONS: AssessmentSection['name'][] = [
    'Quants', 'Logical', 'C/C++', 'OOPs', 'SQL', 'HTML/CSS/JS',
    'Subjective', 'SQL Query', 'Coding',
    'Aptitude', 'Logical Reasoning', 'Technical', 'Verbal',
  ];

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
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            drive.status === 'Published' || drive.status === 'Ongoing'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : drive.status === 'Completed'
              ? 'bg-gray-100 text-gray-500 border-gray-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>{drive.status}</span>
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
          {drive.status === 'Draft' ? (
            <Button
              size="sm"
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => {
                updateDrive({ ...drive, status: 'Published' });
                if (linkedAssessment) updateAssessment({ ...linkedAssessment, status: 'Active' });
                toast.success('Test published — candidates can now take the assessment');
              }}
            >
              <CheckCircle2 className="h-4 w-4" />
              Done
            </Button>
          ) : (drive.status === 'Published' || drive.status === 'Ongoing') ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live
            </span>
          ) : (
            <>
              <span className="text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full">
                Completed
              </span>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => {
                  updateDrive({ ...drive, status: 'Published' });
                  if (linkedAssessment) updateAssessment({ ...linkedAssessment, status: 'Active' });
                  toast.success('Test reopened — candidates can take the assessment again');
                }}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reopen
              </Button>
            </>
          )}
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
            <TabsTrigger value="interview" className={TAB_TRIGGER}>
              <Users className="h-4 w-4" />
              Interview Round
              {interviewCandidates.length > 0 && (
                <span className="ml-1 text-[10px] font-bold bg-primary/10 text-primary rounded-full px-1.5 py-0.5">
                  {interviewCandidates.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="coding" className={TAB_TRIGGER}>
              <Code className="h-4 w-4" />
              Coding Round
              {codingRoundCandidates.length > 0 && (
                <span className="ml-1 text-[10px] font-bold bg-primary/10 text-primary rounded-full px-1.5 py-0.5">
                  {codingRoundCandidates.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="whiteboard" className={TAB_TRIGGER}>
              <FileText className="h-4 w-4" />
              Whiteboarding
              {whiteboardCandidates.length > 0 && (
                <span className="ml-1 text-[10px] font-bold bg-primary/10 text-primary rounded-full px-1.5 py-0.5">
                  {whiteboardCandidates.length}
                </span>
              )}
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
                <div className="space-y-4">
                  {SESSIONS.map(session => {
                    const sessionSections = sections.filter(s => session.topics.includes(s.topic));
                    if (sessionSections.length === 0) return null;
                    const sessionMarks = sessionSections.reduce((sum, s) => sum + s.questions.reduce((a, q) => a + q.marks, 0), 0);
                    const sessionQCount = sessionSections.reduce((sum, s) => sum + s.questions.length, 0);
                    return (
                      <div key={session.name} className="border rounded-xl overflow-hidden">
                        <div className="px-4 py-3 bg-slate-100 dark:bg-slate-800 flex items-center justify-between">
                          <span className="font-bold text-sm">{session.name}</span>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{sessionMarks} marks</span>
                            <span>{sessionQCount} question{sessionQCount !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                        <div className="space-y-0 divide-y">
                          {sessionSections.map((sec, sIdx) => {
                            const collapsed = collapsedSections.has(sec.topic);
                            const sectionMarks = sec.questions.reduce((s, q) => s + q.marks, 0);
                            return (
                              <div key={sec.topic}>
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
                                        onClick={() => { setSelectedQuestion(q); setEditingQuestion(false); }}
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
                                          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-blue-50 hover:text-blue-500"
                                          title="Edit question"
                                          onClick={e => {
                                            e.stopPropagation();
                                            setSelectedQuestion(q);
                                            setEditDraft({
                                              text: q.text,
                                              difficulty: q.difficulty,
                                              marks: q.marks,
                                              tags: [...q.tags],
                                              options: q.options ? [...q.options] : undefined,
                                              correctOptions: q.correctOptions ? [...q.correctOptions] : undefined,
                                            });
                                            setEditingQuestion(true);
                                          }}
                                        >
                                          <Pencil className="h-3.5 w-3.5" />
                                        </button>
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
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right: question preview / edit */}
            {selectedQuestion && (
              <div className="w-80 shrink-0 border rounded-lg self-start sticky top-24 overflow-hidden">
                {/* Panel header */}
                <div className="flex items-center justify-between gap-2 px-4 py-3 border-b bg-muted/30">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {editingQuestion ? 'Editing Question' : 'Question Preview'}
                  </span>
                  <div className="flex items-center gap-1">
                    {!editingQuestion && (
                      <button
                        title="Edit this question"
                        className="text-muted-foreground hover:text-primary transition-colors p-1 rounded"
                        onClick={() => {
                          setEditDraft({
                            text: selectedQuestion.text,
                            difficulty: selectedQuestion.difficulty,
                            marks: selectedQuestion.marks,
                            tags: [...selectedQuestion.tags],
                            options: selectedQuestion.options ? [...selectedQuestion.options] : undefined,
                            correctOptions: selectedQuestion.correctOptions ? [...selectedQuestion.correctOptions] : undefined,
                          });
                          setEditingQuestion(true);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      className="text-muted-foreground hover:text-foreground shrink-0 p-1 rounded"
                      onClick={() => { setSelectedQuestion(null); setEditingQuestion(false); }}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {editingQuestion ? (
                  /* ── Edit form ── */
                  <div className="flex flex-col">
                    <div className="p-4 space-y-3 overflow-y-auto max-h-[60vh]">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Question Text</Label>
                        <Textarea
                          rows={4}
                          value={editDraft.text ?? ''}
                          onChange={e => setEditDraft(d => ({ ...d, text: e.target.value }))}
                          className="text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Difficulty</Label>
                          <Select
                            value={editDraft.difficulty ?? selectedQuestion.difficulty}
                            onValueChange={v => setEditDraft(d => ({ ...d, difficulty: v as Question['difficulty'] }))}
                          >
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Easy">Easy</SelectItem>
                              <SelectItem value="Medium">Medium</SelectItem>
                              <SelectItem value="Hard">Hard</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Marks</Label>
                          <Input
                            type="number"
                            className="h-8 text-xs"
                            value={editDraft.marks ?? selectedQuestion.marks}
                            onChange={e => setEditDraft(d => ({ ...d, marks: parseInt(e.target.value) || 1 }))}
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Tags (comma separated)</Label>
                        <Input
                          className="h-8 text-xs"
                          value={(editDraft.tags ?? selectedQuestion.tags).join(', ')}
                          onChange={e => setEditDraft(d => ({ ...d, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) }))}
                        />
                      </div>
                      {editDraft.options && (
                        <div className="space-y-2">
                          <Label className="text-xs">Options (click radio to set correct)</Label>
                          {editDraft.options.map((opt, i) => {
                            const isCorrect = (editDraft.correctOptions ?? []).includes(i);
                            return (
                              <div key={i} className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEditDraft(d => ({ ...d, correctOptions: [i] }))}
                                  className={`h-4 w-4 rounded-full border-2 shrink-0 transition-colors ${isCorrect ? 'border-emerald-600 bg-emerald-600' : 'border-muted-foreground'}`}
                                />
                                <Input
                                  className="h-7 text-xs"
                                  value={opt}
                                  onChange={e => setEditDraft(d => {
                                    const opts = [...(d.options ?? [])];
                                    opts[i] = e.target.value;
                                    return { ...d, options: opts };
                                  })}
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div className="px-4 py-3 border-t flex gap-2 bg-background">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          updateQuestion(selectedQuestion.id, editDraft);
                          setEditingQuestion(false);
                          toast.success('Question updated — live for all candidates');
                        }}
                      >
                        <Save className="h-3.5 w-3.5 mr-1.5" />
                        Save
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingQuestion(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* ── View mode ── */
                  <>
                    <div className="p-4 border-b">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
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
                  </>
                )}
              </div>
            )}
          </div>

          {/* Confirm & Publish button — shown only in Draft state with questions */}
          {drive?.status === 'Draft' && driveQuestions.length > 0 && linkedAssessment && (
            <div className="mt-6 pt-4 border-t flex justify-end">
              <Button
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => setConfirmPublishOpen(true)}
              >
                <CheckCircle2 className="h-4 w-4" />
                Confirm & Publish Test
              </Button>
            </div>
          )}
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

                {/* Access mode indicator */}
                <div className={`rounded-lg px-3 py-2 text-xs flex items-start gap-2 ${drive.accessMode === 'remote' ? 'bg-blue-50 text-blue-800' : 'bg-amber-50 text-amber-800'}`}>
                  <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  {drive.accessMode === 'remote'
                    ? 'Remote drive — each candidate receives the test link + their individual password via email.'
                    : 'In-Person drive — share the test link and shared password verbally in the lab.'
                  }
                </div>

                {inviteSent ? (
                  <div className="space-y-2">
                    <Alert className="border-emerald-500 bg-emerald-50 text-emerald-800">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <AlertDescription className="font-semibold">
                        Invitations dispatched successfully!
                      </AlertDescription>
                    </Alert>
                    {drive.accessMode === 'remote' && (
                      <Button
                        variant="outline"
                        className="w-full gap-2 text-sm"
                        onClick={() => {
                          const count = sendRemoteInvites(drive.id);
                          if (count > 0) {
                            toast.success(`Test invite emails sent to ${count} candidate${count !== 1 ? 's' : ''}.`);
                          } else {
                            toast.info('All candidates already have emails sent.');
                          }
                        }}
                      >
                        <Mail className="h-4 w-4" />
                        Send Test Invites via Email
                      </Button>
                    )}
                  </div>
                ) : (
                  <Button
                    className="w-full gap-2"
                    disabled={!selectedAssessment || !scheduleDate || !scheduleTime}
                    onClick={handleInvite}
                  >
                    <Send className="h-4 w-4" />
                    {drive.accessMode === 'remote' ? 'Generate Individual Passwords' : 'Send Invitations'}
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
                          {drive.accessMode === 'remote' && (
                            <th className="text-left py-2 pr-4 font-medium">Email</th>
                          )}
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
                            {drive.accessMode === 'remote' && (
                              <td className="py-2.5 pr-4">
                                {c.inviteEmailSentAt ? (
                                  <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                    <Mail className="h-3 w-3" /> Sent
                                  </span>
                                ) : (
                                  <span className="text-xs text-muted-foreground">Pending</span>
                                )}
                              </td>
                            )}
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
          {/* Toolbar: Import + attendance controls */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              {drive?.accessMode === 'in-person' && driveCandidates.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-xs"
                  onClick={() => {
                    driveCandidates.forEach(c => {
                      if (!c.attendanceMarked) markAttendance(c.id, true);
                    });
                    toast.success('All candidates marked as present.');
                  }}
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  Mark All Present
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleCsvFileSelect}
              />
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-xs"
                onClick={() => csvInputRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5" />
                Import Students (CSV)
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-xs"
                onClick={() => setCollegePoolOpen(true)}
              >
                <Users className="h-3.5 w-3.5" />
                Add from College Pool
              </Button>
            </div>
          </div>

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

          {/* Cutoff & shortlisting toolbar */}
          {candidateRows.some(r => r.status === 'Finished') && (
            <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex-wrap">
              <span className="text-sm font-medium text-amber-900">OA Shortlisting Cutoff:</span>
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={cutoffInput}
                  onChange={e => setCutoffInput(e.target.value)}
                  className="h-8 w-20 text-sm"
                />
                <span className="text-sm text-amber-800">%</span>
              </div>
              <Button size="sm" variant="outline" className="h-8 text-xs border-amber-300 text-amber-800 hover:bg-amber-100" onClick={applyCutoff}>
                Apply Cutoff
              </Button>
              {shortlistSelection.size > 0 && (
                <div className="flex items-center gap-2 ml-auto">
                  <span className="text-sm text-amber-800 font-medium">{shortlistSelection.size} selected</span>
                  <Button size="sm" className="h-8 text-xs bg-green-600 hover:bg-green-700 text-white" onClick={confirmOaShortlist}>
                    Confirm Shortlist for Interview Round
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setShortlistSelection(new Set())}>
                    Clear
                  </Button>
                </div>
              )}
            </div>
          )}

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

        {/* ── Interview Round Tab ── */}
        <TabsContent value="interview" className="m-0 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-base">Interview Round</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Candidates shortlisted from Online Assessment ({interviewCandidates.length} total)
              </p>
            </div>
          </div>

          {interviewCandidates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground border rounded-lg">
              <Users className="h-8 w-8 opacity-40" />
              <p className="text-sm">No candidates shortlisted yet.</p>
              <Button size="sm" variant="outline" onClick={() => setActiveTab('candidates')}>
                Go to Candidates tab to shortlist
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Candidate</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">OA Score</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Panel</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {interviewCandidates.map(c => {
                    const pct = totalMarks > 0 ? Math.round(((c.assessmentScore ?? 0) / totalMarks) * 100) : 0;
                    const statusLabel = c.interviewShortlisted === true ? 'Shortlisted' : c.interviewShortlisted === false ? 'Rejected' : c.interviewPanel ? 'In Progress' : 'Pending';
                    const statusCls = statusLabel === 'Shortlisted' ? 'bg-green-100 text-green-700' : statusLabel === 'Rejected' ? 'bg-red-100 text-red-700' : statusLabel === 'In Progress' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600';
                    const avgScore = [c.interviewAptitudeScore, c.interviewTechnicalScore, c.interviewProblemSolvingScore, c.interviewCommunicationScore].filter((v): v is number => v != null);
                    return (
                      <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c.email}</p>
                          {(c.resumeUrl || c.githubUrl || c.linkedinUrl) && (
                            <div className="flex items-center gap-2 mt-1">
                              {c.resumeUrl && (
                                <a href={c.resumeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                                  <FileText className="h-3 w-3" />Resume
                                </a>
                              )}
                              {c.githubUrl && (
                                <a href={c.githubUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                                  <ExternalLink className="h-3 w-3" />GitHub
                                </a>
                              )}
                              {c.linkedinUrl && (
                                <a href={c.linkedinUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                                  <ExternalLink className="h-3 w-3" />LinkedIn
                                </a>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${scoreBandColor(scoreBand(pct))}`}>{pct}%</span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm">{c.interviewPanel || '—'}</p>
                          {avgScore.length > 0 && (
                            <p className="text-xs text-muted-foreground">Avg: {(avgScore.reduce((a: number, b: number) => a + b, 0) / avgScore.length).toFixed(1)}/10</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusCls}`}>{statusLabel}</span>
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1"
                            onClick={() => openInterviewSheet(c)}
                          >
                            <Pencil className="h-3 w-3" />
                            {c.interviewPanel ? 'Edit Feedback' : 'Fill Feedback'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ── Coding Round Tab ── */}
        <TabsContent value="coding" className="m-0 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-base">Coding Round</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Candidates shortlisted from Interview Round ({codingRoundCandidates.length} total)
              </p>
            </div>
          </div>

          {codingRoundCandidates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground border rounded-lg">
              <Code className="h-8 w-8 opacity-40" />
              <p className="text-sm">No candidates shortlisted from Interview Round yet.</p>
              <Button size="sm" variant="outline" onClick={() => setActiveTab('interview')}>
                Go to Interview Round tab
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Candidate</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Interview Score</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tech Stack</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {codingRoundCandidates.map(c => {
                    const ivScores = [c.interviewAptitudeScore, c.interviewTechnicalScore, c.interviewProblemSolvingScore, c.interviewCommunicationScore].filter(Boolean) as number[];
                    const avgIv = ivScores.length > 0 ? (ivScores.reduce((a, b) => a + b, 0) / ivScores.length).toFixed(1) : '—';
                    const statusLabel = c.codingShortlisted === true ? 'Shortlisted' : c.codingShortlisted === false ? 'Rejected' : c.codingPanel ? 'In Progress' : 'Pending';
                    const statusCls = statusLabel === 'Shortlisted' ? 'bg-green-100 text-green-700' : statusLabel === 'Rejected' ? 'bg-red-100 text-red-700' : statusLabel === 'In Progress' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600';
                    return (
                      <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-semibold">{avgIv !== '—' ? `${avgIv}/10` : '—'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm">{c.codingTechStack || '—'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusCls}`}>{statusLabel}</span>
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1"
                            onClick={() => openCodingSheet(c)}
                          >
                            <Pencil className="h-3 w-3" />
                            {c.codingPanel ? 'Update' : 'Fill Details'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* ── Whiteboarding Tab ── */}
        <TabsContent value="whiteboard" className="m-0 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-base">Whiteboarding Round</h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                Candidates shortlisted from Coding Round ({whiteboardCandidates.length} total)
              </p>
            </div>
          </div>

          {whiteboardCandidates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-muted-foreground border rounded-lg">
              <FileText className="h-8 w-8 opacity-40" />
              <p className="text-sm">No candidates shortlisted from Coding Round yet.</p>
              <Button size="sm" variant="outline" onClick={() => setActiveTab('coding')}>
                Go to Coding Round tab
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Candidate</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cultural Fit</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Final Result</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {whiteboardCandidates.map(c => {
                    const fitLabel = c.whiteboardSelectedForCulturalFit === true ? 'Yes' : c.whiteboardSelectedForCulturalFit === false ? 'No' : '—';
                    const fitCls = c.whiteboardSelectedForCulturalFit === true ? 'text-green-600' : c.whiteboardSelectedForCulturalFit === false ? 'text-red-500' : 'text-muted-foreground';
                    const resultCls = c.whiteboardFinalResult === 'Selected' ? 'bg-green-100 text-green-700' : c.whiteboardFinalResult === 'Rejected' ? 'bg-red-100 text-red-700' : c.whiteboardFinalResult === 'Waitlisted' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600';
                    return (
                      <tr key={c.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`font-medium text-sm ${fitCls}`}>{fitLabel}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${resultCls}`}>
                            {c.whiteboardFinalResult ?? 'Pending'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1"
                            onClick={() => openWbSheet(c)}
                          >
                            <Pencil className="h-3 w-3" />
                            Update
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
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

      {/* ── College pool picker sheet ── */}
      {drive && (
        <CollegePoolPicker
          open={collegePoolOpen}
          onClose={() => setCollegePoolOpen(false)}
          driveId={drive.id}
          college={drive.college}
        />
      )}

      {/* ── Evaluate drawer ── */}
      <Sheet open={evaluateOpen} onOpenChange={open => { if (!open) { setEvaluateOpen(false); setEvaluateCandidate(null); } }}>
        <SheetContent side="center" className="sm:max-w-md flex flex-col p-0">
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

              {/* AI Practical Round Evaluation */}
              {(evaluateCandidate.sectionScores?.coding != null ||
                evaluateCandidate.sectionScores?.subjective != null ||
                evaluateCandidate.sectionScores?.sqlQuery != null) && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Practical Round AI Evaluation</p>
                    {!evaluateCandidate.practicalAiEvaluation && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1.5 border-violet-300 text-violet-700 hover:bg-violet-50"
                        onClick={runAiEvaluation}
                        disabled={aiEvaluating}
                      >
                        {aiEvaluating ? (
                          <>
                            <RefreshCw className="h-3 w-3 animate-spin" />
                            Evaluating…
                          </>
                        ) : (
                          <>
                            <Award className="h-3 w-3" />
                            AI Evaluate
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {evaluateCandidate.practicalAiEvaluation ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-lg border border-violet-200 bg-violet-50 p-3">
                        <span className="text-xs font-medium text-violet-700">Overall Practical Score</span>
                        <span className="text-xl font-bold text-violet-800">
                          {evaluateCandidate.practicalAiEvaluation.overallPracticalScore}/10
                        </span>
                      </div>

                      {[
                        { label: 'Coding', score: evaluateCandidate.practicalAiEvaluation.codingScore, feedback: evaluateCandidate.practicalAiEvaluation.codingFeedback },
                        { label: 'SQL / Query', score: evaluateCandidate.practicalAiEvaluation.sqlScore, feedback: evaluateCandidate.practicalAiEvaluation.sqlFeedback },
                        { label: 'Subjective', score: evaluateCandidate.practicalAiEvaluation.subjectiveScore, feedback: evaluateCandidate.practicalAiEvaluation.subjectiveFeedback },
                      ].map(item => item.score != null && (
                        <div key={item.label} className="rounded-lg border p-3 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold">{item.label}</span>
                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-violet-100 text-violet-700">{item.score}/10</span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{item.feedback}</p>
                        </div>
                      ))}

                      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                        <p className="text-xs font-semibold text-blue-800 mb-1">AI Summary</p>
                        <p className="text-xs text-blue-700 leading-relaxed">{evaluateCandidate.practicalAiEvaluation.summary}</p>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className="text-[10px] text-muted-foreground">
                          Evaluated {new Date(evaluateCandidate.practicalAiEvaluation.evaluatedAt!).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                        </p>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 text-[10px] text-muted-foreground gap-1"
                          onClick={runAiEvaluation}
                          disabled={aiEvaluating}
                        >
                          <RefreshCw className="h-2.5 w-2.5" />
                          Re-evaluate
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                      Click "AI Evaluate" to generate an automated assessment of the candidate's practical round submissions.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ── CSV Import Preview Sheet ── */}
      <Sheet open={csvPreviewOpen} onOpenChange={v => { if (!v) setCsvPreviewOpen(false); }}>
        <SheetContent side="center" className="sm:max-w-lg flex flex-col p-0">
          <SheetHeader className="px-6 py-4 border-b shrink-0">
            <SheetTitle>Import Students</SheetTitle>
            <p className="text-sm text-muted-foreground">
              {csvPreviewRows.length} student{csvPreviewRows.length !== 1 ? 's' : ''} found in CSV. Review before importing.
            </p>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
            {csvPreviewRows.map((r, i) => (
              <div key={i} className="flex items-start justify-between border rounded px-3 py-2 text-sm">
                <div>
                  <p className="font-medium">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.email}</p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p>{r.degree}</p>
                  {r.registrationNumber && <p>#{r.registrationNumber}</p>}
                </div>
              </div>
            ))}
            {csvPreviewRows.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No valid rows found in CSV.</p>
            )}
          </div>
          <SheetFooter className="px-6 py-4 border-t shrink-0 flex-row gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setCsvPreviewOpen(false)}>Cancel</Button>
            <Button className="flex-1" disabled={csvPreviewRows.length === 0} onClick={confirmCsvImport}>
              Import {csvPreviewRows.length} Student{csvPreviewRows.length !== 1 ? 's' : ''}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── Edit Drive Sheet ── */}
      <Sheet open={driveEditOpen} onOpenChange={v => { if (!v) setDriveEditOpen(false); }}>
        <SheetContent side="center" className="sm:max-w-lg flex flex-col p-0">
          <SheetHeader className="px-6 py-4 border-b shrink-0">
            <SheetTitle>Edit Drive Details</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div className="space-y-1.5">
              <Label>Drive Name</Label>
              <Input value={draftDriveName} onChange={e => setDraftDriveName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Day 1 Date</Label>
                <p className="text-xs text-muted-foreground -mt-1">Pre-placement & Online Test</p>
                <Input type="date" value={draftDriveDate} onChange={e => setDraftDriveDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Day 2 Date</Label>
                <p className="text-xs text-muted-foreground -mt-1">Interview, Coding & Whiteboarding</p>
                <Input type="date" value={draftDriveDay2Date} onChange={e => setDraftDriveDay2Date(e.target.value)} />
              </div>
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
              <Label>Access Mode</Label>
              <Select value={draftDriveAccessMode} onValueChange={v => setDraftDriveAccessMode(v as CampusDrive['accessMode'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in-person">In-Person (team visits college)</SelectItem>
                  <SelectItem value="remote">Remote (online pre-placement)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {draftDriveAccessMode === 'in-person'
                  ? 'Students log in with the shared test password given in the lab.'
                  : 'Students receive the test link via email and log in with their individual password.'}
              </p>
            </div>
            {draftDriveAccessMode === 'in-person' && (
              <div className="space-y-3 rounded-lg border p-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Test Window (optional)</p>
                <p className="text-xs text-muted-foreground">If set, the test link will only be accessible on the exam date within this time range.</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Start Time</Label>
                    <Input type="time" value={draftDriveExamStart} onChange={e => setDraftDriveExamStart(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">End Time</Label>
                    <Input type="time" value={draftDriveExamEnd} onChange={e => setDraftDriveExamEnd(e.target.value)} />
                  </div>
                </div>
              </div>
            )}
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
      <Sheet open={asmEditOpen} onOpenChange={v => { if (v) openAsmEdit(); else setAsmEditOpen(false); }}>
        <SheetContent side="center" className="sm:max-w-lg flex flex-col p-0">
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

      {/* ── Interview Round Sheet ── */}
      <Sheet open={interviewSheetOpen} onOpenChange={open => { if (!open) { setInterviewSheetOpen(false); setInterviewCandidate(null); } }}>
        <SheetContent side="center" className="sm:max-w-lg flex flex-col p-0">
          <SheetHeader className="px-6 py-4 border-b shrink-0">
            <SheetTitle>{interviewCandidate?.name ?? 'Interview Feedback'}</SheetTitle>
            {interviewCandidate && (
              <p className="text-sm text-muted-foreground">{interviewCandidate.email}</p>
            )}
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* Candidate links */}
            {interviewCandidate && (interviewCandidate.resumeUrl || interviewCandidate.githubUrl || interviewCandidate.linkedinUrl) && (
              <div className="flex items-center gap-2 flex-wrap">
                {interviewCandidate.resumeUrl && (
                  <a href={interviewCandidate.resumeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border hover:bg-muted transition-colors">
                    <FileText className="h-3.5 w-3.5" />
                    Resume
                  </a>
                )}
                {interviewCandidate.githubUrl && (
                  <a href={interviewCandidate.githubUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border hover:bg-muted transition-colors">
                    <ExternalLink className="h-3.5 w-3.5" />
                    GitHub
                  </a>
                )}
                {interviewCandidate.linkedinUrl && (
                  <a href={interviewCandidate.linkedinUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border hover:bg-muted transition-colors">
                    <ExternalLink className="h-3.5 w-3.5" />
                    LinkedIn
                  </a>
                )}
              </div>
            )}

            {/* Panel info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Panel</Label>
                <Input value={ivDraft.panel} onChange={e => setIvDraft(d => ({ ...d, panel: e.target.value }))} placeholder="Panel name" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Time Slot</Label>
                <Input value={ivDraft.timeSlot} onChange={e => setIvDraft(d => ({ ...d, timeSlot: e.target.value }))} placeholder="e.g. 10:00 AM – 11:00 AM" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Panel Members</Label>
              <Input value={ivDraft.panelMembers} onChange={e => setIvDraft(d => ({ ...d, panelMembers: e.target.value }))} placeholder="Names of interviewers" />
            </div>

            <div className="border-t pt-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Evaluation Scores (1–10)</p>
              <div className="space-y-4">
                {([
                  { label: 'Aptitude', scoreKey: 'aptitudeScore', commKey: 'aptitudeComments' },
                  { label: 'Technical Skills', scoreKey: 'technicalScore', commKey: 'technicalComments' },
                  { label: 'Problem Solving & Logical Thinking', scoreKey: 'problemSolvingScore', commKey: 'problemSolvingComments' },
                  { label: 'Communication', scoreKey: 'communicationScore', commKey: 'communicationComments' },
                ] as { label: string; scoreKey: keyof InterviewDraft; commKey: keyof InterviewDraft }[]).map(item => (
                  <div key={item.label} className="space-y-2 rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium">{item.label}</Label>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        className="h-7 w-16 text-sm text-center"
                        value={ivDraft[item.scoreKey]}
                        onChange={e => setIvDraft(d => ({ ...d, [item.scoreKey]: e.target.value }))}
                        placeholder="—"
                      />
                    </div>
                    <Textarea
                      rows={2}
                      className="text-xs resize-none"
                      placeholder="Comments…"
                      value={ivDraft[item.commKey] as string}
                      onChange={e => setIvDraft(d => ({ ...d, [item.commKey]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Any Other Observations</Label>
              <Textarea
                rows={2}
                className="text-xs resize-none"
                placeholder="Additional notes…"
                value={ivDraft.anyOther}
                onChange={e => setIvDraft(d => ({ ...d, anyOther: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Overall Feedback</Label>
              <Textarea
                rows={3}
                className="text-xs resize-none"
                placeholder="Overall impression and recommendation…"
                value={ivDraft.overallFeedback}
                onChange={e => setIvDraft(d => ({ ...d, overallFeedback: e.target.value }))}
              />
            </div>
          </div>
          <SheetFooter className="px-6 py-4 border-t shrink-0 flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
              onClick={() => saveInterviewFeedback('reject')}
            >
              Reject
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              onClick={() => saveInterviewFeedback('shortlist')}
            >
              Shortlist → Coding Round
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── Coding Round Sheet ── */}
      <Sheet open={codingSheetOpen} onOpenChange={open => { if (!open) { setCodingSheetOpen(false); setCodingCandidate(null); } }}>
        <SheetContent side="center" className="sm:max-w-lg flex flex-col p-0">
          <SheetHeader className="px-6 py-4 border-b shrink-0">
            <SheetTitle>{codingCandidate?.name ?? 'Coding Round'}</SheetTitle>
            {codingCandidate && (
              <p className="text-sm text-muted-foreground">{codingCandidate.email}</p>
            )}
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Panel</Label>
                <Input value={cdDraft.panel} onChange={e => setCdDraft(d => ({ ...d, panel: e.target.value }))} placeholder="Panel name" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Time Slot</Label>
                <Input value={cdDraft.timeSlot} onChange={e => setCdDraft(d => ({ ...d, timeSlot: e.target.value }))} placeholder="e.g. 2:00 PM – 4:00 PM" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Panel Members</Label>
              <Input value={cdDraft.panelMembers} onChange={e => setCdDraft(d => ({ ...d, panelMembers: e.target.value }))} placeholder="Names" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Exercise Start Time</Label>
                <Input type="time" value={cdDraft.exerciseStartTime} onChange={e => setCdDraft(d => ({ ...d, exerciseStartTime: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tech Stack</Label>
                <Input value={cdDraft.techStack} onChange={e => setCdDraft(d => ({ ...d, techStack: e.target.value }))} placeholder="e.g. Java, React" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Exercise Given?</Label>
              <Select value={cdDraft.exerciseGiven} onValueChange={v => setCdDraft(d => ({ ...d, exerciseGiven: v }))}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Coding Exercise Review</Label>
              <Textarea
                rows={3}
                className="text-xs resize-none"
                placeholder="Overall review of the coding exercise…"
                value={cdDraft.exerciseReview}
                onChange={e => setCdDraft(d => ({ ...d, exerciseReview: e.target.value }))}
              />
            </div>

            <div className="border-t pt-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Checkpoints</p>
              <div className="space-y-3">
                {([1, 2, 3] as const).map(n => (
                  <div key={n} className="space-y-1.5">
                    <Label className="text-xs">Checkpoint {n}</Label>
                    <Textarea
                      rows={2}
                      className="text-xs resize-none"
                      placeholder={`Checkpoint ${n} notes…`}
                      value={cdDraft[`checkpoint${n}` as keyof CodingDraft] as string}
                      onChange={e => setCdDraft(d => ({ ...d, [`checkpoint${n}`]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <SheetFooter className="px-6 py-4 border-t shrink-0 flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
              onClick={() => saveCodingFeedback('reject')}
            >
              Reject
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              onClick={() => saveCodingFeedback('shortlist')}
            >
              Shortlist → Whiteboarding
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── Whiteboarding Sheet ── */}
      <Sheet open={wbSheetOpen} onOpenChange={open => { if (!open) { setWbSheetOpen(false); setWbCandidate(null); } }}>
        <SheetContent side="center" className="sm:max-w-md flex flex-col p-0">
          <SheetHeader className="px-6 py-4 border-b shrink-0">
            <SheetTitle>{wbCandidate?.name ?? 'Whiteboarding'}</SheetTitle>
            {wbCandidate && (
              <p className="text-sm text-muted-foreground">{wbCandidate.email}</p>
            )}
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Selected for Cultural Fit?</Label>
              <Select value={wbDraft.culturalFit} onValueChange={v => setWbDraft(d => ({ ...d, culturalFit: v }))}>
                <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes</SelectItem>
                  <SelectItem value="no">No</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Comments</Label>
              <Textarea
                rows={4}
                className="text-sm resize-none"
                placeholder="Whiteboarding session notes and observations…"
                value={wbDraft.comments}
                onChange={e => setWbDraft(d => ({ ...d, comments: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Final Result</Label>
              <Select value={wbDraft.finalResult} onValueChange={v => setWbDraft(d => ({ ...d, finalResult: v }))}>
                <SelectTrigger><SelectValue placeholder="Select result…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Selected">Selected</SelectItem>
                  <SelectItem value="Waitlisted">Waitlisted</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              {wbDraft.finalResult === 'Selected' && (
                <p className="text-xs text-green-600 mt-1">Candidate will be moved to the Offered stage.</p>
              )}
            </div>
          </div>
          <SheetFooter className="px-6 py-4 border-t shrink-0 flex-row gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setWbSheetOpen(false)}>Cancel</Button>
            <Button className="flex-1" onClick={saveWbFeedback}>Save Result</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── Publish Confirmation Dialog ── */}
      <AlertDialog open={confirmPublishOpen} onOpenChange={setConfirmPublishOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publish this test?</AlertDialogTitle>
            <AlertDialogDescription>
              This will activate the test and make it accessible to candidates via the link and
              password. Candidates can begin taking the assessment immediately after publishing.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={handleConfirmPublish}
            >
              Yes, Publish
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Publish Success Dialog — shows link + password ── */}
      <Dialog open={publishSuccessOpen} onOpenChange={setPublishSuccessOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
              Test Published Successfully!
            </DialogTitle>
            <DialogDescription>
              Share the link and password below with your students.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Test Link
              </Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={assessmentUrl ?? ''}
                  className="font-mono text-xs"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                  disabled={!assessmentUrl}
                  onClick={() => assessmentUrl && copyToClipboard(assessmentUrl, 'Test URL')}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Password
              </Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={linkedAssessment?.accessPassword ?? ''}
                  className="font-mono tracking-widest text-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                  disabled={!linkedAssessment?.accessPassword}
                  onClick={() => linkedAssessment?.accessPassword && copyToClipboard(linkedAssessment.accessPassword, 'Password')}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button className="w-full" onClick={() => setPublishSuccessOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
