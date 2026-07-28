import { Router } from "express";
import {
  listCollegeStudents, importCollegeStudents, deleteCollegeStudents,
} from "../controllers/collegeStudents.controller.js";

export const collegeStudentsRouter = Router();

collegeStudentsRouter.get("/college-students", listCollegeStudents);
collegeStudentsRouter.post("/college-students/import", importCollegeStudents);
collegeStudentsRouter.delete("/college-students", deleteCollegeStudents);
