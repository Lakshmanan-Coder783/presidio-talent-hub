import { Router } from "express";
import {
  listAssessments, getAssessment, createAssessment, createAssessmentForDrive, updateAssessment,
} from "../controllers/assessments.controller.js";

export const assessmentsRouter = Router();

assessmentsRouter.get("/assessments", listAssessments);
assessmentsRouter.post("/assessments", createAssessment);
assessmentsRouter.post("/drives/:driveId/assessments", createAssessmentForDrive);
assessmentsRouter.get("/assessments/:id", getAssessment);
assessmentsRouter.patch("/assessments/:id", updateAssessment);
