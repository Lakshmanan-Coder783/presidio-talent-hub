import type { Request, Response } from "express";
import { CampusDrive } from "../models/CampusDrive.model.js";

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
