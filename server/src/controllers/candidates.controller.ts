import type { Request, Response } from "express";
import { Candidate } from "../models/Candidate.model.js";

// Server-side field redaction (the real port of redactCandidateForViewer,
// with per-role visibility) lands in the auth phase. For now this is a no-op
// pass-through since there is no session/role to redact against yet.

export async function listCandidatesForDrive(req: Request, res: Response) {
  const candidates = await Candidate.find({ driveId: req.params.driveId });
  res.json(candidates);
}

export async function getCandidate(req: Request, res: Response) {
  const candidate = await Candidate.findById(req.params.id);
  if (!candidate) return res.status(404).json({ error: "Candidate not found" });
  res.json(candidate);
}
