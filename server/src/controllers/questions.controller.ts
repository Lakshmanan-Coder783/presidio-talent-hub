import type { Request, Response } from "express";
import { Question } from "../models/Question.model.js";
import { nextQuestionId } from "../utils/ids.js";
import { HttpError } from "../middleware/errorHandler.js";

export async function listQuestions(req: Request, res: Response) {
  const { topic, tag } = req.query;
  const filter: Record<string, unknown> = {};
  if (typeof topic === "string") filter.topic = topic;
  if (typeof tag === "string") filter.tags = tag;
  const questions = await Question.find(filter);
  res.json(questions);
}

export async function createQuestion(req: Request, res: Response) {
  const question = await Question.create({ ...req.body, _id: await nextQuestionId() });
  res.status(201).json(question);
}

export async function updateQuestion(req: Request, res: Response) {
  const question = await Question.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!question) throw new HttpError(404, "Question not found");
  res.json(question);
}
