import type { Request, Response } from "express";
import { DriveMembership } from "../models/DriveMembership.model.js";

export async function listMembershipsForDrive(req: Request, res: Response) {
  const memberships = await DriveMembership.find({ driveId: req.params.driveId });
  res.json(memberships);
}
