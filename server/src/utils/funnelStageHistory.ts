import type { CandidateDoc } from "../models/Candidate.model.js";

type FunnelStage = CandidateDoc["funnelStage"];
type HistoryEntry = { stage: FunnelStage; enteredAt: string };

// Appends a new entry only when the stage actually changes, so re-saving the
// same stage (e.g. an unrelated field patch that echoes the current stage
// back) doesn't pad the history with duplicate consecutive entries.
export function appendFunnelStageHistory(
  previousHistory: HistoryEntry[] | undefined,
  previousStage: FunnelStage | undefined,
  nextStage: FunnelStage | undefined,
): HistoryEntry[] | undefined {
  if (!nextStage || nextStage === previousStage) return previousHistory;
  return [...(previousHistory ?? []), { stage: nextStage, enteredAt: new Date().toISOString() }];
}
