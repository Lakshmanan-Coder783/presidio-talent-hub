import type { Candidate, CampusDrive } from '../types';

export function computeDriveStatus(candidates: Candidate[]): CampusDrive['status'] {
  const started = candidates.some(
    c => c.assessmentStatus === 'InProgress' || c.assessmentStatus === 'Completed'
  );
  if (!started) return 'Draft';

  const reachedWhiteboard = candidates.filter(
    c => c.funnelStage === 'Whiteboard Interview' || c.funnelStage === 'Offered' || c.funnelStage === 'Joined' || c.whiteboardFinalResult !== undefined
  );
  if (reachedWhiteboard.length === 0) return 'Ongoing';

  const allWhiteboardDone = reachedWhiteboard.every(
    c => c.whiteboardFinalResult !== undefined || c.funnelStage === 'Offered' || c.funnelStage === 'Joined'
  );
  return allWhiteboardDone ? 'Completed' : 'Ongoing';
}
