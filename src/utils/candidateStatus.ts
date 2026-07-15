import type { Candidate } from '../types';

export const deriveInterviewStatus = (
  c: Pick<Candidate, 'interviewShortlisted' | 'interviewPanel'>,
): 'Shortlisted' | 'Rejected' | 'In Progress' | 'Pending' =>
  c.interviewShortlisted === true
    ? 'Shortlisted'
    : c.interviewShortlisted === false
    ? 'Rejected'
    : c.interviewPanel
    ? 'In Progress'
    : 'Pending';

export const deriveCodingStatus = (
  c: Pick<Candidate, 'codingShortlisted' | 'codingPanel'>,
): 'Shortlisted' | 'Rejected' | 'In Progress' | 'Pending' =>
  c.codingShortlisted === true
    ? 'Shortlisted'
    : c.codingShortlisted === false
    ? 'Rejected'
    : c.codingPanel
    ? 'In Progress'
    : 'Pending';

export const deriveWhiteboardStatus = (
  c: Pick<Candidate, 'whiteboardFinalResult'>,
): 'Selected' | 'Rejected' | 'Waitlisted' | 'Pending' => c.whiteboardFinalResult ?? 'Pending';
