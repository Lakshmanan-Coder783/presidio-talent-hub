import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { FunnelChart, LineChart, BarChart, DonutChart } from '../../components/Charts';
import {
  Users, School, FileCheck, Award, TrendingUp, Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { computeDriveStatus, getDriveLinkedAssessment } from '../../utils/driveStatus';

export const Dashboard: React.FC = () => {
  const { db } = useApp();

  const activeDrives = useMemo(() => db.drives.filter(d => !d.deletedAt), [db.drives]);

  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedCollege, setSelectedCollege] = useState<string>('all');

  const availableYears = useMemo(() =>
    Array.from(new Set(activeDrives.map(d => new Date(d.date).getFullYear().toString())))
      .sort((a, b) => Number(b) - Number(a)),
    [activeDrives]);

  const availableColleges = useMemo(() => {
    const base = selectedYear === 'all'
      ? activeDrives
      : activeDrives.filter(d => new Date(d.date).getFullYear().toString() === selectedYear);
    return Array.from(new Set(base.map(d => d.college))).sort();
  }, [activeDrives, selectedYear]);

  useEffect(() => {
    if (selectedCollege !== 'all' && !availableColleges.includes(selectedCollege))
      setSelectedCollege('all');
  }, [availableColleges]);

  const filteredDrives = useMemo(() =>
    activeDrives.filter(d => {
      if (selectedYear !== 'all' && new Date(d.date).getFullYear().toString() !== selectedYear) return false;
      if (selectedCollege !== 'all' && d.college !== selectedCollege) return false;
      return true;
    }), [activeDrives, selectedYear, selectedCollege]);

  const filteredCandidates = useMemo(() => {
    const collegeSet = new Set(filteredDrives.map(d => d.college));
    return db.candidates.filter(c => collegeSet.has(c.college));
  }, [db.candidates, filteredDrives]);

  const kpiStats = useMemo(() => {
    const totalCandidates = filteredCandidates.length;
    const activeDrives = filteredDrives.filter(d => {
      const driveCandidates = db.candidates.filter(c => c.driveId === d.id);
      const isPublished = getDriveLinkedAssessment(d, driveCandidates, db.assessments)?.status === 'Active';
      return computeDriveStatus(driveCandidates, isPublished) === 'Ongoing';
    }).length;
    const assessmentsActive = db.assessments.filter(a => a.status === 'Active').length;
    const joined = filteredCandidates.filter(c => c.offerStatus === 'Joined').length;
    const accepted = filteredCandidates.filter(c => c.offerStatus === 'Accepted').length;
    const joiningRate = Math.round((joined / ((joined + accepted) || 1)) * 100);
    return { totalCandidates, activeDrives, assessmentsActive, joiningRate };
  }, [filteredCandidates, filteredDrives, db.assessments, db.candidates]);

  const funnelData = useMemo(() => {
    const total = filteredCandidates.length;
    const passedOnlineTest = filteredCandidates.filter(c =>
      ['Online Test', 'Interview', 'Coding Exercise', 'Whiteboard Interview', 'Offered', 'Joined'].includes(c.funnelStage)
    ).length;
    const passedInterview = filteredCandidates.filter(c =>
      ['Interview', 'Coding Exercise', 'Whiteboard Interview', 'Offered', 'Joined'].includes(c.funnelStage)
    ).length;
    const passedCoding = filteredCandidates.filter(c =>
      ['Coding Exercise', 'Whiteboard Interview', 'Offered', 'Joined'].includes(c.funnelStage)
    ).length;
    const passedWhiteboard = filteredCandidates.filter(c =>
      ['Whiteboard Interview', 'Offered', 'Joined'].includes(c.funnelStage)
    ).length;
    const offered = filteredCandidates.filter(c => ['Offered', 'Joined'].includes(c.funnelStage)).length;
    const joined = filteredCandidates.filter(c => c.funnelStage === 'Joined').length;
    return [
      { stage: 'Applied', count: total, pct: 100 },
      { stage: 'Online Test', count: passedOnlineTest, pct: Math.round((passedOnlineTest / (total || 1)) * 100) },
      { stage: 'Interview', count: passedInterview, pct: Math.round((passedInterview / (passedOnlineTest || 1)) * 100) },
      { stage: 'Coding', count: passedCoding, pct: Math.round((passedCoding / (passedInterview || 1)) * 100) },
      { stage: 'Whiteboard', count: passedWhiteboard, pct: Math.round((passedWhiteboard / (passedCoding || 1)) * 100) },
      { stage: 'Offered', count: offered, pct: Math.round((offered / (passedWhiteboard || 1)) * 100) },
      { stage: 'Joined', count: joined, pct: Math.round((joined / (offered || 1)) * 100) },
    ];
  }, [filteredCandidates]);

  const drivePerformanceData = useMemo(() => {
    const byCollege = filteredDrives.reduce((acc, d) => {
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
  }, [filteredDrives]);

  const scoreDistributionData = useMemo(() => {
    const scores = filteredCandidates
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
  }, [filteredCandidates]);

  const selectedCandidateDegrees = useMemo(() => {
    const selected = filteredCandidates.filter(c =>
      ['Offered', 'Accepted', 'Joined'].includes(c.offerStatus)
    );
    const counts: Record<string, number> = {};
    selected.forEach(c => { counts[c.degree] = (counts[c.degree] || 0) + 1; });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({ label, value }));
  }, [filteredCandidates]);

  const selectedCandidateGenders = useMemo(() => {
    const selected = filteredCandidates.filter(c =>
      ['Offered', 'Accepted', 'Joined'].includes(c.offerStatus)
    );
    const counts: Record<string, number> = {};
    selected.forEach(c => { counts[c.gender] = (counts[c.gender] || 0) + 1; });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({ label, value }));
  }, [filteredCandidates]);

  const kpiCards = [
    { label: 'Total Candidates', value: kpiStats.totalCandidates.toLocaleString(), trend: '+12.4% vs last drive', icon: Users, colorClass: 'text-chart-1 bg-chart-1/10' },
    { label: 'Active Campus Drives', value: kpiStats.activeDrives, trend: '+4 this month', icon: School, colorClass: 'text-chart-2 bg-chart-2/10' },
    { label: 'Active Assessments', value: kpiStats.assessmentsActive, trend: 'Running in cloud', icon: FileCheck, colorClass: 'text-chart-3 bg-chart-3/10', noTrend: true },
    { label: 'Joining Rate', value: `${kpiStats.joiningRate}%`, trend: '+2.3% conversion', icon: Award, colorClass: 'text-chart-5 bg-chart-5/10' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Executive Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Comprehensive analytics of active campus drives and candidate funnel.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedYear} onValueChange={(v) => { setSelectedYear(v); }}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="All Years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {availableYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={selectedCollege} onValueChange={setSelectedCollege}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="All Colleges" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Colleges</SelectItem>
              {availableColleges.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
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
                  <div className={`flex items-center gap-1 text-xs font-medium ${noTrend ? 'text-muted-foreground' : 'text-primary'}`}>
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
            <CardTitle className="text-base">Gender Distribution</CardTitle>
            <CardDescription>Distribution among selected candidates</CardDescription>
          </CardHeader>
          <CardContent>
            <DonutChart data={selectedCandidateGenders} />
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
