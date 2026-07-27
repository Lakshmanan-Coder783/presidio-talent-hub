import type { Request, Response } from "express";
import { Assessment } from "../models/Assessment.model.js";

export async function listAssessments(_req: Request, res: Response) {
  const assessments = await Assessment.find();
  res.json(assessments);
}

export async function getAssessment(req: Request, res: Response) {
  const assessment = await Assessment.findById(req.params.id);
  if (!assessment) return res.status(404).json({ error: "Assessment not found" });
  res.json(assessment);
}
