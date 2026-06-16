import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Table } from '../../components/Table';
import { Send, ShieldCheck, Users } from 'lucide-react';

export const InviteCandidates: React.FC = () => {
  const { db, bulkInvite } = useApp();
  const [selectedCollege, setSelectedCollege] = useState('');
  const [selectedAssessment, setSelectedAssessment] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [invitedSuccess, setInvitedSuccess] = useState(false);

  // Colleges with pending candidates
  const collegesWithOptions = useMemo(() => {
    const colleges = Array.from(new Set(db.candidates.map(c => c.college)));
    return colleges.map(col => {
      const pendingCount = db.candidates.filter(c => c.college === col && c.assessmentStatus === 'Not Invited').length;
      return { college: col, count: pendingCount };
    }).filter(c => c.count > 0);
  }, [db]);

  const activeAssessments = useMemo(() => {
    return db.assessments.filter(a => a.status === 'Active');
  }, [db]);

  const handleBulkInvite = () => {
    if (!selectedCollege || !selectedAssessment || !scheduleDate || !scheduleTime) {
      alert('Please select all required invitation settings.');
      return;
    }

    bulkInvite(selectedAssessment, scheduleDate, selectedCollege);
    setInvitedSuccess(true);
  };

  // Preview generated credentials list
  const invitedCandidates = useMemo(() => {
    return db.candidates.filter(c => c.college === selectedCollege && c.assessmentStatus === 'Pending');
  }, [db, selectedCollege, invitedSuccess]);

  // Define Columns
  const columns = [
    { header: 'Candidate ID', accessor: 'id', sortable: true },
    { header: 'Candidate Name', accessor: 'name', sortable: true },
    { header: 'Email Address', accessor: 'email' },
    {
      header: 'Assigned Exam',
      accessor: 'assessmentId',
      render: (row: any) => {
        const test = db.assessments.find(a => a.id === row.assessmentId);
        return test ? test.name : row.assessmentId;
      }
    },
    {
      header: 'Access Password',
      accessor: 'assessmentPassword',
      render: (row: any) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--primary-blue)' }}>
          {row.assessmentPassword}
        </span>
      )
    },
    {
      header: 'Invitation Status',
      render: () => <span className="badge success">Generated</span>
    }
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Candidate Invitations</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
            Generate unique Candidate IDs and passwords, assign exam schedules, and bulk invite students.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '28px', alignItems: 'start' }}>
        
        {/* Left Widget: Invite configurator form */}
        <div className="widget-card">
          <div className="widget-title">
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Invite Configurator</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div className="form-group">
              <label className="form-label">Select College Drive *</label>
              <select
                className="select-filter"
                style={{ width: '100%', padding: '10px' }}
                value={selectedCollege}
                onChange={e => { setSelectedCollege(e.target.value); setInvitedSuccess(false); }}
              >
                <option value="">Choose College...</option>
                {collegesWithOptions.map(opt => (
                  <option key={opt.college} value={opt.college}>
                    {opt.college} ({opt.count} candidates pending)
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Select Assessment *</label>
              <select
                className="select-filter"
                style={{ width: '100%', padding: '10px' }}
                value={selectedAssessment}
                onChange={e => setSelectedAssessment(e.target.value)}
              >
                <option value="">Choose Assessment...</option>
                {activeAssessments.map(asm => (
                  <option key={asm.id} value={asm.id}>
                    {asm.name} ({asm.duration} mins)
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Exam Schedule Date *</label>
              <input
                type="date"
                className="form-control"
                value={scheduleDate}
                onChange={e => setScheduleDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Exam Start Time *</label>
              <input
                type="time"
                className="form-control"
                value={scheduleTime}
                onChange={e => setScheduleTime(e.target.value)}
              />
            </div>

            {invitedSuccess ? (
              <div style={{
                backgroundColor: 'var(--success-light)',
                border: '1px solid var(--success)',
                color: 'var(--success)',
                borderRadius: '8px',
                padding: '12px',
                fontSize: '0.875rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <ShieldCheck size={18} />
                Invitations successfully dispatched!
              </div>
            ) : (
              <button 
                className="btn btn-primary"
                onClick={handleBulkInvite}
                style={{ justifyContent: 'center', padding: '10px', gap: '8px' }}
                disabled={!selectedCollege || !selectedAssessment || !scheduleDate || !scheduleTime}
              >
                <Send size={16} />
                Generate & Invite Candidates
              </button>
            )}
          </div>
        </div>

        {/* Right Widget: Preview panel */}
        <div className="widget-card" style={{ minHeight: '360px' }}>
          <div className="widget-title" style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700 }}>Invitations Access Preview</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Generated credential preview list.</span>
          </div>

          {invitedCandidates.length === 0 ? (
            <div style={{
              flexGrow: 1,
              border: '2px dashed var(--border)',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              padding: '60px 20px',
              textAlign: 'center',
              gap: '12px'
            }}>
              <Users size={36} style={{ color: 'var(--text-muted)' }} />
              <div>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>No active batch selected</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', maxWidth: '300px' }}>
                  Configure invitation settings on the left and dispatch the invites. The generated candidate ID and assessment password credentials will preview here.
                </p>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                backgroundColor: 'rgba(37, 99, 235, 0.08)',
                border: '1px solid rgba(37, 99, 235, 0.15)',
                color: 'var(--primary-blue)',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                lineHeight: '1.4'
              }}>
                Generated <b>{invitedCandidates.length}</b> unique exam credentials for <b>{selectedCollege}</b> drive. Candidates can now access the portal using these credentials.
              </div>
              
              <Table
                data={invitedCandidates}
                columns={columns}
                searchPlaceholder="Filter preview list..."
                searchKey="name"
                initialSort={{ key: 'id', direction: 'asc' }}
                exportFileName="Generated_Credentials_Batch"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
