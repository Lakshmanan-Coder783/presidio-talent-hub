import { Router } from "express";
import { drivesRouter } from "./drives.routes.js";
import { candidatesRouter } from "./candidates.routes.js";
import { assessmentsRouter } from "./assessments.routes.js";
import { questionsRouter } from "./questions.routes.js";
import { interviewsRouter } from "./interviews.routes.js";
import { offersRouter } from "./offers.routes.js";
import { collegeStudentsRouter } from "./collegeStudents.routes.js";
import { usersRouter } from "./users.routes.js";
import { driveMembershipsRouter } from "./driveMemberships.routes.js";
import { bundlesRouter } from "./bundles.routes.js";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

apiRouter.use(drivesRouter);
apiRouter.use(candidatesRouter);
apiRouter.use(assessmentsRouter);
apiRouter.use(questionsRouter);
apiRouter.use(interviewsRouter);
apiRouter.use(offersRouter);
apiRouter.use(collegeStudentsRouter);
apiRouter.use(usersRouter);
apiRouter.use(driveMembershipsRouter);
apiRouter.use(bundlesRouter);

// Auth and mutating (POST/PATCH/DELETE) routers mount here as later phases
// of the backend plan land.
