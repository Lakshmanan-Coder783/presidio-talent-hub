import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Table } from '../../components/Table';
import { Modal } from '../../components/Modal';
import type { Candidate } from '../../types';
import { 
  User, 
  Mail, 
  Phone, 
  School, 
  GraduationCap, 
  Award, 
  Calendar, 
  MessageSquare,
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  Plus
} from 'lucide-react';

export const Candidates: React.FC<{ setActiveTab?: (tab: string) => void }> = ({ setActiveTab }) => {
  const { db } = useApp();
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [profileTab, setProfileTab] = useState<'personal' | 'education' | 'assessment' | 'interview' | 'offer'>('personal');
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Define Table Columns
  const columns = useMemo(() => [
    {
      header: 'Candidate ID',
      accessor: 'id',
      sortable: true,
      render: (row: Candidate) => (
        <span 
          style={{ color: 'var(--primary-blue)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
          onClick={() => { setSelectedCandidate(row); setProfileTab('personal'); }}
        >
          {row.id}
        </span>
      )
    },
    {
      header: 'Name',
      accessor: 'name',
      sortable: true,
      render: (row: Candidate) => (
        <span 
          style={{ fontWeight: 600, cursor: 'pointer', color: 'var(--text-primary)' }}
          onClick={() => { setSelectedCandidate(row); setProfileTab('personal'); }}
        >
          {row.name}
        </span>
      )
    },
    { header: 'College', accessor: 'college', sortable: true },
    { header: 'Degree', accessor: 'degree', sortable: true },
    { header: 'CGPA', accessor: 'cgpa', sortable: true },
    {
      header: 'Assessment',
      accessor: 'assessmentStatus',
      sortable: true,
      render: (row: Candidate) => {
        let badgeClass = 'badge ';
        if (row.assessmentStatus === 'Completed') badgeClass += 'success';
        else if (row.assessmentStatus === 'InProgress') badgeClass += 'warning';
        else if (row.assessmentStatus === 'Pending') badgeClass += 'info';
        else badgeClass += 'error';
        return <span className={badgeClass}>{row.assessmentStatus}</span>;
      }
    },
    {
      header: 'Interview',
      accessor: 'interviewStatus',
      sortable: true,
      render: (row: Candidate) => {
        let badgeClass = 'badge ';
        if (row.interviewStatus === 'Passed') badgeClass += 'success';
        else if (row.interviewStatus === 'Failed') badgeClass += 'error';
        else if (row.interviewStatus === 'Scheduled') badgeClass += 'info';
        else if (row.interviewStatus === 'Ongoing') badgeClass += 'warning';
        else return <span style={{ color: 'var(--text-muted)' }}>-</span>;
        return <span className={badgeClass}>{row.interviewStatus}</span>;
      }
    },
    {
      header: 'Offer',
      accessor: 'offerStatus',
      sortable: true,
      render: (row: Candidate) => {
        let badgeClass = 'badge ';
        if (row.offerStatus === 'Joined') badgeClass += 'success';
        else if (row.offerStatus === 'Accepted') badgeClass += 'success';
        else if (row.offerStatus === 'Declined') badgeClass += 'error';
        else if (row.offerStatus === 'Offered') badgeClass += 'info';
        else return <span style={{ color: 'var(--text-muted)' }}>-</span>;
        return <span className={badgeClass}>{row.offerStatus}</span>;
      }
    }
  ], []);

  // Filter Configurations
  const tableFilters = useMemo(() => [
    {
      key: 'assessmentStatus',
      label: 'Assessment',
      options: [
        { label: 'Not Invited', value: 'Not Invited' },
        { label: 'Pending', value: 'Pending' },
        { label: 'InProgress', value: 'InProgress' },
        { label: 'Completed', value: 'Completed' }
      ]
    },
    {
      key: 'offerStatus',
      label: 'Offer',
      options: [
        { label: 'None', value: 'None' },
        { label: 'Offered', value: 'Offered' },
        { label: 'Accepted', value: 'Accepted' },
        { label: 'Declined', value: 'Declined' },
        { label: 'Joined', value: 'Joined' }
      ]
    },
    {
      key: 'college',
      label: 'College',
      options: Array.from(new Set(db.candidates.slice(0, 100).map(c => c.college))).map(col => ({
        label: col,
        value: col
      }))
    }
  ], [db]);

  const handleBulkUploadSimulate = () => {
    setUploading(true);
    setUploadSuccess(false);

    setTimeout(() => {
      setUploading(false);
      setUploadSuccess(true);
      setTimeout(() => {
        setUploadModalOpen(false);
        setUploadSuccess(false);
      }, 1500);
    }, 2000);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Candidates Directory</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
            Manage profiles, assessment scorecards, interview feedbacks, and hiring funnels of all {db.candidates.length} candidates.
          </p>
        </div>

        <div className="page-actions">
          <button className="btn btn-secondary" onClick={() => setUploadModalOpen(true)}>
            <UploadCloud size={16} />
            Bulk Import (XLS)
          </button>
          <button className="btn btn-primary" onClick={() => setActiveTab?.('invite-candidates')}>
            <Plus size={16} />
            Invite Candidates
          </button>
        </div>
      </div>

      {/* Candidates table */}
      <Table
        data={db.candidates}
        columns={columns}
        filters={tableFilters}
        searchPlaceholder="Search by Candidate ID, Name, College..."
        searchKey={(c) => `${c.id} ${c.name} ${c.college}`}
        initialSort={{ key: 'id', direction: 'asc' }}
        exportFileName="Candidates_Database_Export"
      />

      {/* Candidate Profile Drawer / Modal */}
      {selectedCandidate && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedCandidate(null)}
          title={`Candidate Profile: ${selectedCandidate.name}`}
          size="lg"
          footer={
            <button className="btn btn-secondary" onClick={() => setSelectedCandidate(null)}>
              Close Profile
            </button>
          }
        >
          {/* Sub Navigation Tabs */}
          <div 
            style={{ 
              display: 'flex', 
              borderBottom: '1px solid var(--border)', 
              marginBottom: '20px',
              overflowX: 'auto',
              whiteSpace: 'nowrap'
            }}
          >
            {[
              { id: 'personal', label: 'Personal Information', icon: User },
              { id: 'education', label: 'Education Details', icon: GraduationCap },
              { id: 'assessment', label: 'Assessment Scorecard', icon: Award },
              { id: 'interview', label: 'Interview Logs', icon: MessageSquare },
              { id: 'offer', label: 'Offer Conversion', icon: Calendar }
            ].map(tab => {
              const Icon = tab.icon;
              const isTabActive = profileTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setProfileTab(tab.id as any)}
                  style={{
                    padding: '12px 18px',
                    border: 'none',
                    background: 'none',
                    borderBottom: isTabActive ? '2px solid var(--primary-blue)' : '2px solid transparent',
                    color: isTabActive ? 'var(--primary-blue)' : 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    outline: 'none'
                  }}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* TAB CONTENTS */}
          <div style={{ minHeight: '300px' }}>
            
            {/* PERSONAL INFO */}
            {profileTab === 'personal' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <User size={18} style={{ color: 'var(--primary-blue)' }} />
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Full Name</span>
                      <p style={{ fontWeight: 600 }}>{selectedCandidate.name}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Mail size={18} style={{ color: 'var(--primary-blue)' }} />
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Email Address</span>
                      <p style={{ fontWeight: 600 }}>{selectedCandidate.email}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Phone size={18} style={{ color: 'var(--primary-blue)' }} />
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Phone Number</span>
                      <p style={{ fontWeight: 600 }}>{selectedCandidate.phone}</p>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingLeft: '20px', borderLeft: '1px solid var(--border)' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Funnel Hiring Stage</span>
                    <p style={{ fontWeight: 700, color: 'var(--primary-blue)', marginTop: '4px' }}>
                      <span className="badge info">{selectedCandidate.funnelStage}</span>
                    </p>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Portal Candidate ID</span>
                    <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: '2px' }}>
                      {selectedCandidate.id}
                    </p>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Exam Portal Password</span>
                    <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: '2px' }}>
                      {selectedCandidate.assessmentPassword || 'Not Generated'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* EDUCATION */}
            {profileTab === 'education' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <School size={18} style={{ color: 'var(--primary-blue)' }} />
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>College Institute</span>
                      <p style={{ fontWeight: 600 }}>{selectedCandidate.college}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <GraduationCap size={18} style={{ color: 'var(--primary-blue)' }} />
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Degree & Stream</span>
                      <p style={{ fontWeight: 600 }}>{selectedCandidate.degree}</p>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingLeft: '20px', borderLeft: '1px solid var(--border)' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>CGPA Score</span>
                    <p style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary-blue)' }}>
                      {selectedCandidate.cgpa}
                      <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-secondary)' }}> / 10.0</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ASSESSMENT HISTORY */}
            {profileTab === 'assessment' && (
              <div>
                {selectedCandidate.assessmentStatus === 'Completed' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                    <div>
                      <h4 style={{ fontSize: '1rem', marginBottom: '12px' }}>Test Statistics</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Assigned Exam</span>
                          <span style={{ fontWeight: 600 }}>{selectedCandidate.assessmentId}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Total Marks Scored</span>
                          <span style={{ fontWeight: 700, color: 'var(--success)' }}>{selectedCandidate.assessmentScore} Marks</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Percentile Rank</span>
                          <span style={{ fontWeight: 700, color: 'var(--primary-blue)' }}>{selectedCandidate.assessmentPercentile}%</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>State-wide Rank</span>
                          <span style={{ fontWeight: 600 }}>#{selectedCandidate.assessmentRank}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Time Taken</span>
                          <span style={{ fontWeight: 600 }}>{Math.round((selectedCandidate.assessmentDurationUsed || 0) / 60)} mins</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ paddingLeft: '24px', borderLeft: '1px solid var(--border)' }}>
                      <h4 style={{ fontSize: '1rem', marginBottom: '12px' }}>Topic Breakdown</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {selectedCandidate.sectionScores && Object.entries(selectedCandidate.sectionScores).map(([sec, val]) => (
                          <div key={sec}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, textTransform: 'capitalize', marginBottom: '4px' }}>
                              <span>{sec}</span>
                              <span style={{ color: 'var(--text-primary)' }}>{val} Marks</span>
                            </div>
                            <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-slate)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${Math.min(val * 4, 100)}%`, height: '100%', backgroundColor: 'var(--primary-blue)', borderRadius: '3px' }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                    Assessment status is <b>{selectedCandidate.assessmentStatus}</b>. No scorecard metrics generated yet.
                  </div>
                )}
              </div>
            )}

            {/* INTERVIEW logs */}
            {profileTab === 'interview' && (
              <div>
                {selectedCandidate.interviewStatus !== 'Not Scheduled' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ backgroundColor: 'var(--bg-slate)', border: '1px solid var(--border)', borderRadius: '8px', padding: '16px', fontSize: '0.875rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Technical Interview Panel</span>
                        <span className="badge success">{selectedCandidate.interviewStatus}</span>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                        Candidate demonstrated good problem-solving logic. Strong knowledge in database concepts and OS concurrency. Satisfactorily resolved coding exercise. Recommended for next steps.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                    No interview logs found. Candidate is currently not scheduled.
                  </div>
                )}
              </div>
            )}

            {/* OFFER DETAILS */}
            {profileTab === 'offer' && (
              <div>
                {selectedCandidate.offerStatus !== 'None' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Offer CTC Package</span>
                        <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--success)' }}>12.5 LPA</p>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Offer Release Date</span>
                        <p style={{ fontWeight: 600 }}>10th June 2026</p>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingLeft: '20px', borderLeft: '1px solid var(--border)' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Hiring Status</span>
                        <div style={{ marginTop: '8px' }}>
                          <span className="badge success" style={{ fontSize: '0.9rem', padding: '6px 12px' }}>
                            {selectedCandidate.offerStatus}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                    No offer details released for this candidate. Funnel status: <b>{selectedCandidate.funnelStage}</b>.
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Bulk Import Simulator Modal */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Import Candidates via Spreadsheet"
        footer={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={() => setUploadModalOpen(false)} disabled={uploading}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleBulkUploadSimulate} disabled={uploading}>
              {uploading ? 'Processing XLS...' : 'Import Spreadsheet'}
            </button>
          </div>
        }
      >
        <div style={{
          border: '2px dashed var(--border)',
          borderRadius: '8px',
          padding: '40px',
          textAlign: 'center',
          backgroundColor: 'var(--bg-slate)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px'
        }}>
          {uploading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '4px solid var(--primary-blue-light)',
                borderTop: '4px solid var(--primary-blue)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
              <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>Analyzing sheet layout and rows...</p>
            </div>
          ) : uploadSuccess ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <CheckCircle2 size={40} style={{ color: 'var(--success)' }} />
              <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--success)' }}>
                Import Completed! 50 Candidates created.
              </p>
            </div>
          ) : (
            <>
              <FileSpreadsheet size={48} style={{ color: 'var(--primary-blue)' }} />
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 600 }}>Drag and Drop your spreadsheet here</h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Supports CSV, XLS, XLSX formats. Minimum columns required: Name, Email, Phone, College, Degree, CGPA.
                </p>
              </div>
              <input type="file" id="xls-file" style={{ display: 'none' }} />
              <button className="btn btn-secondary" onClick={() => document.getElementById('xls-file')?.click()} style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
                Browse Files
              </button>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};
