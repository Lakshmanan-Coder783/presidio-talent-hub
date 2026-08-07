import React, { useMemo, useRef, useState } from 'react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  BarChart2, TrendingUp, PieChart as PieIcon, Puzzle, Sparkles, ShieldCheck,
  User as UserIcon, HelpCircle, RefreshCw, Award, CheckCircle2, XCircle,
  MonitorCheck, ExternalLink,
} from 'lucide-react';
import type { Candidate, CampusDrive, Question } from '../../types';
import type { Database } from '../../utils/db';
import { scoreBand, scoreBandColor, DEFAULT_SCORE_BAND_CUTOFFS } from '../../utils/scoreBand';
import { GaugeChart, SkillRadarChart, PercentileDots, type SkillRadarPoint } from '../../components/Charts';

const SECTION_ORDER: Question['topic'][] = [
  'Quants', 'Logical', 'C/C++', 'OOPs', 'SQL', 'HTML/CSS/JS',
  'Subjective', 'SQL Query', 'Coding',
  'Aptitude', 'Logical Reasoning', 'Technical', 'Verbal',
];

const TOPIC_TO_SECTION_KEY: Partial<Record<Question['topic'], keyof NonNullable<Candidate['sectionScores']>>> = {
  'Aptitude': 'aptitude',
  'Logical Reasoning': 'logical',
  'Logical': 'logical',
  'Technical': 'technical',
  'Coding': 'coding',
  'Verbal': 'verbal',
  'Quants': 'quants',
  'C/C++': 'cpp',
  'OOPs': 'oops',
  'SQL': 'sql',
  'HTML/CSS/JS': 'htmlcssjs',
  'Subjective': 'subjective',
  'SQL Query': 'sqlQuery',
};

const NAV_ITEMS = [
  { id: 'performance', label: 'Performance', icon: BarChart2 },
  { id: 'percentile', label: 'Percentile', icon: TrendingUp },
  { id: 'hard-skills', label: 'Hard skills', icon: PieIcon },
  { id: 'soft-skills', label: 'Soft skills', icon: Puzzle },
  { id: 'ai-fluency', label: 'AI fluency', icon: Sparkles },
  { id: 'proctoring', label: 'Proctoring', icon: ShieldCheck },
  { id: 'profile', label: 'Profile', icon: UserIcon },
  { id: 'questions', label: 'Questions', icon: HelpCircle },
] as const;

const seededFraction = (seed: string): number => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  const x = Math.sin(h) * 10000;
  return x - Math.floor(x);
};

const benchmarkLabel = (percentile: number): string => {
  const p = Math.round(percentile);
  if (p >= 99) return 'Top 1%';
  if (p >= 90) return 'Top 10%';
  if (p >= 75) return 'Top 25%';
  if (p >= 50) return `Top ${100 - p}%`;
  if (p <= 1) return 'Bottom 1%';
  return `Bottom ${p}%`;
};

interface QuestionReview {
  question: Question;
  correct: boolean;
  timeSpentSec: number;
  chosenOptionIndex?: number;
  chosenOptionIndices?: number[];
}

const buildQuestionReviews = (candidate: Candidate, topic: Question['topic'], questions: Question[]): QuestionReview[] => {
  const key = TOPIC_TO_SECTION_KEY[topic];
  const topicMax = questions.reduce((s, q) => s + q.marks, 0);
  const candidateScore = key ? (candidate.sectionScores?.[key] ?? 0) : 0;
  const pCorrect = topicMax > 0 ? Math.min(1, candidateScore / topicMax) : 0;

  return questions.map(q => {
    const seed = `${candidate.id}:${q.id}`;
    const correct = seededFraction(seed) < pCorrect;
    const timeSpentSec = Math.round(30 + seededFraction(seed + ':t') * 150);

    if (q.type === 'MCQ' && q.options && q.correctOptions?.length) {
      const correctIdx = q.correctOptions[0];
      let chosenOptionIndex = correctIdx;
      if (!correct && q.options.length > 1) {
        const offset = 1 + Math.floor(seededFraction(seed + ':o') * (q.options.length - 1));
        chosenOptionIndex = (correctIdx + offset) % q.options.length;
      }
      return { question: q, correct, timeSpentSec, chosenOptionIndex };
    }
    if (q.type === 'Multiple Select' && q.options && q.correctOptions) {
      const chosenOptionIndices = correct
        ? q.correctOptions
        : q.options.map((_, i) => i).filter(i => seededFraction(`${seed}:m${i}`) > 0.5);
      return { question: q, correct, timeSpentSec, chosenOptionIndices };
    }
    return { question: q, correct, timeSpentSec };
  });
};

interface EvaluateReportProps {
  open: boolean;
  candidate: Candidate | null;
  drive: CampusDrive;
  db: Database;
  aiEvaluating: boolean;
  onRunAiEvaluation: () => void;
  onClose: () => void;
}

export const EvaluateReport: React.FC<EvaluateReportProps> = ({
  open, candidate, drive, db, aiEvaluating, onRunAiEvaluation, onClose,
}) => {
  const [selectedQuestion, setSelectedQuestion] = useState<{ topic: string; index: number } | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const driveQuestions = useMemo(
    () => db.questions.filter(q => drive.questionIds?.includes(q.id)),
    [db.questions, drive.questionIds],
  );
  const totalMarks = driveQuestions.reduce((s, q) => s + q.marks, 0);
  const sections = useMemo(() => (
    SECTION_ORDER
      .map(topic => ({ topic, questions: driveQuestions.filter(q => q.topic === topic) }))
      .filter(s => s.questions.length > 0)
  ), [driveQuestions]);

  const linkedAssessment = useMemo(() => {
    if (drive.assessmentId) return db.assessments.find(a => a.id === drive.assessmentId) ?? null;
    const withAsm = db.candidates.find(c => c.driveId === drive.id && c.assessmentId);
    return withAsm ? db.assessments.find(a => a.id === withAsm.assessmentId) ?? null : null;
  }, [db.assessments, db.candidates, drive.assessmentId, drive.id]);

  // Same-drive completed candidates (fair comparison — identical question set/marks)
  const driveCandidatesCompleted = useMemo(
    () => db.candidates.filter(c => c.driveId === drive.id && c.assessmentStatus === 'Completed'),
    [db.candidates, drive.id],
  );

  // Same-assessment pool across drives (mirrors how assessmentRank/assessmentPercentile were computed)
  const driveTotalMarksById = useMemo(() => {
    const map = new Map<string, number>();
    db.drives.forEach(d => {
      map.set(d.id, db.questions.filter(q => d.questionIds?.includes(q.id)).reduce((s, q) => s + q.marks, 0));
    });
    return map;
  }, [db.drives, db.questions]);

  const assessmentPool = useMemo(() => {
    if (!candidate?.assessmentId) return [];
    return db.candidates.filter(c => c.assessmentId === candidate.assessmentId && c.assessmentStatus === 'Completed');
  }, [db.candidates, candidate?.assessmentId]);

  const avgPercentage = useMemo(() => {
    if (assessmentPool.length === 0) return 0;
    const pcts = assessmentPool.map(c => {
      const total = c.assessmentTotalMarks ?? driveTotalMarksById.get(c.driveId) ?? 0;
      return total > 0 ? Math.min(100, ((c.assessmentScore ?? 0) / total) * 100) : 0;
    });
    return pcts.reduce((a, b) => a + b, 0) / pcts.length;
  }, [assessmentPool, driveTotalMarksById]);

  const skillRows = useMemo(() => {
    return sections.map(({ topic, questions }) => {
      const key = TOPIC_TO_SECTION_KEY[topic];
      const topicMax = questions.reduce((s, q) => s + q.marks, 0);
      const candidateScore = (key && candidate?.sectionScores?.[key]) ?? 0;
      const candidatePct = topicMax > 0 ? Math.min(100, Math.round((candidateScore / topicMax) * 100)) : 0;

      const poolScores = key
        ? driveCandidatesCompleted.map(c => c.sectionScores?.[key] ?? 0)
        : [];
      const avgPct = topicMax > 0 && poolScores.length
        ? Math.min(100, Math.round((poolScores.reduce((a, b) => a + b, 0) / poolScores.length / topicMax) * 100))
        : candidatePct;

      const rank = 1 + poolScores.filter(s => s > candidateScore).length;
      const percentile = poolScores.length > 1
        ? ((poolScores.length - rank) / (poolScores.length - 1)) * 100
        : 100;

      return { topic, candidatePct, avgPct, benchmark: benchmarkLabel(percentile) };
    });
  }, [sections, candidate, driveCandidatesCompleted]);

  const radarData: SkillRadarPoint[] = skillRows.map(r => ({ skill: r.topic, candidate: r.candidatePct, average: r.avgPct }));

  const avgDurationUsed = useMemo(() => {
    const durations = driveCandidatesCompleted.map(c => c.assessmentDurationUsed).filter((d): d is number => d != null);
    if (durations.length === 0) return null;
    return Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
  }, [driveCandidatesCompleted]);

  const scrollToSection = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (!candidate) return null;

  const effectiveTotalMarks = candidate.assessmentTotalMarks ?? totalMarks;
  const pct = effectiveTotalMarks > 0 ? Math.min(100, Math.round(((candidate.assessmentScore ?? 0) / effectiveTotalMarks) * 100)) : 0;
  const band = scoreBand(pct, {
    ...DEFAULT_SCORE_BAND_CUTOFFS,
    ...(candidate.batch === 'Batch 2' ? drive.scoreBandCutoffsBatch2 : drive.scoreBandCutoffs),
  });
  const avgScoreEquivalent = Math.round((avgPercentage / 100) * effectiveTotalMarks);
  const totalAttended = assessmentPool.length;
  const hasPracticalRound = candidate.sectionScores?.coding != null
    || candidate.sectionScores?.subjective != null
    || candidate.sectionScores?.sqlQuery != null;

  const formatDuration = (secs: number) => `${Math.floor(secs / 60)} min ${secs % 60} secs`;

  const startDate = candidate.assessmentSubmissionDate && candidate.assessmentDurationUsed != null
    ? new Date(new Date(candidate.assessmentSubmissionDate).getTime() - candidate.assessmentDurationUsed * 1000)
    : null;
  const endDate = candidate.assessmentSubmissionDate ? new Date(candidate.assessmentSubmissionDate) : null;
  const fmtDateTime = (d: Date) => d.toLocaleString('en-US', {
    day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
  });

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <SheetContent side="center" className="sm:max-w-6xl w-[95vw] h-[92vh] flex flex-col p-0 gap-0">
        <SheetHeader className="px-6 py-3 border-b shrink-0 flex-row items-center justify-between space-y-0">
          <div>
            <SheetTitle>Candidate Report</SheetTitle>
            <p className="text-sm text-muted-foreground">{drive.name}</p>
          </div>
        </SheetHeader>

        <div className="flex flex-1 min-h-0">
          {/* ── Left rail ── */}
          <div className="w-56 shrink-0 border-r flex flex-col overflow-y-auto p-4 gap-4">
            <div className="flex flex-col items-center text-center gap-2 rounded-lg border p-4">
              <div className="h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-lg font-bold">
                {candidate.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-sm leading-tight">{candidate.name}</p>
                <p className="text-xs text-muted-foreground break-all">{candidate.email}</p>
              </div>
            </div>

            <nav className="flex flex-col gap-1">
              {NAV_ITEMS.map(item => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-left"
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* ── Content ── */}
          <div ref={contentRef} className="flex-1 overflow-y-auto p-6 space-y-6">

            {/* Performance */}
            <div ref={el => { sectionRefs.current['performance'] = el; }} className="rounded-lg border p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2"><BarChart2 className="h-4 w-4 text-primary" />Performance</h3>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${scoreBandColor(band)}`}>
                  Score band: {band} &middot; Average {avgPercentage.toFixed(2)}%
                </span>
              </div>
              <div className="flex items-center gap-8 flex-wrap">
                <GaugeChart percentage={pct} color={`var(--chart-${band === 'Excellent' ? 2 : band === 'Good' ? 1 : band === 'Average' ? 3 : 4})`} label={`Average ${avgPercentage.toFixed(0)}%`} />
                <div className="flex gap-10">
                  <div>
                    <p className="text-xs text-muted-foreground">Total score</p>
                    <p className="text-xl font-bold">{candidate.assessmentScore ?? 0}/{effectiveTotalMarks}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Average test score</p>
                    <p className="text-xl font-bold">{avgScoreEquivalent}/{effectiveTotalMarks}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Percentile */}
            <div ref={el => { sectionRefs.current['percentile'] = el; }} className="rounded-lg border p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" />Percentile</h3>
                {candidate.assessmentPercentile != null && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full border bg-muted">
                    Better than {Math.round(candidate.assessmentPercentile)}% of all candidates
                  </span>
                )}
              </div>
              <div className="flex items-center gap-10 flex-wrap mb-4">
                <div>
                  <p className="text-xs text-muted-foreground">Candidate rank</p>
                  <p className="text-xl font-bold">{candidate.assessmentRank ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total attended</p>
                  <p className="text-xl font-bold">{totalAttended}</p>
                </div>
              </div>
              {candidate.assessmentRank != null && (
                <PercentileDots rank={candidate.assessmentRank} total={Math.max(totalAttended, candidate.assessmentRank)} />
              )}
            </div>

            {/* Hard skills */}
            <div ref={el => { sectionRefs.current['hard-skills'] = el; }} className="rounded-lg border p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2"><PieIcon className="h-4 w-4 text-primary" />Hard skills</h3>
                {candidate.assessmentDurationUsed != null && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full border bg-muted">
                    Time taken {formatDuration(candidate.assessmentDurationUsed)}
                    {avgDurationUsed != null && ` | Average time ${formatDuration(avgDurationUsed)}`}
                  </span>
                )}
              </div>
              <div className="grid md:grid-cols-2 gap-6 items-center">
                <SkillRadarChart data={radarData} />
                <div className="border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-3 bg-muted/50 px-3 py-2 text-xs font-semibold uppercase text-muted-foreground">
                    <span>Skill</span><span>Score</span><span>Benchmark</span>
                  </div>
                  {skillRows.map(row => (
                    <div key={row.topic} className="grid grid-cols-3 px-3 py-2 text-sm border-t items-center">
                      <span>{row.topic}</span>
                      <span className="font-semibold">{row.candidatePct}%</span>
                      <span className={row.candidatePct >= row.avgPct ? 'text-green-600 flex items-center gap-1' : 'text-red-600 flex items-center gap-1'}>
                        {row.candidatePct >= row.avgPct ? '↗' : '↘'} {row.benchmark}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {hasPracticalRound && (
                <div className="mt-6 pt-5 border-t space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Practical Round AI Evaluation</p>
                    {!candidate.practicalAiEvaluation && (
                      <Button
                        size="sm" variant="outline"
                        className="h-7 text-xs gap-1.5 border-violet-300 text-violet-700 hover:bg-violet-50"
                        onClick={onRunAiEvaluation} disabled={aiEvaluating}
                      >
                        {aiEvaluating ? (<><RefreshCw className="h-3 w-3 animate-spin" />Evaluating…</>) : (<><Award className="h-3 w-3" />AI Evaluate</>)}
                      </Button>
                    )}
                  </div>
                  {candidate.practicalAiEvaluation ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-lg border border-violet-200 bg-violet-50 p-3">
                        <span className="text-xs font-medium text-violet-700">Overall Practical Score</span>
                        <span className="text-xl font-bold text-violet-800">{candidate.practicalAiEvaluation.overallPracticalScore}/10</span>
                      </div>
                      {[
                        { label: 'Coding', score: candidate.practicalAiEvaluation.codingScore, feedback: candidate.practicalAiEvaluation.codingFeedback },
                        { label: 'SQL / Query', score: candidate.practicalAiEvaluation.sqlScore, feedback: candidate.practicalAiEvaluation.sqlFeedback },
                        { label: 'Subjective', score: candidate.practicalAiEvaluation.subjectiveScore, feedback: candidate.practicalAiEvaluation.subjectiveFeedback },
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
                        <p className="text-xs text-blue-700 leading-relaxed">{candidate.practicalAiEvaluation.summary}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] text-muted-foreground">
                          Evaluated {new Date(candidate.practicalAiEvaluation.evaluatedAt!).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}
                        </p>
                        <Button size="sm" variant="ghost" className="h-6 text-[10px] text-muted-foreground gap-1" onClick={onRunAiEvaluation} disabled={aiEvaluating}>
                          <RefreshCw className="h-2.5 w-2.5" />Re-evaluate
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

            {/* Soft skills */}
            <div ref={el => { sectionRefs.current['soft-skills'] = el; }} className="rounded-lg border p-5">
              <h3 className="font-semibold flex items-center gap-2 mb-4"><Puzzle className="h-4 w-4 text-primary" />Soft skills report</h3>
              <div className="flex gap-4 border-b mb-4 text-sm">
                {['Communication report', 'Cognitive ability report', 'Behavioral report', 'Personality report'].map((t, i) => (
                  <span key={t} className={`pb-2 ${i === 0 ? 'border-b-2 border-primary text-foreground font-medium' : 'text-muted-foreground'}`}>{t}</span>
                ))}
              </div>
              <div className="rounded-lg bg-muted/30 p-8 text-center">
                <p className="font-semibold text-sm mb-1">Not included in this test</p>
                <p className="text-xs text-muted-foreground">This test didn't include any communication questions. Add communication questions in future tests for more insights.</p>
              </div>
            </div>

            {/* AI fluency */}
            <div ref={el => { sectionRefs.current['ai-fluency'] = el; }} className="rounded-lg border p-5">
              <h3 className="font-semibold flex items-center gap-2 mb-4"><Sparkles className="h-4 w-4 text-primary" />AI fluency</h3>
              <div className="rounded-lg bg-muted/30 p-8 text-center">
                <p className="font-semibold text-sm mb-1">Not included in this test</p>
                <p className="text-xs text-muted-foreground">This test didn't include AI fluency questions, so insights on prompt-crafting skills aren't available.</p>
              </div>
            </div>

            {/* Proctoring */}
            {(() => {
              const violationCount = candidate.windowViolationCount ?? 0;
              const hasViolations = violationCount > 0;
              const deviceActivity = [
                { label: 'Full-screen exit', detected: hasViolations },
                { label: 'Tab or window switch', detected: hasViolations },
                { label: 'External copy-paste', detected: false },
                { label: 'Session interruption', detected: candidate.proctoringTerminated ?? false },
              ];
              return (
                <div ref={el => { sectionRefs.current['proctoring'] = el; }} className="rounded-lg border p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" />Proctoring</h3>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${hasViolations ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                      {violationCount} potential violation{violationCount === 1 ? '' : 's'} flagged
                    </span>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground mb-4 flex items-center gap-2">
                    <MonitorCheck className="h-4 w-4 shrink-0" />
                    {candidate.proctoringTerminated
                      ? 'This assessment was auto-submitted after exceeding the allowed number of policy violations.'
                      : 'Fullscreen, tab-switch and copy-paste monitoring were active for this test.'}
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Device activity</p>
                  <div className="grid md:grid-cols-2 gap-x-8 gap-y-3 mb-5 text-sm">
                    {deviceActivity.map(({ label, detected }) => (
                      <div key={label} className="flex items-center gap-2">
                        {detected
                          ? <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                          : <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
                        {label} {detected ? 'detected' : 'not detected'}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">External activity</p>
                  <div className="grid md:grid-cols-2 gap-x-8 gap-y-3 text-sm text-muted-foreground">
                    {['Background voice monitoring disabled', 'Additional person or object monitoring disabled', 'Additional screen monitoring disabled', 'External device monitoring disabled'].map(item => (
                      <div key={item} className="flex items-center gap-2"><XCircle className="h-4 w-4 text-muted-foreground/50 shrink-0" />{item}</div>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Profile */}
            <div ref={el => { sectionRefs.current['profile'] = el; }} className="rounded-lg border p-5">
              <h3 className="font-semibold flex items-center gap-2 mb-4"><UserIcon className="h-4 w-4 text-primary" />Profile</h3>
              <div className="grid md:grid-cols-3 gap-x-8 gap-y-4 text-sm">
                <div><p className="text-xs text-muted-foreground">Name</p><p className="font-medium">{candidate.name}</p></div>
                <div><p className="text-xs text-muted-foreground">IP address</p><p className="font-medium">{candidate.mockIpAddress ?? '—'}</p></div>
                <div><p className="text-xs text-muted-foreground">Test taken through</p><p className="font-medium">{candidate.accessMode === 'remote' ? 'Public Link' : 'Shared Test Link'}</p></div>
                <div><p className="text-xs text-muted-foreground">Email</p><p className="font-medium break-all">{candidate.email}</p></div>
                <div><p className="text-xs text-muted-foreground">Browser</p><p className="font-medium">{candidate.deviceBrowser ?? '—'}</p></div>
                <div><p className="text-xs text-muted-foreground">Test started</p><p className="font-medium">{startDate ? fmtDateTime(startDate) : '—'}</p></div>
                <div><p className="text-xs text-muted-foreground">Operating system</p><p className="font-medium">{candidate.deviceOS ?? '—'}</p></div>
                <div><p className="text-xs text-muted-foreground">Test ended</p><p className="font-medium">{endDate ? fmtDateTime(endDate) : '—'}</p></div>
                <div />
                {candidate.githubUrl && (
                  <div><p className="text-xs text-muted-foreground">GitHub URL</p><a href={candidate.githubUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline flex items-center gap-1">{candidate.githubUrl}<ExternalLink className="h-3 w-3" /></a></div>
                )}
                {candidate.linkedinUrl && (
                  <div><p className="text-xs text-muted-foreground">LinkedIn URL</p><a href={candidate.linkedinUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline flex items-center gap-1">{candidate.linkedinUrl}<ExternalLink className="h-3 w-3" /></a></div>
                )}
                {candidate.registrationNumber && (
                  <div><p className="text-xs text-muted-foreground">Registration Number</p><p className="font-medium">{candidate.registrationNumber}</p></div>
                )}
                {candidate.specialization && (
                  <div><p className="text-xs text-muted-foreground">Department</p><p className="font-medium">{candidate.specialization}</p></div>
                )}
              </div>
            </div>

            {/* Questions */}
            <div ref={el => { sectionRefs.current['questions'] = el; }} className="rounded-lg border p-5">
              <h3 className="font-semibold flex items-center gap-2 mb-4"><HelpCircle className="h-4 w-4 text-primary" />Questions</h3>
              {linkedAssessment && (
                <p className="text-xs text-muted-foreground mb-4">{linkedAssessment.name} &middot; {linkedAssessment.duration} min &middot; {totalMarks} total marks</p>
              )}
              <div className="space-y-2">
                {sections.map(({ topic, questions }) => {
                  const key = TOPIC_TO_SECTION_KEY[topic];
                  const max = questions.reduce((s, q) => s + q.marks, 0);
                  const score = Math.min(max, (key && candidate.sectionScores?.[key]) ?? 0);
                  const secPct = max > 0 ? Math.min(100, Math.round((score / max) * 100)) : 0;
                  const reviews = buildQuestionReviews(candidate, topic, questions);
                  const isOpenSection = selectedQuestion?.topic === topic;

                  return (
                    <div key={topic} className="border rounded-lg">
                      <button
                        className="w-full flex items-center justify-between px-4 py-3 text-sm"
                        onClick={() => setSelectedQuestion(isOpenSection ? null : { topic, index: 0 })}
                      >
                        <span className="font-semibold">{topic}</span>
                        <span className="flex items-center gap-3">
                          <span className="font-medium">{score}/{max}</span>
                          <span className="w-28 h-1.5 rounded-full bg-muted overflow-hidden">
                            <span className="block h-full bg-primary" style={{ width: `${secPct}%` }} />
                          </span>
                          <span className="text-muted-foreground">{secPct}%</span>
                        </span>
                      </button>

                      {isOpenSection && (
                        <div className="border-t p-4 space-y-4">
                          <div className="flex flex-wrap gap-2">
                            {reviews.map((r, idx) => (
                              <button
                                key={r.question.id}
                                onClick={() => setSelectedQuestion({ topic, index: idx })}
                                className={`h-8 w-8 rounded-full text-xs font-semibold border flex items-center justify-center ${
                                  selectedQuestion?.index === idx
                                    ? 'ring-2 ring-primary'
                                    : ''
                                } ${r.correct ? 'bg-green-50 text-green-700 border-green-300' : 'bg-red-50 text-red-700 border-red-300'}`}
                              >
                                {idx + 1}
                              </button>
                            ))}
                          </div>

                          {reviews[selectedQuestion?.index ?? 0] && (() => {
                            const review = reviews[selectedQuestion?.index ?? 0];
                            const q = review.question;
                            return (
                              <div className="space-y-3">
                                <p className="font-semibold text-sm">{q.title ?? `Question ${(selectedQuestion?.index ?? 0) + 1}`}</p>
                                <p className="text-sm text-muted-foreground">{q.text}</p>
                                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                                  {q.skill && <span className="px-2 py-0.5 rounded bg-muted">{q.skill}</span>}
                                  <span>Time spent: {Math.floor(review.timeSpentSec / 60)} min {review.timeSpentSec % 60} secs</span>
                                  <span className={`px-2 py-0.5 rounded ${q.difficulty === 'Hard' ? 'bg-red-100 text-red-700' : q.difficulty === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>{q.difficulty}</span>
                                  <span>Score: {review.correct ? q.marks : 0}/{q.marks}</span>
                                </div>

                                {(q.type === 'MCQ' || q.type === 'Multiple Select') && q.options ? (
                                  <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-xs font-semibold text-muted-foreground mb-2">Candidate response</p>
                                      <div className="space-y-1.5">
                                        {q.options.map((opt, i) => {
                                          const chosen = q.type === 'MCQ' ? review.chosenOptionIndex === i : review.chosenOptionIndices?.includes(i);
                                          return (
                                            <div key={i} className={`text-sm px-3 py-1.5 rounded border ${chosen ? (review.correct ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50') : ''}`}>
                                              {opt}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                    <div>
                                      <p className="text-xs font-semibold text-muted-foreground mb-2">Expected response</p>
                                      <div className="space-y-1.5">
                                        {q.options.map((opt, i) => {
                                          const isCorrect = q.correctOptions?.includes(i);
                                          return (
                                            <div key={i} className={`text-sm px-3 py-1.5 rounded border ${isCorrect ? 'border-green-400 bg-green-50' : ''}`}>
                                              {opt}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground italic">No response recorded for this question type.</p>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
