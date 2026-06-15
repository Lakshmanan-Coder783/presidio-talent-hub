import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { LineChart, BarChart, DonutChart } from '../../components/Charts';
import { 
  Users, 
  School, 
  FileCheck, 
  CalendarDays, 
  Award, 
  TrendingUp,
  ArrowUpRight,
  Clock
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { db } = useApp();

  // 1. Dynamic KPI calculations
  const kpiStats = useMemo(() => {
    const totalCandidates = db.candidates.length;
    const activeDrives = db.drives.filter(d => d.status === 'Ongoing' || d.status === 'Published').length;
    const assessmentsActive = db.assessments.filter(a => a.status === 'Active').length;
    const scheduledInterviews = db.interviews.filter(i => i.status === 'Scheduled').length;
    const offersReleased = db.offers.length;
    
    // Joined / (Joined + Accepted)
    const joined = db.offers.filter(o => o.status === 'Joined').length;
    const accepted = db.offers.filter(o => o.status === 'Accepted').length;
    const joiningRate = Math.round((joined / ((joined + accepted) || 1)) * 100);

    return {
      totalCandidates,
      activeDrives,
      assessmentsActive,
      scheduledInterviews,
      offersReleased,
      joiningRate
    };
  }, [db]);

  // 2. Cumulative Funnel Calculations
  const funnelData = useMemo(() => {
    const total = db.candidates.length;
    
    const countOnlineTest = db.candidates.filter(c => 
      ['Online Test', 'Interview', 'Coding Exercise', 'Whiteboard Interview', 'Offered', 'Joined'].includes(c.funnelStage)
    ).length;
    
    const countInterview = db.candidates.filter(c => 
      ['Interview', 'Coding Exercise', 'Whiteboard Interview', 'Offered', 'Joined'].includes(c.funnelStage)
    ).length;

    const countCoding = db.candidates.filter(c => 
      ['Coding Exercise', 'Whiteboard Interview', 'Offered', 'Joined'].includes(c.funnelStage)
    ).length;

    const countWhiteboard = db.candidates.filter(c => 
      ['Whiteboard Interview', 'Offered', 'Joined'].includes(c.funnelStage)
    ).length;

    const countOffered = db.candidates.filter(c => 
      ['Offered', 'Joined'].includes(c.funnelStage)
    ).length;

    const countJoined = db.candidates.filter(c => c.funnelStage === 'Joined').length;

    return [
      { stage: '1. Applied', count: total, pct: 100, color: '#2563eb' },
      { stage: '2. Online Test', count: countOnlineTest, pct: Math.round((countOnlineTest / total) * 100), color: '#8b5cf6' },
      { stage: '3. Interview', count: countInterview, pct: Math.round((countInterview / countOnlineTest || 1) * 100), color: '#06b6d4' },
      { stage: '4. Coding Exercise', count: countCoding, pct: Math.round((countCoding / countInterview || 1) * 100), color: '#f59e0b' },
      { stage: '5. Whiteboard', count: countWhiteboard, pct: Math.round((countWhiteboard / countCoding || 1) * 100), color: '#ec4899' },
      { stage: '6. Offered', count: countOffered, pct: Math.round((countOffered / countWhiteboard || 1) * 100), color: '#22c55e' },
      { stage: '7. Joined', count: countJoined, pct: Math.round((countJoined / countOffered || 1) * 100), color: '#10b981' },
    ];
  }, [db]);

  // 3. Drive Performance Chart Data (Top 5 Colleges)
  const drivePerformanceData = useMemo(() => {
    return db.drives
      .slice(0, 5)
      .map(d => ({
        label: d.college.split(' ').map(w => w[0]).join(''), // Abbreviate college name
        val1: d.registered,
        val2: d.shortlisted
      }));
  }, [db]);

  // 4. Assessment Scores line chart (distribution)
  const scoreDistributionData = useMemo(() => {
    const scores = db.candidates
      .filter(c => c.assessmentStatus === 'Completed' && c.assessmentScore !== undefined)
      .map(c => c.assessmentScore || 0);

    // Group scores into ranges
    const ranges = [
      { label: '0-20', min: 0, max: 20, value: 0 },
      { label: '21-40', min: 21, max: 40, value: 0 },
      { label: '41-60', min: 41, max: 60, value: 0 },
      { label: '61-80', min: 61, max: 80, value: 0 },
      { label: '81-100', min: 81, max: 100, value: 0 }
    ];

    scores.forEach(s => {
      ranges.forEach(r => {
        if (s >= r.min && s <= r.max) r.value++;
      });
    });

    return ranges.map(r => ({ label: r.label, value: r.value }));
  }, [db]);

  // 5. Degree distribution Donut Chart data
  const degreeDistributionData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    db.candidates.forEach(c => {
      counts[c.degree] = (counts[c.degree] || 0) + 1;
    });

    const colors = ['#2563eb', '#8b5cf6', '#06b6d4', '#f59e0b', '#22c55e', '#ec4899'];
    return Object.entries(counts).map(([label, value], idx) => ({
      label,
      value,
      color: colors[idx % colors.length]
    }));
  }, [db]);

  // 6. Recent activities
  const recentActivities = useMemo(() => {
    // Generate a set of dynamic logs based on candidate completion
    const completed = db.candidates.filter(c => c.assessmentStatus === 'Completed').slice(0, 3);
    const offered = db.candidates.filter(c => c.offerStatus === 'Accepted').slice(0, 2);

    const logs = [
      ...completed.map(c => ({
        text: `Candidate ${c.name} (${c.college}) completed assessment with ${c.assessmentScore} marks.`,
        time: 'Just now',
        type: 'assessment'
      })),
      ...offered.map(c => ({
        text: `Offer accepted by ${c.name} - joining on 15th July 2026.`,
        time: '2 hours ago',
        type: 'offer'
      })),
      {
        text: 'New Campus Placement Drive scheduled for BITS Pilani.',
        time: '1 day ago',
        type: 'drive'
      }
    ];

    return logs;
  }, [db]);

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Executive Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
            Comprehensive analytics of the active campus drives and candidates funnel.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-data">
            <span className="kpi-label">Total Candidates</span>
            <span className="kpi-value">{kpiStats.totalCandidates.toLocaleString()}</span>
            <span className="kpi-trend up">
              <TrendingUp size={12} />
              +12.4% vs last drive
            </span>
          </div>
          <div className="kpi-icon-wrapper">
            <Users size={22} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-data">
            <span className="kpi-label">Active Campus Drives</span>
            <span className="kpi-value">{kpiStats.activeDrives}</span>
            <span className="kpi-trend up">
              <TrendingUp size={12} />
              +4 this month
            </span>
          </div>
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
            <School size={22} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-data">
            <span className="kpi-label">Active Assessments</span>
            <span className="kpi-value">{kpiStats.assessmentsActive}</span>
            <span className="kpi-trend" style={{ color: 'var(--text-secondary)' }}>
              <Clock size={12} />
              Running in cloud
            </span>
          </div>
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4' }}>
            <FileCheck size={22} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-data">
            <span className="kpi-label">Interviews Scheduled</span>
            <span className="kpi-value">{kpiStats.scheduledInterviews}</span>
            <span className="kpi-trend up">
              <TrendingUp size={12} />
              +8 panel logins active
            </span>
          </div>
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' }}>
            <CalendarDays size={22} />
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-data">
            <span className="kpi-label">Joining Rate</span>
            <span className="kpi-value">{kpiStats.joiningRate}%</span>
            <span className="kpi-trend up">
              <TrendingUp size={12} />
              +2.3% conversion
            </span>
          </div>
          <div className="kpi-icon-wrapper" style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
            <Award size={22} />
          </div>
        </div>
      </div>

      {/* Hiring Funnel widget */}
      <div className="funnel-container">
        <div className="funnel-header">
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Hiring Funnel</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Conversion rates across cumulative placement stages.
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-blue)' }}>
            Funnel Analytics
            <ArrowUpRight size={14} />
          </div>
        </div>
        
        <div className="funnel-grid">
          {funnelData.map((step, idx) => (
            <div key={idx} className="funnel-step">
              <div className="funnel-step-label">{step.stage.split('. ')[1]}</div>
              <div className="funnel-step-count">{step.count}</div>
              <div className="funnel-step-pct">
                {idx === 0 ? 'Base' : `${step.pct}% Conv.`}
              </div>
              {idx < funnelData.length - 1 && (
                <div 
                  className="funnel-step-arrow"
                  style={{
                    position: 'absolute',
                    right: '-10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 10,
                    color: 'var(--text-muted)',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    display: window.innerWidth <= 768 ? 'none' : 'block'
                  }}
                >
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Charts Display Grid */}
      <div className="dashboard-grid">
        {/* Left Widget: Performance Graphs */}
        <div className="widget-card">
          <div className="widget-title">
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Campus Recruitment Progress</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Registered vs Shortlisted candidates per college.</span>
          </div>
          <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BarChart data={drivePerformanceData} />
          </div>
        </div>

        {/* Right Widget: Candidate Degrees */}
        <div className="widget-card">
          <div className="widget-title">
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Candidate Degrees</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Discipline split.</span>
          </div>
          <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DonutChart data={degreeDistributionData} />
          </div>
        </div>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* Left: Test Scores distribution */}
        <div className="widget-card">
          <div className="widget-title">
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Online Assessment Scores</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Number of candidates in score ranges.</span>
          </div>
          <div style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LineChart data={scoreDistributionData} color="#8b5cf6" />
          </div>
        </div>

        {/* Right: Activities feed */}
        <div className="widget-card">
          <div className="widget-title">
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Recent Activity</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Real-time event feed.</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {recentActivities.map((act, idx) => (
              <div 
                key={idx} 
                style={{ 
                  display: 'flex', 
                  gap: '12px', 
                  paddingBottom: '12px', 
                  borderBottom: idx < recentActivities.length - 1 ? '1px solid var(--border)' : 'none',
                  fontSize: '0.875rem'
                }}
              >
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: act.type === 'assessment' 
                    ? 'rgba(139, 92, 246, 0.1)' 
                    : (act.type === 'offer' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(37, 99, 235, 0.1)'),
                  color: act.type === 'assessment' 
                    ? '#8b5cf6' 
                    : (act.type === 'offer' ? '#22c55e' : '#2563eb'),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '0.75rem',
                  flexShrink: 0
                }}>
                  {act.type[0].toUpperCase()}
                </div>
                <div style={{ flexGrow: 1 }}>
                  <p style={{ color: 'var(--text-primary)', lineHeight: '1.4' }}>{act.text}</p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px', display: 'block' }}>
                    {act.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
