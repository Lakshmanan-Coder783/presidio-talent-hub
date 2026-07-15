export const DEFAULT_SCORE_BAND_CUTOFFS = { average: 25, good: 50, excellent: 75 };

export type ScoreBandCutoffs = typeof DEFAULT_SCORE_BAND_CUTOFFS;

export const scoreBand = (pct: number, cutoffs: ScoreBandCutoffs = DEFAULT_SCORE_BAND_CUTOFFS) => {
  if (pct >= cutoffs.excellent) return 'Excellent';
  if (pct >= cutoffs.good) return 'Good';
  if (pct >= cutoffs.average) return 'Average';
  return 'Poor';
};

export const scoreBandColor = (band: string) => {
  if (band === 'Excellent') return 'bg-green-100 text-green-700';
  if (band === 'Good') return 'bg-blue-100 text-blue-700';
  if (band === 'Average') return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
};
