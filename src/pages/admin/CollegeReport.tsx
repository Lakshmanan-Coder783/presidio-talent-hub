import React, { useEffect, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LineChart } from '../../components/Charts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Button } from '@/components/ui/button';
import { Star, ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const SELECTED_STATUSES = new Set(['Offered', 'Accepted', 'Joined']);

export const CollegeReport: React.FC = () => {
  const { db, loadCollegeReportPage } = useApp();

  useEffect(() => { loadCollegeReportPage(); }, [loadCollegeReportPage]);

  const activeDrives = useMemo(() => db.drives.filter(d => !d.deletedAt), [db.drives]);

  const [selectedCollege, setSelectedCollege] = useState<string>('all');
  const [collegePickerOpen, setCollegePickerOpen] = useState(false);

  const availableColleges = useMemo(() =>
    Array.from(new Set(activeDrives.map(d => d.college))).sort(),
    [activeDrives]);

  const availableYears = useMemo(() =>
    Array.from(new Set(activeDrives.map(d => new Date(d.date).getFullYear().toString())))
      .sort((a, b) => Number(b) - Number(a)),
    [activeDrives]);

  // Defaults to the current year if it has any drives, otherwise the most recent year
  // that does — only used for the default "top colleges" view below, not the per-college
  // trend chart (which always shows a college's complete history regardless of this).
  // Derived on render rather than written back via an effect, so picking a year still
  // just overrides this default through the same piece of state.
  const [yearOverride, setYearOverride] = useState<string>('');
  const selectedYear = yearOverride || (() => {
    const currentYear = new Date().getFullYear().toString();
    return availableYears.includes(currentYear) ? currentYear : (availableYears[0] ?? '');
  })();

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

  // Default landing view (no college picked yet): top 5 colleges by Selected count for
  // the chosen year — only colleges that actually ran a drive that year are included.
  const topCollegesThisYear = useMemo(() => {
    if (!selectedYear) return [];
    const entries: { college: string; count: number }[] = [];
    for (const [college, byYear] of selectedByCollegeYear) {
      if (byYear.has(selectedYear)) entries.push({ college, count: byYear.get(selectedYear)! });
    }
    return entries
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(e => ({
        label: e.college.length > 18 ? e.college.slice(0, 16) + '…' : e.college,
        value: e.count,
      }));
  }, [selectedByCollegeYear, selectedYear]);

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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">College Report</h1>
        <p className="text-sm text-muted-foreground mt-1">
          A college's Selected-candidate history, year by year — helps plan future drives.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Select
          value={selectedYear}
          onValueChange={(y) => { setYearOverride(y); setSelectedCollege('all'); }}
        >
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            {availableYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
        <Popover open={collegePickerOpen} onOpenChange={setCollegePickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={collegePickerOpen}
              className="w-72 justify-between font-normal"
            >
              <span className="truncate">
                {selectedCollege === 'all' ? 'Select a college…' : selectedCollege}
              </span>
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0">
            <Command>
              <CommandInput placeholder="Search colleges…" />
              <CommandList>
                <CommandEmpty>No college found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value="Select a college…"
                    onSelect={() => { setSelectedCollege('all'); setCollegePickerOpen(false); }}
                  >
                    <Check className={cn('h-4 w-4', selectedCollege === 'all' ? 'opacity-100' : 'opacity-0')} />
                    Select a college…
                  </CommandItem>
                  {availableColleges.map(c => (
                    <CommandItem
                      key={c}
                      value={c}
                      onSelect={() => { setSelectedCollege(c); setCollegePickerOpen(false); }}
                    >
                      <Check className={cn('h-4 w-4', selectedCollege === c ? 'opacity-100' : 'opacity-0')} />
                      {c}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      {trendRating && (
        <div className="flex items-center justify-center gap-2">
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
            {selectedCollege === 'all'
              ? `Top 5 Colleges — Selected Candidates in ${selectedYear || '…'}`
              : `${selectedCollege} — Selected Candidates by Year`}
          </h3>
          {selectedCollege === 'all' ? (
            topCollegesThisYear.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No drives ran in {selectedYear || 'this year'}.
              </p>
            ) : (
              <>
                <LineChart data={topCollegesThisYear} height={420} />
                <p className="text-sm text-muted-foreground leading-relaxed mt-3 pt-3 border-t text-center">
                  Pick a college above to see its full multi-year history and trend rating.
                </p>
              </>
            )
          ) : (
            <>
              <LineChart data={trendData} height={420} />
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
