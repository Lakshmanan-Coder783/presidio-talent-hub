const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
};

// Compact drive-date-range display: same month collapses to one month name
// ("28th & 29th Apr 2026"); different months/years keep each date's own
// month/year ("30th Apr & 1st Jun 2026").
export function formatDriveDateRange(date1: string, date2?: string): string {
  const d1 = new Date(date1);
  const day1 = ordinal(d1.getDate());
  const month1 = d1.toLocaleDateString('en-GB', { month: 'short' });
  const year1 = d1.getFullYear();
  if (!date2) return `${day1} ${month1} ${year1}`;

  const d2 = new Date(date2);
  const day2 = ordinal(d2.getDate());
  const month2 = d2.toLocaleDateString('en-GB', { month: 'short' });
  const year2 = d2.getFullYear();

  if (year1 === year2 && month1 === month2) return `${day1} & ${day2} ${month1} ${year1}`;
  if (year1 === year2) return `${day1} ${month1} & ${day2} ${month2} ${year1}`;
  return `${day1} ${month1} ${year1} & ${day2} ${month2} ${year2}`;
}
