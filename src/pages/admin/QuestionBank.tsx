import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Table } from '../../components/Table';
import { Modal } from '../../components/Modal';
import type { Question } from '../../types';
import { Plus, Tag, HelpCircle, Code } from 'lucide-react';

export const QuestionBank: React.FC = () => {
  const { db, createQuestion } = useApp();
  const [modalOpen, setModalOpen] = useState(false);

  // Form states
  const [text, setText] = useState('');
  const [type, setType] = useState<Question['type']>('MCQ');
  const [topic, setTopic] = useState<Question['topic']>('Technical');
  const [difficulty, setDifficulty] = useState<Question['difficulty']>('Medium');
  const [marks, setMarks] = useState('2');
  const [tagsInput, setTagsInput] = useState('');
  const [options, setOptions] = useState<string[]>(['', '', '', '']);
  const [correctOption, setCorrectOption] = useState('0');

  const handleOptionChange = (idx: number, value: string) => {
    const next = [...options];
    next[idx] = value;
    setOptions(next);
  };

  const handleSaveQuestion = () => {
    if (!text || !marks) {
      alert('Please fill out all required fields.');
      return;
    }

    const tags = tagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0);
    
    // Construct new question
    const qData: Omit<Question, 'id'> = {
      text,
      type,
      topic,
      difficulty,
      marks: parseInt(marks),
      tags,
      options: ['MCQ', 'Multiple Select'].includes(type) ? options.filter(o => o.trim() !== '') : undefined,
      correctOptions: ['MCQ', 'Multiple Select'].includes(type) ? [parseInt(correctOption)] : undefined
    };

    createQuestion(qData);
    resetForm();
    setModalOpen(false);
  };

  const resetForm = () => {
    setText('');
    setType('MCQ');
    setTopic('Technical');
    setDifficulty('Medium');
    setMarks('2');
    setTagsInput('');
    setOptions(['', '', '', '']);
    setCorrectOption('0');
  };

  // Define Table Columns
  const columns = useMemo(() => [
    {
      header: 'Question Text',
      accessor: 'text',
      sortable: true,
      render: (row: Question) => (
        <div style={{ maxWidth: '400px', whiteSpace: 'normal', wordBreak: 'break-word' }}>
          <b style={{ color: 'var(--text-primary)', fontSize: '0.875rem' }}>
            {row.text.length > 110 ? `${row.text.slice(0, 110)}...` : row.text}
          </b>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
            {row.tags.map(t => (
              <span 
                key={t} 
                style={{ 
                  fontSize: '10px', 
                  backgroundColor: 'var(--bg-slate)', 
                  border: '1px solid var(--border)', 
                  borderRadius: '4px', 
                  padding: '1px 6px',
                  color: 'var(--text-secondary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px'
                }}
              >
                <Tag size={8} />
                {t}
              </span>
            ))}
          </div>
        </div>
      )
    },
    { header: 'Topic', accessor: 'topic', sortable: true },
    {
      header: 'Type',
      accessor: 'type',
      sortable: true,
      render: (row: Question) => {
        let iconColor = 'var(--primary-blue)';
        if (row.type === 'Coding') iconColor = '#8b5cf6';
        if (row.type === 'SQL') iconColor = '#06b6d4';
        return (
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
            {row.type === 'Coding' ? <Code size={14} style={{ color: iconColor }} /> : <HelpCircle size={14} style={{ color: iconColor }} />}
            {row.type}
          </span>
        );
      }
    },
    {
      header: 'Difficulty',
      accessor: 'difficulty',
      sortable: true,
      render: (row: Question) => {
        let badgeClass = 'badge ';
        if (row.difficulty === 'Easy') badgeClass += 'success';
        else if (row.difficulty === 'Medium') badgeClass += 'warning';
        else badgeClass += 'error';
        return <span className={badgeClass}>{row.difficulty}</span>;
      }
    },
    { header: 'Marks', accessor: 'marks', sortable: true, render: (row: Question) => `${row.marks} pts` }
  ], []);

  // Filters configs
  const filters = useMemo(() => [
    {
      key: 'type',
      label: 'Type',
      options: [
        { label: 'MCQ', value: 'MCQ' },
        { label: 'Multiple Select', value: 'Multiple Select' },
        { label: 'Coding', value: 'Coding' },
        { label: 'SQL', value: 'SQL' },
        { label: 'Descriptive', value: 'Descriptive' }
      ]
    },
    {
      key: 'topic',
      label: 'Topic',
      options: [
        { label: 'Aptitude', value: 'Aptitude' },
        { label: 'Logical Reasoning', value: 'Logical Reasoning' },
        { label: 'Technical', value: 'Technical' },
        { label: 'Coding', value: 'Coding' },
        { label: 'Verbal', value: 'Verbal' }
      ]
    },
    {
      key: 'difficulty',
      label: 'Difficulty',
      options: [
        { label: 'Easy', value: 'Easy' },
        { label: 'Medium', value: 'Medium' },
        { label: 'Hard', value: 'Hard' }
      ]
    }
  ], []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Question Bank</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
            Central repository of all {db.questions.length} pre-approved assessment questions, filters, and tagging categories.
          </p>
        </div>

        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={16} />
            Create Question
          </button>
        </div>
      </div>

      {/* Directory Table */}
      <Table
        data={db.questions}
        columns={columns}
        filters={filters}
        searchPlaceholder="Search questions by text or tags..."
        searchKey={(q) => `${q.text} ${q.tags.join(' ')}`}
        initialSort={{ key: 'id', direction: 'desc' }}
        exportFileName="Question_Bank_Export"
      />

      {/* Create Question Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); resetForm(); }}
        title="Add Question to Bank"
        size="lg"
        footer={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={() => { setModalOpen(false); resetForm(); }}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSaveQuestion}>
              Add Question
            </button>
          </div>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Left Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Question Text *</label>
              <textarea
                className="form-control"
                placeholder="Enter question statement details..."
                rows={4}
                value={text}
                onChange={e => setText(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Question Type *</label>
              <select
                className="select-filter"
                style={{ width: '100%', padding: '10px' }}
                value={type}
                onChange={e => setType(e.target.value as any)}
              >
                <option value="MCQ">Multiple Choice (Single Correct)</option>
                <option value="Multiple Select">Multiple Select (Multiple Correct)</option>
                <option value="Coding">Coding Challenge</option>
                <option value="SQL">SQL Query Writing</option>
                <option value="Descriptive">Descriptive Theory</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Difficulty *</label>
                <select
                  className="select-filter"
                  style={{ width: '100%', padding: '10px' }}
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value as any)}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Marks *</label>
                <input
                  type="number"
                  className="form-control"
                  value={marks}
                  onChange={e => setMarks(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Topic Area *</label>
              <select
                className="select-filter"
                style={{ width: '100%', padding: '10px' }}
                value={topic}
                onChange={e => setTopic(e.target.value as any)}
              >
                <option value="Aptitude">Aptitude</option>
                <option value="Logical Reasoning">Logical Reasoning</option>
                <option value="Technical">Technical MCQ</option>
                <option value="Coding">Coding IDE</option>
                <option value="Verbal">Verbal / Communication</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Tags (comma separated)</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Arrays, Recursion, Time Complexity"
                value={tagsInput}
                onChange={e => setTagsInput(e.target.value)}
              />
            </div>
          </div>

          {/* Right MCQ Config Fields */}
          <div style={{ paddingLeft: '20px', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ fontSize: '1rem', marginBottom: '12px' }}>MCQ/MSQ Options Configurator</h4>
            {['MCQ', 'Multiple Select'].includes(type) ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {options.map((opt, idx) => (
                  <div key={idx} className="form-group">
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      Option {idx + 1}
                      <input 
                        type="radio" 
                        name="correct-option" 
                        checked={correctOption === String(idx)} 
                        onChange={() => setCorrectOption(String(idx))} 
                      />
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder={`Enter text for Option ${idx + 1}...`}
                      value={opt}
                      onChange={e => handleOptionChange(idx, e.target.value)}
                    />
                  </div>
                ))}
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  * Select the corresponding radio button to mark the correct option.
                </span>
              </div>
            ) : (
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
                Options configuration is only available for Multiple Choice and Multiple Select question types.
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
