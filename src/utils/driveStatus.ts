import type { Candidate, CampusDrive, Assessment } from '../types';

// Prefers the drive's own assessmentId; falls back to any of its candidates'
// assessmentId (some drives only get linked via bulk-invite on the candidates).
export function getDriveLinkedAssessment(
  drive: CampusDrive,
  candidates: Candidate[],
  assessments: Assessment[],
): Assessment | undefined {
  if (drive.assessmentId) return assessments.find(a => a.id === drive.assessmentId);
  const c = candidates.find(c => c.assessmentId);
  return c ? assessments.find(a => a.id === c.assessmentId) : undefined;
}

export function computeDriveStatus(candidates: Candidate[], isAssessmentPublished = false): CampusDrive['status'] {
  const started = candidates.some(
    c => c.assessmentStatus === 'InProgress' || c.assessmentStatus === 'Completed'
  );
  if (!started) return isAssessmentPublished ? 'Ongoing' : 'Draft';

  const reachedWhiteboard = candidates.filter(
    c => c.funnelStage === 'Whiteboard Interview' || c.funnelStage === 'Offered' || c.funnelStage === 'Joined' || c.whiteboardFinalResult !== undefined
  );
  if (reachedWhiteboard.length === 0) return 'Ongoing';

  const allWhiteboardDone = reachedWhiteboard.every(
    c => c.whiteboardFinalResult !== undefined || c.funnelStage === 'Offered' || c.funnelStage === 'Joined'
  );
  return allWhiteboardDone ? 'Completed' : 'Ongoing';
}
