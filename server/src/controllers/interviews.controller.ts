import type { Request, Response } from "express";
import { Interview } from "../models/Interview.model.js";

export async function listInterviews(req: Request, res: Response) {
  const { candidateId } = req.query;
  const filter: Record<string, unknown> = {};
  if (typeof candidateId === "string") filter.candidateId = candidateId;
  const interviews = await Interview.find(filter);
  res.json(interviews);
}
