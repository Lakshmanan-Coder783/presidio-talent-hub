import type { Request, Response } from "express";
import { CampusDrive } from "../models/CampusDrive.model.js";
import { Candidate } from "../models/Candidate.model.js";
import { Assessment } from "../models/Assessment.model.js";
import { User } from "../models/User.model.js";
import { CollegeStudent } from "../models/CollegeStudent.model.js";
import { Offer } from "../models/Offer.model.js";
import { DriveMembership } from "../models/DriveMembership.model.js";
import { HttpError } from "../middleware/errorHandler.js";

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
// KPI cards and charts from these 6 collections (funnel/round/OA metrics from
// drives+candidates+assessments; offer economics from offers; team activity
// from driveMemberships+users). Mirrors exactly what listDrives/listCandidates/
// listAssessments/listOffers/listDriveMemberships/listUsers already return individually.
export async function getDashboardBundle(_req: Request, res: Response) {
  const [drives, candidates, assessments, offers, driveMemberships, users] = await Promise.all([
    CampusDrive.find({ deletedAt: null }).sort({ createdAt: -1 }),
    Candidate.find(),
    Assessment.find(),
    Offer.find(),
    DriveMembership.find(),
    User.find(),
  ]);
  res.json({ drives, candidates, assessments, offers, driveMemberships, users });
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

// Single-round-trip bundle for one drive's Test Detail page — scoped to just
// that drive (not every drive/candidate/assessment in the system), since the
// page only ever renders this one drive's data. Feeds the always-visible
// header (title, status pill, duration) plus every tab's initial view; each
// tab's own force-refresh (see loadDriveCandidates) narrows further per-batch
// where relevant.
export async function getTestDetailBundle(req: Request, res: Response) {
  const drive = await CampusDrive.findById(req.params.driveId);
  if (!drive) throw new HttpError(404, "Drive not found");

  const assessmentIds = [drive.assessmentId, drive.assessmentIdBatch2].filter(
    (id): id is string => !!id,
  );
  const [candidates, assessments] = await Promise.all([
    Candidate.find({ driveId: drive._id }),
    Assessment.find({ _id: { $in: assessmentIds } }),
  ]);
  res.json({ drives: [drive], candidates, assessments });
}
