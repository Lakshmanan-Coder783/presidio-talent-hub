import type { Request, Response } from "express";
import { Interview } from "../models/Interview.model.js";
import { Candidate } from "../models/Candidate.model.js";
import { nextInterviewId } from "../utils/ids.js";

export async function listInterviews(req: Request, res: Response) {
  const { candidateId } = req.query;
  const filter: Record<string, unknown> = {};
  if (typeof candidateId === "string") filter.candidateId = candidateId;
  const interviews = await Interview.find(filter);
  res.json(interviews);
}

export async function createInterview(req: Request, res: Response) {
  const data = req.body as {
    candidateId: string; candidateName: string; panelName: string; date: string; time: string;
    stage: "Interview" | "Coding Exercise" | "Whiteboard Interview";
    status: "Scheduled" | "Completed" | "Cancelled"; feedback?: string; rating?: number;
  };

  const interview = await Interview.create({ ...data, _id: await nextInterviewId() });

  const candidate = await Candidate.findByIdAndUpdate(
    data.candidateId,
    { interviewStatus: "Scheduled", funnelStage: data.stage },
    { new: true },
  );

  res.status(201).json({ interview, candidate });
}
