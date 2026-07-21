const seededFraction = (seed: string): number => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  const x = Math.sin(h) * 10000;
  return x - Math.floor(x);
};

/** Deterministic Fisher-Yates shuffle — same seed always yields the same order. */
export const seededShuffle = <T,>(items: T[], seed: string): T[] => {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(seededFraction(`${seed}:${i}`) * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

/**
 * Shuffles an MCQ/Multiple-Select question's options, remapping correctOptions
 * indices so scoring against the original correctOptions array still works.
 */
export const shuffleQuestionOptions = <
  Q extends { id: string; options?: string[]; correctOptions?: number[] }
>(question: Q, seed: string): Q => {
  if (!question.options || question.options.length === 0) return question;

  const order = seededShuffle(
    question.options.map((_, idx) => idx),
    `${seed}:${question.id}:opts`
  );
  const shuffledOptions = order.map(idx => question.options![idx]);
  const shuffledCorrect = question.correctOptions?.map(origIdx => order.indexOf(origIdx));

  return { ...question, options: shuffledOptions, correctOptions: shuffledCorrect };
};
