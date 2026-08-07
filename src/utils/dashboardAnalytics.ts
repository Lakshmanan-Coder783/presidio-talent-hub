import type { Candidate, CampusDrive, Offer, DriveMembership, User } from '../types';

export interface LabeledValue {
  label: string;
  value: number;
}

// ─── KPI row ────────────────────────────────────────────────────────────────

export interface KpiStats {
  totalCandidates: number;
  activeDrives: number;
  offersReleased: number;
  avgTimeToHireDays: number | null;
  joiningRate: number;
}

export function computeKpiStats(
  filteredCandidates: Candidate[],
  filteredDrives: CampusDrive[],
): KpiStats {
  const totalCandidates = filteredCandidates.length;
  const activeDrives = new Set(filteredDrives.map(d => d.college)).size;
  const offersReleased = filteredCandidates.filter(c => c.funnelStage === 'Offered' || c.funnelStage === 'Joined').length;
  const joined = filteredCandidates.filter(c => c.offerStatus === 'Joined').length;
  const accepted = filteredCandidates.filter(c => c.offerStatus === 'Accepted').length;
  const joiningRate = Math.round((joined / ((joined + accepted) || 1)) * 100);
  const avgTimeToHireDays = computeAvgTimeToHireDays(filteredCandidates);
  return { totalCandidates, activeDrives, offersReleased, avgTimeToHireDays, joiningRate };
}

// Applied -> OA-shortlist-decision span, averaged over candidates whose
// funnelStageHistory actually records both endpoints. The 'Interview' stage
// entry is recorded the instant an evaluator shortlists a candidate off the
// Online Test (see TestDetail.tsx's confirmOaShortlist) — Day-2 interview
// onward isn't counted, since that's a separately scheduled day, not part of
// this turnaround metric. Candidates seeded/created before this history
// existed are simply excluded rather than guessed at.
export function computeAvgTimeToHireDays(candidates: Candidate[]): number | null {
  const spans: number[] = [];
  candidates.forEach(c => {
    const history = c.funnelStageHistory;
    if (!history?.length) return;
    const applied = history.find(h => h.stage === 'Applied');
    const shortlisted = history.find(h => h.stage === 'Interview');
    if (!applied || !shortlisted) return;
    const days = (new Date(shortlisted.enteredAt).getTime() - new Date(applied.enteredAt).getTime()) / 86_400_000;
    if (days >= 0) spans.push(days);
  });
  if (!spans.length) return null;
  return Math.round(spans.reduce((s, d) => s + d, 0) / spans.length);
}

// ─── Hiring funnel ──────────────────────────────────────────────────────────

export interface FunnelStageDatum {
  stage: string;
  count: number;
  pct: number;
}

export function computeFunnelData(candidates: Candidate[]): FunnelStageDatum[] {
  const total = candidates.length;
  const inStage = (stages: Candidate['funnelStage'][]) => candidates.filter(c => stages.includes(c.funnelStage)).length;
  const passedOnlineTest = inStage(['Online Test', 'Interview', 'Coding Exercise', 'Whiteboard Interview', 'Offered', 'Joined']);
  const passedInterview = inStage(['Interview', 'Coding Exercise', 'Whiteboard Interview', 'Offered', 'Joined']);
  const passedCoding = inStage(['Coding Exercise', 'Whiteboard Interview', 'Offered', 'Joined']);
  const passedWhiteboard = inStage(['Whiteboard Interview', 'Offered', 'Joined']);
  const offered = inStage(['Offered', 'Joined']);
  const joined = inStage(['Joined']);
  return [
    { stage: 'Applied', count: total, pct: 100 },
    { stage: 'Online Test', count: passedOnlineTest, pct: Math.round((passedOnlineTest / (total || 1)) * 100) },
    { stage: 'Interview', count: passedInterview, pct: Math.round((passedInterview / (passedOnlineTest || 1)) * 100) },
    { stage: 'Coding', count: passedCoding, pct: Math.round((passedCoding / (passedInterview || 1)) * 100) },
    { stage: 'Whiteboard', count: passedWhiteboard, pct: Math.round((passedWhiteboard / (passedCoding || 1)) * 100) },
    { stage: 'Offered', count: offered, pct: Math.round((offered / (passedWhiteboard || 1)) * 100) },
    { stage: 'Joined', count: joined, pct: Math.round((joined / (offered || 1)) * 100) },
  ];
}

// ─── Round-wise pass rate ───────────────────────────────────────────────────

// % shortlisted among candidates who actually have a recorded decision for
// that round — undecided candidates (still in progress) are excluded from
// the denominator rather than counted as a fail.
export function computeRoundPassRates(candidates: Candidate[]): LabeledValue[] {
  const rate = (defined: (c: Candidate) => boolean, passed: (c: Candidate) => boolean): number => {
    const decided = candidates.filter(defined);
    if (!decided.length) return 0;
    return Math.round((decided.filter(passed).length / decided.length) * 100);
  };
  return [
    { label: 'Online Test', value: rate(c => c.oaShortlisted !== undefined, c => c.oaShortlisted === true) },
    { label: 'Interview', value: rate(c => c.interviewShortlisted !== undefined, c => c.interviewShortlisted === true) },
    { label: 'Coding', value: rate(c => c.codingShortlisted !== undefined, c => c.codingShortlisted === true) },
    { label: 'Whiteboard', value: rate(c => c.whiteboardFinalResult !== undefined, c => c.whiteboardFinalResult === 'Selected') },
  ];
}

// ─── Offer & joining ────────────────────────────────────────────────────────

export interface OfferStats {
  acceptanceRatePct: number;
  avgCtc: number | null;
  offerStatusBreakdown: LabeledValue[];
}

export function computeOfferStats(offers: Offer[]): OfferStats {
  const accepted = offers.filter(o => o.status === 'Accepted' || o.status === 'Joined').length;
  const declined = offers.filter(o => o.status === 'Declined').length;
  const decided = accepted + declined;
  const acceptanceRatePct = decided ? Math.round((accepted / decided) * 100) : 0;
  const ctcs = offers.map(o => o.ctc).filter((v): v is number => typeof v === 'number');
  const avgCtc = ctcs.length ? parseFloat((ctcs.reduce((s, v) => s + v, 0) / ctcs.length).toFixed(1)) : null;

  const counts: Record<string, number> = {};
  offers.forEach(o => { counts[o.status] = (counts[o.status] || 0) + 1; });
  const offerStatusBreakdown = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value }));

  return { acceptanceRatePct, avgCtc, offerStatusBreakdown };
}

// ─── Team members ───────────────────────────────────────────────────────────

export type TeamMemberRole = 'SPOC' | 'Primary Panel' | 'Secondary Panel' | 'Evaluator';

const TEAM_MEMBER_ROLE_ORDER: TeamMemberRole[] = ['SPOC', 'Primary Panel', 'Secondary Panel', 'Evaluator'];

export interface TeamMember {
  userId: string;
  name: string;
  email: string;
  roles: TeamMemberRole[];
}

// Every team member holding any SPOC/Panel/Evaluator membership on a drive
// within scope, deduped by user and sorted alphabetically for a directory view.
// 'Panel' isn't a distinct stored role — for each drive, the earliest-added
// Panel member is labeled 'Primary Panel' and any later one(s) 'Secondary
// Panel', derived purely from addedAt order.
export function computeTeamMembers(
  driveMemberships: DriveMembership[],
  users: User[],
  driveIds: Set<string>,
): TeamMember[] {
  const userById = new Map(users.map(u => [u.id, u]));
  const membershipsByDrive = new Map<string, DriveMembership[]>();
  driveMemberships
    .filter(m => driveIds.has(m.driveId))
    .forEach(m => {
      if (!membershipsByDrive.has(m.driveId)) membershipsByDrive.set(m.driveId, []);
      membershipsByDrive.get(m.driveId)!.push(m);
    });

  const rolesByUser = new Map<string, Set<TeamMemberRole>>();
  const addRole = (userId: string, role: TeamMemberRole) => {
    if (!rolesByUser.has(userId)) rolesByUser.set(userId, new Set());
    rolesByUser.get(userId)!.add(role);
  };

  membershipsByDrive.forEach(members => {
    members.filter(m => m.role === 'SPOC').forEach(m => addRole(m.userId, 'SPOC'));
    members.filter(m => m.role === 'Evaluator').forEach(m => addRole(m.userId, 'Evaluator'));
    const panelMembers = members
      .filter(m => m.role === 'Panel')
      .sort((a, b) => new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime());
    panelMembers.forEach((m, i) => addRole(m.userId, i === 0 ? 'Primary Panel' : 'Secondary Panel'));
  });

  return Array.from(rolesByUser.entries())
    .map(([userId, roles]) => ({
      userId,
      name: userById.get(userId)?.name ?? 'Unknown',
      email: userById.get(userId)?.email ?? '',
      roles: TEAM_MEMBER_ROLE_ORDER.filter(r => roles.has(r)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// ─── Campus recruitment progress ───────────────────────────────────────────

export interface DualSeriesDatum {
  label: string;
  val1: number;
  val2: number;
}

export function computeDrivePerformanceData(drives: CampusDrive[]): DualSeriesDatum[] {
  const byCollege = drives.reduce((acc, d) => {
    if (!acc[d.college]) acc[d.college] = { registered: 0, selected: 0 };
    acc[d.college].registered += d.registered;
    acc[d.college].selected += d.selected;
    return acc;
  }, {} as Record<string, { registered: number; selected: number }>);

  return Object.entries(byCollege)
    .sort((a, b) => b[1].registered - a[1].registered)
    .slice(0, 5)
    .map(([college, vals]) => ({
      label: college.split(' ').map((w: string) => w[0]).join(''),
      val1: vals.registered,
      val2: vals.selected,
    }));
}

// ─── Online Assessment scores ───────────────────────────────────────────────

export function computeScoreDistributionData(candidates: Candidate[]): LabeledValue[] {
  const scores = candidates
    .filter(c => c.assessmentStatus === 'Completed' && c.assessmentScore !== undefined)
    .map(c => c.assessmentScore as number);
  const ranges = [
    { label: '0-20', min: 0, max: 20, value: 0 },
    { label: '21-40', min: 21, max: 40, value: 0 },
    { label: '41-60', min: 41, max: 60, value: 0 },
    { label: '61-80', min: 61, max: 80, value: 0 },
    { label: '81-100', min: 81, max: 100, value: 0 },
  ];
  scores.forEach(s => ranges.forEach(r => { if (s >= r.min && s <= r.max) r.value++; }));
  return ranges.map(r => ({ label: r.label, value: r.value }));
}

// ─── Selected-candidate demographics ───────────────────────────────────────

function groupSelectedBy(candidates: Candidate[], key: (c: Candidate) => string): LabeledValue[] {
  const selected = candidates.filter(c => ['Offered', 'Accepted', 'Joined'].includes(c.offerStatus));
  const counts: Record<string, number> = {};
  selected.forEach(c => { counts[key(c)] = (counts[key(c)] || 0) + 1; });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value }));
}

export const computeSelectedCandidateDegrees = (candidates: Candidate[]): LabeledValue[] =>
  groupSelectedBy(candidates, c => c.degree);

export const computeSelectedCandidateGenders = (candidates: Candidate[]): LabeledValue[] =>
  groupSelectedBy(candidates, c => c.gender);
