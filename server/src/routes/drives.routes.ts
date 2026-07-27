import { Router } from "express";
import { listDrives, listTrashedDrives, getDrive } from "../controllers/drives.controller.js";
import { listCandidatesForDrive } from "../controllers/candidates.controller.js";
import { listMembershipsForDrive } from "../controllers/driveMemberships.controller.js";

export const drivesRouter = Router();

drivesRouter.get("/drives", listDrives);
drivesRouter.get("/drives/trash", listTrashedDrives);
drivesRouter.get("/drives/:id", getDrive);
drivesRouter.get("/drives/:driveId/candidates", listCandidatesForDrive);
drivesRouter.get("/drives/:driveId/memberships", listMembershipsForDrive);
