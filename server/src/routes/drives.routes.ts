import { Router } from "express";
import {
  listDrives, listTrashedDrives, getDrive, createDrive, updateDrive,
  deleteDrive, restoreDrive, permanentlyDeleteDrive, bulkInvite, activateDriveInvites,
} from "../controllers/drives.controller.js";
import {
  listCandidatesForDrive, bulkImportCandidates, extendDriveExamTime,
} from "../controllers/candidates.controller.js";
import { listMembershipsForDrive, addDriveMembership } from "../controllers/driveMemberships.controller.js";

export const drivesRouter = Router();

drivesRouter.get("/drives", listDrives);
drivesRouter.get("/drives/trash", listTrashedDrives);
drivesRouter.post("/drives", createDrive);
drivesRouter.get("/drives/:id", getDrive);
drivesRouter.patch("/drives/:id", updateDrive);
drivesRouter.delete("/drives/:id", deleteDrive);
drivesRouter.post("/drives/:id/restore", restoreDrive);
drivesRouter.delete("/drives/:id/permanent", permanentlyDeleteDrive);
drivesRouter.get("/drives/:driveId/candidates", listCandidatesForDrive);
drivesRouter.post("/drives/:driveId/candidates/import", bulkImportCandidates);
drivesRouter.patch("/drives/:driveId/extend-time", extendDriveExamTime);
drivesRouter.get("/drives/:driveId/memberships", listMembershipsForDrive);
drivesRouter.post("/drives/:driveId/memberships", addDriveMembership);
drivesRouter.patch("/drives/:driveId/bulk-invite", bulkInvite);
drivesRouter.post("/drives/:driveId/invites/activate", activateDriveInvites);
