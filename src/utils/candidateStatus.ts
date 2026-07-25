import type { Candidate } from '../types';

export const deriveInterviewStatus = (
  c: Pick<Candidate, 'interviewShortlisted' | 'interviewPrimaryPanelistId'>,
): 'Shortlisted' | 'Rejected' | 'In Progress' | 'Pending' =>
  c.interviewShortlisted === true
    ? 'Shortlisted'
    : c.interviewShortlisted === false
    ? 'Rejected'
    : c.interviewPrimaryPanelistId
    ? 'In Progress'
    : 'Pending';

export const deriveCodingStatus = (
  c: Pick<Candidate, 'codingShortlisted' | 'codingTopic'>,
): 'Shortlisted' | 'Rejected' | 'In Progress' | 'Pending' =>
  c.codingShortlisted === true
    ? 'Shortlisted'
    : c.codingShortlisted === false
    ? 'Rejected'
    : c.codingTopic
    ? 'In Progress'
    : 'Pending';

export const deriveWhiteboardStatus = (
  c: Pick<Candidate, 'whiteboardFinalResult'>,
): 'Selected' | 'Not Selected' | 'Pending' => c.whiteboardFinalResult ?? 'Pending';
