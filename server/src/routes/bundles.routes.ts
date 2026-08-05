import { Router } from "express";
import { getCampusDrivePageBundle, getDashboardBundle, getCollegeReportBundle, getTestDetailBundle } from "../controllers/bundles.controller.js";

export const bundlesRouter = Router();

bundlesRouter.get("/campus-drive-bundle", getCampusDrivePageBundle);
bundlesRouter.get("/dashboard-bundle", getDashboardBundle);
bundlesRouter.get("/college-report-bundle", getCollegeReportBundle);
bundlesRouter.get("/test-detail-bundle", getTestDetailBundle);
