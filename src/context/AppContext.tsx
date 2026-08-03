import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { saveDatabase } from '../utils/db';
import type { Database } from '../utils/db';
import type { Assessment, CampusDrive, Candidate, Question, Interview, User, DriveRole, DriveMembership } from '../types';
import type { ParsedStudentRow } from '../utils/parseStudentFile';
import { canEditDriveConfig, canCreateDrive, canManageMembership, canReleaseOffer, canAdvanceCandidate } from '../utils/permissions';

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
  ensureLoaded: (fields: (keyof Database)[], opts?: { force?: boolean }) => void;
  loadCampusDrivePage: () => void;
  loadDashboardPage: () => void;
  loadCollegeReportPage: () => void;
  currentUser: UserSession | null;
  loginAdmin: (userId: string) => Promise<void>;
  loginCandidate: (id: string, pass: string) => { success: boolean; message: string };
  logout: () => void;
  createDrive: (driveData: Omit<CampusDrive, 'id' | 'registered' | 'selected' | 'createdAt'>, initialSpocUserId?: string) => Promise<CampusDrive | undefined>;
  updateDrive: (drive: CampusDrive) => void;
  deleteDrive: (driveId: string) => void;
  restoreDrive: (driveId: string) => void;
  permanentlyDeleteDrive: (driveId: string) => void;
  updateCandidate: (candidate: Candidate) => void;
  bulkUpdateCandidates: (updates: Candidate[]) => void;
  createQuestion: (question: Omit<Question, 'id'>) => void;
  bulkImportQuestions: (rows: Omit<Question, 'id'>[]) => Promise<number>;
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
  createAssessment: (data: Omit<Assessment, 'id' | 'candidatesAssignedCount'>) => Promise<Assessment | undefined>;
  createAssessmentForDrive: (
    driveId: string,
    data: Omit<Assessment, 'id' | 'candidatesAssignedCount'>,
    driveQuestionIds: string[]
  ) => Promise<Assessment | undefined>;
  updateAssessment: (assessment: Assessment) => void;
  updateQuestion: (id: string, updates: Partial<Omit<Question, 'id'>>) => void;
  loginCandidateByTestSlug: (slug: string, candidateId: string, password: string, token?: string) => { success: boolean; message: string };
  bulkImportCandidates: (driveId: string, rows: Omit<Candidate, 'id' | 'assessmentStatus' | 'interviewStatus' | 'offerStatus' | 'funnelStage'>[]) => Promise<number>;
  activateDriveInvites: (driveId: string, mode: 'remote' | 'in-person') => Promise<{ id: string; name: string; email: string; inviteToken?: string }[]>;
  markAttendance: (candidateId: string, present: boolean) => void;
  extendCandidateExamTime: (candidateId: string, extraMinutes: number) => void;
  extendDriveExamTime: (driveId: string, extraMinutes: number) => Promise<number>;
  importCollegeStudents: (college: string, rows: ParsedStudentRow[]) => Promise<number>;
  deleteCollegeStudents: (college: string) => void;
  addDriveMembership: (driveId: string, userId: string, role: DriveRole) => void;
  removeDriveMembership: (membershipId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // No localStorage seed here on purpose — the app starts empty and is populated
  // exclusively by the fetch effects below, so what's on screen is always a direct
  // read from MongoDB rather than a locally cached snapshot from a prior session.
  const [db, setDb] = useState<Database>({
    drives: [], trashedDrives: [], candidates: [], assessments: [], questions: [], interviews: [],
    offers: [], collegeStudents: [], users: [], driveMemberships: [],
  });
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

  // Read-through hydration from the real backend, on demand per module — each
  // page/component declares exactly which fields it needs (via `ensureLoaded`)
  // instead of one global effect fetching every collection at app mount,
  // before login. `loadedFieldsRef` guards against duplicate fetches when
  // multiple modules ask for the same field. `pendingFieldsRef` guards against
  // a field being fetched twice in the same instant — notably React
  // StrictMode's dev-mode double-invoke of effects, which would otherwise
  // double-fire any `force: true` call (force intentionally bypasses
  // `loadedFieldsRef`, so without this second guard StrictMode's synchronous
  // mount→remount would fire two real requests for the same field). Not
  // paired with saveDatabase — this is a read-through from the source of
  // truth, not a local mutation to persist. Fails silently (and allows retry)
  // if the API isn't reachable.
  const loadedFieldsRef = useRef(new Set<keyof Database>());
  const pendingFieldsRef = useRef(new Set<keyof Database>());

  const ensureLoaded = useCallback((fields: (keyof Database)[], opts?: { force?: boolean }) => {
    const endpointByField: Record<keyof Database, string> = {
      users: '/api/users',
      drives: '/api/drives',
      trashedDrives: '/api/drives/trash',
      candidates: '/api/candidates',
      assessments: '/api/assessments',
      questions: '/api/questions',
      interviews: '/api/interviews',
      offers: '/api/offers',
      collegeStudents: '/api/college-students',
      driveMemberships: '/api/drive-memberships',
    };
    fields.forEach(field => {
      if (!opts?.force && loadedFieldsRef.current.has(field)) return;
      if (pendingFieldsRef.current.has(field)) return;
      pendingFieldsRef.current.add(field);
      loadedFieldsRef.current.add(field);
      fetch(endpointByField[field])
        .then(res => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
        .then(data => {
          pendingFieldsRef.current.delete(field);
          setDb(prev => ({ ...prev, [field]: data }));
        })
        .catch(err => {
          pendingFieldsRef.current.delete(field);
          loadedFieldsRef.current.delete(field);
          console.error(`Failed to load ${field} from backend:`, err);
        });
    });
  }, []);

  // Single-round-trip bundle for the Campus Drive list page, which needs all
  // 5 of these fields to render (drive rows, per-drive registered/progress
  // counts, SPOC picker, uploaded-student counts) — replaces what would
  // otherwise be 5 separate `ensureLoaded` fetches with one backend call.
  // `campusDrivePagePendingRef` prevents React StrictMode's dev-mode
  // double-invoke from turning that into two real requests.
  const campusDrivePagePendingRef = useRef(false);
  const loadCampusDrivePage = useCallback(() => {
    if (campusDrivePagePendingRef.current) return;
    campusDrivePagePendingRef.current = true;
    fetch('/api/campus-drive-bundle')
      .then(res => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((data: Pick<Database, 'drives' | 'candidates' | 'assessments' | 'users' | 'collegeStudents'>) => {
        setDb(prev => ({ ...prev, ...data }));
      })
      .catch(err => console.error('Failed to load campus drive page bundle from backend:', err))
      .finally(() => { campusDrivePagePendingRef.current = false; });
  }, []);

  // Single-round-trip bundle for the Executive Dashboard, which computes its
  // KPI cards and charts from these 3 fields — replaces what would otherwise
  // be 3 separate `ensureLoaded` fetches with one backend call. Same
  // pending-ref guard as `loadCampusDrivePage` against StrictMode's
  // dev-mode double-invoke.
  const dashboardPagePendingRef = useRef(false);
  const loadDashboardPage = useCallback(() => {
    if (dashboardPagePendingRef.current) return;
    dashboardPagePendingRef.current = true;
    fetch('/api/dashboard-bundle')
      .then(res => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((data: Pick<Database, 'drives' | 'candidates' | 'assessments'>) => {
        setDb(prev => ({ ...prev, ...data }));
      })
      .catch(err => console.error('Failed to load dashboard bundle from backend:', err))
      .finally(() => { dashboardPagePendingRef.current = false; });
  }, []);

  // Single-round-trip bundle for the College Report page, which computes
  // selected-candidate counts per college/year from these 2 fields. Same
  // pending-ref guard as `loadCampusDrivePage` against StrictMode's
  // dev-mode double-invoke.
  const collegeReportPagePendingRef = useRef(false);
  const loadCollegeReportPage = useCallback(() => {
    if (collegeReportPagePendingRef.current) return;
    collegeReportPagePendingRef.current = true;
    fetch('/api/college-report-bundle')
      .then(res => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then((data: Pick<Database, 'drives' | 'candidates'>) => {
        setDb(prev => ({ ...prev, ...data }));
      })
      .catch(err => console.error('Failed to load college report bundle from backend:', err))
      .finally(() => { collegeReportPagePendingRef.current = false; });
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
  const createDrive = async (
    driveData: Omit<CampusDrive, 'id' | 'registered' | 'selected' | 'createdAt'>,
    initialSpocUserId?: string,
  ): Promise<CampusDrive | undefined> => {
    if (!canCreateDrive(currentUser?.user, db)) return undefined;
    try {
      const res = await fetch('/api/drives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...driveData,
          initialSpocUserId,
          createdByUserId: currentUser?.user?.id ?? '',
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const { drive, membership } = await res.json();
      setDb(prev => ({
        ...prev,
        drives: [drive, ...prev.drives],
        driveMemberships: membership ? [...prev.driveMemberships, membership] : prev.driveMemberships,
      }));
      return drive;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create drive.');
      return undefined;
    }
  };

  const updateDrive = async (updatedDrive: CampusDrive) => {
    if (!canEditDriveConfig(currentUser?.user)) return;
    try {
      const res = await fetch(`/api/drives/${updatedDrive.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedDrive),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const saved: CampusDrive = await res.json();
      setDb(prev => ({ ...prev, drives: prev.drives.map(d => d.id === saved.id ? saved : d) }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update drive.');
    }
  };

  // Soft-delete: moves the drive to Trash without touching it or its candidates, so
  // restoreDrive can bring it back exactly as it was. Permanent removal is a separate,
  // explicit action (permanentlyDeleteDrive) taken from within the Trash view.
  const deleteDrive = async (driveId: string) => {
    if (!canEditDriveConfig(currentUser?.user)) return;
    try {
      const res = await fetch(`/api/drives/${driveId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const saved: CampusDrive = await res.json();
      setDb(prev => ({
        ...prev,
        drives: prev.drives.filter(d => d.id !== driveId),
        trashedDrives: [saved, ...prev.trashedDrives.filter(d => d.id !== driveId)],
      }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to move drive to trash.');
    }
  };

  const restoreDrive = async (driveId: string) => {
    if (!canEditDriveConfig(currentUser?.user)) return;
    try {
      const res = await fetch(`/api/drives/${driveId}/restore`, { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const saved: CampusDrive = await res.json();
      setDb(prev => ({
        ...prev,
        trashedDrives: prev.trashedDrives.filter(d => d.id !== driveId),
        drives: [saved, ...prev.drives.filter(d => d.id !== driveId)],
      }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to restore drive.');
    }
  };

  const permanentlyDeleteDrive = async (driveId: string) => {
    if (!canEditDriveConfig(currentUser?.user)) return;
    try {
      const res = await fetch(`/api/drives/${driveId}/permanent`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`);
      setDb(prev => ({
        ...prev,
        trashedDrives: prev.trashedDrives.filter(d => d.id !== driveId),
        candidates: prev.candidates.filter(c => c.driveId !== driveId),
      }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to permanently delete drive.');
    }
  };

  const updateCandidate = async (updatedCandidate: Candidate) => {
    try {
      const res = await fetch(`/api/candidates/${updatedCandidate.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedCandidate),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const saved: Candidate = await res.json();
      setDb(prev => ({ ...prev, candidates: prev.candidates.map(c => c.id === saved.id ? saved : c) }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update candidate.');
    }
  };

  const bulkUpdateCandidates = async (updates: Candidate[]) => {
    try {
      const res = await fetch('/api/candidates/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const saved: Candidate[] = await res.json();
      const map = new Map(saved.map(c => [c.id, c]));
      setDb(prev => ({ ...prev, candidates: prev.candidates.map(c => map.get(c.id) ?? c) }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update candidates.');
    }
  };

  const createQuestion = async (qData: Omit<Question, 'id'>) => {
    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(qData),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const newQ: Question = await res.json();
      setDb(prev => ({ ...prev, questions: [...prev.questions, newQ] }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create question.');
    }
  };

  const createInterview = async (intData: Omit<Interview, 'id'>) => {
    if (intData.stage === 'Whiteboard Interview') {
      const targetCandidate = db.candidates.find(c => c.id === intData.candidateId);
      if (!targetCandidate || !canAdvanceCandidate(currentUser?.user, targetCandidate.driveId, 'Whiteboard Interview', db)) return;
    }
    try {
      const res = await fetch('/api/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(intData),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { interview, candidate } = await res.json();
      setDb(prev => ({
        ...prev,
        interviews: [interview, ...prev.interviews],
        candidates: prev.candidates.map(c => c.id === candidate.id ? candidate : c),
      }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to schedule interview.');
    }
  };

  const updateOfferStatus = async (candidateId: string, status: Candidate['offerStatus']) => {
    const targetCandidate = db.candidates.find(c => c.id === candidateId);
    if (!targetCandidate || !canReleaseOffer(currentUser?.user, targetCandidate.driveId, db)) return;
    try {
      const res = await fetch(`/api/candidates/${candidateId}/offer-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { candidate, offer } = await res.json();
      setDb(prev => ({
        ...prev,
        candidates: prev.candidates.map(c => c.id === candidateId ? candidate : c),
        offers: offer
          ? (prev.offers.some(o => o.candidateId === candidateId)
              ? prev.offers.map(o => o.candidateId === candidateId ? offer : o)
              : [offer, ...prev.offers])
          : prev.offers.filter(o => o.candidateId !== candidateId),
      }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update offer status.');
    }
  };

  const submitCandidateAssessment = async (
    candidateId: string,
    assessmentId: string,
    answers: { [qId: string]: string | number[] | number },
    durationUsed: number,
    proctoring?: { windowViolationCount?: number; imageViolationCount?: number; proctoringTerminated?: boolean }
  ) => {
    try {
      const { browser, os } = parseUserAgent();
      const res = await fetch(`/api/candidates/${candidateId}/submit-assessment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentId, answers, durationUsed, proctoring,
          deviceBrowser: browser, deviceOS: os,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const finalCandidate: Candidate = await res.json();
      setDb(prev => ({ ...prev, candidates: prev.candidates.map(c => c.id === candidateId ? finalCandidate : c) }));

      // If candidate logged in, update current session
      if (currentUser && currentUser.id === candidateId) {
        const updatedSession = { ...currentUser, candidate: finalCandidate };
        setCurrentUser(updatedSession);
        localStorage.setItem('presidio_session', JSON.stringify(updatedSession));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit assessment.');
    }
  };

  const updateAssessment = async (updated: Assessment) => {
    try {
      const res = await fetch(`/api/assessments/${updated.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const saved: Assessment = await res.json();
      setDb(prev => ({ ...prev, assessments: prev.assessments.map(a => a.id === saved.id ? saved : a) }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update assessment.');
    }
  };

  const updateQuestion = async (id: string, updates: Partial<Omit<Question, 'id'>>) => {
    try {
      const res = await fetch(`/api/questions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const saved: Question = await res.json();
      setDb(prev => ({ ...prev, questions: prev.questions.map(q => q.id === id ? saved : q) }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update question.');
    }
  };

  const createAssessment = async (data: Omit<Assessment, 'id' | 'candidatesAssignedCount'>): Promise<Assessment | undefined> => {
    try {
      const res = await fetch('/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const newAsm: Assessment = await res.json();
      setDb(prev => ({ ...prev, assessments: [newAsm, ...prev.assessments] }));
      return newAsm;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create assessment.');
      return undefined;
    }
  };

  // Atomically creates a new assessment AND links it (+ its question list) to
  // the drive server-side in a single request, so the two writes can't leave
  // the drive pointing at a half-created assessment.
  const createAssessmentForDrive = async (
    driveId: string,
    data: Omit<Assessment, 'id' | 'candidatesAssignedCount'>,
    driveQuestionIds: string[]
  ): Promise<Assessment | undefined> => {
    try {
      const res = await fetch(`/api/drives/${driveId}/assessments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, driveQuestionIds }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { assessment, drive } = await res.json();
      setDb(prev => ({
        ...prev,
        assessments: [assessment, ...prev.assessments],
        drives: prev.drives.map(d => d.id === driveId ? drive : d),
      }));
      return assessment;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create assessment.');
      return undefined;
    }
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

  const loginCandidateByTestSlug = (slug: string, email: string, password: string, token?: string) => {
    const asm = db.assessments.find(a => a.slug === slug);
    if (!asm) return { success: false, message: 'Test not found. Check the URL.' };
    if (asm.status !== 'Active') return { success: false, message: 'This test is not currently active.' };

    const normalizedEmail = email.trim().toLowerCase();
    const candidate = db.candidates.find(
      c => c.email.trim().toLowerCase() === normalizedEmail && c.assessmentId === asm.id
    );
    if (!candidate) return { success: false, message: 'Invalid email or you are not registered for this test.' };
    if (candidate.assessmentStatus === 'Completed') return { success: false, message: 'Assessment already completed.' };

    // Passwordless only applies when the exact per-candidate magic-link token is present and
    // matches — a bare shared URL (no token, or wrong one) always falls back to the shared
    // test password, even for a candidate who was invited via email.
    const drive = db.drives.find(d => d.assessmentId === asm.id);
    const passwordless = candidate.accessMode === 'remote' && !!token && token === candidate.inviteToken;
    // A candidate already mid-test (e.g. reconnecting after a network drop) is
    // resuming an already-authorized session, not requesting fresh admission — the
    // exam window gate is only meant to control new entries, so it shouldn't lock
    // someone out of their own in-progress attempt just because the nominal window
    // closed while they were disconnected. testSession.ts already restores their
    // exact answers/position once login succeeds.
    const isResuming = candidate.assessmentStatus === 'InProgress';

    if (passwordless) {
      // Only enforce the exam time window when explicitly scheduled
      if (!isResuming && drive?.experienceSettings?.testWindow === 'scheduled') {
        const windowError = checkExamWindow(drive);
        if (windowError) return { success: false, message: windowError };
      }
    } else {
      // Validate against the shared test password
      if (asm.accessPassword !== password) {
        return { success: false, message: 'Incorrect test password.' };
      }
      // Check attendance if it has been enabled for this drive
      const attendanceUsed = db.candidates.some(c => c.college === candidate.college && c.attendanceMarked !== undefined);
      if (attendanceUsed && !candidate.attendanceMarked) {
        return { success: false, message: 'You are not marked as present for this test. Please contact your coordinator.' };
      }
      // Check exam time window if drive has one set
      if (!isResuming && drive) {
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

  const bulkInvite = async (assessmentId: string, date: string, driveId: string) => {
    try {
      const res = await fetch(`/api/drives/${driveId}/bulk-invite`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assessmentId, date }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { assessment, drive, candidates } = await res.json();
      setDb(prev => {
        const candidateMap = new Map<string, Candidate>(candidates.map((c: Candidate) => [c.id, c]));
        return {
          ...prev,
          candidates: prev.candidates.map(c => candidateMap.get(c.id) ?? c),
          assessments: prev.assessments.map(a => a.id === assessment.id ? assessment : a),
          drives: prev.drives.map(d => d.id === driveId ? drive : d),
        };
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send bulk invite.');
    }
  };

  const bulkImportCandidates = async (
    driveId: string,
    rows: Omit<Candidate, 'id' | 'assessmentStatus' | 'interviewStatus' | 'offerStatus' | 'funnelStage' | 'driveId'>[]
  ): Promise<number> => {
    try {
      const res = await fetch(`/api/drives/${driveId}/candidates/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rows),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { imported, candidates } = await res.json();
      if (candidates?.length) {
        setDb(prev => ({ ...prev, candidates: [...prev.candidates, ...candidates] }));
      }
      return imported;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to import candidates.');
      return 0;
    }
  };

  const bulkImportQuestions = async (rows: Omit<Question, 'id'>[]): Promise<number> => {
    try {
      const res = await fetch('/api/questions/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rows),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { imported, questions } = await res.json();
      if (questions?.length) {
        setDb(prev => ({ ...prev, questions: [...prev.questions, ...questions] }));
      }
      return imported;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to import questions.');
      return 0;
    }
  };

  // Activates (or reactivates) every candidate in the drive who hasn't completed the
  // assessment yet, assigning them to the linked test so they can log in — used both
  // for emailing an invite and for the "share the link/password manually" path.
  const activateDriveInvites = async (
    driveId: string, mode: 'remote' | 'in-person'
  ): Promise<{ id: string; name: string; email: string; inviteToken?: string }[]> => {
    try {
      const res = await fetch(`/api/drives/${driveId}/invites/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { invited, candidates } = await res.json();
      if (candidates?.length) {
        const candidateMap = new Map<string, Candidate>(candidates.map((c: Candidate) => [c.id, c]));
        setDb(prev => ({ ...prev, candidates: prev.candidates.map(c => candidateMap.get(c.id) ?? c) }));
      }
      return invited;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to activate invites.');
      return [];
    }
  };

  const markAttendance = async (candidateId: string, present: boolean) => {
    try {
      const res = await fetch(`/api/candidates/${candidateId}/attendance`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ present }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const saved: Candidate = await res.json();
      setDb(prev => ({ ...prev, candidates: prev.candidates.map(c => c.id === candidateId ? saved : c) }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to mark attendance.');
    }
  };

  const extendCandidateExamTime = async (candidateId: string, extraMinutes: number) => {
    try {
      const res = await fetch(`/api/candidates/${candidateId}/extend-time`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extraMinutes }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const saved: Candidate = await res.json();
      setDb(prev => ({ ...prev, candidates: prev.candidates.map(c => c.id === candidateId ? saved : c) }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to extend exam time.');
    }
  };

  const extendDriveExamTime = async (driveId: string, extraMinutes: number): Promise<number> => {
    try {
      const res = await fetch(`/api/drives/${driveId}/extend-time`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extraMinutes }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { count } = await res.json();
      if (count > 0) {
        setDb(prev => ({
          ...prev,
          candidates: prev.candidates.map(c =>
            c.driveId === driveId && c.assessmentStatus !== 'Completed'
              ? { ...c, extraTimeMinutes: (c.extraTimeMinutes ?? 0) + extraMinutes }
              : c
          ),
        }));
      }
      return count;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to extend exam time.');
      return 0;
    }
  };
  const importCollegeStudents = async (college: string, rows: ParsedStudentRow[]): Promise<number> => {
    try {
      const res = await fetch(`/api/college-students/import?college=${encodeURIComponent(college)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rows),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const { imported, students } = await res.json();
      if (students?.length) {
        setDb(prev => ({ ...prev, collegeStudents: [...(prev.collegeStudents ?? []), ...students] }));
      }
      return imported;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to import students.');
      return 0;
    }
  };

  const deleteCollegeStudents = async (college: string) => {
    try {
      const res = await fetch(`/api/college-students?college=${encodeURIComponent(college)}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`);
      setDb(prev => ({ ...prev, collegeStudents: (prev.collegeStudents ?? []).filter(s => s.college !== college) }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete students.');
    }
  };

  const addDriveMembership = async (driveId: string, userId: string, role: DriveRole) => {
    if (!canManageMembership(currentUser?.user, driveId, role, db)) return;
    const alreadyMember = db.driveMemberships.some(m => m.driveId === driveId && m.userId === userId && m.role === role);
    if (alreadyMember) return;
    try {
      const res = await fetch(`/api/drives/${driveId}/memberships`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role, addedByUserId: currentUser?.user?.id ?? '' }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const newMembership: DriveMembership = await res.json();
      setDb(prev => ({ ...prev, driveMemberships: [...prev.driveMemberships, newMembership] }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add membership.');
    }
  };

  const removeDriveMembership = async (membershipId: string) => {
    const membership = db.driveMemberships.find(m => m.id === membershipId);
    if (!membership || !canManageMembership(currentUser?.user, membership.driveId, membership.role, db)) return;
    try {
      const res = await fetch(`/api/memberships/${membershipId}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`);
      // Removal only revokes future access — it never touches the candidate records
      // this person already scored/decided on, so historical attribution is preserved.
      setDb(prev => ({ ...prev, driveMemberships: prev.driveMemberships.filter(m => m.id !== membershipId) }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove membership.');
    }
  };

  return (
    <AppContext.Provider value={{
      db,
      ensureLoaded,
      loadCampusDrivePage,
      loadDashboardPage,
      loadCollegeReportPage,
      currentUser,
      loginAdmin,
      loginCandidate,
      logout,
      createDrive,
      updateDrive,
      deleteDrive,
      restoreDrive,
      permanentlyDeleteDrive,
      updateCandidate,
      createQuestion,
      bulkImportQuestions,
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
      activateDriveInvites,
      markAttendance,
      extendCandidateExamTime,
      extendDriveExamTime,
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
