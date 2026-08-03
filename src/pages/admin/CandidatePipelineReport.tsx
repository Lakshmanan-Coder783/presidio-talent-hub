import React, { useMemo } from 'react';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import {
  BarChart2, Users, Code, FileText,
} from 'lucide-react';
import type { Candidate, CampusDrive } from '../../types';
import type { Database } from '../../utils/db';
import { scoreBand, scoreBandColor, DEFAULT_SCORE_BAND_CUTOFFS } from '../../utils/scoreBand';
import { deriveInterviewStatus, deriveCodingStatus, deriveWhiteboardStatus } from '../../utils/candidateStatus';

interface CandidatePipelineReportProps {
  open: boolean;
  candidate: Candidate | null;
  drive: CampusDrive;
  db: Database;
  onClose: () => void;
}

const statusPillCls = (status: string) => {
  if (status === 'Shortlisted' || status === 'Selected') return 'bg-green-100 text-green-700';
  if (status === 'Rejected' || status === 'Not Selected') return 'bg-red-100 text-red-700';
  if (status === 'In Progress') return 'bg-amber-100 text-amber-700';
  return 'bg-gray-100 text-gray-600';
};

const Field: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
  <div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-sm font-medium">{value ?? '—'}</p>
  </div>
);

const NotCompleted: React.FC<{ label: string }> = ({ label }) => (
  <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
    {label} not yet completed.
  </div>
);

export const CandidatePipelineReport: React.FC<CandidatePipelineReportProps> = ({
  open, candidate, drive, db, onClose,
}) => {
  const totalMarks = useMemo(
    () => db.questions.filter(q => drive.questionIds?.includes(q.id)).reduce((s, q) => s + q.marks, 0),
    [db.questions, drive.questionIds],
  );

  if (!candidate) return null;

  const oaCompleted = candidate.assessmentStatus === 'Completed';
  const effectiveTotal = candidate.assessmentTotalMarks ?? totalMarks;
  const pct = effectiveTotal > 0 ? Math.min(100, Math.round(((candidate.assessmentScore ?? 0) / effectiveTotal) * 100)) : 0;
  const band = scoreBand(pct, { ...DEFAULT_SCORE_BAND_CUTOFFS, ...drive.scoreBandCutoffs });

  const interviewStatus = deriveInterviewStatus(candidate);
  const interviewStarted = interviewStatus !== 'Pending';
  const primaryPanelist = db.users.find(u => u.id === candidate.interviewPrimaryPanelistId);
  const secondaryPanelist = db.users.find(u => u.id === candidate.interviewSecondaryPanelistId);

  const codingStatus = deriveCodingStatus(candidate);
  const codingStarted = codingStatus !== 'Pending';

  const whiteboardStatus = deriveWhiteboardStatus(candidate);
  const whiteboardStarted = whiteboardStatus !== 'Pending';

  return (
    <Sheet open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <SheetContent side="center" className="sm:max-w-3xl w-[95vw] h-[90vh] flex flex-col p-0 gap-0">
        <SheetHeader className="px-6 py-4 border-b shrink-0">
          <SheetTitle>{candidate.name} - {candidate.email}</SheetTitle>
          <p className="text-sm text-muted-foreground">{candidate.college}</p>
          <p className="text-sm text-muted-foreground">
            Panel Members: {[primaryPanelist?.name, secondaryPanelist?.name].filter(Boolean).join(', ') || '—'}
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Online Assessment */}
          <div className="rounded-lg border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2"><BarChart2 className="h-4 w-4 text-primary" />Online Assessment</h3>
              {oaCompleted && (
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${scoreBandColor(band)}`}>{band}</span>
              )}
            </div>
            {oaCompleted ? (
              <div className="grid grid-cols-3 gap-6">
                <Field label="Score" value={`${candidate.assessmentScore ?? 0}/${effectiveTotal}`} />
                <Field label="Percentage" value={`${pct}%`} />
                <Field label="Percentile" value={candidate.assessmentPercentile != null ? `${Math.round(candidate.assessmentPercentile)}%` : undefined} />
              </div>
            ) : (
              <NotCompleted label="Online Assessment" />
            )}
          </div>

          {/* Interview Round */}
          <div className="rounded-lg border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2"><Users className="h-4 w-4 text-primary" />Interview Round</h3>
              {interviewStarted && (
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusPillCls(interviewStatus)}`}>{interviewStatus}</span>
              )}
            </div>
            {interviewStarted ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Primary Panelist" value={primaryPanelist?.name} />
                  <Field label="Secondary Panelist" value={secondaryPanelist?.name} />
                  <Field label="Start Time" value={candidate.interviewTimeSlot} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Aptitude" value={candidate.interviewAptitudeScore != null ? `${candidate.interviewAptitudeScore}/10` : undefined} />
                  <Field label="Technical Skills" value={candidate.interviewTechnicalScore != null ? `${candidate.interviewTechnicalScore}/10` : undefined} />
                  <Field label="Problem Solving" value={candidate.interviewProblemSolvingScore != null ? `${candidate.interviewProblemSolvingScore}/10` : undefined} />
                  <Field label="Communication" value={candidate.interviewCommunicationScore != null ? `${candidate.interviewCommunicationScore}/10` : undefined} />
                </div>
                {candidate.interviewOverallFeedback && (
                  <Field label="Overall Feedback" value={candidate.interviewOverallFeedback} />
                )}
                {candidate.interviewAnyOther && (
                  <Field label="Any Other Observations" value={candidate.interviewAnyOther} />
                )}
              </div>
            ) : (
              <NotCompleted label="Interview Round" />
            )}
          </div>

          {/* Coding Round */}
          <div className="rounded-lg border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2"><Code className="h-4 w-4 text-primary" />Coding Round</h3>
              {codingStarted && (
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusPillCls(codingStatus)}`}>{codingStatus}</span>
              )}
            </div>
            {codingStarted ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Exercise Topic" value={candidate.codingTopic} />
                  <Field label="Start Time" value={candidate.codingExerciseStartTime} />
                  <Field label="Tech Stack" value={candidate.codingTechStack} />
                </div>
                {candidate.codingExerciseReview && (
                  <Field label="Coding Exercise Review" value={candidate.codingExerciseReview} />
                )}
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Checkpoint 1" value={candidate.codingCheckpoint1} />
                  <Field label="Checkpoint 2" value={candidate.codingCheckpoint2} />
                  <Field label="Checkpoint 3" value={candidate.codingCheckpoint3} />
                </div>
              </div>
            ) : (
              <NotCompleted label="Coding Round" />
            )}
          </div>

          {/* Whiteboard Round */}
          <div className="rounded-lg border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2"><FileText className="h-4 w-4 text-primary" />Whiteboard Round</h3>
              {whiteboardStarted && (
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusPillCls(whiteboardStatus)}`}>{whiteboardStatus}</span>
              )}
            </div>
            {whiteboardStarted ? (
              <Field label="Comments" value={candidate.whiteboardComments} />
            ) : (
              <NotCompleted label="Whiteboard Round" />
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
