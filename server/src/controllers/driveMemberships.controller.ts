import type { Request, Response } from "express";
import { DriveMembership, type DriveRole } from "../models/DriveMembership.model.js";
import { nextMembershipId } from "../utils/ids.js";
import { HttpError } from "../middleware/errorHandler.js";

const VALID_ROLES: DriveRole[] = ["SPOC", "Panel", "Evaluator"];

export async function listMemberships(_req: Request, res: Response) {
  const memberships = await DriveMembership.find();
  res.json(memberships);
}

export async function listMembershipsForDrive(req: Request, res: Response) {
  const memberships = await DriveMembership.find({ driveId: req.params.driveId });
  res.json(memberships);
}

export async function addDriveMembership(req: Request, res: Response) {
  const driveId = req.params.driveId as string;
  const { userId, role, addedByUserId } = req.body as { userId: string; role: DriveRole; addedByUserId?: string };
  if (!userId || !role) throw new HttpError(400, "userId and role are required");
  if (!VALID_ROLES.includes(role)) throw new HttpError(400, `role must be one of ${VALID_ROLES.join(", ")}`);

  const alreadyMember = await DriveMembership.findOne({ driveId, userId, role });
  if (alreadyMember) throw new HttpError(409, "This user already has that role on this drive");

  const membership = await DriveMembership.create({
    _id: await nextMembershipId(),
    driveId,
    userId,
    role,
    addedAt: new Date(),
    addedByUserId: addedByUserId ?? "",
  });
  res.status(201).json(membership);
}

export async function removeDriveMembership(req: Request, res: Response) {
  const membership = await DriveMembership.findByIdAndDelete(req.params.id);
  if (!membership) throw new HttpError(404, "Membership not found");
  res.status(204).end();
}
