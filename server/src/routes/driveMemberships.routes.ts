import { Router } from "express";
import { listMemberships, removeDriveMembership } from "../controllers/driveMemberships.controller.js";

export const driveMembershipsRouter = Router();

driveMembershipsRouter.get("/drive-memberships", listMemberships);
driveMembershipsRouter.delete("/memberships/:id", removeDriveMembership);
