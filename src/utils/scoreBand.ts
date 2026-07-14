export const scoreBand = (pct: number) => {
  if (pct >= 75) return 'Excellent';
  if (pct >= 50) return 'Good';
  if (pct >= 25) return 'Average';
  return 'Poor';
};

export const scoreBandColor = (band: string) => {
  if (band === 'Excellent') return 'bg-green-100 text-green-700';
  if (band === 'Good') return 'bg-blue-100 text-blue-700';
  if (band === 'Average') return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
};
