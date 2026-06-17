import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { CodeEditor } from '../../components/CodeEditor';
import { CodingQuestionPanel } from '../../components/CodingQuestionPanel';
import { DonutChart } from '../../components/Charts';
import {
  Clock,
  CheckSquare,
  FileCheck2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Bookmark,
  LogOut,
  Trophy,
  Activity,
  Award,
  Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

export const CandidatePortal: React.FC = () => {
  const { currentUser, db, submitCandidateAssessment, logout } = useApp();
  const candidate = currentUser?.candidate;

  const [portalStep, setPortalStep] = useState<'instructions' | 'assessment' | 'submitted'>('instructions');
  const [agreed, setAgreed] = useState(false);

  const assessment = useMemo(() => {
    if (!candidate) return null;
    return db.assessments.find(a => a.id === candidate.assessmentId) || null;
  }, [candidate, db]);

  const questions = useMemo(() => {
    if (!assessment) return [];
    return db.questions.filter(q => assessment.questionIds.includes(q.id));
  }, [assessment, db]);

  const [activeIdx, setActiveIdx] = useState(0);
  const [answers, setAnswers] = useState<{ [qId: string]: any }>({});
  const [markedForReview, setMarkedForReview] = useState<{ [qId: string]: boolean }>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [durationUsed, setDurationUsed] = useState(0);

  useEffect(() => {
    if (assessment) setTimeLeft(assessment.duration * 60);
  }, [assessment]);

  useEffect(() => {
    if (portalStep !== 'assessment') return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        setDurationUsed(d => d + 1);
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [portalStep]);

  const activeQuestion = questions[activeIdx];

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
  };

  const handleAnswerSelect = (optIdx: number) => {
    if (!activeQuestion) return;
    setAnswers(prev => ({ ...prev, [activeQuestion.id]: optIdx }));
  };

  const handleMultipleSelectToggle = (optIdx: number) => {
    if (!activeQuestion) return;
    const currentAnswers = (answers[activeQuestion.id] as number[]) || [];
    const next = currentAnswers.includes(optIdx)
      ? currentAnswers.filter(v => v !== optIdx)
      : [...currentAnswers, optIdx];
    setAnswers(prev => ({ ...prev, [activeQuestion.id]: next }));
  };

  const handleTextAnswerChange = (val: string) => {
    if (!activeQuestion) return;
    setAnswers(prev => ({ ...prev, [activeQuestion.id]: val }));
  };

  const handleMarkReview = () => {
    if (!activeQuestion) return;
    setMarkedForReview(prev => ({ ...prev, [activeQuestion.id]: !prev[activeQuestion.id] }));
  };

  const handleNext = () => { if (activeIdx < questions.length - 1) setActiveIdx(activeIdx + 1); };
  const handlePrev = () => { if (activeIdx > 0) setActiveIdx(activeIdx - 1); };

  const handleAutoSubmit = () => {
    if (!candidate || !assessment) return;
    submitCandidateAssessment(candidate.id, assessment.id, answers, durationUsed);
    setPortalStep('submitted');
  };

  const handleSubmitTest = () => {
    if (window.confirm('Are you sure you want to end and submit your assessment?')) {
      handleAutoSubmit();
    }
  };

  const sectionBreakdownChartData = () => {
    const dbCandidate = db.candidates.find(c => c.id === candidate?.id);
    if (!dbCandidate || !dbCandidate.sectionScores) return [];
    const colors = ['#2563eb', '#8b5cf6', '#06b6d4', '#f59e0b', '#22c55e'];
    return Object.entries(dbCandidate.sectionScores)
      .map(([label, value], idx) => ({ label, value: Number(value), color: colors[idx % colors.length] }))
      .filter(item => item.value > 0);
  };

  if (!candidate || !assessment) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-sm w-full">
          <CardContent className="pt-8 pb-6 flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <div>
              <h3 className="font-bold text-lg">Session Configuration Error</h3>
              <p className="text-muted-foreground text-sm mt-1">
                No active candidate assessment record detected. Please sign out and log in again.
              </p>
            </div>
            <Button className="w-full" onClick={logout}>Sign Out</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Navbar */}
      <header className="flex items-center justify-between h-14 px-6 border-b bg-card shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center font-bold text-base">
            P
          </div>
          <span className="font-bold text-lg">Presidio Portal</span>
        </div>

        <div className="flex items-center gap-5 text-sm">
          <span className="text-muted-foreground">
            Candidate ID: <b className="text-foreground">{candidate.id}</b>
          </span>
          <span className="text-muted-foreground">
            Name: <b className="text-foreground">{candidate.name}</b>
          </span>
          {portalStep === 'instructions' && (
            <Button variant="outline" size="sm" onClick={logout} className="gap-1.5 h-7 text-xs">
              <LogOut className="h-3 w-3" />
              Exit
            </Button>
          )}
        </div>
      </header>

      {/* INSTRUCTIONS STEP */}
      {portalStep === 'instructions' && (
        <div className="max-w-5xl mx-auto w-full px-4 py-8">
          <Card>
            <CardContent className="p-8">
              <div className="pb-5 mb-6 border-b">
                <h2 className="text-2xl font-bold">Assessment Instructions</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Please read the instructions carefully before launching the test environment.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[2fr_1.2fr] gap-8 mb-8">
                <div className="space-y-5 text-sm leading-relaxed">
                  <div>
                    <h4 className="font-bold mb-2">General Guidelines</h4>
                    <p className="text-muted-foreground">
                      - Total Test Duration is <b className="text-foreground">{assessment.duration} minutes</b>. Keep track of the countdown timer.<br />
                      - The exam comprises <b className="text-foreground">{questions.length} questions</b> across configured sections.<br />
                      - Ensure you have a stable internet connection. Auto-save is active.<br />
                      - Do NOT close or refresh the browser.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-bold mb-2 text-destructive">AI Proctoring &amp; Compliance Rules</h4>
                    <p className="text-muted-foreground">
                      - Fullscreen mode is mandatory. Switching tabs or shifting window focus triggers violations.<br />
                      - Right-click, text selection, and copy-paste are blocked inside the editor layout.<br />
                      - Ensure your camera is active and you remain in frame throughout the assessment.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border bg-muted/50 p-5">
                  <h4 className="font-bold text-sm mb-4 flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-primary" />
                    Exam Parameters
                  </h4>
                  <div className="space-y-2.5 text-sm">
                    {[
                      { label: 'Exam Title', value: assessment.name },
                      { label: 'Duration', value: `${assessment.duration} mins` },
                      { label: 'Total Questions', value: `${questions.length} items` },
                      { label: 'Total Marks', value: `${assessment.totalMarks} pts` },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between border-b pb-2 last:border-0 last:pb-0">
                        <span className="text-muted-foreground">{label}</span>
                        <b>{value}</b>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <Separator className="mb-6" />

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="agree-inst"
                    checked={agreed}
                    onCheckedChange={v => setAgreed(v === true)}
                  />
                  <Label htmlFor="agree-inst" className="text-sm font-semibold cursor-pointer">
                    I have read, understood, and agree to comply with the instructions and proctoring rules listed above.
                  </Label>
                </div>
                <Button disabled={!agreed} onClick={() => setPortalStep('assessment')} className="px-8">
                  Launch Assessment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ASSESSMENT STEP */}
      {portalStep === 'assessment' && activeQuestion && (
        <div className="flex-1 p-4 xl:p-6">
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_260px] gap-4 h-full items-start">

            {/* Question Panel */}
            {activeQuestion.type === 'Coding' ? (
              /* ── Coding: split-view layout ── */
              <Card className="flex flex-col h-[82vh]">
                {/* Toolbar */}
                <div className="flex items-center justify-between px-4 py-2 border-b shrink-0">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary">
                    Question {activeIdx + 1} of {questions.length} • Coding Section
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">
                    Marks: <b className="text-foreground">{activeQuestion.marks} pts</b>
                  </span>
                </div>

                {/* Split body */}
                <div className="flex flex-1 min-h-0">
                  {/* Left: question description */}
                  <div className="w-[45%] border-r shrink-0 min-h-0">
                    <CodingQuestionPanel question={activeQuestion} />
                  </div>

                  {/* Right: code editor */}
                  <div className="flex-1 min-h-0 p-2">
                    <CodeEditor
                      value={answers[activeQuestion.id] || ''}
                      onChange={handleTextAnswerChange}
                      languageTemplates={activeQuestion.codingTemplate}
                    />
                  </div>
                </div>

                {/* Navigation footer */}
                <div className="flex justify-between items-center border-t px-4 py-3 shrink-0">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handlePrev} disabled={activeIdx === 0} className="gap-1">
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleNext} disabled={activeIdx === questions.length - 1} className="gap-1">
                      Save &amp; Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleMarkReview}
                      className={cn(
                        'gap-1',
                        markedForReview[activeQuestion.id]
                          ? 'border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100'
                          : ''
                      )}
                    >
                      <Bookmark className="h-3.5 w-3.5" />
                      {markedForReview[activeQuestion.id] ? 'Marked' : 'Mark for Review'}
                    </Button>
                    <Button size="sm" className="gap-1 bg-emerald-600 hover:bg-emerald-700" onClick={handleSubmitTest}>
                      Submit Assessment
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              /* ── Non-coding: original layout ── */
              <Card className="flex flex-col min-h-[520px]">
                <CardContent className="p-6 flex flex-col flex-1 justify-between">
                  <div>
                    <div className="flex justify-between items-center border-b pb-3 mb-5">
                      <span className="text-xs font-bold uppercase tracking-widest text-primary">
                        Question {activeIdx + 1} of {questions.length} • {activeQuestion.topic} Section
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground">
                        Marks: <b className="text-foreground">{activeQuestion.marks} pts</b>
                      </span>
                    </div>

                    <p className="text-base font-semibold leading-relaxed mb-6">{activeQuestion.text}</p>

                    {/* MCQ */}
                    {activeQuestion.type === 'MCQ' && activeQuestion.options && (
                      <div className="space-y-3">
                        {activeQuestion.options.map((opt, idx) => {
                          const isSelected = answers[activeQuestion.id] === idx;
                          return (
                            <div
                              key={idx}
                              onClick={() => handleAnswerSelect(idx)}
                              className={cn(
                                'flex items-center gap-3 rounded-lg border p-3.5 cursor-pointer transition-all select-none',
                                isSelected
                                  ? 'border-primary bg-primary/5 text-primary'
                                  : 'border-border hover:bg-muted/50'
                              )}
                            >
                              <div className={cn(
                                'h-4 w-4 rounded-full border-2 shrink-0',
                                isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/40 bg-background'
                              )} />
                              <span className="text-sm font-medium">{opt}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Multiple Select */}
                    {activeQuestion.type === 'Multiple Select' && activeQuestion.options && (
                      <div className="space-y-3">
                        {activeQuestion.options.map((opt, idx) => {
                          const selectedList = (answers[activeQuestion.id] as number[]) || [];
                          const isSelected = selectedList.includes(idx);
                          return (
                            <div
                              key={idx}
                              onClick={() => handleMultipleSelectToggle(idx)}
                              className={cn(
                                'flex items-center gap-3 rounded-lg border p-3.5 cursor-pointer transition-all select-none',
                                isSelected
                                  ? 'border-primary bg-primary/5 text-primary'
                                  : 'border-border hover:bg-muted/50'
                              )}
                            >
                              <div className={cn(
                                'h-4 w-4 rounded border-2 shrink-0 flex items-center justify-center',
                                isSelected
                                  ? 'border-primary bg-primary text-primary-foreground'
                                  : 'border-muted-foreground/40 bg-background'
                              )}>
                                {isSelected && <Check className="h-2.5 w-2.5" />}
                              </div>
                              <span className="text-sm font-medium">{opt}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* SQL / Descriptive */}
                    {['SQL', 'Descriptive'].includes(activeQuestion.type) && (
                      <div className="space-y-1.5">
                        <Label>Your Solution Query / Text Details</Label>
                        <Textarea
                          rows={8}
                          placeholder={activeQuestion.type === 'SQL' ? 'SELECT ... FROM ... WHERE ...' : 'Provide your descriptive notes here...'}
                          value={answers[activeQuestion.id] || ''}
                          onChange={e => handleTextAnswerChange(e.target.value)}
                          className={activeQuestion.type === 'SQL' ? 'font-mono text-sm' : ''}
                        />
                      </div>
                    )}
                  </div>

                  {/* Navigation */}
                  <div className="flex justify-between items-center border-t pt-4 mt-6">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handlePrev} disabled={activeIdx === 0} className="gap-1">
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleNext} disabled={activeIdx === questions.length - 1} className="gap-1">
                        Save &amp; Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleMarkReview}
                        className={cn(
                          'gap-1',
                          markedForReview[activeQuestion.id]
                            ? 'border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100'
                            : ''
                        )}
                      >
                        <Bookmark className="h-3.5 w-3.5" />
                        {markedForReview[activeQuestion.id] ? 'Marked' : 'Mark for Review'}
                      </Button>
                      <Button size="sm" className="gap-1 bg-emerald-600 hover:bg-emerald-700" onClick={handleSubmitTest}>
                        Submit Assessment
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigator Sidebar */}
            <Card className="sticky top-4">
              <CardContent className="p-4">
                {/* Timer */}
                <div className="text-center pb-4 border-b mb-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Time Remaining</p>
                  <div className={cn(
                    'flex items-center justify-center gap-2 mt-1 font-mono text-2xl font-black',
                    timeLeft < 300 ? 'text-destructive animate-pulse' : ''
                  )}>
                    <Clock className="h-5 w-5" />
                    {formatTime(timeLeft)}
                  </div>
                </div>

                {/* Question Grid */}
                <p className="text-xs font-bold text-foreground mb-2">Question Navigation</p>
                <div className="grid grid-cols-5 gap-1 mb-4">
                  {questions.map((q, idx) => {
                    const isCur = activeIdx === idx;
                    const isReview = markedForReview[q.id];
                    const ans = answers[q.id];
                    const isAns = ans !== undefined && (
                      typeof ans === 'string' ? ans.trim().length > 0 : Array.isArray(ans) ? ans.length > 0 : true
                    );
                    return (
                      <button
                        key={q.id}
                        onClick={() => setActiveIdx(idx)}
                        className={cn(
                          'h-8 w-full text-[11px] font-bold rounded border transition-colors',
                          isCur
                            ? 'bg-primary text-primary-foreground border-primary'
                            : isReview
                            ? 'bg-amber-100 text-amber-700 border-amber-400'
                            : isAns
                            ? 'bg-emerald-100 text-emerald-700 border-emerald-400'
                            : 'bg-muted text-muted-foreground border-border'
                        )}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="space-y-1.5 border-t pt-3 text-[11px]">
                  {[
                    { color: 'bg-muted border', label: 'Unvisited' },
                    { color: 'bg-primary border-primary', label: 'Active View' },
                    { color: 'bg-emerald-100 border-emerald-400', label: 'Answered' },
                    { color: 'bg-amber-100 border-amber-400', label: 'Marked for Review' },
                  ].map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-sm border shrink-0 ${color}`} />
                      <span className="text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* RESULTS STEP */}
      {portalStep === 'submitted' && (() => {
        const dbCandidate = db.candidates.find(c => c.id === candidate.id);
        if (!dbCandidate) return null;
        return (
          <div className="max-w-4xl mx-auto w-full px-4 py-8">
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                  <FileCheck2 className="h-8 w-8" />
                </div>

                <h2 className="text-2xl font-black">Assessment Submitted Successfully</h2>
                <p className="text-muted-foreground text-sm mt-2">
                  Your score has been registered. Below is your performance breakdown report.
                </p>

                <div className="grid grid-cols-3 gap-4 rounded-xl bg-muted/50 border p-6 my-6">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Marks Scored</p>
                    <p className="text-2xl font-black text-emerald-600 mt-1">
                      {dbCandidate.assessmentScore} / {assessment.totalMarks}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Percentile Rank</p>
                    <p className="text-2xl font-black text-primary mt-1">{dbCandidate.assessmentPercentile}%</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">State-wide Rank</p>
                    <p className="text-2xl font-black mt-1">#{dbCandidate.assessmentRank}</p>
                  </div>
                </div>

                {dbCandidate.sectionScores && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left mt-2">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-primary" />
                          Section-wise Breakdown
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <DonutChart data={sectionBreakdownChartData()} />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Activity className="h-4 w-4 text-primary" />
                          Next Steps
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          Your assessment responses and compiling analysis logs have been synced to the Presidio Talent Recruitment database. The Talent Acquisition panel will review your codes and scorecards for interview shortlist scheduling.
                        </p>
                        <Alert className="border-emerald-300 bg-emerald-50 text-emerald-700">
                          <Award className="h-4 w-4" />
                          <AlertDescription className="text-xs font-semibold">
                            Eligible for shortlisting parameters check!
                          </AlertDescription>
                        </Alert>
                      </CardContent>
                    </Card>
                  </div>
                )}

                <Button onClick={logout} className="mt-6 px-10">
                  Sign Out of Portal
                </Button>
              </CardContent>
            </Card>
          </div>
        );
      })()}
    </div>
  );
};
