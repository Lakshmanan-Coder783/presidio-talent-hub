import express from "express";
import cookieParser from "cookie-parser";
import { apiRouter } from "./routes/index.js";
import { errorHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(cookieParser());

  app.use("/api", apiRouter);

  app.use(errorHandler);

  return app;
}
