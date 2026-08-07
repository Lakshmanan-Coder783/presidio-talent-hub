import type { Request, Response } from "express";
import { Assessment } from "../models/Assessment.model.js";
import { CampusDrive } from "../models/CampusDrive.model.js";
import { nextAssessmentId } from "../utils/ids.js";
import { HttpError } from "../middleware/errorHandler.js";

export async function listAssessments(_req: Request, res: Response) {
  const assessments = await Assessment.find();
  res.json(assessments);
}

export async function getAssessment(req: Request, res: Response) {
  const assessment = await Assessment.findById(req.params.id);
  if (!assessment) return res.status(404).json({ error: "Assessment not found" });
  res.json(assessment);
}

export async function createAssessment(req: Request, res: Response) {
  const assessment = await Assessment.create({
    ...req.body,
    _id: await nextAssessmentId(),
    candidatesAssignedCount: 0,
  });
  res.status(201).json(assessment);
}

// Atomically creates a new assessment AND links it (+ its question list) to the
// drive, so the two writes can't leave the drive pointing at a half-created
// assessment (mirrors the frontend's previous single-tick createAssessmentForDrive).
// batchSlot picks which of the drive's (up to two) test slots this assessment fills —
// "batch2" is the optional second/afternoon session; default "batch1" is today's
// single-batch behavior, unchanged.
export async function createAssessmentForDrive(req: Request, res: Response) {
  const { driveId } = req.params;
  const { driveQuestionIds, batchSlot, ...data } = req.body as Record<string, unknown> & {
    driveQuestionIds?: string[];
    batchSlot?: "batch1" | "batch2";
  };

  const assessment = await Assessment.create({
    ...data,
    _id: await nextAssessmentId(),
    candidatesAssignedCount: 0,
  });

  const driveUpdate =
    batchSlot === "batch2"
      ? { assessmentIdBatch2: assessment._id, questionIdsBatch2: driveQuestionIds ?? [] }
      : { assessmentId: assessment._id, questionIds: driveQuestionIds ?? [] };

  const drive = await CampusDrive.findByIdAndUpdate(driveId, driveUpdate, { new: true });
  if (!drive) throw new HttpError(404, "Drive not found");

  res.status(201).json({ assessment, drive });
}

export async function updateAssessment(req: Request, res: Response) {
  const assessment = await Assessment.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!assessment) throw new HttpError(404, "Assessment not found");
  res.json(assessment);
}
