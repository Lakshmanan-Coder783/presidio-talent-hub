import { Router } from "express";
import { listQuestions } from "../controllers/questions.controller.js";

export const questionsRouter = Router();

questionsRouter.get("/questions", listQuestions);
