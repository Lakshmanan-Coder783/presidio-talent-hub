import type { CampusDrive, Candidate, User, DriveRole } from '../types';
import type { Database } from './db';

export type EffectiveRole = 'SuperAdmin' | DriveRole;

export function getUserRoleForDrive(user: User | undefined, driveId: string, db: Database): EffectiveRole | null {
  if (!user) return null;
  if (user.isSuperAdmin) return 'SuperAdmin';
  const memberships = db.driveMemberships.filter(m => m.driveId === driveId && m.userId === user.id);
  if (memberships.some(m => m.role === 'SPOC')) return 'SPOC';
  if (memberships.some(m => m.role === 'Panel')) return 'Panel';
  return null;
}

export function getVisibleDrives(user: User | undefined, db: Database): CampusDrive[] {
  if (!user) return [];
  const activeDrives = db.drives.filter(d => !d.deletedAt);
  if (user.isSuperAdmin) return activeDrives;
  const myDriveIds = new Set(db.driveMemberships.filter(m => m.userId === user.id).map(m => m.driveId));
  return activeDrives.filter(d => myDriveIds.has(d.id));
}

// Drive CRUD, scoreBandCutoffs, and experienceSettings — Super Admin only.
export function canEditDriveConfig(user: User | undefined): boolean {
  return !!user?.isSuperAdmin;
}

export function canManageMembership(
  actingUser: User | undefined,
  driveId: string,
  targetRole: DriveRole,
  db: Database
): boolean {
  if (!actingUser) return false;
  if (actingUser.isSuperAdmin) return true;
  const role = getUserRoleForDrive(actingUser, driveId, db);
  return role === 'SPOC' && targetRole === 'Panel'; // SPOC can manage Panel only, never SPOC (including themselves)
}

export function canAdvanceCandidate(
  user: User | undefined,
  driveId: string,
  stage: 'Interview' | 'Coding Exercise' | 'Whiteboard Interview',
  db: Database
): boolean {
  const role = getUserRoleForDrive(user, driveId, db);
  if (role === 'SuperAdmin' || role === 'SPOC') return true;
  if (role === 'Panel') return stage === 'Interview' || stage === 'Coding Exercise';
  return false;
}

export function canReleaseOffer(user: User | undefined, driveId: string, db: Database): boolean {
  const role = getUserRoleForDrive(user, driveId, db);
  return role === 'SuperAdmin' || role === 'SPOC';
}

export function canViewUnredactedCandidate(user: User | undefined, driveId: string, db: Database): boolean {
  const role = getUserRoleForDrive(user, driveId, db);
  return role === 'SuperAdmin' || role === 'SPOC';
}

const REDACTED = '••••••••';

export function redactCandidateForViewer<T extends Pick<Candidate, 'email' | 'phone'>>(
  candidate: T,
  user: User | undefined,
  driveId: string,
  db: Database
): T {
  if (canViewUnredactedCandidate(user, driveId, db)) return candidate;
  return { ...candidate, email: REDACTED, phone: REDACTED };
}
