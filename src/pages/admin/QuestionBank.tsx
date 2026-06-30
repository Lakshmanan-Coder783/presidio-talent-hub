import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../../components/Modal';
import type { Question } from '../../types';
import {
  Plus, Search, ChevronDown, ChevronUp, Clock, Eye,
  BarChart2, Upload, Code, HelpCircle, CheckCircle2,
  FileText, Database, CloudUpload, CheckCircle, Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

// Stable mock stats computed from question id
const mockStats = (id: string) => {
  const n = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const views = ((n % 45) + 5) * 200;
  const rate = (n % 40) + 50;
  const time = (((n % 3) + 1) * 0.25 + 0.5).toFixed(2);
  return { views, rate, time };
};

const difficultyColor = (d: Question['difficulty']) => {
  if (d === 'Easy') return 'bg-green-100 text-green-700';
  if (d === 'Medium') return 'bg-yellow-100 text-yellow-700';
  return 'bg-red-100 text-red-700';
};

const TypeIcon: React.FC<{ type: Question['type'] }> = ({ type }) => {
  if (type === 'Coding') return <Code className="h-3 w-3 text-violet-500" />;
  if (type === 'SQL') return <Database className="h-3 w-3 text-blue-500" />;
  if (type === 'Descriptive') return <FileText className="h-3 w-3 text-orange-500" />;
  return <HelpCircle className="h-3 w-3 text-primary" />;
};

const FilterGroup: React.FC<{
  label: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}> = ({ label, open, onToggle, children }) => (
  <div className="border-b">
    <button
      onClick={onToggle}
      className="flex items-center justify-between w-full px-4 py-2.5 text-sm font-semibold hover:bg-muted/40 transition-colors"
    >
      {label}
      {open
        ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
        : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
    </button>
    {open && children}
  </div>
);

const PAGE_SIZE = 15;

export const QuestionBank: React.FC = () => {
  const { db, createQuestion, updateQuestion } = useApp();

  // Filter state
  const [skillSearch, setSkillSearch] = useState('');
  const [activeSkills, setActiveSkills] = useState<Set<string>>(new Set());
  const [activeDifficulties, setActiveDifficulties] = useState<Set<string>>(new Set());
  const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set());
  const [openSections, setOpenSections] = useState({ skill: true, difficulty: true, type: true });

  // Center state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Requested Questions');
  const [page, setPage] = useState(1);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  // Upload modal state
  const [uploadOpen, setUploadOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) setUploadedFile(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setUploadedFile(file);
  };

  const handleUploadSubmit = () => {
    if (!uploadedFile) return;
    setUploadSuccess(true);
    setTimeout(() => {
      setUploadSuccess(false);
      setUploadedFile(null);
      setUploadOpen(false);
    }, 1800);
  };

  const downloadTemplate = () => {
    const headers = [
      'Question Title',
      'Question Type',
      'Skill',
      'Tags',
      'Difficulty Level',
      'Question Text',
      'Visuals/Additional Information',
      'Answer Choice 1',
      'Answer Choice 2',
      'Answer Choice 3 (optional)',
      'Answer Choice 4 (optional)',
      'Answer Choice 5 (optional)',
      'Correct answer',
      'Answer Description (optional)',
      'Positive marks',
      'Negative marks',
    ];
    const rows = [
      [
        'Allocating storage for an array',
        'MCQ',
        'C++',
        'Array initialization, Memory management, calloc, malloc',
        'Medium',
        'You want to allocate storage for an array of 10 objects of type T. All the bits in the allocated storage must be set to zero and the allocated storage must not be uninitialized. Which of these lines of code will help you achieve this?',
        'SAMPLE QUESTION FOR REFERENCE ONLY',
        'pw = calloc(10, sizeof(T));',
        'pw = malloc(10 * sizeof(T));',
        'pw = calloc(10 , sizeof(T));',
        'pw = calloc(10*sizeof(T));',
        '',
        'Choice 1',
        '',
        '3',
        '0',
      ],
      [
        'Identify prime numbers',
        'MCQ (Checkboxes)',
        'Mathematics',
        'Number Theory, Prime Numbers',
        'Easy',
        'Which of the following are prime numbers?',
        'SAMPLE QUESTION FOR REFERENCE ONLY',
        '2',
        '4',
        '7',
        '12',
        '',
        'Choice 1, Choice 3',
        '',
        '3',
        '0',
      ],
    ];
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const csv = [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'questions_template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Create modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [text, setText] = useState('');
  const [qType, setQType] = useState<Question['type']>('MCQ');
  const [topic, setTopic] = useState<Question['topic']>('Technical');
  const [difficulty, setDifficulty] = useState<Question['difficulty']>('Medium');
  const [marks, setMarks] = useState('2');
  const [tagsInput, setTagsInput] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctOption, setCorrectOption] = useState('0');

  const allSkills = useMemo(() => {
    const s = new Set<string>();
    db.questions.forEach(q => s.add(q.skill ?? q.topic));
    return Array.from(s).sort();
  }, [db.questions]);

  const filteredQuestions = useMemo(() => {
    let qs = db.questions;
    if (activeSkills.size > 0) qs = qs.filter(q => activeSkills.has(q.skill ?? q.topic));
    if (activeDifficulties.size > 0) qs = qs.filter(q => activeDifficulties.has(q.difficulty));
    if (activeTypes.size > 0) qs = qs.filter(q => activeTypes.has(q.type));
    if (searchQuery.trim()) {
      const sq = searchQuery.toLowerCase();
      qs = qs.filter(q =>
        q.text.toLowerCase().includes(sq) ||
        q.title?.toLowerCase().includes(sq) ||
        q.tags.some(t => t.toLowerCase().includes(sq))
      );
    }
    return qs;
  }, [db.questions, activeSkills, activeDifficulties, activeTypes, searchQuery]);

  const paginatedQuestions = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredQuestions.slice(start, start + PAGE_SIZE);
  }, [filteredQuestions, page]);

  const totalPages = Math.ceil(filteredQuestions.length / PAGE_SIZE);

  const toggle = (set: Set<string>, val: string): Set<string> => {
    const next = new Set(set);
    next.has(val) ? next.delete(val) : next.add(val);
    return next;
  };

  const clearAllFilters = () => {
    setActiveSkills(new Set());
    setActiveDifficulties(new Set());
    setActiveTypes(new Set());
    setSearchQuery('');
    setPage(1);
  };

  const hasActiveFilters =
    activeSkills.size > 0 || activeDifficulties.size > 0 ||
    activeTypes.size > 0 || searchQuery.trim().length > 0;

  const handleOptionChange = (idx: number, val: string) => {
    const next = [...options]; next[idx] = val; setOptions(next);
  };

  const resetForm = () => {
    setText(''); setQType('MCQ'); setTopic('Technical'); setDifficulty('Medium');
    setMarks('2'); setTagsInput(''); setOptions(['', '', '', '']); setCorrectOption('0');
  };

  const handleSaveQuestion = () => {
    if (!text || !marks) { alert('Fill all required fields.'); return; }
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
    createQuestion({
      text, type: qType, topic, difficulty, marks: parseInt(marks), tags,
      options: ['MCQ', 'Multiple Select'].includes(qType) ? options.filter(o => o.trim()) : undefined,
      correctOptions: ['MCQ', 'Multiple Select'].includes(qType) ? [parseInt(correctOption)] : undefined,
    });
    resetForm();
    setModalOpen(false);
  };

  const openEditModal = (q: Question) => {
    setText(q.text);
    setQType(q.type);
    setTopic(q.topic);
    setDifficulty(q.difficulty);
    setMarks(String(q.marks));
    setTagsInput(q.tags.join(', '));
    setOptions(q.options?.length ? [...q.options, '', '', ''].slice(0, 4) : ['', '', '', '']);
    setCorrectOption(String(q.correctOptions?.[0] ?? 0));
    setEditingQuestion(q);
    setEditModalOpen(true);
  };

  const handleUpdateQuestion = () => {
    if (!editingQuestion || !text || !marks) return;
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
    updateQuestion(editingQuestion.id, {
      text, type: qType, topic, difficulty, marks: parseInt(marks), tags,
      options: ['MCQ', 'Multiple Select'].includes(qType) ? options.filter(o => o.trim()) : undefined,
      correctOptions: ['MCQ', 'Multiple Select'].includes(qType) ? [parseInt(correctOption)] : undefined,
    });
    if (selectedQuestion?.id === editingQuestion.id) {
      setSelectedQuestion(q => q ? { ...q, text, type: qType, topic, difficulty, marks: parseInt(marks), tags } : null);
    }
    setEditModalOpen(false);
    setEditingQuestion(null);
    resetForm();
  };

  const visibleSkills = allSkills.filter(s =>
    s.toLowerCase().includes(skillSearch.toLowerCase())
  );

  return (
    <>
      <div
        className="-m-6 flex overflow-hidden bg-background"
        style={{ height: 'calc(100vh - 3.5rem)' }}
      >

        {/* ── Left: Filter Panel ── */}
        <aside className="w-64 shrink-0 border-r overflow-y-auto bg-background">
          <div className="flex items-center justify-between px-4 py-2.5 border-b">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Filters</span>
            {hasActiveFilters && (
              <button onClick={clearAllFilters} className="text-xs text-primary hover:underline">
                Clear all
              </button>
            )}
          </div>
          <FilterGroup
            label="Skill"
            open={openSections.skill}
            onToggle={() => setOpenSections(s => ({ ...s, skill: !s.skill }))}
          >
            <div className="px-4 pb-2">
              <Input
                placeholder="Search for Skills"
                value={skillSearch}
                onChange={e => setSkillSearch(e.target.value)}
                className="h-7 text-xs"
              />
            </div>
            <div className="space-y-1.5 px-4 pb-3 max-h-52 overflow-y-auto">
              {visibleSkills.map(s => (
                <label key={s} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={activeSkills.has(s)}
                    onChange={() => { setActiveSkills(prev => toggle(prev, s)); setPage(1); }}
                    className="h-3.5 w-3.5 rounded accent-primary cursor-pointer"
                  />
                  <span className="text-xs text-muted-foreground group-hover:text-foreground">{s}</span>
                </label>
              ))}
            </div>
          </FilterGroup>

          <FilterGroup
            label="Difficulty"
            open={openSections.difficulty}
            onToggle={() => setOpenSections(s => ({ ...s, difficulty: !s.difficulty }))}
          >
            <div className="space-y-1.5 px-4 pb-3">
              {(['Easy', 'Medium', 'Hard'] as const).map(d => (
                <label key={d} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={activeDifficulties.has(d)}
                    onChange={() => { setActiveDifficulties(prev => toggle(prev, d)); setPage(1); }}
                    className="h-3.5 w-3.5 rounded accent-primary cursor-pointer"
                  />
                  <span className="text-xs text-muted-foreground group-hover:text-foreground">{d}</span>
                </label>
              ))}
            </div>
          </FilterGroup>

          <FilterGroup
            label="Question Type"
            open={openSections.type}
            onToggle={() => setOpenSections(s => ({ ...s, type: !s.type }))}
          >
            <div className="space-y-1.5 px-4 pb-3">
              {(['MCQ', 'Multiple Select', 'Coding', 'SQL', 'Descriptive'] as const).map(t => (
                <label key={t} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={activeTypes.has(t)}
                    onChange={() => { setActiveTypes(prev => toggle(prev, t)); setPage(1); }}
                    className="h-3.5 w-3.5 rounded accent-primary cursor-pointer"
                  />
                  <span className="text-xs text-muted-foreground group-hover:text-foreground">{t}</span>
                </label>
              ))}
            </div>
          </FilterGroup>
        </aside>

        {/* ── Center: Question List ── */}
        <div className="flex-1 flex flex-col overflow-hidden border-r">

          {/* Action bar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b shrink-0">
            <h2 className="text-sm font-semibold tracking-wide text-foreground">Questions</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs" onClick={() => setUploadOpen(true)}>
                <Upload className="h-3.5 w-3.5" />
                Upload in bulk
              </Button>
              <Button size="sm" className="gap-1.5 h-8 text-xs" onClick={() => setModalOpen(true)}>
                <Plus className="h-3.5 w-3.5" />
                Create Question
              </Button>
            </div>
          </div>

          {/* Search bar */}
          <div className="px-4 py-2.5 border-b shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Try searching for questions on, Data S"
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
                className="pl-8 h-8 text-sm bg-muted/40"
              />
            </div>
          </div>

          {/* Count + sort */}
          <div className="flex items-center justify-between px-4 py-1.5 border-b shrink-0 bg-muted/20">
            <span className="text-xs text-muted-foreground">
              Showing {filteredQuestions.length} questions
            </span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>Sort By</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-6 text-xs w-44 border-0 bg-transparent shadow-none focus:ring-0 px-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Requested Questions">Requested Questions</SelectItem>
                  <SelectItem value="Difficulty">Difficulty</SelectItem>
                  <SelectItem value="Newest">Newest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Question cards */}
          <div className="flex-1 overflow-y-auto divide-y">
            {paginatedQuestions.map(q => {
              const stats = mockStats(q.id);
              const isSelected = selectedQuestion?.id === q.id;
              const title = q.title || (q.text.length > 65 ? `${q.text.slice(0, 65)}…` : q.text);
              const skillLabel = q.skill ?? q.topic;
              return (
                <div
                  key={q.id}
                  onClick={() => setSelectedQuestion(q)}
                  className={cn(
                    'group px-4 py-3 cursor-pointer hover:bg-muted/40 transition-colors',
                    isSelected && 'bg-blue-50 border-l-2 border-l-blue-500'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium leading-snug flex-1">{title}</p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={e => { e.stopPropagation(); openEditModal(q); }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-muted transition-opacity"
                        title="Edit question"
                      >
                        <Pencil className="h-3 w-3 text-muted-foreground" />
                      </button>
                      <span className="text-[10px] font-semibold text-muted-foreground border rounded px-1.5 py-0.5 uppercase tracking-wide">
                        {skillLabel}
                      </span>
                    </div>
                  </div>

                  {q.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {q.tags.slice(0, 5).map(t => (
                        <span key={t} className="text-[10px] rounded border bg-muted px-1.5 py-0.5 text-muted-foreground">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      <TypeIcon type={q.type} />
                      {q.type}
                    </span>
                    <span className={cn('rounded px-1.5 py-0.5 font-medium text-[10px]', difficultyColor(q.difficulty))}>
                      {q.difficulty}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Clock className="h-3 w-3" />
                      {q.estimatedTime ? `${q.estimatedTime} min` : `${stats.time} min`}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Eye className="h-3 w-3" />
                      {stats.views >= 10000 ? '10000+' : stats.views}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <BarChart2 className="h-3 w-3" />
                      {stats.rate} %
                    </span>
                    <span className="text-primary font-medium ml-auto">Analytics</span>
                  </div>
                </div>
              );
            })}

            {paginatedQuestions.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 text-sm text-muted-foreground gap-2">
                <HelpCircle className="h-6 w-6 opacity-30" />
                No questions match your filters.
                {hasActiveFilters && (
                  <button onClick={clearAllFilters} className="text-xs text-primary hover:underline">
                    Clear all filters
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t px-4 py-2 flex items-center justify-between shrink-0">
              <Button
                variant="outline" size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
              <Button
                variant="outline" size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>

        {/* ── Right: Preview Panel ── */}
        <div className="w-[380px] shrink-0 overflow-y-auto bg-background">
          {selectedQuestion ? (
            <div className="p-4 space-y-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Preview</p>

              <h3 className="text-base font-semibold leading-snug">
                {selectedQuestion.title || selectedQuestion.text.slice(0, 80)}
              </h3>

              <div className="flex items-center gap-2 text-xs flex-wrap">
                <span className="border rounded px-2 py-0.5 text-muted-foreground">
                  Type: {selectedQuestion.type}
                </span>
                <span className="border rounded px-2 py-0.5 text-muted-foreground">
                  Skill: {selectedQuestion.skill ?? selectedQuestion.topic}
                </span>
              </div>

              {selectedQuestion.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedQuestion.tags.map(t => (
                    <span key={t} className="text-[10px] rounded-full border bg-blue-50 text-blue-700 px-2 py-0.5">
                      {t}
                    </span>
                  ))}
                </div>
              )}

              <span className={cn('inline-block text-xs rounded px-2 py-0.5 font-medium', difficultyColor(selectedQuestion.difficulty))}>
                {selectedQuestion.difficulty}
              </span>

              <p className="text-sm text-foreground leading-relaxed pt-1">
                {selectedQuestion.text}
              </p>

              {['MCQ', 'Multiple Select'].includes(selectedQuestion.type) && selectedQuestion.options && (
                <div className="space-y-2 pt-1">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Options</p>
                  {selectedQuestion.options.map((opt, i) => (
                    <div
                      key={i}
                      className={cn(
                        'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm',
                        selectedQuestion.correctOptions?.includes(i)
                          ? 'border-green-400 bg-green-50 font-medium text-green-800'
                          : 'bg-muted/30'
                      )}
                    >
                      <span className="text-xs font-semibold text-muted-foreground w-4 shrink-0">
                        {String.fromCharCode(65 + i)}
                      </span>
                      {opt}
                    </div>
                  ))}
                </div>
              )}

              {selectedQuestion.type === 'Coding' && (
                <div className="space-y-3 pt-1">
                  {selectedQuestion.functionName && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Function</p>
                      <code className="text-xs bg-muted rounded px-2 py-1.5 block font-mono">
                        {selectedQuestion.functionName}({selectedQuestion.functionParams?.map(p => p.name).join(', ')})
                      </code>
                    </div>
                  )}
                  {selectedQuestion.constraints && selectedQuestion.constraints.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Constraints</p>
                      <ul className="text-xs space-y-0.5 text-muted-foreground">
                        {selectedQuestion.constraints.map((c, i) => <li key={i}>• {c}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-3 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => openEditModal(selectedQuestion)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit Question
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 gap-3">
              <HelpCircle className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Select a question to preview it here</p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Question Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => { setEditModalOpen(false); setEditingQuestion(null); resetForm(); }}
        title="Edit Question"
        size="lg"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setEditModalOpen(false); setEditingQuestion(null); resetForm(); }}>Cancel</Button>
            <Button onClick={handleUpdateQuestion} className="gap-1.5">
              <CheckCircle className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Question Text *</Label>
              <Textarea placeholder="Enter question statement..." rows={4} value={text} onChange={e => setText(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Question Type *</Label>
              <Select value={qType} onValueChange={v => setQType(v as Question['type'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MCQ">MCQ (Single Correct)</SelectItem>
                  <SelectItem value="Multiple Select">Multiple Select</SelectItem>
                  <SelectItem value="Coding">Coding Challenge</SelectItem>
                  <SelectItem value="SQL">SQL Query</SelectItem>
                  <SelectItem value="Descriptive">Descriptive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Difficulty *</Label>
                <Select value={difficulty} onValueChange={v => setDifficulty(v as Question['difficulty'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Marks *</Label>
                <Input type="number" value={marks} onChange={e => setMarks(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Topic *</Label>
              <Select value={topic} onValueChange={v => setTopic(v as Question['topic'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Quants">Quants</SelectItem>
                  <SelectItem value="Logical">Logical</SelectItem>
                  <SelectItem value="C/C++">C/C++</SelectItem>
                  <SelectItem value="OOPs">OOPs</SelectItem>
                  <SelectItem value="SQL">SQL (MCQ)</SelectItem>
                  <SelectItem value="HTML/CSS/JS">HTML/CSS/JS</SelectItem>
                  <SelectItem value="Subjective">Subjective</SelectItem>
                  <SelectItem value="SQL Query">SQL Query</SelectItem>
                  <SelectItem value="Aptitude">Aptitude</SelectItem>
                  <SelectItem value="Logical Reasoning">Logical Reasoning</SelectItem>
                  <SelectItem value="Technical">Technical MCQ</SelectItem>
                  <SelectItem value="Coding">Coding IDE</SelectItem>
                  <SelectItem value="Verbal">Verbal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tags (comma separated)</Label>
              <Input placeholder="e.g. Arrays, Recursion" value={tagsInput} onChange={e => setTagsInput(e.target.value)} />
            </div>
          </div>
          <div className="pl-4 border-l space-y-3">
            <p className="font-semibold text-sm">MCQ / MSQ Options</p>
            {['MCQ', 'Multiple Select'].includes(qType) ? (
              <RadioGroup value={correctOption} onValueChange={setCorrectOption} className="space-y-3">
                {options.map((opt, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Option {idx + 1}</Label>
                      <RadioGroupItem value={String(idx)} id={`edit-opt-${idx}`} />
                    </div>
                    <Input
                      placeholder={`Text for option ${idx + 1}…`}
                      value={opt}
                      onChange={e => handleOptionChange(idx, e.target.value)}
                    />
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">Select the radio button to mark the correct option.</p>
              </RadioGroup>
            ) : (
              <div className="flex items-center justify-center rounded-lg border-2 border-dashed p-8 text-center text-sm text-muted-foreground">
                Options only apply to MCQ and Multiple Select types.
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Upload in Bulk Modal */}
      <Modal
        isOpen={uploadOpen}
        onClose={() => { setUploadOpen(false); setUploadedFile(null); setUploadSuccess(false); }}
        title="Upload Questions in Bulk"
        size="lg"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setUploadOpen(false); setUploadedFile(null); setUploadSuccess(false); }}>
              Cancel
            </Button>
            <Button onClick={handleUploadSubmit} disabled={!uploadedFile || uploadSuccess} className="gap-1.5">
              {uploadSuccess ? <><CheckCircle className="h-4 w-4" /> Uploaded!</> : <><CloudUpload className="h-4 w-4" /> Upload Questions</>}
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-12 cursor-pointer transition-colors',
              dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30',
              uploadSuccess && 'border-green-400 bg-green-50'
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,.json"
              className="hidden"
              onChange={handleFileSelect}
            />
            {uploadSuccess ? (
              <>
                <CheckCircle className="h-10 w-10 text-green-500" />
                <p className="text-sm font-medium text-green-700">File uploaded successfully!</p>
              </>
            ) : uploadedFile ? (
              <>
                <FileText className="h-10 w-10 text-primary/60" />
                <p className="text-sm font-medium">{uploadedFile.name}</p>
                <p className="text-xs text-muted-foreground">{(uploadedFile.size / 1024).toFixed(1)} KB — click to change</p>
              </>
            ) : (
              <>
                <CloudUpload className="h-10 w-10 text-muted-foreground/40" />
                <div className="text-center">
                  <p className="text-sm font-medium">Drag & drop your file here</p>
                  <p className="text-xs text-muted-foreground mt-0.5">or click to browse</p>
                </div>
                <p className="text-xs text-muted-foreground">Supports CSV, Excel (.xlsx), JSON</p>
              </>
            )}
          </div>

          {/* Format guide */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Required CSV columns</p>
              <button
                onClick={downloadTemplate}
                className="text-xs text-primary underline-offset-2 hover:underline font-medium"
              >
                Download sample template (.csv)
              </button>
            </div>
            <div className="font-mono text-xs text-muted-foreground bg-background rounded border px-3 py-2 leading-relaxed">
              Question Title, Question Type, Skill, Tags, Difficulty Level, Question Text, Visuals/Additional Information, Answer Choice 1, Answer Choice 2, Answer Choice 3 (optional), Answer Choice 4 (optional), Answer Choice 5 (optional), Correct answer, Answer Description (optional), Positive marks, Negative marks
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Question Type</span>: MCQ, MCQ (Checkboxes), Coding, SQL, Descriptive
              &nbsp;·&nbsp;
              <span className="font-medium text-foreground">Difficulty Level</span>: Easy, Medium, Hard
              &nbsp;·&nbsp;
              <span className="font-medium text-foreground">Correct answer</span>: Choice 1, Choice 2 … (comma-separated for multi-select)
            </p>
          </div>
        </div>
      </Modal>

      {/* Create Question Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); resetForm(); }}
        title="Add Question to Bank"
        size="lg"
        footer={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setModalOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleSaveQuestion}>Add Question</Button>
          </div>
        }
      >
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Question Text *</Label>
              <Textarea placeholder="Enter question statement..." rows={4} value={text} onChange={e => setText(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Question Type *</Label>
              <Select value={qType} onValueChange={v => setQType(v as Question['type'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MCQ">MCQ (Single Correct)</SelectItem>
                  <SelectItem value="Multiple Select">Multiple Select</SelectItem>
                  <SelectItem value="Coding">Coding Challenge</SelectItem>
                  <SelectItem value="SQL">SQL Query</SelectItem>
                  <SelectItem value="Descriptive">Descriptive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Difficulty *</Label>
                <Select value={difficulty} onValueChange={v => setDifficulty(v as Question['difficulty'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Marks *</Label>
                <Input type="number" value={marks} onChange={e => setMarks(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Topic *</Label>
              <Select value={topic} onValueChange={v => setTopic(v as Question['topic'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Quants">Quants</SelectItem>
                  <SelectItem value="Logical">Logical</SelectItem>
                  <SelectItem value="C/C++">C/C++</SelectItem>
                  <SelectItem value="OOPs">OOPs</SelectItem>
                  <SelectItem value="SQL">SQL (MCQ)</SelectItem>
                  <SelectItem value="HTML/CSS/JS">HTML/CSS/JS</SelectItem>
                  <SelectItem value="Subjective">Subjective</SelectItem>
                  <SelectItem value="SQL Query">SQL Query</SelectItem>
                  <SelectItem value="Aptitude">Aptitude</SelectItem>
                  <SelectItem value="Logical Reasoning">Logical Reasoning</SelectItem>
                  <SelectItem value="Technical">Technical MCQ</SelectItem>
                  <SelectItem value="Coding">Coding IDE</SelectItem>
                  <SelectItem value="Verbal">Verbal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Tags (comma separated)</Label>
              <Input placeholder="e.g. Arrays, Recursion" value={tagsInput} onChange={e => setTagsInput(e.target.value)} />
            </div>
          </div>

          <div className="pl-4 border-l space-y-3">
            <p className="font-semibold text-sm">MCQ / MSQ Options</p>
            {['MCQ', 'Multiple Select'].includes(qType) ? (
              <RadioGroup value={correctOption} onValueChange={setCorrectOption} className="space-y-3">
                {options.map((opt, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Option {idx + 1}</Label>
                      <RadioGroupItem value={String(idx)} id={`opt-${idx}`} />
                    </div>
                    <Input
                      placeholder={`Text for option ${idx + 1}…`}
                      value={opt}
                      onChange={e => handleOptionChange(idx, e.target.value)}
                    />
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">Select the radio button to mark the correct option.</p>
              </RadioGroup>
            ) : (
              <div className="flex items-center justify-center rounded-lg border-2 border-dashed p-8 text-center text-sm text-muted-foreground">
                Options only apply to MCQ and Multiple Select types.
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
};
