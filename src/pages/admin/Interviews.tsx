import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Table } from '../../components/Table';
import { Modal } from '../../components/Modal';
import type { Interview } from '../../types';
import { Plus, Clock } from 'lucide-react';

export const Interviews: React.FC = () => {
  const { db, createInterview } = useApp();
  const [modalOpen, setModalOpen] = useState(false);

  // Form states
  const [candidateId, setCandidateId] = useState('');
  const [panelName, setPanelName] = useState('Panel Alpha');
  const [date, setDate] = useState('2026-06-15');
  const [time, setTime] = useState('10:00');
  const [stage, setStage] = useState<Interview['stage']>('Interview');

  // Filter candidates who have completed assessment or are in test/interview stage
  const eligibleCandidates = useMemo(() => {
    return db.candidates.filter(c => 
      c.assessmentStatus === 'Completed' && c.interviewStatus !== 'Passed' && c.interviewStatus !== 'Failed'
    );
  }, [db]);

  const handleSchedule = () => {
    if (!candidateId) {
      alert('Please select a candidate.');
      return;
    }
    const candidate = db.candidates.find(c => c.id === candidateId);
    if (!candidate) return;

    createInterview({
      candidateId,
      candidateName: candidate.name,
      panelName,
      date,
      time,
      stage,
      status: 'Scheduled'
    });

    setCandidateId('');
    setModalOpen(false);
  };

  // Generate calendar days for June 2026
  // June 1, 2026 starts on Monday. It has 30 days.
  const calendarDays = useMemo(() => {
    const days: { dayNum: number; isCurrentMonth: boolean; events: Interview[] }[] = [];
    
    // Add empty padding for starting day of the week (Monday starts on index 0 in our grid)
    // In 2026, June 1st is Monday.
    for (let i = 1; i <= 30; i++) {
      const dateStr = `2026-06-${i < 10 ? '0' + i : i}`;
      const dayEvents = db.interviews.filter(evt => evt.date === dateStr);
      days.push({
        dayNum: i,
        isCurrentMonth: true,
        events: dayEvents
      });
    }
    return days;
  }, [db]);

  const columns = [
    { header: 'ID', accessor: 'id', sortable: true },
    { header: 'Candidate Name', accessor: 'candidateName', sortable: true },
    {
      header: 'Stage',
      accessor: 'stage',
      render: (row: Interview) => {
        let badgeClass = 'badge ';
        if (row.stage === 'Interview') badgeClass += 'success';
        else if (row.stage === 'Coding Exercise') badgeClass += 'info';
        else badgeClass += 'warning';
        return <span className={badgeClass}>{row.stage}</span>;
      }
    },
    { header: 'Panel / Interviewer', accessor: 'panelName', sortable: true },
    {
      header: 'Schedule',
      render: (row: Interview) => (
        <span style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={12} style={{ color: 'var(--text-secondary)' }} />
          {row.date} @ {row.time}
        </span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row: Interview) => (
        <span className={`badge ${row.status === 'Scheduled' ? 'warning' : 'success'}`}>
          {row.status}
        </span>
      )
    }
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Interviews Scheduler</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
            Coordinate panels, schedule candidate sessions, and track general technical and coding whiteboard rounds.
          </p>
        </div>

        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={16} />
            Schedule Interview
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '5fr 3fr', gap: '28px', alignItems: 'start' }}>
        
        {/* Left Widget: Monthly Calendar view */}
        <div className="widget-card">
          <div className="widget-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>June 2026</h3>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Standard Grid View</span>
          </div>

          <div className="calendar-view" style={{ padding: 0, border: 'none' }}>
            <div className="calendar-grid">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <div key={day} className="calendar-cell-header">{day}</div>
              ))}

              {calendarDays.map((cell, idx) => {
                const isToday = cell.dayNum === 12; // June 12, 2026 is today's local time!
                return (
                  <div key={idx} className="calendar-cell current-month" style={{ borderColor: isToday ? 'var(--primary-blue)' : 'var(--border)', minHeight: '90px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <span className={`calendar-cell-num ${isToday ? 'today' : ''}`}>{cell.dayNum}</span>
                      {isToday && <span style={{ fontSize: '9px', fontWeight: 600, color: 'var(--primary-blue)' }}>TODAY</span>}
                    </div>

                    <div className="calendar-events">
                      {cell.events.slice(0, 2).map((evt, eIdx) => {
                        let cClass = 'primary';
                        if (evt.stage === 'Coding Exercise') cClass = 'info';
                        if (evt.stage === 'Whiteboard Interview') cClass = 'warning';
                        return (
                          <div key={eIdx} className={`calendar-event ${cClass}`}>
                            {evt.candidateName.split(' ')[0]} ({evt.time})
                          </div>
                        );
                      })}
                      {cell.events.length > 2 && (
                        <div style={{ fontSize: '8px', color: 'var(--text-secondary)', textAlign: 'right', fontWeight: 600 }}>
                          +{cell.events.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Widget: Directory Table of Scheduled Interviews */}
        <div className="widget-card">
          <div className="widget-title" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Upcoming Schedule</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Active interview panels list.</span>
          </div>

          <Table
            data={db.interviews}
            columns={columns}
            searchPlaceholder="Filter interview panels..."
            searchKey="candidateName"
            initialSort={{ key: 'id', direction: 'desc' }}
            exportFileName="Interviews_Schedules_Export"
          />
        </div>
      </div>

      {/* Schedule Interview Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Schedule Interview Session"
        footer={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSchedule} disabled={eligibleCandidates.length === 0}>
              Confirm Schedule
            </button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className="form-group">
            <label className="form-label">Select Candidate *</label>
            {eligibleCandidates.length === 0 ? (
              <div style={{
                backgroundColor: 'var(--warning-light)',
                border: '1px solid var(--warning)',
                color: 'var(--warning)',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '0.85rem'
              }}>
                No candidates available for interviews. Ensure candidates have completed assessments first.
              </div>
            ) : (
              <select
                className="select-filter"
                style={{ width: '100%', padding: '10px' }}
                value={candidateId}
                onChange={e => setCandidateId(e.target.value)}
              >
                <option value="">Select Student...</option>
                {eligibleCandidates.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.college} - CGPA {c.cgpa}) - Score: {c.assessmentScore} pts
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Interview Stage *</label>
            <select
              className="select-filter"
              style={{ width: '100%', padding: '10px' }}
              value={stage}
              onChange={e => setStage(e.target.value as any)}
            >
              <option value="Interview">Technical Interview Round</option>
              <option value="Coding Exercise">Coding Evaluation Round</option>
              <option value="Whiteboard Interview">System Design / Whiteboard Round</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Assigned Interview Panelist Name *</label>
            <select
              className="select-filter"
              style={{ width: '100%', padding: '10px' }}
              value={panelName}
              onChange={e => setPanelName(e.target.value)}
            >
              <option value="Panel Alpha">Panel Alpha (SDE-2 lead)</option>
              <option value="Panel Beta">Panel Beta (Architect lead)</option>
              <option value="Panel Gamma">Panel Gamma (Director TA)</option>
              <option value="Panel Delta">Panel Delta (QA lead)</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Interview Date *</label>
              <input
                type="date"
                className="form-control"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Start Time *</label>
              <input
                type="time"
                className="form-control"
                value={time}
                onChange={e => setTime(e.target.value)}
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
