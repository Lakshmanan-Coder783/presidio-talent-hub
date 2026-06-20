import React, { createContext, useContext, useState, useEffect } from 'react';
import { getDatabase, saveDatabase } from '../utils/db';
import type { Database } from '../utils/db';
import type { Assessment, CampusDrive, Candidate, Question, Interview, Offer } from '../types';

interface UserSession {
  role: 'admin' | 'candidate';
  id?: string; // Candidate ID if candidate
  candidate?: Candidate;
}

interface AppContextType {
  db: Database;
  currentUser: UserSession | null;
  loginAdmin: () => Promise<void>;
  loginCandidate: (id: string, pass: string) => { success: boolean; message: string };
  logout: () => void;
  createDrive: (driveData: Omit<CampusDrive, 'id' | 'registered' | 'selected'>) => void;
  updateDrive: (drive: CampusDrive) => void;
  updateCandidate: (candidate: Candidate) => void;
  createQuestion: (question: Omit<Question, 'id'>) => void;
  createInterview: (interview: Omit<Interview, 'id'>) => void;
  updateOfferStatus: (candidateId: string, status: Candidate['offerStatus']) => void;
  submitCandidateAssessment: (
    candidateId: string,
    assessmentId: string,
    answers: { [qId: string]: string | number[] | number },
    durationUsed: number
  ) => void;
  bulkInvite: (assessmentId: string, date: string, college: string) => void;
  createAssessment: (data: Omit<Assessment, 'id' | 'candidatesAssignedCount'>) => Assessment;
  updateAssessment: (assessment: Assessment) => void;
  updateQuestion: (id: string, updates: Partial<Omit<Question, 'id'>>) => void;
  loginCandidateByTestSlug: (slug: string, candidateId: string, password: string) => { success: boolean; message: string };
  bulkImportCandidates: (driveId: string, rows: Omit<Candidate, 'id' | 'assessmentStatus' | 'interviewStatus' | 'offerStatus' | 'funnelStage'>[]) => number;
  sendRemoteInvites: (driveId: string) => number;
  markAttendance: (candidateId: string, present: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [db, setDb] = useState<Database>(getDatabase());
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    const session = localStorage.getItem('presidio_session');
    return session ? JSON.parse(session) : null;
  });

  // Listen to cross-tab/window database updates
  useEffect(() => {
    const handleDbUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<Database>;
      setDb(customEvent.detail);
    };
    window.addEventListener('presidio-db-updated', handleDbUpdate);
    return () => window.removeEventListener('presidio-db-updated', handleDbUpdate);
  }, []);

  const loginAdmin = async () => {
    // Simulates an async Microsoft Entra ID authentication delay
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const session: UserSession = { role: 'admin' };
        setCurrentUser(session);
        localStorage.setItem('presidio_session', JSON.stringify(session));
        resolve();
      }, 1500);
    });
  };

  const loginCandidate = (id: string, pass: string) => {
    const candidate = db.candidates.find(c => c.id === id);
    if (!candidate) {
      return { success: false, message: 'Invalid Candidate ID.' };
    }
    if (candidate.assessmentPassword !== pass) {
      return { success: false, message: 'Incorrect password.' };
    }
    if (candidate.assessmentStatus === 'Completed') {
      return { success: false, message: 'Assessment already completed.' };
    }

    // Get assigned assessment
    const asm = db.assessments.find(a => a.id === candidate.assessmentId);
    if (!asm || asm.status !== 'Active') {
      return { success: false, message: 'No active assessment assigned.' };
    }

    const session: UserSession = { role: 'candidate', id, candidate };
    setCurrentUser(session);
    localStorage.setItem('presidio_session', JSON.stringify(session));

    // Mark candidate as InProgress in database
    const updatedCandidates = db.candidates.map(c => 
      c.id === id ? { ...c, assessmentStatus: 'InProgress' as const } : c
    );
    const updatedDb = { ...db, candidates: updatedCandidates };
    setDb(updatedDb);
    saveDatabase(updatedDb);

    return { success: true, message: 'Login successful.' };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('presidio_session');
  };

  const createDrive = (driveData: Omit<CampusDrive, 'id' | 'registered' | 'selected'>) => {
    const newDrive: CampusDrive = {
      ...driveData,
      id: `DRV-2026-${100 + db.drives.length + 1}`,
      registered: 0,
      selected: 0
    };
    const updatedDb = { ...db, drives: [newDrive, ...db.drives] };
    setDb(updatedDb);
    saveDatabase(updatedDb);
  };

  const updateDrive = (updatedDrive: CampusDrive) => {
    const updatedDrives = db.drives.map(d => d.id === updatedDrive.id ? updatedDrive : d);
    const updatedDb = { ...db, drives: updatedDrives };
    setDb(updatedDb);
    saveDatabase(updatedDb);
  };

  const updateCandidate = (updatedCandidate: Candidate) => {
    const updatedCandidates = db.candidates.map(c => c.id === updatedCandidate.id ? updatedCandidate : c);
    const updatedDb = { ...db, candidates: updatedCandidates };
    setDb(updatedDb);
    saveDatabase(updatedDb);
  };

  const createQuestion = (qData: Omit<Question, 'id'>) => {
    const newQ: Question = {
      ...qData,
      id: `Q-${1000 + db.questions.length + 1}`
    };
    const updatedDb = { ...db, questions: [...db.questions, newQ] };
    setDb(updatedDb);
    saveDatabase(updatedDb);
  };

  const createInterview = (intData: Omit<Interview, 'id'>) => {
    const newInt: Interview = {
      ...intData,
      id: `INT-2026-${1000 + db.interviews.length + 1}`
    };
    const updatedCandidates = db.candidates.map(c => {
      if (c.id === intData.candidateId) {
        let nextStage = c.funnelStage;
        if (intData.stage === 'Interview') nextStage = 'Interview';
        else if (intData.stage === 'Coding Exercise') nextStage = 'Coding Exercise';
        else if (intData.stage === 'Whiteboard Interview') nextStage = 'Whiteboard Interview';

        return {
          ...c,
          interviewStatus: 'Scheduled' as const,
          funnelStage: nextStage
        };
      }
      return c;
    });

    const updatedDb = { ...db, interviews: [newInt, ...db.interviews], candidates: updatedCandidates };
    setDb(updatedDb);
    saveDatabase(updatedDb);
  };

  const updateOfferStatus = (candidateId: string, status: Candidate['offerStatus']) => {
    const updatedCandidates = db.candidates.map(c => {
      if (c.id === candidateId) {
        let stage: Candidate['funnelStage'] = c.funnelStage;
        if (status === 'Offered') stage = 'Offered';
        if (status === 'Joined') stage = 'Joined';
        return {
          ...c,
          offerStatus: status,
          funnelStage: stage
        };
      }
      return c;
    });

    // Handle Offers list
    let updatedOffers = [...db.offers];
    const existingOffer = db.offers.find(o => o.candidateId === candidateId);
    const candidate = db.candidates.find(c => c.id === candidateId);

    if (candidate) {
      if (status !== 'None') {
        if (existingOffer) {
          updatedOffers = db.offers.map(o => o.candidateId === candidateId ? { ...o, status: status as Offer['status'] } : o);
        } else {
          updatedOffers.unshift({
            id: `OFF-2026-${200 + db.offers.length + 1}`,
            candidateId,
            candidateName: candidate.name,
            college: candidate.college,
            ctc: 8.5, // Default LPA
            status: status as Offer['status'],
            dateReleased: new Date().toISOString().split('T')[0]
          });
        }
      } else {
        updatedOffers = db.offers.filter(o => o.candidateId !== candidateId);
      }
    }

    const updatedDb = { ...db, candidates: updatedCandidates, offers: updatedOffers };
    setDb(updatedDb);
    saveDatabase(updatedDb);
  };

  const submitCandidateAssessment = (
    candidateId: string,
    assessmentId: string,
    answers: { [qId: string]: string | number[] | number },
    durationUsed: number
  ) => {
    const candidate = db.candidates.find(c => c.id === candidateId);
    const assessment = db.assessments.find(a => a.id === assessmentId);
    if (!candidate || !assessment) return;

    let score = 0;
    const scoresBreakdown = { aptitude: 0, logical: 0, technical: 0, coding: 0, verbal: 0, quants: 0, cpp: 0, oops: 0, sql: 0, htmlcssjs: 0, subjective: 0, sqlQuery: 0 };

    assessment.questionIds.forEach(qId => {
      const question = db.questions.find(q => q.id === qId);
      if (!question) return;

      const ans = answers[qId];
      let isCorrect = false;

      if (question.type === 'MCQ') {
        // MCQ answer is index (number)
        isCorrect = ans !== undefined && question.correctOptions !== undefined && question.correctOptions[0] === Number(ans);
      } else if (question.type === 'Multiple Select') {
        // Multiple choice answers is list of indices
        const userAnswers = Array.isArray(ans) ? ans : [];
        const correctAnswers = question.correctOptions || [];
        isCorrect = userAnswers.length === correctAnswers.length && 
                    userAnswers.every(v => correctAnswers.includes(v));
      } else if (question.type === 'Coding') {
        // Coding questions evaluate as correct on submit
        isCorrect = ans !== undefined && String(ans).trim().length > 10; // Basic check
      } else if (question.type === 'SQL') {
        isCorrect = ans !== undefined && String(ans).toLowerCase().includes('select');
      }

      if (isCorrect) {
        score += question.marks;
        const topic = question.topic;
        if (topic === 'Aptitude') scoresBreakdown.aptitude += question.marks;
        else if (topic === 'Logical Reasoning' || topic === 'Logical') scoresBreakdown.logical += question.marks;
        else if (topic === 'Technical') scoresBreakdown.technical += question.marks;
        else if (topic === 'Coding') scoresBreakdown.coding += question.marks;
        else if (topic === 'Verbal') scoresBreakdown.verbal += question.marks;
        else if (topic === 'Quants') scoresBreakdown.quants += question.marks;
        else if (topic === 'C/C++') scoresBreakdown.cpp += question.marks;
        else if (topic === 'OOPs') scoresBreakdown.oops += question.marks;
        else if (topic === 'SQL') scoresBreakdown.sql += question.marks;
        else if (topic === 'HTML/CSS/JS') scoresBreakdown.htmlcssjs += question.marks;
        else if (topic === 'Subjective') scoresBreakdown.subjective += question.marks;
        else if (topic === 'SQL Query') scoresBreakdown.sqlQuery += question.marks;
      }
    });

    const updatedCandidates = db.candidates.map(c => {
      if (c.id === candidateId) {
        return {
          ...c,
          assessmentStatus: 'Completed' as const,
          assessmentScore: score,
          assessmentDurationUsed: durationUsed,
          assessmentSubmissionDate: new Date().toISOString(),
          sectionScores: scoresBreakdown,
          funnelStage: 'Online Test' as const // Ensure funnel updates
        };
      }
      return c;
    });

    // Re-evaluate ranks & percentiles for this assessment
    const assessmentCandidates = updatedCandidates.filter(c => c.assessmentId === assessmentId && c.assessmentStatus === 'Completed');
    assessmentCandidates.sort((a, b) => (b.assessmentScore || 0) - (a.assessmentScore || 0));
    
    assessmentCandidates.forEach((c, idx) => {
      c.assessmentRank = idx + 1;
      const count = assessmentCandidates.length;
      c.assessmentPercentile = count > 1 
        ? parseFloat((((count - (idx + 1)) / (count - 1)) * 100).toFixed(1))
        : 100.0;
    });

    // Merge recalculated candidates back to list
    const finalCandidates = updatedCandidates.map(c => {
      const ranked = assessmentCandidates.find(rc => rc.id === c.id);
      return ranked ? ranked : c;
    });

    const updatedDb = { ...db, candidates: finalCandidates };
    setDb(updatedDb);
    saveDatabase(updatedDb);

    // If candidate logged in, update current session
    if (currentUser && currentUser.id === candidateId) {
      const selfUpdated = finalCandidates.find(c => c.id === candidateId);
      if (selfUpdated) {
        const updatedSession = { ...currentUser, candidate: selfUpdated };
        setCurrentUser(updatedSession);
        localStorage.setItem('presidio_session', JSON.stringify(updatedSession));
      }
    }
  };

  const updateAssessment = (updated: Assessment) => {
    const updatedAssessments = db.assessments.map(a => a.id === updated.id ? updated : a);
    const updatedDb = { ...db, assessments: updatedAssessments };
    setDb(updatedDb);
    saveDatabase(updatedDb);
  };

  const updateQuestion = (id: string, updates: Partial<Omit<Question, 'id'>>) => {
    const updatedDb = {
      ...db,
      questions: db.questions.map(q => q.id === id ? { ...q, ...updates } : q),
    };
    setDb(updatedDb);
    saveDatabase(updatedDb);
  };

  const createAssessment = (data: Omit<Assessment, 'id' | 'candidatesAssignedCount'>): Assessment => {
    const newAsm: Assessment = {
      ...data,
      id: `ASM-${2000 + db.assessments.length + 1}`,
      candidatesAssignedCount: 0,
    };
    const updatedDb = { ...db, assessments: [newAsm, ...db.assessments] };
    setDb(updatedDb);
    saveDatabase(updatedDb);
    return newAsm;
  };

  const loginCandidateByTestSlug = (slug: string, candidateId: string, password: string) => {
    const asm = db.assessments.find(a => a.slug === slug);
    if (!asm) return { success: false, message: 'Test not found. Check the URL.' };
    if (asm.status !== 'Active') return { success: false, message: 'This test is not currently active.' };

    const candidate = db.candidates.find(c => c.id === candidateId);
    if (!candidate) return { success: false, message: 'Invalid Candidate ID.' };
    if (candidate.assessmentId !== asm.id) return { success: false, message: 'You are not registered for this test.' };
    if (candidate.assessmentStatus === 'Completed') return { success: false, message: 'Assessment already completed.' };

    // Determine drive access mode to decide which password to validate
    const drive = db.drives.find(d => d.assessmentId === asm.id);
    const isRemote = drive?.accessMode === 'remote';

    if (isRemote) {
      // Remote drive: validate against the candidate's individual password
      if (candidate.assessmentPassword !== password) {
        return { success: false, message: 'Incorrect password.' };
      }
    } else {
      // In-person drive: validate against the shared test password
      if (asm.accessPassword !== password) {
        return { success: false, message: 'Incorrect test password.' };
      }
      // In-person: check attendance if it has been enabled for this drive
      const attendanceUsed = db.candidates.some(c => c.college === candidate.college && c.attendanceMarked !== undefined);
      if (attendanceUsed && !candidate.attendanceMarked) {
        return { success: false, message: 'You are not marked as present for this test. Please contact your coordinator.' };
      }
      // In-person: check exam time window if drive has one set
      if (drive?.examDate && drive?.examStartTime && drive?.examEndTime) {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        if (todayStr !== drive.examDate) {
          return { success: false, message: `Test is only accessible on ${drive.examDate}.` };
        }
        const [sh, sm] = drive.examStartTime.split(':').map(Number);
        const [eh, em] = drive.examEndTime.split(':').map(Number);
        const startMin = sh * 60 + sm;
        const endMin = eh * 60 + em;
        const nowMin = now.getHours() * 60 + now.getMinutes();
        if (nowMin < startMin) {
          return { success: false, message: `Test window opens at ${drive.examStartTime}.` };
        }
        if (nowMin > endMin) {
          return { success: false, message: `Test window closed at ${drive.examEndTime}.` };
        }
      }
    }

    const session: UserSession = { role: 'candidate', id: candidateId, candidate };
    setCurrentUser(session);
    localStorage.setItem('presidio_session', JSON.stringify(session));

    const updatedCandidates = db.candidates.map(c =>
      c.id === candidateId ? { ...c, assessmentStatus: 'InProgress' as const } : c
    );
    const updatedDb = { ...db, candidates: updatedCandidates };
    setDb(updatedDb);
    saveDatabase(updatedDb);

    return { success: true, message: 'Login successful.' };
  };

  const bulkInvite = (assessmentId: string, date: string, college: string) => {
    console.log(`Scheduling bulk assessment for ${college} on ${date}`);
    // Invites all "Not Invited" candidates from the specific college to take the assessment
    const updatedCandidates = db.candidates.map(c => {
      if (c.college === college && c.assessmentStatus === 'Not Invited') {
        return {
          ...c,
          assessmentStatus: 'Pending' as const,
          assessmentId,
          assessmentPassword: `PRES${Math.floor(1000 + Math.random() * 9000)}`
        };
      }
      return c;
    });

    // Re-compute assigned count
    const updatedAssessments = db.assessments.map(asm => {
      if (asm.id === assessmentId) {
        const count = updatedCandidates.filter(c => c.assessmentId === assessmentId).length;
        return { ...asm, candidatesAssignedCount: count };
      }
      return asm;
    });

    const updatedDrives = db.drives.map(d =>
      d.college === college ? { ...d, assessmentId, examDate: date } : d
    );
    const updatedDb = { ...db, candidates: updatedCandidates, assessments: updatedAssessments, drives: updatedDrives };
    setDb(updatedDb);
    saveDatabase(updatedDb);
  };

  const bulkImportCandidates = (
    driveId: string,
    rows: Omit<Candidate, 'id' | 'assessmentStatus' | 'interviewStatus' | 'offerStatus' | 'funnelStage'>[]
  ): number => {
    const drive = db.drives.find(d => d.id === driveId);
    if (!drive) return 0;

    const existing = new Set(db.candidates.map(c => c.email.toLowerCase()));
    const newCandidates: Candidate[] = [];

    rows.forEach((row, idx) => {
      if (existing.has(row.email.toLowerCase())) return; // skip duplicates
      newCandidates.push({
        ...row,
        id: `PRES2026-${20000 + db.candidates.length + idx + 1}`,
        college: drive.college,
        assessmentStatus: 'Not Invited',
        interviewStatus: 'Not Scheduled',
        offerStatus: 'None',
        funnelStage: 'Applied',
      });
    });

    if (newCandidates.length === 0) return 0;

    const updatedDb = { ...db, candidates: [...db.candidates, ...newCandidates] };
    setDb(updatedDb);
    saveDatabase(updatedDb);
    return newCandidates.length;
  };

  const sendRemoteInvites = (driveId: string): number => {
    const drive = db.drives.find(d => d.id === driveId);
    if (!drive || drive.accessMode !== 'remote') return 0;

    const now = new Date().toISOString();
    let count = 0;

    const updatedCandidates = db.candidates.map(c => {
      if (c.college === drive.college && c.assessmentStatus === 'Pending' && !c.inviteEmailSentAt) {
        count++;
        return { ...c, inviteEmailSentAt: now };
      }
      return c;
    });

    const updatedDb = { ...db, candidates: updatedCandidates };
    setDb(updatedDb);
    saveDatabase(updatedDb);
    return count;
  };

  const markAttendance = (candidateId: string, present: boolean) => {
    const updatedCandidates = db.candidates.map(c =>
      c.id === candidateId ? { ...c, attendanceMarked: present } : c
    );
    const updatedDb = { ...db, candidates: updatedCandidates };
    setDb(updatedDb);
    saveDatabase(updatedDb);
  };

  return (
    <AppContext.Provider value={{
      db,
      currentUser,
      loginAdmin,
      loginCandidate,
      logout,
      createDrive,
      updateDrive,
      updateCandidate,
      createQuestion,
      createInterview,
      updateOfferStatus,
      submitCandidateAssessment,
      bulkInvite,
      createAssessment,
      updateAssessment,
      updateQuestion,
      loginCandidateByTestSlug,
      bulkImportCandidates,
      sendRemoteInvites,
      markAttendance,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
