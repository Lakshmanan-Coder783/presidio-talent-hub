import type { Request, Response } from "express";
import { CollegeStudent } from "../models/CollegeStudent.model.js";

export async function listCollegeStudents(req: Request, res: Response) {
  const { college } = req.query;
  const filter: Record<string, unknown> = {};
  if (typeof college === "string") filter.college = college;
  const students = await CollegeStudent.find(filter);
  res.json(students);
}
