import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Table } from '../../components/Table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
} from 'lucide-react';
import type { Question } from '../../types';

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

const scoreBandVariant = (band: string) => {
  if (band === 'Excellent') return 'bg-green-100 text-green-700';
  if (band === 'Good') return 'bg-blue-100 text-blue-700';
  if (band === 'Average') return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
};

interface CandidateRow {
  id: string;
  name: string;
  email: string;
  status: string;
  startTime: string;
  percentage: number;
  band: string;
}

export const TestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { db } = useApp();

  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  const drive = useMemo(() => db.drives.find(d => d.id === id), [db.drives, id]);

  const driveCandidates = useMemo(
    () => (drive ? db.candidates.filter(c => c.college === drive.college) : []),
    [db.candidates, drive],
  );

  const assessment = useMemo(() => {
    const assessmentId = driveCandidates.find(c => c.assessmentId)?.assessmentId;
    return assessmentId ? db.assessments.find(a => a.id === assessmentId) : undefined;
  }, [driveCandidates, db.assessments]);

  const questions = useMemo(() => {
    if (!assessment) return [];
    return db.questions.filter(q => assessment.questionIds.includes(q.id));
  }, [assessment, db.questions]);

  const questionsBySection = useMemo(() => {
    if (!assessment) return {};
    const map: Record<string, Question[]> = {};
    for (const sec of assessment.sections) {
      map[sec.name] = questions.filter(q => q.topic === sec.name);
    }
    return map;
  }, [assessment, questions]);

  const candidateRows = useMemo<CandidateRow[]>(() => {
    const totalMarks = assessment?.totalMarks ?? 100;
    return driveCandidates
      .filter(c => c.assessmentStatus !== 'Not Invited')
      .map(c => {
        const pct = c.assessmentScore != null
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
  }, [driveCandidates, assessment]);

  const overview = useMemo(() => {
    const invited = candidateRows.length;
    const completed = candidateRows.filter(r => r.status === 'Finished').length;
    const started = candidateRows.filter(r => r.status !== 'Pending').length;
    const participationPct = invited ? Math.round((started / invited) * 100) : 0;
    const bandCounts = { Poor: 0, Average: 0, Good: 0, Excellent: 0 };
    for (const r of candidateRows) {
      const b = r.band as keyof typeof bandCounts;
      if (b in bandCounts) bandCounts[b]++;
    }
    const bandPct = (k: keyof typeof bandCounts) =>
      invited ? ((bandCounts[k] / invited) * 100).toFixed(2) + '%' : '0%';
    return { invited, completed, participationPct, bandPct };
  }, [candidateRows]);

  const toggleSection = (name: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const collapseAll = () => {
    if (assessment) setCollapsedSections(new Set(assessment.sections.map(s => s.name)));
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
          <span className={`text-xs font-semibold px-2 py-1 rounded ${scoreBandVariant(row.band)}`}>
            {row.band}
          </span>
        );
      },
    },
  ];

  const candidateFilters = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { label: 'Finished', value: 'Finished' },
        { label: 'In Progress', value: 'In Progress' },
        { label: 'Pending', value: 'Pending' },
      ],
    },
    {
      key: 'band',
      label: 'Score Band',
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

        {/* Questionnaire Tab */}
        <TabsContent value="questionnaire" className="m-0 p-6">
          {!assessment ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              No assessment linked to this test yet.
            </div>
          ) : (
            <div className="flex gap-6">
              {/* Left: question list */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Test duration: {assessment.duration} minutes</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={collapseAll}>
                    Collapse all
                  </Button>
                </div>

                <div className="space-y-4">
                  {assessment.sections.map((sec, sIdx) => {
                    const sectionQs = questionsBySection[sec.name] ?? [];
                    const collapsed = collapsedSections.has(sec.name);
                    return (
                      <div key={sec.name} className="border rounded-lg overflow-hidden">
                        {/* Section header */}
                        <button
                          className="w-full flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-muted/60 text-left"
                          onClick={() => toggleSection(sec.name)}
                        >
                          <div className="flex items-center gap-3">
                            {collapsed ? <ChevronRight className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                            <span className="font-semibold text-sm">{sIdx + 1}. {sec.name}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Total Marks: {sec.marks}</span>
                            <span>Shuffle Yes</span>
                            <span>Show {sectionQs.length} of {sec.questionCount} questions</span>
                          </div>
                        </button>

                        {!collapsed && (
                          <div className="divide-y">
                            {sectionQs.length === 0 ? (
                              <p className="px-4 py-3 text-sm text-muted-foreground">No questions in this section.</p>
                            ) : (
                              sectionQs.map((q, qIdx) => (
                                <button
                                  key={q.id}
                                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors ${selectedQuestion?.id === q.id ? 'bg-primary/5 border-l-2 border-primary' : ''}`}
                                  onClick={() => setSelectedQuestion(q)}
                                >
                                  <span className="text-xs text-muted-foreground w-6 shrink-0">#{qIdx + 1}</span>
                                  <span className={`text-xs font-medium px-2 py-0.5 rounded shrink-0 ${topicColor(q.topic)}`}>
                                    {q.topic}
                                  </span>
                                  <span className="text-sm flex-1 truncate">{q.text}</span>
                                  <span className="text-xs text-muted-foreground shrink-0">{q.type}</span>
                                  <span className="text-xs text-muted-foreground shrink-0">Marks: {q.marks}</span>
                                  <span className="text-xs text-muted-foreground shrink-0">1 min</span>
                                  <span className={`text-xs font-medium px-2 py-0.5 rounded shrink-0 ${difficultyColor(q.difficulty)}`}>
                                    {q.difficulty}
                                  </span>
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right: question preview */}
              {selectedQuestion && (
                <div className="w-80 shrink-0 border rounded-lg p-4 space-y-4 self-start sticky top-24">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Section: {selectedQuestion.topic}</p>
                    <h3 className="font-semibold text-base">{selectedQuestion.text.split('?')[0]}?</h3>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selectedQuestion.tags.map(tag => (
                      <span key={tag} className="text-xs bg-muted px-2 py-0.5 rounded">{tag}</span>
                    ))}
                  </div>
                  <p className="text-sm text-foreground">{selectedQuestion.text}</p>
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
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* Integrity & Experience Tab */}
        <TabsContent value="integrity" className="m-0 p-6">
          <div className="max-w-3xl space-y-4">
            {/* Candidate experience card */}
            <div className="border rounded-lg p-6 flex gap-8">
              <div className="w-56 shrink-0">
                <h3 className="font-semibold text-base mb-1">Candidate experience</h3>
                <p className="text-sm text-muted-foreground mb-4">Set the core rules for how the test runs and how candidates experience it</p>
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

            {/* Integrity experience card */}
            <div className="border rounded-lg p-6 flex gap-8">
              <div className="w-56 shrink-0">
                <h3 className="font-semibold text-base mb-1">Integrity experience</h3>
                <p className="text-sm text-muted-foreground mb-4">Secure your test with AI proctoring or custom monitoring to prevent cheating</p>
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

        {/* Candidates Tab */}
        <TabsContent value="candidates" className="m-0 p-6 space-y-6">
          {/* Overview */}
          <div className="border rounded-lg p-4">
            <div className="flex items-start justify-between mb-1">
              <h3 className="font-semibold text-sm">Overview</h3>
            </div>
            <div className="grid grid-cols-3 gap-6 mt-4">
              {/* Test progress */}
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-3 uppercase tracking-wide">Test progress</p>
                <div className="flex gap-6 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <span className="inline-block w-3 h-3 rounded-sm border border-muted-foreground" />
                      Invited
                    </p>
                    <p className="font-bold text-lg">{overview.invited}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                      Completed
                    </p>
                    <p className="font-bold text-lg">{overview.completed}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Info className="h-3 w-3 text-blue-500" />
                      Participation
                    </p>
                    <p className="font-bold text-lg">{overview.participationPct}%</p>
                  </div>
                </div>
              </div>

              {/* Score bands */}
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

              {/* Candidate feedback placeholder */}
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-3 uppercase tracking-wide">Candidate feedback</p>
                <p className="text-sm text-muted-foreground">No feedback collected yet.</p>
              </div>
            </div>
          </div>

          {/* Candidate table */}
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
    </div>
  );
};
