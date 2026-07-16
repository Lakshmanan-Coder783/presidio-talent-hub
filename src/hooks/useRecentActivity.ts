import { useMemo } from 'react';
import type { Database } from '../utils/db';

export type ActivityType = 'assessment_submitted' | 'offer_released' | 'interview_scheduled';

export interface ActivityEntry {
  id: string;
  type: ActivityType;
  message: string;
  timestamp: string;
  driveId?: string;
}

export function useRecentActivity(db: Database, limit = 12): ActivityEntry[] {
  return useMemo(() => {
    const candidateDriveMap = new Map(db.candidates.map(c => [c.id, c.driveId]));
    const entries: ActivityEntry[] = [];

    for (const c of db.candidates) {
      if (c.assessmentSubmissionDate) {
        entries.push({
          id: `asm-${c.id}`,
          type: 'assessment_submitted',
          message: `${c.name} submitted the assessment`,
          timestamp: c.assessmentSubmissionDate,
          driveId: c.driveId,
        });
      }
    }

    for (const o of db.offers) {
      entries.push({
        id: `off-${o.id}`,
        type: 'offer_released',
        message: `Offer released to ${o.candidateName}`,
        timestamp: o.dateReleased,
        driveId: candidateDriveMap.get(o.candidateId),
      });
    }

    for (const iv of db.interviews) {
      entries.push({
        id: `int-${iv.id}`,
        type: 'interview_scheduled',
        message: `${iv.candidateName} scheduled for ${iv.stage}`,
        timestamp: `${iv.date}T${iv.time}`,
        driveId: candidateDriveMap.get(iv.candidateId),
      });
    }

    entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return entries.slice(0, limit);
  }, [db.candidates, db.offers, db.interviews, limit]);
}
