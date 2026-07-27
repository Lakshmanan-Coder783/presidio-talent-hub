import type { ErrorRequestHandler } from "express";

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// Express only recognizes error-handling middleware by arity (4 args), so
// `next` must stay in the signature even though this handler never calls it.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const status = err instanceof HttpError ? err.status : 500;
  if (status === 500) {
    console.error(err);
  }
  res.status(status).json({ error: err instanceof Error ? err.message : "Internal server error" });
};
