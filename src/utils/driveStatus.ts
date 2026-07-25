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

export function getDriveDisplayName(drive: Pick<CampusDrive, 'role' | 'date'>): string {
  const year = new Date(drive.date).getFullYear();
  return `Campus Recruitment || ${drive.role ?? 'Associate Engineer'} - ${year}`;
}

export function computeDriveStatus(candidates: Candidate[], isAssessmentPublished = false): CampusDrive['status'] {
  const startedCandidates = candidates.filter(
    c => c.assessmentStatus === 'InProgress' || c.assessmentStatus === 'Completed'
  );
  if (startedCandidates.length === 0) return isAssessmentPublished ? 'Ongoing' : 'Draft';

  const isTerminal = (c: Candidate): boolean =>
    c.oaShortlisted === false
    || c.interviewShortlisted === false
    || c.codingShortlisted === false
    || c.whiteboardFinalResult !== undefined
    || c.funnelStage === 'Offered'
    || c.funnelStage === 'Joined'
    || c.offerStatus !== 'None';

  return startedCandidates.every(isTerminal) ? 'Completed' : 'Ongoing';
}
