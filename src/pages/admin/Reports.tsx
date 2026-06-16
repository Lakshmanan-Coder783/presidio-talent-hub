import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Table } from '../../components/Table';
import { DonutChart, LineChart } from '../../components/Charts';
import { Printer, Landmark } from 'lucide-react';

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
  const [activeReportTab, setActiveReportTab] = useState<'college' | 'assessments' | 'interviews'>('college');

  // Compute College Performance Summaries
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
          conversionPct: 0
        };
      }

      const s = summaryMap[c.college];
      s.registered++;
      if (c.assessmentStatus === 'Completed') {
        s.tested++;
        // Assume pass mark is 50% of assessment total
        const test = db.assessments.find(a => a.id === c.assessmentId);
        const passMark = test ? test.totalMarks * 0.5 : 50;
        if ((c.assessmentScore || 0) >= passMark) {
          s.clearedTest++;
        }
      }
      if (c.interviewStatus !== 'Not Scheduled') {
        s.interviewed++;
      }
      if (c.offerStatus !== 'None') {
        s.offered++;
      }
      if (c.offerStatus === 'Joined') {
        s.joined++;
      }
    });

    return Object.values(summaryMap).map(s => {
      s.conversionPct = Math.round((s.joined / (s.registered || 1)) * 100);
      return s;
    });
  }, [db]);

  // Aggregate stats for charts
  const testAveragesData = useMemo(() => {
    // Generate averages per degree
    const degrees = Array.from(new Set(db.candidates.map(c => c.degree)));
    return degrees.map(deg => {
      const candidatesInDeg = db.candidates.filter(c => c.degree === deg && c.assessmentScore !== undefined);
      const avg = candidatesInDeg.reduce((sum, c) => sum + (c.assessmentScore || 0), 0) / (candidatesInDeg.length || 1);
      return {
        label: deg,
        value: Math.round(avg)
      };
    });
  }, [db]);

  const interviewStatsData = useMemo(() => {
    const completed = db.interviews.filter(i => i.status === 'Completed').length;
    const scheduled = db.interviews.filter(i => i.status === 'Scheduled').length;
    
    return [
      { label: 'Completed', value: completed, color: '#22c55e' },
      { label: 'Scheduled', value: scheduled, color: '#f59e0b' }
    ];
  }, [db]);

  const columns = [
    { header: 'College Name', accessor: 'college', sortable: true },
    { header: 'Registered', accessor: 'registered', sortable: true },
    { header: 'Tested', accessor: 'tested', sortable: true },
    { header: 'Cleared Exam', accessor: 'clearedTest', sortable: true },
    { header: 'Interviewed', accessor: 'interviewed', sortable: true },
    { header: 'Offered', accessor: 'offered', sortable: true },
    { header: 'Joined', accessor: 'joined', sortable: true },
    {
      header: 'Conversion Rate',
      accessor: 'conversionPct',
      sortable: true,
      render: (row: CollegeReport) => (
        <span style={{ fontWeight: 700, color: 'var(--primary-blue)' }}>
          {row.conversionPct}%
        </span>
      )
    }
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & Analytics</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
            Comprehensive analysis reports of college drives, assessment performance, and interview funnels.
          </p>
        </div>

        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => window.print()} style={{ gap: '6px' }}>
            <Printer size={16} />
            Print PDF Report
          </button>
        </div>
      </div>

      {/* Analytics Tabs switcher */}
      <div className="login-tabs" style={{ maxWidth: '400px', marginBottom: '24px' }}>
        <div 
          className={`login-tab ${activeReportTab === 'college' ? 'active' : ''}`}
          onClick={() => setActiveReportTab('college')}
        >
          College Performance
        </div>
        <div 
          className={`login-tab ${activeReportTab === 'assessments' ? 'active' : ''}`}
          onClick={() => setActiveReportTab('assessments')}
        >
          Assessments
        </div>
        <div 
          className={`login-tab ${activeReportTab === 'interviews' ? 'active' : ''}`}
          onClick={() => setActiveReportTab('interviews')}
        >
          Interviews & Funnel
        </div>
      </div>

      {/* Tab content renders */}
      {activeReportTab === 'college' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div className="widget-card">
            <div className="widget-title">
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Landmark size={18} style={{ color: 'var(--primary-blue)' }} />
                College-wise Performance Summary
              </h3>
            </div>
            <Table
              data={collegeSummaries}
              columns={columns}
              searchPlaceholder="Filter colleges..."
              searchKey="college"
              initialSort={{ key: 'registered', direction: 'desc' }}
              exportFileName="College_Performance_Summary"
            />
          </div>
        </div>
      )}

      {activeReportTab === 'assessments' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>
          <div className="widget-card">
            <div className="widget-title">
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Average Assessment Score by Degree</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Calculated across completed test scores.</span>
            </div>
            <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LineChart data={testAveragesData} color="#8b5cf6" />
            </div>
          </div>

          <div className="widget-card">
            <div className="widget-title">
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Assigned Candidate Statistics</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Split by candidate eligibility levels.</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Completed Assessments</span>
                <span style={{ fontWeight: 700, color: 'var(--success)' }}>
                  {db.candidates.filter(c => c.assessmentStatus === 'Completed').length} candidates
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Total Pending Assessments</span>
                <span style={{ fontWeight: 700, color: 'var(--warning)' }}>
                  {db.candidates.filter(c => c.assessmentStatus === 'Pending').length} candidates
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Average Score Overall</span>
                <span style={{ fontWeight: 700 }}>
                  {Math.round(db.candidates.filter(c => c.assessmentScore !== undefined).reduce((sum, c) => sum + (c.assessmentScore || 0), 0) / (db.candidates.filter(c => c.assessmentScore !== undefined).length || 1))} pts
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeReportTab === 'interviews' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>
          <div className="widget-card">
            <div className="widget-title">
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Interview Scheduling Status</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>State of panels queue.</span>
            </div>
            <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DonutChart data={interviewStatsData} />
            </div>
          </div>

          <div className="widget-card">
            <div className="widget-title">
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Recruitment Funnel Health</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Current statistics and conversions.</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.875rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                <span>Funnel Pipeline Health</span>
                <span style={{ fontWeight: 700, color: 'var(--success)' }}>Excellent</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                <span>Online Test Conversion Rate</span>
                <span style={{ fontWeight: 700 }}>
                  {Math.round((db.candidates.filter(c => c.assessmentStatus === 'Completed').length / db.candidates.length) * 100)}%
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                <span>Interviews Conversion Rate</span>
                <span style={{ fontWeight: 700 }}>
                  {Math.round((db.candidates.filter(c => c.interviewStatus === 'Passed').length / (db.candidates.filter(c => c.interviewStatus !== 'Not Scheduled').length || 1)) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
