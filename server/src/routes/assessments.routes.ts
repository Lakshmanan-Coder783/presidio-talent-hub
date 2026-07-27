import { Router } from "express";
import { listAssessments, getAssessment } from "../controllers/assessments.controller.js";

export const assessmentsRouter = Router();

assessmentsRouter.get("/assessments", listAssessments);
assessmentsRouter.get("/assessments/:id", getAssessment);
