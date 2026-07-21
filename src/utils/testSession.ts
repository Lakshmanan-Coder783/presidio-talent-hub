export interface TestSessionState {
  answers: { [qId: string]: string | number | number[] };
  markedForReview: { [qId: string]: boolean };
  activeIdx: number;
  sessionStartedAt: string; // ISO timestamp — set once, on first save
}

const key = (candidateId: string) => `presidio_test_session_${candidateId}`;

export const loadTestSession = (candidateId: string): TestSessionState | null => {
  try {
    const raw = localStorage.getItem(key(candidateId));
    return raw ? (JSON.parse(raw) as TestSessionState) : null;
  } catch {
    return null;
  }
};

export const saveTestSession = (candidateId: string, state: TestSessionState): void => {
  localStorage.setItem(key(candidateId), JSON.stringify(state));
};

export const clearTestSession = (candidateId: string): void => {
  localStorage.removeItem(key(candidateId));
};
