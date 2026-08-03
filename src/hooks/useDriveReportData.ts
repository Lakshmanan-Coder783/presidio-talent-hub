import { useMemo } from 'react';
import type { Candidate } from '../types';
import { deriveInterviewStatus, deriveCodingStatus, deriveWhiteboardStatus } from '../utils/candidateStatus';

export interface StageCount {
  stage: string;
  count: number;
  pct: number;
}

export interface LabeledValue {
  label: string;
  value: number;
}

export interface DriveReportData {
  pipelineFunnel: StageCount[];
  stageScoreAverages: LabeledValue[];
  interviewOutcome: LabeledValue[];
  interviewCriteriaAverages: LabeledValue[];
  codingOutcome: LabeledValue[];
  codingScoreAvg: number | null;
  whiteboardOutcome: LabeledValue[];
  finalOutcome: LabeledValue[];
  finalOutcomeTotal: number;
  offeredCount: number;
}

const avg = (values: number[]): number | null =>
  values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : null;

const countBy = <T extends string>(items: T[], labels: readonly T[]): LabeledValue[] =>
  labels.map(label => ({ label, value: items.filter(v => v === label).length }));

export function useDriveReportData(driveCandidates: Candidate[], totalMarks: number): DriveReportData {
  return useMemo(() => {
    const registered = driveCandidates.length;
    const pct = (n: number) => (registered > 0 ? Math.round((n / registered) * 100) : 0);

    const oaCompleted = driveCandidates.filter(c => c.assessmentStatus === 'Completed');
    const oaShortlisted = driveCandidates.filter(c => c.oaShortlisted === true);
    const interviewCandidates = driveCandidates.filter(c => c.oaShortlisted === true);
    const interviewShortlisted = driveCandidates.filter(c => c.interviewShortlisted === true);
    const codingRoundCandidates = driveCandidates.filter(c => c.interviewShortlisted === true);
    const codingShortlisted = driveCandidates.filter(c => c.codingShortlisted === true);
    const whiteboardCandidates = driveCandidates.filter(c => c.codingShortlisted === true);
    const whiteboardSelected = driveCandidates.filter(c => c.whiteboardFinalResult === 'Selected');
    const offeredOrJoined = driveCandidates.filter(
      c => c.offerStatus === 'Offered' || c.offerStatus === 'Accepted' || c.offerStatus === 'Joined',
    );

    const pipelineFunnel: StageCount[] = [
      { stage: 'Registered', count: registered, pct: pct(registered) },
      { stage: 'OA Completed', count: oaCompleted.length, pct: pct(oaCompleted.length) },
      { stage: 'OA Shortlisted', count: oaShortlisted.length, pct: pct(oaShortlisted.length) },
      { stage: 'Interview Shortlisted', count: interviewShortlisted.length, pct: pct(interviewShortlisted.length) },
      { stage: 'Coding Shortlisted', count: codingShortlisted.length, pct: pct(codingShortlisted.length) },
      { stage: 'Whiteboard Selected', count: whiteboardSelected.length, pct: pct(whiteboardSelected.length) },
      { stage: 'Offered / Joined', count: offeredOrJoined.length, pct: pct(offeredOrJoined.length) },
    ];

    const oaPct = avg(
      oaCompleted
        .map(c => {
          const effectiveTotal = c.assessmentTotalMarks ?? totalMarks;
          return effectiveTotal > 0 ? Math.min(100, ((c.assessmentScore ?? 0) / effectiveTotal) * 100) : null;
        })
        .filter((v): v is number => v != null),
    );

    const interviewScoresFlat = driveCandidates.flatMap(c =>
      [c.interviewAptitudeScore, c.interviewTechnicalScore, c.interviewProblemSolvingScore, c.interviewCommunicationScore].filter(
        (v): v is number => v != null,
      ),
    );
    const interviewAvg = avg(interviewScoresFlat);
    const interviewAvgPct = interviewAvg != null ? interviewAvg * 10 : null;

    const codingScores = driveCandidates.map(c => c.codingScore).filter((v): v is number => v != null);
    const codingScoreAvg = avg(codingScores);
    const codingAvgPct = codingScoreAvg != null ? codingScoreAvg * 10 : null;

    const stageScoreAverages: LabeledValue[] = [
      { label: 'Online Assessment', value: oaPct != null ? Math.round(oaPct) : 0 },
      { label: 'Interview Round', value: interviewAvgPct != null ? Math.round(interviewAvgPct) : 0 },
      { label: 'Coding Round', value: codingAvgPct != null ? Math.round(codingAvgPct) : 0 },
    ];

    const interviewStatusLabels = ['Shortlisted', 'Rejected', 'In Progress', 'Pending'] as const;
    const interviewOutcome = countBy(interviewCandidates.map(deriveInterviewStatus), interviewStatusLabels);

    const criteriaAvg = (values: (number | undefined)[]): number =>
      Math.round(((avg(values.filter((v): v is number => v != null)) ?? 0)) * 10) / 10;

    const interviewCriteriaAverages: LabeledValue[] = [
      { label: 'Aptitude', value: criteriaAvg(driveCandidates.map(c => c.interviewAptitudeScore)) },
      { label: 'Technical', value: criteriaAvg(driveCandidates.map(c => c.interviewTechnicalScore)) },
      { label: 'Problem Solving', value: criteriaAvg(driveCandidates.map(c => c.interviewProblemSolvingScore)) },
      { label: 'Communication', value: criteriaAvg(driveCandidates.map(c => c.interviewCommunicationScore)) },
    ];

    const codingStatusLabels = ['Shortlisted', 'Rejected', 'In Progress', 'Pending'] as const;
    const codingOutcome = countBy(codingRoundCandidates.map(deriveCodingStatus), codingStatusLabels);

    const whiteboardStatusLabels = ['Selected', 'Not Selected', 'Pending'] as const;
    const whiteboardOutcome = countBy(whiteboardCandidates.map(deriveWhiteboardStatus), whiteboardStatusLabels);

    const finalOutcomeLabels = ['Offered', 'Accepted', 'Declined', 'Joined'] as const;
    const finalOutcome = countBy(
      driveCandidates.map(c => c.offerStatus).filter((s): s is typeof finalOutcomeLabels[number] => s !== 'None'),
      finalOutcomeLabels,
    );

    return {
      pipelineFunnel,
      stageScoreAverages,
      interviewOutcome,
      interviewCriteriaAverages,
      codingOutcome,
      codingScoreAvg,
      whiteboardOutcome,
      finalOutcome,
      finalOutcomeTotal: registered,
      offeredCount: offeredOrJoined.length,
    };
  }, [driveCandidates, totalMarks]);
}
