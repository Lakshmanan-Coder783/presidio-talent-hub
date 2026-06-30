import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Table } from '../../components/Table';
import { DonutChart, LineChart } from '../../components/Charts';
import { Printer, Landmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

interface CollegeReport {
  college: string;
  registered: number;
  tested: number;
  clearedTest: number;
  interviewed: number;
  offered: number;
  joined: number;
  conversionPct: number;
}

export const Reports: React.FC = () => {
  const { db } = useApp();

  // ── Year filter (same pattern as Dashboard) ──────────────────────────────
  const [selectedYear, setSelectedYear] = useState<string>('all');

  const availableYears = useMemo(() =>
    Array.from(new Set(db.drives.map(d => new Date(d.date).getFullYear().toString())))
      .sort((a, b) => Number(b) - Number(a)),
    [db.drives]);

  const filteredDrives = useMemo(() =>
    selectedYear === 'all'
      ? db.drives
      : db.drives.filter(d => new Date(d.date).getFullYear().toString() === selectedYear),
    [db.drives, selectedYear]);

  const filteredColleges = useMemo(() =>
    new Set(filteredDrives.map(d => d.college)),
    [filteredDrives]);

  // Candidates and interviews scoped to the selected year's colleges
  const yearCandidates = useMemo(() =>
    db.candidates.filter(c => filteredColleges.has(c.college)),
    [db.candidates, filteredColleges]);

  const yearCandidateIds = useMemo(() =>
    new Set(yearCandidates.map(c => c.id)),
    [yearCandidates]);

  const yearInterviews = useMemo(() =>
    db.interviews.filter(i => yearCandidateIds.has(i.candidateId)),
    [db.interviews, yearCandidateIds]);

  // ── College Performance ──────────────────────────────────────────────────
  const collegeSummaries = useMemo<CollegeReport[]>(() => {
    const summaryMap: { [col: string]: CollegeReport } = {};

    yearCandidates.forEach(c => {
      if (!summaryMap[c.college]) {
        summaryMap[c.college] = {
          college: c.college,
          registered: 0,
          tested: 0,
          clearedTest: 0,
          interviewed: 0,
          offered: 0,
          joined: 0,
          conversionPct: 0,
        };
      }

      const s = summaryMap[c.college];
      s.registered++;
      if (c.assessmentStatus === 'Completed') {
        s.tested++;
        const test = db.assessments.find(a => a.id === c.assessmentId);
        const passMark = test ? test.totalMarks * 0.5 : 50;
        if ((c.assessmentScore || 0) >= passMark) s.clearedTest++;
      }
      if (c.interviewStatus !== 'Not Scheduled') s.interviewed++;
      if (c.offerStatus !== 'None') s.offered++;
      if (c.offerStatus === 'Joined') s.joined++;
    });

    return Object.values(summaryMap).map(s => {
      s.conversionPct = Math.round((s.joined / (s.registered || 1)) * 100);
      return s;
    });
  }, [yearCandidates, db.assessments]);

  // ── Assessments tab ──────────────────────────────────────────────────────
  const testAveragesData = useMemo(() => {
    const degrees = Array.from(new Set(yearCandidates.map(c => c.degree)));
    return degrees.map(deg => {
      const degreeCandidates = yearCandidates.filter(c => c.degree === deg && c.assessmentScore !== undefined);
      const avg = degreeCandidates.reduce((sum, c) => sum + (c.assessmentScore || 0), 0) / (degreeCandidates.length || 1);
      return { label: deg, value: Math.round(avg) };
    });
  }, [yearCandidates]);

  const completedAssessments = useMemo(() =>
    yearCandidates.filter(c => c.assessmentStatus === 'Completed').length,
    [yearCandidates]);

  const pendingAssessments = useMemo(() =>
    yearCandidates.filter(c => c.assessmentStatus === 'Pending').length,
    [yearCandidates]);

  const avgScore = useMemo(() => {
    const scored = yearCandidates.filter(c => c.assessmentScore !== undefined);
    return Math.round(
      scored.reduce((sum, c) => sum + (c.assessmentScore || 0), 0) / (scored.length || 1)
    );
  }, [yearCandidates]);

  const testConversionRate = useMemo(() =>
    Math.round((completedAssessments / (yearCandidates.length || 1)) * 100),
    [completedAssessments, yearCandidates]);

  // ── Interviews & Funnel tab ──────────────────────────────────────────────
  const interviewStatsData = useMemo(() => {
    const completed = yearInterviews.filter(i => i.status === 'Completed').length;
    const scheduled = yearInterviews.filter(i => i.status === 'Scheduled').length;
    return [
      { label: 'Completed', value: completed },
      { label: 'Scheduled', value: scheduled },
    ];
  }, [yearInterviews]);

  const interviewPassRate = useMemo(() =>
    Math.round(
      (yearCandidates.filter(c => c.interviewStatus === 'Passed').length /
        (yearCandidates.filter(c => c.interviewStatus !== 'Not Scheduled').length || 1)) * 100
    ),
    [yearCandidates]);

  const columns = [
    { header: 'College Name', accessor: 'college' as const, sortable: true },
    { header: 'Registered', accessor: 'registered' as const, sortable: true },
    { header: 'Tested', accessor: 'tested' as const, sortable: true },
    { header: 'Cleared Exam', accessor: 'clearedTest' as const, sortable: true },
    { header: 'Interviewed', accessor: 'interviewed' as const, sortable: true },
    { header: 'Offered', accessor: 'offered' as const, sortable: true },
    { header: 'Joined', accessor: 'joined' as const, sortable: true },
    {
      header: 'Conversion Rate',
      accessor: 'conversionPct' as const,
      sortable: true,
      render: (row: CollegeReport) => (
        <span className="font-bold text-primary">{row.conversionPct}%</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports &amp; Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {selectedYear === 'all' ? 'All years' : `Year ${selectedYear}`}
            {' · '}Comprehensive analysis of college drives, assessments, and interview funnels.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-36 h-9">
              <SelectValue placeholder="All Years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {availableYears.map(y => (
                <SelectItem key={y} value={y}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => window.print()} className="gap-2 h-9">
            <Printer className="h-4 w-4" />
            Print PDF Report
          </Button>
        </div>
      </div>

      <Tabs defaultValue="college">
        <TabsList>
          <TabsTrigger value="college">College Performance</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger value="interviews">Interviews &amp; Funnel</TabsTrigger>
        </TabsList>

        <TabsContent value="college" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Landmark className="h-4 w-4 text-primary" />
                College-wise Performance Summary
                {selectedYear !== 'all' && (
                  <span className="ml-auto text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    {selectedYear}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table
                data={collegeSummaries}
                columns={columns}
                searchPlaceholder="Filter colleges..."
                searchKey="college"
                initialSort={{ key: 'registered', direction: 'desc' }}
                exportFileName={`College_Performance_${selectedYear === 'all' ? 'All_Years' : selectedYear}`}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assessments" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Average Assessment Score by Degree</CardTitle>
                <CardDescription>Calculated across completed test scores{selectedYear !== 'all' ? ` for ${selectedYear}` : ''}.</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <LineChart data={testAveragesData} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Assigned Candidate Statistics</CardTitle>
                <CardDescription>Split by candidate eligibility levels{selectedYear !== 'all' ? ` · ${selectedYear}` : ''}.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Total Completed Assessments</span>
                  <span className="font-bold text-chart-1">{completedAssessments} candidates</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Total Pending Assessments</span>
                  <span className="font-bold text-chart-2">{pendingAssessments} candidates</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Average Score Overall</span>
                  <span className="font-bold">{avgScore} pts</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="interviews" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Interview Scheduling Status</CardTitle>
                <CardDescription>State of panels queue{selectedYear !== 'all' ? ` · ${selectedYear}` : ''}.</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <DonutChart data={interviewStatsData} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recruitment Funnel Health</CardTitle>
                <CardDescription>Current statistics and conversions{selectedYear !== 'all' ? ` · ${selectedYear}` : ''}.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Funnel Pipeline Health</span>
                  <span className="font-bold text-primary">Excellent</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Online Test Conversion Rate</span>
                  <span className="font-bold">{testConversionRate}%</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Interviews Conversion Rate</span>
                  <span className="font-bold">{interviewPassRate}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
