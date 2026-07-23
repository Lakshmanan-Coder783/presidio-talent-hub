import React, { createContext, useContext, useState, useEffect } from 'react';
import { getDatabase, saveDatabase } from '../utils/db';
import type { Database } from '../utils/db';
import type { Assessment, CampusDrive, Candidate, CollegeStudent, Question, Interview, Offer, User, DriveRole } from '../types';
import type { ParsedStudentRow } from '../utils/parseStudentFile';
import { generateAccessPassword } from '../lib/utils';
import { canEditDriveConfig, canManageMembership, canReleaseOffer, canAdvanceCandidate } from '../utils/permissions';

interface UserSession {
  role: 'admin' | 'candidate';
  id?: string; // Candidate ID if candidate; User ID if admin
  candidate?: Candidate;
  user?: User; // populated when role === 'admin'
}

const parseUserAgent = (): { browser: string; os: string } => {
  const ua = navigator.userAgent;
  let browser = 'Unknown Browser';
  if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Safari/') && !ua.includes('Chrome')) browser = 'Safari';

  let os = 'Unknown OS';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS X')) os = 'macOS';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Linux')) os = 'Linux';

  return { browser, os };
};

interface AppContextType {
  db: Database;
  currentUser: UserSession | null;
  loginAdmin: (userId: string) => Promise<void>;
  loginCandidate: (id: string, pass: string) => { success: boolean; message: string };
  logout: () => void;
  createDrive: (driveData: Omit<CampusDrive, 'id' | 'registered' | 'selected'>, initialSpocUserId?: string) => CampusDrive | undefined;
  updateDrive: (drive: CampusDrive) => void;
  deleteDrive: (driveId: string) => void;
  updateCandidate: (candidate: Candidate) => void;
  bulkUpdateCandidates: (updates: Candidate[]) => void;
  createQuestion: (question: Omit<Question, 'id'>) => void;
  createInterview: (interview: Omit<Interview, 'id'>) => void;
  updateOfferStatus: (candidateId: string, status: Candidate['offerStatus']) => void;
  submitCandidateAssessment: (
    candidateId: string,
    assessmentId: string,
    answers: { [qId: string]: string | number[] | number },
    durationUsed: number,
    proctoring?: { windowViolationCount?: number; imageViolationCount?: number; proctoringTerminated?: boolean }
  ) => void;
  bulkInvite: (assessmentId: string, date: string, driveId: string) => void;
  createAssessment: (data: Omit<Assessment, 'id' | 'candidatesAssignedCount'>) => Assessment;
  createAssessmentForDrive: (
    driveId: string,
    data: Omit<Assessment, 'id' | 'candidatesAssignedCount'>,
    driveQuestionIds: string[]
  ) => Assessment;
  updateAssessment: (assessment: Assessment) => void;
  updateQuestion: (id: string, updates: Partial<Omit<Question, 'id'>>) => void;
  loginCandidateByTestSlug: (slug: string, candidateId: string, password: string) => { success: boolean; message: string };
  bulkImportCandidates: (driveId: string, rows: Omit<Candidate, 'id' | 'assessmentStatus' | 'interviewStatus' | 'offerStatus' | 'funnelStage'>[]) => number;
  sendRemoteInvites: (driveId: string) => number;
  markAttendance: (candidateId: string, present: boolean) => void;
  importCollegeStudents: (college: string, rows: ParsedStudentRow[]) => number;
  deleteCollegeStudents: (college: string) => void;
  addDriveMembership: (driveId: string, userId: string, role: DriveRole) => void;
  removeDriveMembership: (membershipId: string) => void;
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

  const loginAdmin = async (userId: string) => {
    // Simulates an async Microsoft Entra ID authentication delay
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        const user = db.users.find(u => u.id === userId);
        if (!user) {
          reject(new Error('Unknown user'));
          return;
        }
        const session: UserSession = { role: 'admin', id: user.id, user };
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

  // Optionally grants an initial SPOC membership in the same update as the
  // drive creation itself — doing this as two separate mutator calls would
  // have the second call's setDb/saveDatabase overwrite the first (each
  // reads the same pre-update `db` closure), silently losing the new drive.
  const createDrive = (
    driveData: Omit<CampusDrive, 'id' | 'registered' | 'selected'>,
    initialSpocUserId?: string,
  ): CampusDrive | undefined => {
    if (!canEditDriveConfig(currentUser?.user)) return undefined;
    const newDrive: CampusDrive = {
      ...driveData,
      id: `DRV-2026-${100 + db.drives.length + 1}`,
      registered: 0,
      selected: 0
    };
    const driveMemberships = initialSpocUserId
      ? [...db.driveMemberships, {
          id: `MEM-${db.driveMemberships.length + 1}-${Date.now()}`,
          driveId: newDrive.id,
          userId: initialSpocUserId,
          role: 'SPOC' as const,
          addedAt: new Date().toISOString(),
          addedByUserId: currentUser?.user?.id ?? '',
        }]
      : db.driveMemberships;
    const updatedDb = { ...db, drives: [newDrive, ...db.drives], driveMemberships };
    setDb(updatedDb);
    saveDatabase(updatedDb);
    return newDrive;
  };

  const updateDrive = (updatedDrive: CampusDrive) => {
    if (!canEditDriveConfig(currentUser?.user)) return;
    const updatedDrives = db.drives.map(d => d.id === updatedDrive.id ? updatedDrive : d);
    const updatedDb = { ...db, drives: updatedDrives };
    setDb(updatedDb);
    saveDatabase(updatedDb);
  };

  const deleteDrive = (driveId: string) => {
    if (!canEditDriveConfig(currentUser?.user)) return;
    const updatedDb = {
      ...db,
      drives: db.drives.filter(d => d.id !== driveId),
      candidates: db.candidates.filter(c => c.driveId !== driveId),
    };
    setDb(updatedDb);
    saveDatabase(updatedDb);
  };

  const updateCandidate = (updatedCandidate: Candidate) => {
    const updatedCandidates = db.candidates.map(c => c.id === updatedCandidate.id ? updatedCandidate : c);
    const updatedDb = { ...db, candidates: updatedCandidates };
    setDb(updatedDb);
    saveDatabase(updatedDb);
  };

  const bulkUpdateCandidates = (updates: Candidate[]) => {
    const map = new Map(updates.map(c => [c.id, c]));
    const updatedCandidates = db.candidates.map(c => map.get(c.id) ?? c);
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
    if (intData.stage === 'Whiteboard Interview') {
      const targetCandidate = db.candidates.find(c => c.id === intData.candidateId);
      if (!targetCandidate || !canAdvanceCandidate(currentUser?.user, targetCandidate.driveId, 'Whiteboard Interview', db)) return;
    }
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
    const targetCandidate = db.candidates.find(c => c.id === candidateId);
    if (!targetCandidate || !canReleaseOffer(currentUser?.user, targetCandidate.driveId, db)) return;
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
    durationUsed: number,
    proctoring?: { windowViolationCount?: number; imageViolationCount?: number; proctoringTerminated?: boolean }
  ) => {
    const candidate = db.candidates.find(c => c.id === candidateId);
    const assessment = db.assessments.find(a => a.id === assessmentId);
    if (!candidate || !assessment) return;

    // The drive's questionIds (managed in the Questions tab) are the source of
    // truth for what's actually attached to the test; assessment.questionIds
    // is set once at creation and isn't kept in sync with later edits.
    const drive = db.drives.find(d => d.id === candidate.driveId);
    const questionIds = drive?.questionIds ?? assessment.questionIds;

    let score = 0;
    const scoresBreakdown = { aptitude: 0, logical: 0, technical: 0, coding: 0, verbal: 0, quants: 0, cpp: 0, oops: 0, sql: 0, htmlcssjs: 0, subjective: 0, sqlQuery: 0 };

    questionIds.forEach(qId => {
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

    const { browser, os } = parseUserAgent();
    const updatedCandidates = db.candidates.map(c => {
      if (c.id === candidateId) {
        return {
          ...c,
          assessmentStatus: 'Completed' as const,
          assessmentScore: score,
          assessmentDurationUsed: durationUsed,
          assessmentSubmissionDate: new Date().toISOString(),
          sectionScores: scoresBreakdown,
          funnelStage: 'Online Test' as const, // Ensure funnel updates
          deviceBrowser: browser,
          deviceOS: os,
          windowViolationCount: proctoring?.windowViolationCount,
          imageViolationCount: proctoring?.imageViolationCount,
          proctoringTerminated: proctoring?.proctoringTerminated,
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

  // Atomically creates a new assessment AND links it (+ its question list) to
  // the drive in a single db update, since two separate update calls in the
  // same tick would each overwrite the other's change (both read the same
  // pre-update `db` closure).
  const createAssessmentForDrive = (
    driveId: string,
    data: Omit<Assessment, 'id' | 'candidatesAssignedCount'>,
    driveQuestionIds: string[]
  ): Assessment => {
    const newAsm: Assessment = {
      ...data,
      id: `ASM-${2000 + db.assessments.length + 1}`,
      candidatesAssignedCount: 0,
    };
    const updatedDrives = db.drives.map(d =>
      d.id === driveId ? { ...d, assessmentId: newAsm.id, questionIds: driveQuestionIds } : d
    );
    const updatedDb = { ...db, assessments: [newAsm, ...db.assessments], drives: updatedDrives };
    setDb(updatedDb);
    saveDatabase(updatedDb);
    return newAsm;
  };

  // Returns an error message if `now` falls outside the drive's configured exam date/time
  // window, or null if there's no window set (or it's currently within range).
  const checkExamWindow = (drive: CampusDrive): string | null => {
    if (!drive.examDate || !drive.examStartTime || !drive.examEndTime) return null;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    if (todayStr !== drive.examDate) return `Test is only accessible on ${drive.examDate}.`;
    const [sh, sm] = drive.examStartTime.split(':').map(Number);
    const [eh, em] = drive.examEndTime.split(':').map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    const nowMin = now.getHours() * 60 + now.getMinutes();
    if (nowMin < startMin) return `Test window opens at ${drive.examStartTime}.`;
    if (nowMin > endMin) return `Test window closed at ${drive.examEndTime}.`;
    return null;
  };

  const loginCandidateByTestSlug = (slug: string, email: string, password: string) => {
    const asm = db.assessments.find(a => a.slug === slug);
    if (!asm) return { success: false, message: 'Test not found. Check the URL.' };
    if (asm.status !== 'Active') return { success: false, message: 'This test is not currently active.' };

    const normalizedEmail = email.trim().toLowerCase();
    const candidate = db.candidates.find(
      c => c.email.trim().toLowerCase() === normalizedEmail && c.assessmentId === asm.id
    );
    if (!candidate) return { success: false, message: 'Invalid email or you are not registered for this test.' };
    if (candidate.assessmentStatus === 'Completed') return { success: false, message: 'Assessment already completed.' };

    // Determine drive access mode to decide which password to validate
    const drive = db.drives.find(d => d.assessmentId === asm.id);
    const isRemote = drive?.accessMode === 'remote';

    if (isRemote) {
      // Remote drive: validate against the candidate's individual password
      if (candidate.assessmentPassword !== password) {
        return { success: false, message: 'Incorrect password.' };
      }
      // Remote: only enforce the exam time window when explicitly scheduled
      if (drive?.experienceSettings?.testWindow === 'scheduled') {
        const windowError = checkExamWindow(drive);
        if (windowError) return { success: false, message: windowError };
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
      if (drive) {
        const windowError = checkExamWindow(drive);
        if (windowError) return { success: false, message: windowError };
      }
    }

    const session: UserSession = { role: 'candidate', id: candidate.id, candidate };
    setCurrentUser(session);
    localStorage.setItem('presidio_session', JSON.stringify(session));

    const updatedCandidates = db.candidates.map(c =>
      c.id === candidate.id ? { ...c, assessmentStatus: 'InProgress' as const } : c
    );
    const updatedDb = { ...db, candidates: updatedCandidates };
    setDb(updatedDb);
    saveDatabase(updatedDb);

    return { success: true, message: 'Login successful.' };
  };

  const bulkInvite = (assessmentId: string, date: string, driveId: string) => {
    const updatedCandidates = db.candidates.map(c => {
      if (c.driveId === driveId && c.assessmentStatus === 'Not Invited') {
        return {
          ...c,
          assessmentStatus: 'Pending' as const,
          assessmentId,
          assessmentPassword: `PRES${Math.floor(1000 + Math.random() * 9000)}`
        };
      }
      return c;
    });

    const updatedAssessments = db.assessments.map(asm => {
      if (asm.id === assessmentId) {
        const count = updatedCandidates.filter(c => c.assessmentId === assessmentId).length;
        return { ...asm, candidatesAssignedCount: count };
      }
      return asm;
    });

    const updatedDrives = db.drives.map(d =>
      d.id === driveId ? { ...d, assessmentId, examDate: date } : d
    );
    const updatedDb = { ...db, candidates: updatedCandidates, assessments: updatedAssessments, drives: updatedDrives };
    setDb(updatedDb);
    saveDatabase(updatedDb);
  };

  const bulkImportCandidates = (
    driveId: string,
    rows: Omit<Candidate, 'id' | 'assessmentStatus' | 'interviewStatus' | 'offerStatus' | 'funnelStage' | 'driveId'>[]
  ): number => {
    const drive = db.drives.find(d => d.id === driveId);
    if (!drive) return 0;

    const existing = new Set(
      db.candidates.filter(c => c.driveId === driveId).map(c => c.email.toLowerCase())
    );
    const newCandidates: Candidate[] = [];

    rows.forEach((row, idx) => {
      if (existing.has(row.email.toLowerCase())) return; // skip duplicates within this drive
      newCandidates.push({
        ...row,
        id: `PRES2026-${20000 + db.candidates.length + idx + 1}`,
        driveId: drive.id,
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

  // Assigns each un-invited remote candidate their own login credentials
  // (assessmentId + individual password) and stamps the invite as sent.
  const sendRemoteInvites = (driveId: string): number => {
    const drive = db.drives.find(d => d.id === driveId);
    if (!drive || drive.accessMode !== 'remote' || !drive.assessmentId) return 0;

    const now = new Date().toISOString();
    let count = 0;

    const updatedCandidates = db.candidates.map(c => {
      if (c.driveId === driveId && c.assessmentStatus === 'Not Invited') {
        count++;
        return {
          ...c,
          assessmentStatus: 'Pending' as const,
          assessmentId: drive.assessmentId,
          assessmentPassword: generateAccessPassword(),
          inviteEmailSentAt: now,
        };
      }
      return c;
    });

    if (count === 0) return 0;

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

  const importCollegeStudents = (college: string, rows: ParsedStudentRow[]): number => {
    const existing = new Set(
      (db.collegeStudents ?? [])
        .filter(s => s.college === college)
        .map(s => s.email.toLowerCase())
    );
    const now = new Date().toISOString();
    const newStudents: CollegeStudent[] = [];

    rows.forEach((row, idx) => {
      if (!row.email || existing.has(row.email.toLowerCase())) return;
      const prefix = college.replace(/\s+/g, '').slice(0, 6).toUpperCase();
      newStudents.push({
        ...row,
        id: `CS-${prefix}-${Date.now()}-${idx}`,
        college,
        importedAt: now,
      });
    });

    if (newStudents.length === 0) return 0;
    const updatedDb = { ...db, collegeStudents: [...(db.collegeStudents ?? []), ...newStudents] };
    setDb(updatedDb);
    saveDatabase(updatedDb);
    return newStudents.length;
  };

  const deleteCollegeStudents = (college: string) => {
    const updatedDb = {
      ...db,
      collegeStudents: (db.collegeStudents ?? []).filter(s => s.college !== college),
    };
    setDb(updatedDb);
    saveDatabase(updatedDb);
  };

  const addDriveMembership = (driveId: string, userId: string, role: DriveRole) => {
    if (!canManageMembership(currentUser?.user, driveId, role, db)) return;
    const alreadyMember = db.driveMemberships.some(m => m.driveId === driveId && m.userId === userId && m.role === role);
    if (alreadyMember) return;
    const newMembership = {
      id: `MEM-${db.driveMemberships.length + 1}-${Date.now()}`,
      driveId,
      userId,
      role,
      addedAt: new Date().toISOString(),
      addedByUserId: currentUser?.user?.id ?? '',
    };
    const updatedDb = { ...db, driveMemberships: [...db.driveMemberships, newMembership] };
    setDb(updatedDb);
    saveDatabase(updatedDb);
  };

  const removeDriveMembership = (membershipId: string) => {
    const membership = db.driveMemberships.find(m => m.id === membershipId);
    if (!membership || !canManageMembership(currentUser?.user, membership.driveId, membership.role, db)) return;
    // Removal only revokes future access — it never touches the candidate records
    // this person already scored/decided on, so historical attribution is preserved.
    const updatedDb = { ...db, driveMemberships: db.driveMemberships.filter(m => m.id !== membershipId) };
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
      deleteDrive,
      updateCandidate,
      createQuestion,
      createInterview,
      updateOfferStatus,
      submitCandidateAssessment,
      bulkInvite,
      createAssessment,
      createAssessmentForDrive,
      updateAssessment,
      updateQuestion,
      loginCandidateByTestSlug,
      bulkImportCandidates,
      sendRemoteInvites,
      markAttendance,
      bulkUpdateCandidates,
      importCollegeStudents,
      deleteCollegeStudents,
      addDriveMembership,
      removeDriveMembership,
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
