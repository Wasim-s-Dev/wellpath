/** 404 for unknown routes, and one place that turns errors into clean JSON responses. */
import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError, z } from "zod";

/** An expected failure whose message is safe to show to the client. */
export class HttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ error: "Not found" });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json({ error: "Validation failed", details: z.flattenError(err).fieldErrors });
    return;
  }
  // Client errors raised by middleware, such as malformed JSON (400) or an oversized body (413).
  if (typeof err.status === "number" && err.status >= 400 && err.status < 500) {
    res.status(err.status).json({ error: err.status === 413 ? "Request body too large" : "Invalid request" });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
};
