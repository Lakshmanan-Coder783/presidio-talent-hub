import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { FunnelChart, LineChart, BarChart, DonutChart } from '../../components/Charts';
import {
  Users, School, FileCheck, CalendarDays, Award, TrendingUp, Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const Dashboard: React.FC = () => {
  const { db } = useApp();

  const kpiStats = useMemo(() => {
    const totalCandidates = db.candidates.length;
    const activeDrives = db.drives.filter(d => d.status === 'Ongoing' || d.status === 'Published').length;
    const assessmentsActive = db.assessments.filter(a => a.status === 'Active').length;
    const scheduledInterviews = db.interviews.filter(i => i.status === 'Scheduled').length;
    const joined = db.offers.filter(o => o.status === 'Joined').length;
    const accepted = db.offers.filter(o => o.status === 'Accepted').length;
    const joiningRate = Math.round((joined / ((joined + accepted) || 1)) * 100);
    return { totalCandidates, activeDrives, assessmentsActive, scheduledInterviews, joiningRate };
  }, [db]);

  const funnelData = useMemo(() => {
    const total = db.candidates.length;
    const passedOnlineTest = db.candidates.filter(c =>
      ['Online Test', 'Interview', 'Coding Exercise', 'Whiteboard Interview', 'Offered', 'Joined'].includes(c.funnelStage)
    ).length;
    const passedInterview = db.candidates.filter(c =>
      ['Interview', 'Coding Exercise', 'Whiteboard Interview', 'Offered', 'Joined'].includes(c.funnelStage)
    ).length;
    const passedCoding = db.candidates.filter(c =>
      ['Coding Exercise', 'Whiteboard Interview', 'Offered', 'Joined'].includes(c.funnelStage)
    ).length;
    const passedWhiteboard = db.candidates.filter(c =>
      ['Whiteboard Interview', 'Offered', 'Joined'].includes(c.funnelStage)
    ).length;
    const offered = db.candidates.filter(c => ['Offered', 'Joined'].includes(c.funnelStage)).length;
    const joined = db.candidates.filter(c => c.funnelStage === 'Joined').length;
    return [
      { stage: '1. Applied', count: total, pct: 100, color: 'var(--chart-1)' },
      { stage: '2. Online Test', count: passedOnlineTest, pct: Math.round((passedOnlineTest / total) * 100), color: 'var(--chart-2)' },
      { stage: '3. Interview', count: passedInterview, pct: Math.round((passedInterview / (passedOnlineTest || 1)) * 100), color: 'var(--chart-3)' },
      { stage: '4. Coding', count: passedCoding, pct: Math.round((passedCoding / (passedInterview || 1)) * 100), color: 'var(--chart-4)' },
      { stage: '5. Whiteboard', count: passedWhiteboard, pct: Math.round((passedWhiteboard / (passedCoding || 1)) * 100), color: 'oklch(0.65 0.2 330)' },
      { stage: '6. Offered', count: offered, pct: Math.round((offered / (passedWhiteboard || 1)) * 100), color: 'oklch(0.65 0.17 142)' },
      { stage: '7. Joined', count: joined, pct: Math.round((joined / (offered || 1)) * 100), color: 'oklch(0.55 0.15 142)' },
    ];
  }, [db]);

  const drivePerformanceData = useMemo(() => {
    const byCollege = db.drives.reduce((acc, d) => {
      if (!acc[d.college]) acc[d.college] = { registered: 0, selected: 0 };
      acc[d.college].registered += d.registered;
      acc[d.college].selected += d.selected;
      return acc;
    }, {} as Record<string, { registered: number; selected: number }>);

    return Object.entries(byCollege)
      .sort((a, b) => b[1].registered - a[1].registered)
      .slice(0, 5)
      .map(([college, vals]) => ({
        label: college.split(' ').map((w: string) => w[0]).join(''),
        val1: vals.registered,
        val2: vals.selected,
      }));
  }, [db]);

  const scoreDistributionData = useMemo(() => {
    const scores = db.candidates
      .filter(c => c.assessmentStatus === 'Completed' && c.assessmentScore !== undefined)
      .map(c => c.assessmentScore as number);
    const ranges = [
      { label: '0-20', min: 0, max: 20, value: 0 },
      { label: '21-40', min: 21, max: 40, value: 0 },
      { label: '41-60', min: 41, max: 60, value: 0 },
      { label: '61-80', min: 61, max: 80, value: 0 },
      { label: '81-100', min: 81, max: 100, value: 0 },
    ];
    scores.forEach(s => ranges.forEach(r => { if (s >= r.min && s <= r.max) r.value++; }));
    return ranges.map(r => ({ label: r.label, value: r.value }));
  }, [db]);

  const selectedCandidateDegrees = useMemo(() => {
    const selected = db.candidates.filter(c =>
      ['Offered', 'Accepted', 'Joined'].includes(c.offerStatus)
    );
    const counts: Record<string, number> = {};
    selected.forEach(c => { counts[c.degree] = (counts[c.degree] || 0) + 1; });
    const colors = ['#2563eb', '#8b5cf6', '#06b6d4', '#f59e0b', '#22c55e', '#ec4899'];
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([label, value], idx) => ({ label, value, color: colors[idx % colors.length] }));
  }, [db]);

  const kpiCards = [
    { label: 'Total Candidates', value: kpiStats.totalCandidates.toLocaleString(), trend: '+12.4% vs last drive', icon: Users, colorClass: 'text-primary bg-primary/10' },
    { label: 'Active Campus Drives', value: kpiStats.activeDrives, trend: '+4 this month', icon: School, colorClass: 'text-violet-600 bg-violet-100' },
    { label: 'Active Assessments', value: kpiStats.assessmentsActive, trend: 'Running in cloud', icon: FileCheck, colorClass: 'text-cyan-600 bg-cyan-100', noTrend: true },
    { label: 'Interviews Scheduled', value: kpiStats.scheduledInterviews, trend: '+8 panel logins', icon: CalendarDays, colorClass: 'text-amber-600 bg-amber-100' },
    { label: 'Joining Rate', value: `${kpiStats.joiningRate}%`, trend: '+2.3% conversion', icon: Award, colorClass: 'text-emerald-600 bg-emerald-100' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Executive Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Comprehensive analytics of active campus drives and candidate funnel.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {kpiCards.map(({ label, value, trend, icon: Icon, colorClass, noTrend }) => (
          <Card key={label} className="transition-shadow hover:shadow-md">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                  <p className="text-2xl font-bold">{value}</p>
                  <div className={`flex items-center gap-1 text-xs font-medium ${noTrend ? 'text-muted-foreground' : 'text-emerald-600'}`}>
                    {!noTrend && <TrendingUp className="h-3 w-3" />}
                    {noTrend && <Clock className="h-3 w-3" />}
                    {trend}
                  </div>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${colorClass}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Hiring Funnel */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Hiring Funnel</CardTitle>
              <CardDescription>Conversion rates across cumulative placement stages</CardDescription>
            </div>
            <Badge variant="secondary">Funnel Analytics</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <FunnelChart data={funnelData} />
        </CardContent>
      </Card>

      {/* Charts row 1 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Campus Recruitment Progress</CardTitle>
          <CardDescription>Registered vs Selected per college</CardDescription>
        </CardHeader>
        <CardContent>
          <BarChart data={drivePerformanceData} label2="Selected" />
        </CardContent>
      </Card>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Online Assessment Scores</CardTitle>
            <CardDescription>Candidates per score range</CardDescription>
          </CardHeader>
          <CardContent>
            <LineChart data={scoreDistributionData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Candidate Degrees</CardTitle>
            <CardDescription>Distribution among selected candidates</CardDescription>
          </CardHeader>
          <CardContent>
            <DonutChart data={selectedCandidateDegrees} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
