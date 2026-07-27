import { Router } from "express";
import { listCollegeStudents } from "../controllers/collegeStudents.controller.js";

export const collegeStudentsRouter = Router();

collegeStudentsRouter.get("/college-students", listCollegeStudents);
