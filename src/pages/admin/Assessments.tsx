import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Table } from '../../components/Table';
import { Modal } from '../../components/Modal';
import type { Assessment, AssessmentSection } from '../../types';
import { Plus, Trash2, ArrowUp, ArrowDown, ClipboardCopy, Settings } from 'lucide-react';

export const Assessments: React.FC = () => {
  const { db } = useApp();
  const [assessmentsList, setAssessmentsList] = useState<Assessment[]>(db.assessments);
  const [builderOpen, setBuilderOpen] = useState(false);

  // Builder form states
  const [name, setName] = useState('');
  const [type, setType] = useState<'Coding' | 'Aptitude' | 'Technical' | 'Combined'>('Combined');
  const [duration, setDuration] = useState('60');
  const [activeSections, setActiveSections] = useState<AssessmentSection[]>([]);

  const availableSections: AssessmentSection['name'][] = [
    'Aptitude', 'Logical Reasoning', 'Technical', 'Coding', 'Verbal'
  ];

  const handleAddSection = (secName: AssessmentSection['name']) => {
    if (activeSections.some(s => s.name === secName)) return;
    setActiveSections([...activeSections, { name: secName, questionCount: 10, marks: 20 }]);
  };

  const handleRemoveSection = (idx: number) => {
    setActiveSections(activeSections.filter((_, i) => i !== idx));
  };

  const handleSectionChange = (idx: number, field: 'questionCount' | 'marks', value: number) => {
    const next = [...activeSections];
    next[idx] = { ...next[idx], [field]: value };
    setActiveSections(next);
  };

  const handleMoveSection = (idx: number, direction: 'up' | 'down') => {
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === activeSections.length - 1) return;

    const next = [...activeSections];
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    const temp = next[idx];
    next[idx] = next[swapIdx];
    next[swapIdx] = temp;
    setActiveSections(next);
  };

  const handleSaveAssessment = (status: Assessment['status']) => {
    if (!name || !duration || activeSections.length === 0) {
      alert('Please fill out all fields and configure at least one section.');
      return;
    }

    const totalMarks = activeSections.reduce((sum, s) => sum + s.marks, 0);

    const newAssessment: Assessment = {
      id: `ASM-${2000 + assessmentsList.length + 1}`,
      name,
      type,
      duration: parseInt(duration),
      totalMarks,
      candidatesAssignedCount: 0,
      status,
      sections: activeSections,
      questionIds: []
    };

    setAssessmentsList([newAssessment, ...assessmentsList]);
    setBuilderOpen(false);
    resetBuilderForm();
  };

  const handleClone = (asm: Assessment) => {
    const cloned: Assessment = {
      ...asm,
      id: `ASM-${2000 + assessmentsList.length + 1}`,
      name: `${asm.name} (Copy)`,
      candidatesAssignedCount: 0,
      status: 'Draft'
    };
    setAssessmentsList([cloned, ...assessmentsList]);
  };

  const resetBuilderForm = () => {
    setName('');
    setType('Combined');
    setDuration('60');
    setActiveSections([]);
  };

  // Define Columns
  const columns = [
    {
      header: 'Assessment Name',
      accessor: 'name',
      sortable: true,
      render: (row: Assessment) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <b style={{ color: 'var(--text-primary)' }}>{row.name}</b>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ID: {row.id}</span>
        </div>
      )
    },
    { header: 'Type', accessor: 'type', sortable: true },
    { header: 'Duration', accessor: 'duration', sortable: true, render: (row: Assessment) => `${row.duration} mins` },
    { header: 'Total Marks', accessor: 'totalMarks', sortable: true, render: (row: Assessment) => `${row.totalMarks} pts` },
    { header: 'Assigned Candidates', accessor: 'candidatesAssignedCount', sortable: true },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (row: Assessment) => {
        let badgeClass = 'badge ';
        if (row.status === 'Active') badgeClass += 'success';
        else if (row.status === 'Closed') badgeClass += 'error';
        else badgeClass += 'warning';
        return <span className={badgeClass}>{row.status}</span>;
      }
    },
    {
      header: 'Actions',
      render: (row: Assessment) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className="btn btn-secondary" 
            style={{ padding: '4px 8px', fontSize: '0.75rem' }} 
            onClick={() => handleClone(row)}
            title="Clone Assessment"
          >
            <ClipboardCopy size={12} />
          </button>
          <button 
            className="btn btn-secondary" 
            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
            onClick={() => alert(`Builder editor loaded for: ${row.name}`)}
            title="Configure"
          >
            <Settings size={12} />
          </button>
        </div>
      )
    }
  ];

  // Filters configurations
  const filters = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { label: 'Active', value: 'Active' },
        { label: 'Draft', value: 'Draft' },
        { label: 'Closed', value: 'Closed' }
      ]
    },
    {
      key: 'type',
      label: 'Type',
      options: [
        { label: 'Combined', value: 'Combined' },
        { label: 'Coding', value: 'Coding' },
        { label: 'Aptitude', value: 'Aptitude' },
        { label: 'Technical', value: 'Technical' }
      ]
    }
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Assessments Portal</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
            Build, edit, clone, and schedule screening examinations and coding evaluation environments.
          </p>
        </div>

        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setBuilderOpen(true)}>
            <Plus size={16} />
            Assessment Builder
          </button>
        </div>
      </div>

      {/* Assessments List Table */}
      <Table
        data={assessmentsList}
        columns={columns}
        filters={filters}
        searchPlaceholder="Search assessments..."
        searchKey="name"
        initialSort={{ key: 'id', direction: 'desc' }}
        exportFileName="Assessments_Data_Export"
      />

      {/* Assessment Builder Drag & Drop Simulator Modal */}
      <Modal
        isOpen={builderOpen}
        onClose={() => { setBuilderOpen(false); resetBuilderForm(); }}
        title="Assessment Builder & Configurator"
        size="lg"
        footer={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={() => handleSaveAssessment('Draft')}>
              Save Draft
            </button>
            <button className="btn btn-primary" onClick={() => handleSaveAssessment('Active')}>
              Save and Activate
            </button>
          </div>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 3fr', gap: '24px' }}>
          {/* Left: General Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Assessment Name *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. SDE-1 Java Screening"
                value={name}
                onChange={e => setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Assessment Type *</label>
              <select
                className="select-filter"
                style={{ width: '100%', padding: '10px' }}
                value={type}
                onChange={e => setType(e.target.value as any)}
              >
                <option value="Combined">Combined Test</option>
                <option value="Coding">Coding Assessment</option>
                <option value="Aptitude">Aptitude Test</option>
                <option value="Technical">Technical MCQ Test</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Exam Duration (minutes) *</label>
              <input
                type="number"
                className="form-control"
                value={duration}
                onChange={e => setDuration(e.target.value)}
              />
            </div>

            {/* Section Picker list */}
            <div>
              <label className="form-label">Add Exam Sections</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
                {availableSections.map(secName => {
                  const isAdded = activeSections.some(s => s.name === secName);
                  return (
                    <button
                      key={secName}
                      className="btn"
                      onClick={() => handleAddSection(secName)}
                      disabled={isAdded}
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.75rem',
                        backgroundColor: isAdded ? 'var(--bg-slate)' : 'var(--primary-blue-light)',
                        color: isAdded ? 'var(--text-muted)' : 'var(--primary-blue)',
                        border: isAdded ? '1px solid var(--border)' : '1px solid transparent',
                        fontWeight: 600
                      }}
                    >
                      + {secName}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Section Reordering & Details Editor */}
          <div style={{ paddingLeft: '20px', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ fontSize: '1rem', marginBottom: '12px' }}>Exam Sections Stack</h4>
            
            {activeSections.length === 0 ? (
              <div style={{
                flexGrow: 1,
                border: '2px dashed var(--border)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
                padding: '40px 20px',
                textAlign: 'center'
              }}>
                Select sections on the left to build the structure. Drag/reorder them inside the stack.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', maxHeight: '350px', paddingRight: '4px' }}>
                {activeSections.map((sec, idx) => (
                  <div 
                    key={sec.name} 
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      padding: '12px',
                      backgroundColor: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flexGrow: 1 }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {idx + 1}. {sec.name}
                      </span>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Questions:</span>
                          <input
                            type="number"
                            style={{ width: '45px', padding: '2px 4px', fontSize: '0.75rem', border: '1px solid var(--border)', borderRadius: '4px' }}
                            value={sec.questionCount}
                            onChange={e => handleSectionChange(idx, 'questionCount', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Marks:</span>
                          <input
                            type="number"
                            style={{ width: '45px', padding: '2px 4px', fontSize: '0.75rem', border: '1px solid var(--border)', borderRadius: '4px' }}
                            value={sec.marks}
                            onChange={e => handleSectionChange(idx, 'marks', parseInt(e.target.value) || 0)}
                          />
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button 
                        onClick={() => handleMoveSection(idx, 'up')} 
                        style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px', color: idx === 0 ? 'var(--text-muted)' : 'var(--text-secondary)' }}
                        disabled={idx === 0}
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button 
                        onClick={() => handleMoveSection(idx, 'down')} 
                        style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px', color: idx === activeSections.length - 1 ? 'var(--text-muted)' : 'var(--text-secondary)' }}
                        disabled={idx === activeSections.length - 1}
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button 
                        onClick={() => handleRemoveSection(idx)} 
                        style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '4px', color: 'var(--error)', marginLeft: '4px' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
