import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { CodeEditor } from '../../components/CodeEditor';
import { CodingQuestionPanel } from '../../components/CodingQuestionPanel';
import { DonutChart } from '../../components/Charts';
import { toast } from 'sonner';
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
  Calculator,
  FlaskConical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { StarRating } from '@/components/ui/star-rating';
import { resolveExperienceSettings } from '../../utils/experienceSettings';
import { seededShuffle, shuffleQuestionOptions } from '../../utils/seededShuffle';
import { loadTestSession, saveTestSession, clearTestSession } from '../../utils/testSession';

function SimpleCalculator() {
  const [display, setDisplay] = useState('0');
  const [stored, setStored] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const compute = (a: number, b: number, op: string) => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '×': return a * b;
      case '÷': return b === 0 ? NaN : a / b;
      default: return b;
    }
  };

  const inputDigit = (d: string) => {
    if (waitingForOperand) {
      setDisplay(d);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? d : display + d);
    }
  };

  const inputDot = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes('.')) setDisplay(display + '.');
  };

  const backspace = () => setDisplay(display.length > 1 ? display.slice(0, -1) : '0');

  const clear = () => {
    setDisplay('0');
    setStored(null);
    setOperator(null);
    setWaitingForOperand(false);
  };

  const handleOperator = (nextOp: string) => {
    const inputValue = parseFloat(display);
    if (stored === null) {
      setStored(inputValue);
    } else if (operator) {
      const result = compute(stored, inputValue, operator);
      setStored(result);
      setDisplay(String(result));
    }
    setOperator(nextOp);
    setWaitingForOperand(true);
  };

  const handleEquals = () => {
    const inputValue = parseFloat(display);
    if (operator && stored !== null) {
      const result = compute(stored, inputValue, operator);
      setDisplay(String(result));
      setStored(null);
      setOperator(null);
      setWaitingForOperand(true);
    }
  };

  const btn = (label: string, onClick: () => void, className = '') => (
    <button
      type="button"
      onClick={onClick}
      className={cn('h-9 rounded-md text-sm font-medium border hover:bg-muted transition-colors', className)}
    >
      {label}
    </button>
  );

  return (
    <div className="w-56 space-y-2">
      <div className="rounded-md bg-muted px-3 py-2 text-right font-mono text-lg font-bold truncate">{display}</div>
      <div className="grid grid-cols-4 gap-1.5">
        {btn('C', clear, 'text-destructive')}
        {btn('⌫', backspace)}
        {btn('÷', () => handleOperator('÷'))}
        {btn('×', () => handleOperator('×'))}
        {btn('7', () => inputDigit('7'))}
        {btn('8', () => inputDigit('8'))}
        {btn('9', () => inputDigit('9'))}
        {btn('-', () => handleOperator('-'))}
        {btn('4', () => inputDigit('4'))}
        {btn('5', () => inputDigit('5'))}
        {btn('6', () => inputDigit('6'))}
        {btn('+', () => handleOperator('+'))}
        {btn('1', () => inputDigit('1'))}
        {btn('2', () => inputDigit('2'))}
        {btn('3', () => inputDigit('3'))}
        {btn('=', handleEquals, 'bg-primary text-primary-foreground hover:bg-primary/90')}
        {btn('0', () => inputDigit('0'), 'col-span-3')}
        {btn('.', inputDot)}
      </div>
    </div>
  );
}

export const CandidatePortal: React.FC = () => {
  const { currentUser, db, submitCandidateAssessment, logout, updateCandidate } = useApp();
  // currentUser.candidate is a snapshot taken at login time (before the status
  // flip to InProgress) and is never refreshed — always prefer the live record.
  const candidate = useMemo(() => {
    if (!currentUser?.id) return null;
    return db.candidates.find(c => c.id === currentUser.id) ?? currentUser.candidate ?? null;
  }, [currentUser, db.candidates]);

  const [portalStep, setPortalStep] = useState<'instructions' | 'assessment' | 'submitted'>('instructions');
  const [agreed, setAgreed] = useState(false);

  const assessment = useMemo(() => {
    if (!candidate) return null;
    return db.assessments.find(a => a.id === candidate.assessmentId) || null;
  }, [candidate, db]);

  const drive = useMemo(() => {
    if (!candidate) return null;
    return db.drives.find(d => d.id === candidate.driveId) || null;
  }, [candidate, db]);

  const exp = useMemo(() => resolveExperienceSettings(drive), [drive]);
  const singleQuestionMode = exp.testType === 'single-question';
  const fixedSectionOrder = exp.testNavigation === 'fixed-section-order';

  const questions = useMemo(() => {
    if (!assessment || !candidate) return [];
    // drive.questionIds (Questions tab) is the source of truth for what's attached;
    // assessment.questionIds is only set once, at creation time.
    const ids = drive?.questionIds ?? assessment.questionIds;
    let qs = db.questions.filter(q => ids.includes(q.id));

    if (fixedSectionOrder && assessment.sections?.length) {
      const bySection: Record<string, typeof qs> = {};
      qs.forEach(q => {
        bySection[q.topic] = bySection[q.topic] || [];
        bySection[q.topic].push(q);
      });
      const sectionNames = assessment.sections.map(s => s.name);
      const ordered = sectionNames.flatMap(name => {
        const group = bySection[name] || [];
        return exp.randomQuestions ? seededShuffle(group, `${candidate.id}:${assessment.id}:${name}`) : group;
      });
      const coveredIds = new Set(ordered.map(q => q.id));
      qs = [...ordered, ...qs.filter(q => !coveredIds.has(q.id))];
    } else if (exp.randomQuestions) {
      qs = seededShuffle(qs, `${candidate.id}:${assessment.id}`);
    }

    if (exp.randomAnswers) {
      qs = qs.map(q => shuffleQuestionOptions(q, `${candidate.id}:${assessment.id}`));
    }

    return qs;
  }, [assessment, db.questions, candidate, drive, fixedSectionOrder, exp.randomQuestions, exp.randomAnswers]);

  const questionSectionIdx = useMemo(() => {
    if (!assessment?.sections?.length) return questions.map(() => 0);
    return questions.map(q => {
      const idx = assessment.sections.findIndex(s => s.name === q.topic);
      return idx === -1 ? assessment.sections.length : idx;
    });
  }, [questions, assessment]);

  const [activeIdx, setActiveIdx] = useState(0);
  const [answers, setAnswers] = useState<{ [qId: string]: any }>({});
  const [markedForReview, setMarkedForReview] = useState<{ [qId: string]: boolean }>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [durationUsed, setDurationUsed] = useState(0);
  const [sessionStartedAt, setSessionStartedAt] = useState<string | null>(null);
  const [maxUnlockedSection, setMaxUnlockedSection] = useState(0);
  const [restartBlocked, setRestartBlocked] = useState(false);
  const timeAlertShownRef = useRef(false);

  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Detect a resumed/restarted session (existing saved progress for an in-progress attempt).
  useEffect(() => {
    if (!candidate || !assessment) return;
    const saved = loadTestSession(candidate.id);
    if (saved && candidate.assessmentStatus === 'InProgress') {
      const maxRestart = exp.maxRestartAllowed;
      const nextCount = (candidate.restartCount || 0) + 1;
      if (typeof maxRestart === 'number' && nextCount > maxRestart) {
        setRestartBlocked(true);
        return;
      }
      updateCandidate({ ...candidate, restartCount: nextCount });
      setAnswers(saved.answers);
      setMarkedForReview(saved.markedForReview);
      setActiveIdx(saved.activeIdx);
      setSessionStartedAt(saved.sessionStartedAt);
      setPortalStep('assessment');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidate?.id, assessment?.id]);

  // Compute remaining time from an absolute session-start timestamp, so a page
  // refresh can't silently grant a fresh full-duration timer.
  useEffect(() => {
    if (!assessment || !sessionStartedAt) return;
    const elapsedSec = Math.floor((Date.now() - new Date(sessionStartedAt).getTime()) / 1000);
    setTimeLeft(Math.max(0, assessment.duration * 60 - elapsedSec));
    setDurationUsed(Math.max(0, elapsedSec));
  }, [assessment, sessionStartedAt]);

  // Persist in-progress answers/position so a reload can resume instead of resetting.
  useEffect(() => {
    if (portalStep !== 'assessment' || !sessionStartedAt || !candidate) return;
    saveTestSession(candidate.id, { answers, markedForReview, activeIdx, sessionStartedAt });
  }, [answers, markedForReview, activeIdx, portalStep, sessionStartedAt, candidate]);

  useEffect(() => {
    if (portalStep !== 'assessment') return;
    const interval = setInterval(() => {
      if (sessionStartedAt && exp.sessionTimeoutHours) {
        const deadline = new Date(sessionStartedAt).getTime() + exp.sessionTimeoutHours * 3600 * 1000;
        if (Date.now() >= deadline) {
          clearInterval(interval);
          handleAutoSubmit();
          return;
        }
      }
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        const next = prev - 1;
        if (exp.displayTimeLeftAlert && next === 300 && !timeAlertShownRef.current) {
          timeAlertShownRef.current = true;
          toast.warning('5 minutes remaining!');
        }
        setDurationUsed(d => d + 1);
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [portalStep, sessionStartedAt, exp.sessionTimeoutHours, exp.displayTimeLeftAlert]);

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

  const handleNext = () => {
    if (activeIdx < questions.length - 1) {
      const nextIdx = activeIdx + 1;
      if (fixedSectionOrder) {
        setMaxUnlockedSection(prev => Math.max(prev, questionSectionIdx[nextIdx] ?? 0));
      }
      setActiveIdx(nextIdx);
    }
  };
  const handlePrev = () => { if (activeIdx > 0) setActiveIdx(activeIdx - 1); };

  const handleLaunch = () => {
    if (!candidate) return;
    const startedAt = new Date().toISOString();
    setSessionStartedAt(startedAt);
    saveTestSession(candidate.id, { answers: {}, markedForReview: {}, activeIdx: 0, sessionStartedAt: startedAt });
    setPortalStep('assessment');
  };

  const handleAutoSubmit = () => {
    if (!candidate || !assessment) return;
    submitCandidateAssessment(candidate.id, assessment.id, answers, durationUsed);
    clearTestSession(candidate.id);
    if (exp.emailOnReportGeneration) {
      toast.success(`Report emailed to ${candidate.email}`);
    }
    setPortalStep('submitted');
  };

  const handleSubmitTest = () => {
    if (window.confirm('Are you sure you want to end and submit your assessment?')) {
      handleAutoSubmit();
    }
  };

  const submitFeedback = () => {
    if (!candidate) return;
    const dbCandidate = db.candidates.find(c => c.id === candidate.id);
    if (!dbCandidate) return;
    updateCandidate({ ...dbCandidate, feedbackRating, feedbackComment });
    setFeedbackSubmitted(true);
    toast.success('Thanks for your feedback!');
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

  if (exp.allowedDevices === 'computers' && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-sm w-full">
          <CardContent className="pt-8 pb-6 flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <div>
              <h3 className="font-bold text-lg">Computer Required</h3>
              <p className="text-muted-foreground text-sm mt-1">
                This assessment must be taken on a desktop or laptop. Please switch devices and log in again.
              </p>
            </div>
            <Button className="w-full" onClick={logout}>Sign Out</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (restartBlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-sm w-full">
          <CardContent className="pt-8 pb-6 flex flex-col items-center gap-4 text-center">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <div>
              <h3 className="font-bold text-lg">Restart Limit Reached</h3>
              <p className="text-muted-foreground text-sm mt-1">
                You've exceeded the maximum of {exp.maxRestartAllowed} restart{exp.maxRestartAllowed === 1 ? '' : 's'} allowed
                for this assessment. Please contact your exam coordinator.
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

      {exp.practiceTest && (
        <div className="flex items-center justify-center gap-1.5 bg-amber-50 border-b border-amber-200 text-amber-800 text-xs font-semibold text-center py-1.5 shrink-0">
          <FlaskConical className="h-3.5 w-3.5" />
          Practice Test Mode — this attempt is not scored for evaluation
        </div>
      )}

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
                <Button disabled={!agreed} onClick={handleLaunch} className="px-8">
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
          <div className={cn('grid grid-cols-1 gap-4 h-full items-start', !singleQuestionMode && 'xl:grid-cols-[1fr_260px]')}>

            {/* Question Panel */}
            {activeQuestion.type === 'Coding' ? (
              /* ── Coding: split-view layout ── */
              <Card className="flex flex-col h-[82vh]">
                {/* Toolbar */}
                <div className="flex items-center justify-between px-4 py-2 border-b shrink-0">
                  <span className="text-xs font-bold uppercase tracking-widest text-primary">
                    Question {activeIdx + 1} of {questions.length} • Coding Section
                  </span>
                  {exp.showQuestionScore && (
                    <span className="text-xs font-semibold text-muted-foreground">
                      Marks: <b className="text-foreground">{activeQuestion.marks} pts</b>
                    </span>
                  )}
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
                    {!singleQuestionMode && (
                      <Button variant="outline" size="sm" onClick={handlePrev} disabled={activeIdx === 0} className="gap-1">
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={handleNext} disabled={activeIdx === questions.length - 1} className="gap-1">
                      Save &amp; Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    {!singleQuestionMode && (
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
                    )}
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
                      {exp.showQuestionScore && (
                        <span className="text-xs font-semibold text-muted-foreground">
                          Marks: <b className="text-foreground">{activeQuestion.marks} pts</b>
                        </span>
                      )}
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
                      {!singleQuestionMode && (
                        <Button variant="outline" size="sm" onClick={handlePrev} disabled={activeIdx === 0} className="gap-1">
                          <ChevronLeft className="h-4 w-4" />
                          Previous
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={handleNext} disabled={activeIdx === questions.length - 1} className="gap-1">
                        Save &amp; Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      {!singleQuestionMode && (
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
                      )}
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

                {!singleQuestionMode && (
                  <>
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
                        const isLocked = fixedSectionOrder && (questionSectionIdx[idx] ?? 0) > maxUnlockedSection;
                        return (
                          <button
                            key={q.id}
                            onClick={() => !isLocked && setActiveIdx(idx)}
                            disabled={isLocked}
                            title={isLocked ? 'Complete the current section first' : undefined}
                            className={cn(
                              'h-8 w-full text-[11px] font-bold rounded border transition-colors',
                              isLocked
                                ? 'bg-muted/50 text-muted-foreground/40 border-border cursor-not-allowed'
                                : isCur
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
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {portalStep === 'assessment' && exp.enableCalculator && (
        <Popover>
          <PopoverTrigger asChild>
            <Button size="icon" className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg">
              <Calculator className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-auto">
            <SimpleCalculator />
          </PopoverContent>
        </Popover>
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
                  {exp.practiceTest
                    ? 'This was a practice attempt — your score below is for your own reference and is not counted for evaluation.'
                    : 'Your score has been registered. Below is your performance breakdown report.'}
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

                {exp.allowCandidateFeedback && (
                  <Card className="text-left mt-6">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Share your feedback</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {feedbackSubmitted ? (
                        <p className="text-sm text-muted-foreground">Your feedback has been recorded. Thank you!</p>
                      ) : (
                        <>
                          <StarRating value={feedbackRating} onChange={setFeedbackRating} max={5} className="max-w-[220px]" />
                          <Textarea
                            rows={3}
                            placeholder="Tell us about your assessment experience (optional)..."
                            value={feedbackComment}
                            onChange={e => setFeedbackComment(e.target.value)}
                          />
                          <Button size="sm" variant="outline" disabled={feedbackRating === 0} onClick={submitFeedback}>
                            Submit Feedback
                          </Button>
                        </>
                      )}
                    </CardContent>
                  </Card>
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
