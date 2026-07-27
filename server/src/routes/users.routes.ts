import { Router } from "express";
import { listUsers } from "../controllers/users.controller.js";

export const usersRouter = Router();

usersRouter.get("/users", listUsers);
