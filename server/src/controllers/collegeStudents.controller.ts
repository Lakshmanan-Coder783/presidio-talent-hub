import type { Request, Response } from "express";
import { CollegeStudent } from "../models/CollegeStudent.model.js";
import { nextCollegeStudentId } from "../utils/ids.js";
import { HttpError } from "../middleware/errorHandler.js";

export async function listCollegeStudents(req: Request, res: Response) {
  const { college } = req.query;
  const filter: Record<string, unknown> = {};
  if (typeof college === "string") filter.college = college;
  const students = await CollegeStudent.find(filter);
  res.json(students);
}

export async function importCollegeStudents(req: Request, res: Response) {
  const college = req.query.college as string | undefined;
  const rows = req.body as Array<Record<string, unknown> & { email?: string }>;
  if (!college) throw new HttpError(400, "college query param is required");

  const existingStudents = await CollegeStudent.find({ college }, { email: 1 });
  const existing = new Set(existingStudents.map(s => s.email.toLowerCase()));

  const toInsert = [];
  let idx = 0;
  for (const row of rows) {
    if (!row.email || existing.has(row.email.toLowerCase())) { idx++; continue; }
    existing.add(row.email.toLowerCase());
    toInsert.push({
      ...row,
      _id: nextCollegeStudentId(college, idx),
      college,
      importedAt: new Date(),
    });
    idx++;
  }

  if (toInsert.length === 0) return res.json({ imported: 0 });
  const created = await CollegeStudent.insertMany(toInsert);
  res.status(201).json({ imported: created.length, students: created });
}

export async function deleteCollegeStudents(req: Request, res: Response) {
  const college = req.query.college as string | undefined;
  if (!college) throw new HttpError(400, "college query param is required");
  await CollegeStudent.deleteMany({ college });
  res.status(204).end();
}
