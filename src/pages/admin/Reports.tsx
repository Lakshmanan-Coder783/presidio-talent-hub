import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Table } from '../../components/Table';
import { DonutChart, LineChart } from '../../components/Charts';
import { Printer, Landmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

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

  const collegeSummaries = useMemo<CollegeReport[]>(() => {
    const summaryMap: { [col: string]: CollegeReport } = {};

    db.candidates.forEach(c => {
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
  }, [db]);

  const testAveragesData = useMemo(() => {
    const degrees = Array.from(new Set(db.candidates.map(c => c.degree)));
    return degrees.map(deg => {
      const candidatesInDeg = db.candidates.filter(c => c.degree === deg && c.assessmentScore !== undefined);
      const avg = candidatesInDeg.reduce((sum, c) => sum + (c.assessmentScore || 0), 0) / (candidatesInDeg.length || 1);
      return { label: deg, value: Math.round(avg) };
    });
  }, [db]);

  const interviewStatsData = useMemo(() => {
    const completed = db.interviews.filter(i => i.status === 'Completed').length;
    const scheduled = db.interviews.filter(i => i.status === 'Scheduled').length;
    return [
      { label: 'Completed', value: completed, color: '#22c55e' },
      { label: 'Scheduled', value: scheduled, color: '#f59e0b' },
    ];
  }, [db]);

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

  const completedAssessments = db.candidates.filter(c => c.assessmentStatus === 'Completed').length;
  const pendingAssessments = db.candidates.filter(c => c.assessmentStatus === 'Pending').length;
  const scoredCandidates = db.candidates.filter(c => c.assessmentScore !== undefined);
  const avgScore = Math.round(
    scoredCandidates.reduce((sum, c) => sum + (c.assessmentScore || 0), 0) / (scoredCandidates.length || 1)
  );
  const testConversionRate = Math.round((completedAssessments / db.candidates.length) * 100);
  const interviewPassRate = Math.round(
    (db.candidates.filter(c => c.interviewStatus === 'Passed').length /
      (db.candidates.filter(c => c.interviewStatus !== 'Not Scheduled').length || 1)) * 100
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports &amp; Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Comprehensive analysis reports of college drives, assessment performance, and interview funnels.
          </p>
        </div>
        <Button variant="outline" onClick={() => window.print()} className="gap-2">
          <Printer className="h-4 w-4" />
          Print PDF Report
        </Button>
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
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table
                data={collegeSummaries}
                columns={columns}
                searchPlaceholder="Filter colleges..."
                searchKey="college"
                initialSort={{ key: 'registered', direction: 'desc' }}
                exportFileName="College_Performance_Summary"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assessments" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Average Assessment Score by Degree</CardTitle>
                <CardDescription>Calculated across completed test scores.</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <LineChart data={testAveragesData} color="#8b5cf6" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Assigned Candidate Statistics</CardTitle>
                <CardDescription>Split by candidate eligibility levels.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Total Completed Assessments</span>
                  <span className="font-bold text-emerald-600">{completedAssessments} candidates</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Total Pending Assessments</span>
                  <span className="font-bold text-amber-600">{pendingAssessments} candidates</span>
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
                <CardDescription>State of panels queue.</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <DonutChart data={interviewStatsData} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recruitment Funnel Health</CardTitle>
                <CardDescription>Current statistics and conversions.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Funnel Pipeline Health</span>
                  <span className="font-bold text-emerald-600">Excellent</span>
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
