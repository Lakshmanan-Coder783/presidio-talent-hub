import { Router } from "express";
import { listInterviews, createInterview } from "../controllers/interviews.controller.js";

export const interviewsRouter = Router();

interviewsRouter.get("/interviews", listInterviews);
interviewsRouter.post("/interviews", createInterview);
