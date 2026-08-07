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

// Whether a drive's two-batch online-assessment UI (Batch 2 tab, Batch columns,
// per-batch cutoffs, CSV batch selector) should be shown. `oaBatchMode` is
// authoritative whenever it's explicitly set (so switching a drive back to Single
// hides the UI even if a Batch 2 assessment already exists). Only drives that
// predate `oaBatchMode` (field absent) fall back to "does a Batch 2 assessment
// already exist", so their already-entered Batch 2 data isn't hidden from them.
export function isTwoBatchDrive(drive: Pick<CampusDrive, 'oaBatchMode' | 'assessmentIdBatch2'> | null | undefined): boolean {
  if (drive?.oaBatchMode) return drive.oaBatchMode === 'two';
  return !!drive?.assessmentIdBatch2;
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
