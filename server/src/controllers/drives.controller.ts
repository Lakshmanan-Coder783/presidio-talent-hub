import type { Request, Response } from "express";
import { CampusDrive } from "../models/CampusDrive.model.js";
import { Candidate } from "../models/Candidate.model.js";
import { DriveMembership } from "../models/DriveMembership.model.js";
import { User } from "../models/User.model.js";
import { Assessment } from "../models/Assessment.model.js";
import { nextDriveId, nextMembershipId } from "../utils/ids.js";
import { HttpError } from "../middleware/errorHandler.js";

export async function listDrives(_req: Request, res: Response) {
  // Role-scoped visibility (getVisibleDrives / SuperAdmin-vs-membership filtering)
  // lands in the auth phase; for now this returns all non-trashed drives.
  const drives = await CampusDrive.find({ deletedAt: null }).sort({ createdAt: -1 });
  res.json(drives);
}

export async function listTrashedDrives(_req: Request, res: Response) {
  const drives = await CampusDrive.find({ deletedAt: { $ne: null } }).sort({ deletedAt: -1 });
  res.json(drives);
}

export async function getDrive(req: Request, res: Response) {
  const drive = await CampusDrive.findById(req.params.id);
  if (!drive) return res.status(404).json({ error: "Drive not found" });
  res.json(drive);
}

export async function createDrive(req: Request, res: Response) {
  const { initialSpocUserId, createdByUserId, ...driveData } = req.body as Record<string, unknown> & {
    initialSpocUserId?: string;
    createdByUserId?: string;
  };

  const drive = await CampusDrive.create({
    ...driveData,
    _id: await nextDriveId(),
    registered: 0,
    selected: 0,
    createdAt: new Date(),
  });

  let membership = null;
  if (initialSpocUserId) {
    membership = await DriveMembership.create({
      _id: await nextMembershipId(),
      driveId: drive._id,
      userId: initialSpocUserId,
      role: "SPOC",
      addedAt: new Date(),
      addedByUserId: createdByUserId ?? "",
    });
  } else if (createdByUserId) {
    // SuperAdmins already have implicit access to every drive (see
    // getVisibleDrives on the frontend) — only non-SuperAdmin creators
    // (Evaluators) need their own membership to see the drive they just made.
    const creator = await User.findById(createdByUserId);
    if (creator && !creator.isSuperAdmin) {
      membership = await DriveMembership.create({
        _id: await nextMembershipId(),
        driveId: drive._id,
        userId: createdByUserId,
        role: "Evaluator",
        addedAt: new Date(),
        addedByUserId: createdByUserId,
      });
    }
  }

  res.status(201).json({ drive, membership });
}

export async function updateDrive(req: Request, res: Response) {
  const drive = await CampusDrive.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!drive) throw new HttpError(404, "Drive not found");
  res.json(drive);
}

// Soft-delete: moves the drive to Trash without touching it or its candidates, so
// restoreDrive can bring it back exactly as it was. Permanent removal is a separate,
// explicit endpoint, taken from within the Trash view.
export async function deleteDrive(req: Request, res: Response) {
  const drive = await CampusDrive.findByIdAndUpdate(req.params.id, { deletedAt: new Date() }, { new: true });
  if (!drive) throw new HttpError(404, "Drive not found");
  res.json(drive);
}

export async function restoreDrive(req: Request, res: Response) {
  const drive = await CampusDrive.findByIdAndUpdate(req.params.id, { deletedAt: null }, { new: true });
  if (!drive) throw new HttpError(404, "Drive not found");
  res.json(drive);
}

export async function permanentlyDeleteDrive(req: Request, res: Response) {
  const drive = await CampusDrive.findByIdAndDelete(req.params.id);
  if (!drive) throw new HttpError(404, "Drive not found");
  await Candidate.deleteMany({ driveId: req.params.id });
  res.status(204).end();
}

export async function bulkInvite(req: Request, res: Response) {
  const driveId = req.params.driveId as string;
  const { assessmentId, date } = req.body as { assessmentId: string; date: string };

  const notInvited = await Candidate.find({ driveId, assessmentStatus: "Not Invited" });
  const updatedCandidates = await Promise.all(notInvited.map(c =>
    Candidate.findByIdAndUpdate(c._id, {
      assessmentStatus: "Pending",
      assessmentId,
      assessmentPassword: `PRES${Math.floor(1000 + Math.random() * 9000)}`,
    }, { new: true }),
  ));

  // Matches the original client-side count exactly: every candidate anywhere
  // assigned to this assessment, not just this drive's (assessments are 1:1
  // with drives in practice, but the count was never drive-scoped before).
  const candidatesAssignedCount = await Candidate.countDocuments({ assessmentId });
  const assessment = await Assessment.findByIdAndUpdate(assessmentId, { candidatesAssignedCount }, { new: true });
  const drive = await CampusDrive.findByIdAndUpdate(driveId, { assessmentId, examDate: date }, { new: true });

  res.json({ assessment, drive, candidates: updatedCandidates });
}

// Activates (or reactivates) every candidate in the drive who hasn't completed the
// assessment yet, assigning them to the linked test so they can log in — used both
// for emailing an invite and for the "share the link/password manually" path.
export async function activateDriveInvites(req: Request, res: Response) {
  const driveId = req.params.driveId as string;
  const { mode } = req.body as { mode: "remote" | "in-person" };

  const drive = await CampusDrive.findById(driveId);
  if (!drive || !drive.assessmentId) return res.json({ invited: [], candidates: [] });

  const now = new Date();
  const candidates = await Candidate.find({ driveId, assessmentStatus: { $ne: "Completed" } });
  const invited: Array<{ id: string; name: string; email: string; inviteToken?: string }> = [];
  const updatedCandidates = [];

  for (const c of candidates) {
    const inviteToken = mode === "remote" ? crypto.randomUUID() : undefined;
    invited.push({ id: c._id, name: c.name, email: c.email, inviteToken });
    const updated = await Candidate.findByIdAndUpdate(c._id, {
      assessmentStatus: c.assessmentStatus === "Not Invited" ? "Pending" : c.assessmentStatus,
      assessmentId: drive.assessmentId,
      accessMode: mode,
      inviteToken,
      inviteEmailSentAt: now,
    }, { new: true });
    updatedCandidates.push(updated);
  }

  res.json({ invited, candidates: updatedCandidates });
}
