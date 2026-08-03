import type { Request, Response } from "express";
import { Candidate } from "../models/Candidate.model.js";
import { CampusDrive } from "../models/CampusDrive.model.js";
import { Offer } from "../models/Offer.model.js";
import { Assessment } from "../models/Assessment.model.js";
import { Question } from "../models/Question.model.js";
import { nextCandidateId, nextOfferId } from "../utils/ids.js";
import { HttpError } from "../middleware/errorHandler.js";

// Server-side field redaction (the real port of redactCandidateForViewer,
// with per-role visibility) lands in the auth phase. For now this is a no-op
// pass-through since there is no session/role to redact against yet.

export async function listCandidates(_req: Request, res: Response) {
  const candidates = await Candidate.find();
  res.json(candidates);
}

export async function listCandidatesForDrive(req: Request, res: Response) {
  const candidates = await Candidate.find({ driveId: req.params.driveId });
  res.json(candidates);
}

export async function getCandidate(req: Request, res: Response) {
  const candidate = await Candidate.findById(req.params.id);
  if (!candidate) return res.status(404).json({ error: "Candidate not found" });
  res.json(candidate);
}

export async function updateCandidate(req: Request, res: Response) {
  const candidate = await Candidate.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!candidate) throw new HttpError(404, "Candidate not found");
  res.json(candidate);
}

export async function bulkUpdateCandidates(req: Request, res: Response) {
  const updates = req.body as Array<Record<string, unknown> & { id: string }>;
  const results = await Promise.all(
    updates.map(({ id, ...fields }) =>
      Candidate.findByIdAndUpdate(id, fields, { new: true, runValidators: true }),
    ),
  );
  res.json(results.filter(Boolean));
}

export async function bulkImportCandidates(req: Request, res: Response) {
  const { driveId } = req.params;
  const rows = req.body as Array<Record<string, unknown> & { email: string }>;

  const drive = await CampusDrive.findById(driveId);
  if (!drive) throw new HttpError(404, "Drive not found");

  const existingCandidates = await Candidate.find({ driveId }, { email: 1 });
  const existing = new Set(existingCandidates.map(c => c.email.toLowerCase()));

  const toInsert = [];
  for (const row of rows) {
    if (existing.has(row.email.toLowerCase())) continue; // skip duplicates within this drive
    existing.add(row.email.toLowerCase()); // guard against duplicates within the same import batch too
    toInsert.push({
      ...row,
      _id: await nextCandidateId(),
      driveId,
      college: drive.college,
      assessmentStatus: "Not Invited",
      interviewStatus: "Not Scheduled",
      offerStatus: "None",
      funnelStage: "Applied",
    });
  }

  if (toInsert.length === 0) return res.json({ imported: 0 });
  const created = await Candidate.insertMany(toInsert);
  res.status(201).json({ imported: created.length, candidates: created });
}

export async function markAttendance(req: Request, res: Response) {
  const { present } = req.body as { present: boolean };
  const candidate = await Candidate.findByIdAndUpdate(req.params.id, { attendanceMarked: present }, { new: true });
  if (!candidate) throw new HttpError(404, "Candidate not found");
  res.json(candidate);
}

export async function extendCandidateExamTime(req: Request, res: Response) {
  const { extraMinutes } = req.body as { extraMinutes: number };
  if (!extraMinutes || extraMinutes <= 0) throw new HttpError(400, "extraMinutes must be greater than 0");
  const candidate = await Candidate.findByIdAndUpdate(
    req.params.id,
    { $inc: { extraTimeMinutes: extraMinutes } },
    { new: true },
  );
  if (!candidate) throw new HttpError(404, "Candidate not found");
  res.json(candidate);
}

export async function extendDriveExamTime(req: Request, res: Response) {
  const { driveId } = req.params;
  const { extraMinutes } = req.body as { extraMinutes: number };
  if (!extraMinutes || extraMinutes <= 0) throw new HttpError(400, "extraMinutes must be greater than 0");
  const result = await Candidate.updateMany(
    { driveId, assessmentStatus: { $ne: "Completed" } },
    { $inc: { extraTimeMinutes: extraMinutes } },
  );
  res.json({ count: result.modifiedCount });
}

export async function submitCandidateAssessment(req: Request, res: Response) {
  const candidateId = req.params.id as string;
  const { assessmentId, answers, durationUsed, proctoring, deviceBrowser, deviceOS } = req.body as {
    assessmentId: string;
    answers: Record<string, string | number[] | number>;
    durationUsed: number;
    proctoring?: { windowViolationCount?: number; imageViolationCount?: number; proctoringTerminated?: boolean };
    deviceBrowser?: string;
    deviceOS?: string;
  };

  const candidate = await Candidate.findById(candidateId);
  const assessment = await Assessment.findById(assessmentId);
  if (!candidate || !assessment) throw new HttpError(404, "Candidate or assessment not found");

  // The drive's questionIds (managed in the Questions tab) are the source of
  // truth for what's actually attached to the test; assessment.questionIds is
  // set once at creation and isn't kept in sync with later edits — preserved
  // deliberately, matching the original client-side scoring logic.
  const drive = candidate.driveId ? await CampusDrive.findById(candidate.driveId) : null;
  const questionIds = drive?.questionIds?.length ? drive.questionIds : assessment.questionIds;
  const questions = await Question.find({ _id: { $in: questionIds } });
  const questionById = new Map(questions.map(q => [q._id, q]));

  let score = 0;
  const scoresBreakdown = {
    aptitude: 0, logical: 0, technical: 0, coding: 0, verbal: 0, quants: 0,
    cpp: 0, oops: 0, sql: 0, htmlcssjs: 0, subjective: 0, sqlQuery: 0,
  };

  for (const qId of questionIds) {
    const question = questionById.get(qId);
    if (!question) continue;
    const ans = answers[qId];
    let isCorrect = false;

    if (question.type === "MCQ") {
      isCorrect = ans !== undefined && question.correctOptions !== undefined && question.correctOptions[0] === Number(ans);
    } else if (question.type === "Multiple Select") {
      const userAnswers = Array.isArray(ans) ? ans : [];
      const correctAnswers = question.correctOptions || [];
      isCorrect = userAnswers.length === correctAnswers.length && userAnswers.every(v => correctAnswers.includes(v));
    } else if (question.type === "Coding") {
      isCorrect = ans !== undefined && String(ans).trim().length > 10;
    } else if (question.type === "SQL") {
      isCorrect = ans !== undefined && String(ans).toLowerCase().includes("select");
    }

    if (isCorrect) {
      score += question.marks;
      const topic = question.topic;
      if (topic === "Aptitude") scoresBreakdown.aptitude += question.marks;
      else if (topic === "Logical Reasoning" || topic === "Logical") scoresBreakdown.logical += question.marks;
      else if (topic === "Technical") scoresBreakdown.technical += question.marks;
      else if (topic === "Coding") scoresBreakdown.coding += question.marks;
      else if (topic === "Verbal") scoresBreakdown.verbal += question.marks;
      else if (topic === "Quants") scoresBreakdown.quants += question.marks;
      else if (topic === "C/C++") scoresBreakdown.cpp += question.marks;
      else if (topic === "OOPs") scoresBreakdown.oops += question.marks;
      else if (topic === "SQL") scoresBreakdown.sql += question.marks;
      else if (topic === "HTML/CSS/JS") scoresBreakdown.htmlcssjs += question.marks;
      else if (topic === "Subjective") scoresBreakdown.subjective += question.marks;
      else if (topic === "SQL Query") scoresBreakdown.sqlQuery += question.marks;
    }
  }

  const totalMarks = questions.reduce((s, q) => s + q.marks, 0);

  await Candidate.findByIdAndUpdate(candidateId, {
    assessmentStatus: "Completed",
    assessmentScore: score,
    assessmentTotalMarks: totalMarks,
    assessmentDurationUsed: durationUsed,
    assessmentSubmissionDate: new Date().toISOString(),
    sectionScores: scoresBreakdown,
    funnelStage: "Online Test",
    deviceBrowser,
    deviceOS,
    windowViolationCount: proctoring?.windowViolationCount,
    imageViolationCount: proctoring?.imageViolationCount,
    proctoringTerminated: proctoring?.proctoringTerminated,
  });

  // Re-evaluate ranks & percentiles across every completed candidate on this assessment.
  const assessmentCandidates = await Candidate.find({ assessmentId, assessmentStatus: "Completed" }).sort({ assessmentScore: -1 });
  const count = assessmentCandidates.length;
  await Promise.all(assessmentCandidates.map((c, idx) => {
    const percentile = count > 1 ? parseFloat((((count - (idx + 1)) / (count - 1)) * 100).toFixed(1)) : 100.0;
    return Candidate.updateOne({ _id: c._id }, { assessmentRank: idx + 1, assessmentPercentile: percentile });
  }));

  const finalCandidate = await Candidate.findById(candidateId);
  res.json(finalCandidate);
}

export async function updateOfferStatus(req: Request, res: Response) {
  const candidateId = req.params.id as string;
  const { status } = req.body as { status: "None" | "Offered" | "Accepted" | "Declined" | "Joined" };

  const fields: Record<string, unknown> = { offerStatus: status };
  if (status === "Offered") fields.funnelStage = "Offered";
  if (status === "Joined") fields.funnelStage = "Joined";
  const candidate = await Candidate.findByIdAndUpdate(candidateId, fields, { new: true });
  if (!candidate) throw new HttpError(404, "Candidate not found");

  let offer = null;
  if (status !== "None") {
    const existingOffer = await Offer.findOne({ candidateId });
    if (existingOffer) {
      offer = await Offer.findOneAndUpdate({ candidateId }, { status }, { new: true });
    } else {
      offer = await Offer.create({
        _id: await nextOfferId(),
        candidateId,
        candidateName: candidate.name,
        college: candidate.college,
        ctc: 8.5,
        status,
        dateReleased: new Date().toISOString().split("T")[0],
      });
    }
  } else {
    await Offer.deleteOne({ candidateId });
  }

  res.json({ candidate, offer });
}
