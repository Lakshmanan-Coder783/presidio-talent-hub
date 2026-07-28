import { Router } from "express";
import {
  listCandidates, getCandidate, updateCandidate, bulkUpdateCandidates,
  markAttendance, extendCandidateExamTime, updateOfferStatus, submitCandidateAssessment,
} from "../controllers/candidates.controller.js";

export const candidatesRouter = Router();

candidatesRouter.get("/candidates", listCandidates);
candidatesRouter.patch("/candidates/bulk", bulkUpdateCandidates);
candidatesRouter.get("/candidates/:id", getCandidate);
candidatesRouter.patch("/candidates/:id", updateCandidate);
candidatesRouter.patch("/candidates/:id/attendance", markAttendance);
candidatesRouter.patch("/candidates/:id/extend-time", extendCandidateExamTime);
candidatesRouter.patch("/candidates/:id/offer-status", updateOfferStatus);
candidatesRouter.post("/candidates/:id/submit-assessment", submitCandidateAssessment);
