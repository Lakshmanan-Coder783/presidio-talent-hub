import { Router } from "express";
import { listInterviews } from "../controllers/interviews.controller.js";

export const interviewsRouter = Router();

interviewsRouter.get("/interviews", listInterviews);
