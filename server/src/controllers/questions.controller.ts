import type { Request, Response } from "express";
import { Question } from "../models/Question.model.js";

export async function listQuestions(req: Request, res: Response) {
  const { topic, tag } = req.query;
  const filter: Record<string, unknown> = {};
  if (typeof topic === "string") filter.topic = topic;
  if (typeof tag === "string") filter.tags = tag;
  const questions = await Question.find(filter);
  res.json(questions);
}
