import type { Request, Response } from "express";
import { CampusDrive } from "../models/CampusDrive.model.js";
import { Candidate } from "../models/Candidate.model.js";
import { Assessment } from "../models/Assessment.model.js";
import { User } from "../models/User.model.js";
import { CollegeStudent } from "../models/CollegeStudent.model.js";

// Single-round-trip bundle for the Campus Drive ("Tests") list page, which
// renders from all 5 of these collections at once (drive rows, per-drive
// registered/progress counts, SPOC picker, uploaded-student counts). Mirrors
// exactly what listDrives/listCandidates/listAssessments/listUsers/
// listCollegeStudents already return individually.
export async function getCampusDrivePageBundle(_req: Request, res: Response) {
  const [drives, candidates, assessments, users, collegeStudents] = await Promise.all([
    CampusDrive.find({ deletedAt: null }).sort({ createdAt: -1 }),
    Candidate.find(),
    Assessment.find(),
    User.find(),
    CollegeStudent.find(),
  ]);
  res.json({ drives, candidates, assessments, users, collegeStudents });
}

// Single-round-trip bundle for the Executive Dashboard, which computes its
// KPI cards and charts from these 3 collections. Mirrors exactly what
// listDrives/listCandidates/listAssessments already return individually.
export async function getDashboardBundle(_req: Request, res: Response) {
  const [drives, candidates, assessments] = await Promise.all([
    CampusDrive.find({ deletedAt: null }).sort({ createdAt: -1 }),
    Candidate.find(),
    Assessment.find(),
  ]);
  res.json({ drives, candidates, assessments });
}

// Single-round-trip bundle for the College Report page, which computes
// selected-candidate counts per college/year from these 2 collections.
export async function getCollegeReportBundle(_req: Request, res: Response) {
  const [drives, candidates] = await Promise.all([
    CampusDrive.find({ deletedAt: null }).sort({ createdAt: -1 }),
    Candidate.find(),
  ]);
  res.json({ drives, candidates });
}
