import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LineChart } from '../../components/Charts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const SELECTED_STATUSES = new Set(['Offered', 'Accepted', 'Joined']);

export const CollegeReport: React.FC = () => {
  const { db, loadCollegeReportPage } = useApp();

  useEffect(() => { loadCollegeReportPage(); }, [loadCollegeReportPage]);

  const activeDrives = useMemo(() => db.drives.filter(d => !d.deletedAt), [db.drives]);

  const [selectedCollege, setSelectedCollege] = useState<string>('all');

  const availableColleges = useMemo(() =>
    Array.from(new Set(activeDrives.map(d => d.college))).sort(),
    [activeDrives]);

  // Full (college, year) -> Selected count lookup, covering every year a college has ever
  // run a drive — the trend chart below always shows a college's complete history, with
  // no year filter and no comparison against any other college.
  const selectedByCollegeYear = useMemo(() => {
    const groups = new Map<string, Set<string>>(); // "college__year" -> driveIds
    for (const d of activeDrives) {
      const year = new Date(d.date).getFullYear().toString();
      const key = `${d.college}__${year}`;
      if (!groups.has(key)) groups.set(key, new Set());
      groups.get(key)!.add(d.id);
    }
    const result = new Map<string, Map<string, number>>(); // college -> year -> count
    for (const [key, driveIds] of groups) {
      const [college, year] = key.split('__');
      const count = db.candidates.filter(c => driveIds.has(c.driveId) && SELECTED_STATUSES.has(c.offerStatus)).length;
      if (!result.has(college)) result.set(college, new Map());
      result.get(college)!.set(year, count);
    }
    return result;
  }, [activeDrives, db.candidates]);

  const trendData = useMemo(() => {
    if (selectedCollege === 'all') return [];
    const byYear = selectedByCollegeYear.get(selectedCollege) ?? new Map();
    return Array.from(byYear.entries())
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([year, count]) => ({ label: year, value: count }));
  }, [selectedCollege, selectedByCollegeYear]);

  // Deterministic, data-driven explanation — no AI/external API involved, purely computed
  // from this college's actual multi-year Selected-count history shown in the chart above.
  const justification = useMemo(() => {
    if (selectedCollege === 'all' || trendData.length === 0) return '';
    const years = trendData.map(d => d.label);
    const counts = trendData.map(d => d.value);
    const totalYears = years.length;
    const totalSelected = counts.reduce((a, b) => a + b, 0);
    const avgPerYear = totalSelected / totalYears;
    const firstYear = years[0];
    const latestYear = years[years.length - 1];
    const latestCount = counts[counts.length - 1];

    let momentumClause: string;
    if (totalYears === 1) {
      momentumClause = 'no prior-year data to compare against';
    } else {
      const prevYear = years[years.length - 2];
      const prevCount = counts[counts.length - 2];
      if (latestCount > prevCount) momentumClause = `up from ${prevCount} in ${prevYear}`;
      else if (latestCount < prevCount) momentumClause = `down from ${prevCount} in ${prevYear}`;
      else momentumClause = `unchanged from ${prevYear}`;
    }

    let overallClause = '';
    if (totalYears > 1) {
      const maxCount = Math.max(...counts);
      if (maxCount === 0) {
        overallClause = ' — no candidates have been selected in any year to date';
      } else if (latestCount === maxCount) {
        overallClause = ', matching its strongest year on record';
      } else if (latestCount > avgPerYear) {
        overallClause = `, above its historical average of ${avgPerYear.toFixed(1)}/year`;
      } else if (latestCount < avgPerYear) {
        overallClause = `, below its historical average of ${avgPerYear.toFixed(1)}/year`;
      } else {
        overallClause = ', right at its historical average';
      }
    }

    return `${selectedCollege} has run drives across ${totalYears} year${totalYears === 1 ? '' : 's'}`
      + `${totalYears > 1 ? ` (${firstYear}–${latestYear})` : ` (${firstYear})`}, selecting ${totalSelected} candidate${totalSelected === 1 ? '' : 's'} in total`
      + `${totalYears > 1 ? ` (avg. ${avgPerYear.toFixed(1)}/year)` : ''}. `
      + `${latestYear}'s count of ${latestCount} is ${momentumClause}${overallClause}.`;
  }, [selectedCollege, trendData]);

  // Overall multi-year trend direction — early-half vs. late-half average Selected count
  // (not just the last two years), so a single dip/spike doesn't flip the read. Needs at
  // least 2 years of history to say anything about a "trend" at all.
  const trendRating = useMemo(() => {
    if (trendData.length < 2) return null;
    const counts = trendData.map(d => d.value);
    // Zero selections across every year on record isn't a neutral/"stable" trend — it's no
    // results at all, and must never be conflated with a college that's consistently
    // performing well. Called out as its own worst-tier state rather than falling through
    // to the 0-vs-0 "unchanged" case below.
    if (counts.every(c => c === 0)) {
      return { stars: 1, label: 'No Selections', color: 'fill-red-500 text-red-500' };
    }
    const halfSize = Math.ceil(counts.length / 2);
    const earlyAvg = counts.slice(0, halfSize).reduce((a, b) => a + b, 0) / halfSize;
    const lateAvg = counts.slice(counts.length - halfSize).reduce((a, b) => a + b, 0) / halfSize;

    if (lateAvg > earlyAvg * 1.1) return { stars: 3, label: 'Growing', color: 'fill-green-500 text-green-500' };
    if (lateAvg < earlyAvg * 0.9) return { stars: 1, label: 'Declining', color: 'fill-red-500 text-red-500' };
    return { stars: 2, label: 'Stable', color: 'fill-amber-400 text-amber-400' };
  }, [trendData]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">College Report</h1>
          <p className="text-sm text-muted-foreground mt-1">
            A college's Selected-candidate history, year by year — helps plan future drives.
          </p>
        </div>
        <Select value={selectedCollege} onValueChange={setSelectedCollege}>
          <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Select a college…</SelectItem>
            {availableColleges.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {trendRating && (
        <div className="flex items-center justify-end gap-2">
          <div className="flex items-center">
            {[1, 2, 3].map(n => (
              <Star
                key={n}
                className={cn('h-6 w-6', n <= trendRating.stars ? trendRating.color : 'fill-none text-muted-foreground')}
              />
            ))}
          </div>
          <span className="text-sm font-medium text-muted-foreground">{trendRating.label}</span>
        </div>
      )}

      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="border rounded-lg p-4 w-full">
          <h3 className="font-semibold text-sm mb-1">
            {selectedCollege === 'all' ? 'Selected Candidates by Year' : `${selectedCollege} — Selected Candidates by Year`}
          </h3>
          {selectedCollege === 'all' ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Select a college above to see its Selected-candidates trend by year.
            </p>
          ) : (
            <>
              <LineChart data={trendData} />
              <p className="text-sm text-muted-foreground leading-relaxed mt-3 pt-3 border-t text-center max-w-2xl mx-auto">
                {justification}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
