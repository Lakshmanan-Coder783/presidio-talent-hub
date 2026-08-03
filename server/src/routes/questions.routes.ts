import { Router } from "express";
import { listQuestions, createQuestion, updateQuestion, bulkImportQuestions } from "../controllers/questions.controller.js";

export const questionsRouter = Router();

questionsRouter.get("/questions", listQuestions);
questionsRouter.post("/questions", createQuestion);
questionsRouter.post("/questions/bulk-import", bulkImportQuestions);
questionsRouter.patch("/questions/:id", updateQuestion);
