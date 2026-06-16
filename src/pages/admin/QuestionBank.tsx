import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Table } from '../../components/Table';
import { Modal } from '../../components/Modal';
import type { Question } from '../../types';
import { Plus, Tag, HelpCircle, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const difficultyVariant = (d: Question['difficulty']) => {
  if (d === 'Easy') return 'default';
  if (d === 'Medium') return 'secondary';
  return 'destructive';
};

export const QuestionBank: React.FC = () => {
  const { db, createQuestion } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [text, setText] = useState('');
  const [type, setType] = useState<Question['type']>('MCQ');
  const [topic, setTopic] = useState<Question['topic']>('Technical');
  const [difficulty, setDifficulty] = useState<Question['difficulty']>('Medium');
  const [marks, setMarks] = useState('2');
  const [tagsInput, setTagsInput] = useState('');
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [correctOption, setCorrectOption] = useState('0');

  const handleOptionChange = (idx: number, value: string) => {
    const next = [...options];
    next[idx] = value;
    setOptions(next);
  };

  const resetForm = () => {
    setText(''); setType('MCQ'); setTopic('Technical'); setDifficulty('Medium');
    setMarks('2'); setTagsInput(''); setOptions(['', '', '', '']); setCorrectOption('0');
  };

  const handleSaveQuestion = () => {
    if (!text || !marks) { alert('Fill all required fields.'); return; }
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
    createQuestion({
      text, type, topic, difficulty, marks: parseInt(marks), tags,
      options: ['MCQ', 'Multiple Select'].includes(type) ? options.filter(o => o.trim()) : undefined,
      correctOptions: ['MCQ', 'Multiple Select'].includes(type) ? [parseInt(correctOption)] : undefined,
    });
    resetForm();
    setModalOpen(false);
  };

  const columns = useMemo(() => [
    {
      header: 'Question Text',
      accessor: 'text' as const,
      sortable: true,
      render: (row: Question) => (
        <div className="max-w-[400px]">
          <p className="font-semibold text-sm leading-snug">
            {row.text.length > 110 ? `${row.text.slice(0, 110)}…` : row.text}
          </p>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {row.tags.map(t => (
              <span key={t} className="inline-flex items-center gap-1 text-[10px] rounded border bg-muted px-1.5 py-0.5 text-muted-foreground">
                <Tag className="h-2 w-2" />{t}
              </span>
            ))}
          </div>
        </div>
      ),
    },
    { header: 'Topic', accessor: 'topic' as const, sortable: true },
    {
      header: 'Type',
      accessor: 'type' as const,
      sortable: true,
      render: (row: Question) => (
        <span className="flex items-center gap-1.5 text-xs font-semibold">
          {row.type === 'Coding' ? <Code className="h-3.5 w-3.5 text-violet-500" /> : <HelpCircle className="h-3.5 w-3.5 text-primary" />}
          {row.type}
        </span>
      ),
    },
    {
      header: 'Difficulty',
      accessor: 'difficulty' as const,
      sortable: true,
      render: (row: Question) => <Badge variant={difficultyVariant(row.difficulty)}>{row.difficulty}</Badge>,
    },
    {
      header: 'Marks',
      accessor: 'marks' as const,
      sortable: true,
      render: (row: Question) => `${row.marks} pts`,
    },
  ], []);

  const filters = useMemo(() => [
    {
      key: 'type', label: 'Type',
      options: [
        { label: 'MCQ', value: 'MCQ' }, { label: 'Multiple Select', value: 'Multiple Select' },
        { label: 'Coding', value: 'Coding' }, { label: 'SQL', value: 'SQL' }, { label: 'Descriptive', value: 'Descriptive' },
      ],
    },
    {
      key: 'topic', label: 'Topic',
      options: [
        { label: 'Aptitude', value: 'Aptitude' }, { label: 'Logical Reasoning', value: 'Logical Reasoning' },
        { label: 'Technical', value: 'Technical' }, { label: 'Coding', value: 'Coding' }, { label: 'Verbal', value: 'Verbal' },
      ],
    },
    {
      key: 'difficulty', label: 'Difficulty',
      options: [{ label: 'Easy', value: 'Easy' }, { label: 'Medium', value: 'Medium' }, { label: 'Hard', value: 'Hard' }],
    },
  ], []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Question Bank</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Central repository of {db.questions.length} pre-approved assessment questions.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Question
        </Button>
      </div>

      <Table
        data={db.questions}
        columns={columns}
        filters={filters}
        searchPlaceholder="Search by text or tags..."
        searchKey={q => `${q.text} ${q.tags.join(' ')}`}
        initialSort={{ key: 'id', direction: 'desc' }}
        exportFileName="Question_Bank_Export"
      />

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
          {/* Left */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Question Text *</Label>
              <Textarea placeholder="Enter question statement..." rows={4} value={text} onChange={e => setText(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Question Type *</Label>
              <Select value={type} onValueChange={v => setType(v as Question['type'])}>
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

          {/* Right: MCQ options */}
          <div className="pl-4 border-l space-y-3">
            <p className="font-semibold text-sm">MCQ / MSQ Options</p>
            {['MCQ', 'Multiple Select'].includes(type) ? (
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
              <div className="flex-1 flex items-center justify-center rounded-lg border-2 border-dashed p-8 text-center text-sm text-muted-foreground">
                Options configuration is only available for MCQ and Multiple Select question types.
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
