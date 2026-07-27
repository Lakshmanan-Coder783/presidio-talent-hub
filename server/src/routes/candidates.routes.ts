import { Router } from "express";
import { getCandidate } from "../controllers/candidates.controller.js";

export const candidatesRouter = Router();

candidatesRouter.get("/candidates/:id", getCandidate);
