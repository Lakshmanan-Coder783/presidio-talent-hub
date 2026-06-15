import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { CodeEditor } from '../../components/CodeEditor';
import { DonutChart } from '../../components/Charts';
import { 
  Clock, 
  CheckSquare, 
  FileCheck2, 
  AlertCircle, 
  ChevronRight, 
  ChevronLeft,
  Bookmark,
  LogOut,
  Trophy,
  Activity,
  Award
} from 'lucide-react';

export const CandidatePortal: React.FC = () => {
  const { currentUser, db, submitCandidateAssessment, logout } = useApp();
  const candidate = currentUser?.candidate;
  
  const [portalStep, setPortalStep] = useState<'instructions' | 'assessment' | 'submitted'>('instructions');
  const [agreed, setAgreed] = useState(false);

  // Active exam details
  const assessment = useMemo(() => {
    if (!candidate) return null;
    return db.assessments.find(a => a.id === candidate.assessmentId) || null;
  }, [candidate, db]);

  const questions = useMemo(() => {
    if (!assessment) return [];
    return db.questions.filter(q => assessment.questionIds.includes(q.id));
  }, [assessment, db]);

  // Assessment active states
  const [activeIdx, setActiveIdx] = useState(0);
  const [answers, setAnswers] = useState<{ [qId: string]: any }>({});
  const [markedForReview, setMarkedForReview] = useState<{ [qId: string]: boolean }>({});

  
  // Timer state
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [durationUsed, setDurationUsed] = useState(0);

  useEffect(() => {
    if (assessment) {
      setTimeLeft(assessment.duration * 60);
    }
  }, [assessment]);

  // Decrement timer
  useEffect(() => {
    if (portalStep !== 'assessment') return;
    
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        setDurationUsed(d => d + 1);
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [portalStep]);

  const activeQuestion = questions[activeIdx];



  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
  };

  const handleAnswerSelect = (optIdx: number) => {
    if (!activeQuestion) return;
    setAnswers(prev => ({ ...prev, [activeQuestion.id]: optIdx }));
  };

  const handleMultipleSelectToggle = (optIdx: number) => {
    if (!activeQuestion) return;
    const currentAnswers = (answers[activeQuestion.id] as number[]) || [];
    let next: number[];
    if (currentAnswers.includes(optIdx)) {
      next = currentAnswers.filter(v => v !== optIdx);
    } else {
      next = [...currentAnswers, optIdx];
    }
    setAnswers(prev => ({ ...prev, [activeQuestion.id]: next }));
  };

  const handleTextAnswerChange = (val: string) => {
    if (!activeQuestion) return;
    setAnswers(prev => ({ ...prev, [activeQuestion.id]: val }));
  };

  const handleMarkReview = () => {
    if (!activeQuestion) return;
    setMarkedForReview(prev => ({ ...prev, [activeQuestion.id]: !prev[activeQuestion.id] }));
  };

  const handleNext = () => {
    if (activeIdx < questions.length - 1) {
      setActiveIdx(activeIdx + 1);
    }
  };

  const handlePrev = () => {
    if (activeIdx > 0) {
      setActiveIdx(activeIdx - 1);
    }
  };

  const handleAutoSubmit = () => {
    if (!candidate || !assessment) return;
    submitCandidateAssessment(candidate.id, assessment.id, answers, durationUsed);
    setPortalStep('submitted');
  };

  const handleSubmitTest = () => {
    if (window.confirm('Are you sure you want to end and submit your assessment?')) {
      handleAutoSubmit();
    }
  };

  if (!candidate || !assessment) {
    return (
      <div className="candidate-layout" style={{ justifyContent: 'center', alignItems: 'center', padding: '40px' }}>
        <div className="widget-card" style={{ maxWidth: '440px', textAlign: 'center' }}>
          <AlertCircle size={40} style={{ color: 'var(--error)', margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Session Configuration Error</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '8px' }}>
            No active candidate assessment record detected. Please sign out and log in again.
          </p>
          <button className="btn btn-primary" onClick={logout} style={{ marginTop: '20px', width: '100%' }}>
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // Section scores for charts in Results
  const sectionBreakdownChartData = () => {
    // Reload candidate from database context to read newly computed scores
    const dbCandidate = db.candidates.find(c => c.id === candidate.id);
    if (!dbCandidate || !dbCandidate.sectionScores) return [];
    
    const colors = ['#2563eb', '#8b5cf6', '#06b6d4', '#f59e0b', '#22c55e'];
    return Object.entries(dbCandidate.sectionScores).map(([label, value], idx) => ({
      label,
      value: Number(value),
      color: colors[idx % colors.length]
    })).filter(item => item.value > 0);
  };

  return (
    <div className="candidate-layout">
      {/* Top Navbar */}
      <nav className="candidate-navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            backgroundColor: 'var(--primary-blue)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '1rem'
          }}>P</div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem' }}>Presidio Portal</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '0.875rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>
            Candidate ID: <b style={{ color: 'var(--text-primary)' }}>{candidate.id}</b>
          </span>
          <span style={{ color: 'var(--text-secondary)' }}>
            Name: <b style={{ color: 'var(--text-primary)' }}>{candidate.name}</b>
          </span>
          {portalStep === 'instructions' && (
            <button className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: '0.75rem', gap: '4px' }} onClick={logout}>
              <LogOut size={12} />
              Exit
            </button>
          )}
        </div>
      </nav>

      {/* RENDER INSTRUCTIONS STEP */}
      {portalStep === 'instructions' && (
        <div className="candidate-content" style={{ marginTop: '24px' }}>
          <div className="widget-card" style={{ padding: '32px' }}>
            <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Assessment Instructions</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '4px' }}>
                Please read the instructions carefully before launching the test environment.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '3fr 1.5fr', gap: '32px', marginBottom: '28px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--text-primary)' }}>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>General Guidelines</h4>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    - Total Test Duration is <b>{assessment.duration} minutes</b>. Keep track of the countdown timer.<br />
                    - The exam comprises <b>{questions.length} questions</b> across configured sections.<br />
                    - Ensure you have a stable internet connection. Auto-save is active.<br />
                    - Do NOT close or refresh the browser.
                  </p>
                </div>

                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px', color: 'var(--error)' }}>
                    AI Proctoring & Compliance rules
                  </h4>
                  <p style={{ color: 'var(--text-secondary)' }}>
                    - Fullscreen mode is mandatory. Switching tabs, opening debugger console, or shifting window focus will trigger navigation violations.<br />
                    - Right-click, text selection, and copy-paste functions are blocked inside the editor layout.<br />
                    - Ensure your camera is active and you remain in frame throughout the assessment.
                  </p>
                </div>
              </div>

              {/* Assessment Stats sidebar card */}
              <div style={{ backgroundColor: 'var(--bg-slate)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckSquare size={18} style={{ color: 'var(--primary-blue)' }} />
                  Exam Parameters
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Exam Title</span>
                    <b style={{ color: 'var(--text-primary)', textAlign: 'right' }}>{assessment.name}</b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Duration</span>
                    <b>{assessment.duration} mins</b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Total Questions</span>
                    <b>{questions.length} items</b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '4px' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Total Marks</span>
                    <b>{assessment.totalMarks} pts</b>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="agree-inst"
                  checked={agreed}
                  onChange={e => setAgreed(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="agree-inst" style={{ fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}>
                  I have read, understood, and agree to comply with the instructions and proctoring rules listed above.
                </label>
              </div>

              <button
                className="btn btn-primary"
                style={{ alignSelf: 'flex-start', padding: '10px 24px', fontSize: '0.95rem', fontWeight: 600 }}
                disabled={!agreed}
                onClick={() => setPortalStep('assessment')}
              >
                Launch Assessment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RENDER ASSESSMENT STATE */}
      {portalStep === 'assessment' && activeQuestion && (
        <div style={{ padding: '24px 40px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          
          <div className="mcq-layout" style={{ flexGrow: 1 }}>
            
            {/* Left Column: Question Layout */}
            <div className="widget-card" style={{ minHeight: '480px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              
              <div>
                {/* Question Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '20px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary-blue)', letterSpacing: '0.05em' }}>
                    Question {activeIdx + 1} of {questions.length} • {activeQuestion.topic} Section
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Marks: <b style={{ color: 'var(--text-primary)' }}>{activeQuestion.marks} pts</b>
                  </span>
                </div>

                {/* Question Statement */}
                <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: '1.5', marginBottom: '24px' }}>
                  {activeQuestion.text}
                </div>

                {/* Question Inputs (MCQ, SQL, Coding) */}
                
                {/* MCQ */}
                {activeQuestion.type === 'MCQ' && activeQuestion.options && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {activeQuestion.options.map((opt, idx) => {
                      const isSelected = answers[activeQuestion.id] === idx;
                      return (
                        <div
                          key={idx}
                          onClick={() => handleAnswerSelect(idx)}
                          style={{
                            border: isSelected ? '2px solid var(--primary-blue)' : '1px solid var(--border)',
                            borderRadius: '8px',
                            padding: '14px 18px',
                            cursor: 'pointer',
                            backgroundColor: isSelected ? 'var(--primary-blue-light)' : '#ffffff',
                            transition: 'all 0.15s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                          }}
                        >
                          <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            border: isSelected ? '6px solid var(--primary-blue)' : '2px solid var(--text-muted)',
                            backgroundColor: '#ffffff'
                          }}></div>
                          <span style={{ fontSize: '0.9rem', fontWeight: 500, color: isSelected ? 'var(--primary-blue)' : 'var(--text-primary)' }}>
                            {opt}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* MULTIPLE SELECT */}
                {activeQuestion.type === 'Multiple Select' && activeQuestion.options && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {activeQuestion.options.map((opt, idx) => {
                      const selectedList = (answers[activeQuestion.id] as number[]) || [];
                      const isSelected = selectedList.includes(idx);
                      return (
                        <div
                          key={idx}
                          onClick={() => handleMultipleSelectToggle(idx)}
                          style={{
                            border: isSelected ? '2px solid var(--primary-blue)' : '1px solid var(--border)',
                            borderRadius: '8px',
                            padding: '14px 18px',
                            cursor: 'pointer',
                            backgroundColor: isSelected ? 'var(--primary-blue-light)' : '#ffffff',
                            transition: 'all 0.15s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                          }}
                        >
                          <div style={{
                            width: '18px',
                            height: '18px',
                            border: isSelected ? '2px solid var(--primary-blue)' : '2px solid var(--text-muted)',
                            borderRadius: '4px',
                            backgroundColor: isSelected ? 'var(--primary-blue)' : '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            fontSize: '10px',
                            fontWeight: 'bold'
                          }}>
                            {isSelected && '✓'}
                          </div>
                          <span style={{ fontSize: '0.9rem', fontWeight: 500, color: isSelected ? 'var(--primary-blue)' : 'var(--text-primary)' }}>
                            {opt}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* SQL / DESCRIPTIVE TEXT */}
                {['SQL', 'Descriptive'].includes(activeQuestion.type) && (
                  <div className="form-group">
                    <label className="form-label">Your Solution Query / Text Details</label>
                    <textarea
                      className="form-control"
                      rows={8}
                      placeholder={activeQuestion.type === 'SQL' ? 'SELECT ... FROM ... WHERE ...' : 'Provide your descriptive notes here...'}
                      value={answers[activeQuestion.id] || ''}
                      onChange={e => handleTextAnswerChange(e.target.value)}
                      style={{ fontFamily: activeQuestion.type === 'SQL' ? 'var(--font-mono)' : 'inherit', fontSize: '0.9rem' }}
                    />
                  </div>
                )}

                {/* CODING IDE */}
                {activeQuestion.type === 'Coding' && (
                  <div style={{ height: '400px', marginTop: '12px' }}>
                    <CodeEditor
                      value={answers[activeQuestion.id] || ''}
                      onChange={handleTextAnswerChange}
                      languageTemplates={activeQuestion.codingTemplate}
                    />
                  </div>
                )}

              </div>

              {/* Navigation buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '20px', marginTop: '24px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn btn-secondary" style={{ padding: '8px 14px' }} onClick={handlePrev} disabled={activeIdx === 0}>
                    <ChevronLeft size={16} />
                    Previous
                  </button>
                  <button className="btn btn-secondary" style={{ padding: '8px 14px' }} onClick={handleNext} disabled={activeIdx === questions.length - 1}>
                    Save & Next
                    <ChevronRight size={16} />
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="btn btn-secondary"
                    style={{
                      padding: '8px 14px',
                      color: markedForReview[activeQuestion.id] ? 'var(--warning)' : 'var(--text-secondary)',
                      borderColor: markedForReview[activeQuestion.id] ? 'var(--warning)' : 'var(--border)',
                      backgroundColor: markedForReview[activeQuestion.id] ? 'var(--warning-light)' : '#ffffff'
                    }}
                    onClick={handleMarkReview}
                  >
                    <Bookmark size={16} />
                    {markedForReview[activeQuestion.id] ? 'Marked' : 'Mark for Review'}
                  </button>
                  <button className="btn btn-primary" style={{ backgroundColor: 'var(--success)' }} onClick={handleSubmitTest}>
                    Submit Assessment
                  </button>
                </div>
              </div>

            </div>

            {/* Right Column: Timer & Navigation dot matrix sidebar */}
            <div className="navigator-card">
              {/* Countdown Timer */}
              <div style={{
                textAlign: 'center',
                paddingBottom: '20px',
                borderBottom: '1px solid var(--border)',
                marginBottom: '20px'
              }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Time Remaining
                </span>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: 800,
                  fontFamily: 'var(--font-mono)',
                  color: timeLeft < 300 ? 'var(--error)' : 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginTop: '4px',
                  animation: timeLeft < 300 ? 'pulse 1s infinite' : 'none'
                }}>
                  <Clock size={24} />
                  {formatTime(timeLeft)}
                </div>
              </div>

              {/* Question Dots Grid */}
              <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>Question Navigation</h4>
              <div className="grid-nav">
                {questions.map((q, idx) => {
                  const isCur = activeIdx === idx;
                  const isReview = markedForReview[q.id];
                  const ans = answers[q.id];
                  const isAns = ans !== undefined && (typeof ans === 'string' ? ans.trim().length > 0 : Array.isArray(ans) ? ans.length > 0 : true);
                  
                  let dotClass = 'nav-dot ';
                  if (isCur) dotClass += 'active';
                  else if (isReview) dotClass += 'review';
                  else if (isAns) dotClass += 'answered';

                  return (
                    <button
                      key={q.id}
                      className={dotClass}
                      onClick={() => setActiveIdx(idx)}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Legend details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '16px', fontSize: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'var(--bg-slate)', border: '1px solid var(--border)' }}></span>
                  <span style={{ color: 'var(--text-secondary)' }}>Unvisited</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'var(--primary-blue-light)', border: '1px solid var(--primary-blue)' }}></span>
                  <span style={{ color: 'var(--text-secondary)' }}>Active View</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'var(--success-light)', border: '1px solid var(--success)' }}></span>
                  <span style={{ color: 'var(--text-secondary)' }}>Answered & Saved</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: 'var(--warning-light)', border: '1px solid var(--warning)' }}></span>
                  <span style={{ color: 'var(--text-secondary)' }}>Marked for Review</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* RENDER RESULT SCORECARD STATE */}
      {portalStep === 'submitted' && (
        <div className="candidate-content" style={{ marginTop: '24px' }}>
          {/* Reload candidate to display freshly computed scorecards */}
          {(() => {
            const dbCandidate = db.candidates.find(c => c.id === candidate.id);
            if (!dbCandidate) return null;
            return (
              <div className="widget-card" style={{ padding: '36px', textAlign: 'center' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--success-light)',
                  color: 'var(--success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px'
                }}>
                  <FileCheck2 size={36} />
                </div>

                <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Assessment Submitted Successfully</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '6px' }}>
                  Your score has been registered. Below is your performance breakdown report.
                </p>

                {/* Scorecard Widget */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '24px',
                  backgroundColor: 'var(--bg-slate)',
                  margin: '28px 0',
                  gap: '16px'
                }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                      Marks Scored
                    </span>
                    <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--success)', marginTop: '4px' }}>
                      {dbCandidate.assessmentScore} / {assessment.totalMarks}
                    </p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                      Percentile Rank
                    </span>
                    <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-blue)', marginTop: '4px' }}>
                      {dbCandidate.assessmentPercentile}%
                    </p>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>
                      State-wide Rank
                    </span>
                    <p style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
                      #{dbCandidate.assessmentRank}
                    </p>
                  </div>
                </div>

                {/* Graph breakdown */}
                {dbCandidate.sectionScores && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '28px', textAlign: 'left', marginTop: '16px' }}>
                    <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Trophy size={16} style={{ color: 'var(--primary-blue)' }} />
                        Section-wise breakdown
                      </h4>
                      <DonutChart data={sectionBreakdownChartData()} />
                    </div>

                    <div style={{ backgroundColor: '#ffffff', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' }}>
                      <h4 style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Activity size={16} style={{ color: 'var(--primary-blue)' }} />
                        Next Steps
                      </h4>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
                        Your assessment responses and compiling analysis logs have been synced to the Presidio Talent Recruitment database. The Talent Acquisition panel will review your codes and scorecards for interview shortlist scheduling.
                      </p>
                      
                      <div style={{
                        marginTop: '16px',
                        backgroundColor: 'rgba(34, 197, 94, 0.08)',
                        border: '1px solid rgba(34, 197, 94, 0.15)',
                        borderRadius: '8px',
                        padding: '12px',
                        fontSize: '0.8rem',
                        color: 'var(--success)',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <Award size={16} />
                        Eligible for shortlisting shortlist parameters check!
                      </div>
                    </div>
                  </div>
                )}

                <button className="btn btn-primary" onClick={logout} style={{ marginTop: '28px', padding: '10px 32px' }}>
                  Sign Out of Portal
                </button>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
