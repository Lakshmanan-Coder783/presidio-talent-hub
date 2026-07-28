import { Router } from "express";
import { listQuestions, createQuestion, updateQuestion } from "../controllers/questions.controller.js";

export const questionsRouter = Router();

questionsRouter.get("/questions", listQuestions);
questionsRouter.post("/questions", createQuestion);
questionsRouter.patch("/questions/:id", updateQuestion);
