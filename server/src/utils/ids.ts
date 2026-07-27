import { nextSeq } from "../models/Counter.model.js";

/**
 * Business-key ID generators, one per entity. Each wraps an atomic Mongo
 * counter increment so concurrent requests never collide, while keeping the
 * exact same human-readable formats the frontend/mock data already use
 * (these strings are the actual _id/foreign-key values, see models/plugins.ts).
 */

export async function nextDriveId(year = new Date().getFullYear()): Promise<string> {
  const seq = await nextSeq(`drive:${year}`);
  return `DRV-${year}-${100 + seq - 1}`;
}

export async function nextCandidateId(year = new Date().getFullYear()): Promise<string> {
  const seq = await nextSeq(`candidate:${year}`);
  return `PRES${year}-${10000 + seq - 1}`;
}

export async function nextAssessmentId(): Promise<string> {
  const seq = await nextSeq("assessment");
  return `ASM-${2000 + seq - 1}`;
}

export async function nextQuestionId(): Promise<string> {
  const seq = await nextSeq("question");
  return `Q-${1000 + seq - 1}`;
}

export async function nextInterviewId(year = new Date().getFullYear()): Promise<string> {
  const seq = await nextSeq(`interview:${year}`);
  return `INT-${year}-${1000 + seq - 1}`;
}

export async function nextOfferId(year = new Date().getFullYear()): Promise<string> {
  const seq = await nextSeq(`offer:${year}`);
  return `OFF-${year}-${200 + seq - 1}`;
}

export async function nextMembershipId(): Promise<string> {
  const seq = await nextSeq("membership");
  return `MEM-${seq}`;
}

export async function nextUserId(): Promise<string> {
  const seq = await nextSeq("user");
  return `USR-${String(seq).padStart(3, "0")}`;
}

export function nextCollegeStudentId(college: string, idx: number): string {
  const prefix = college.replace(/\s+/g, "").slice(0, 6).toUpperCase();
  return `CS-${prefix}-${Date.now()}-${idx}`;
}
