/** 404 for unknown routes, and one place that turns errors into clean JSON responses. */
import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError, z } from "zod";

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ error: "Not found" });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    res.status(400).json({ error: "Validation failed", details: z.flattenError(err).fieldErrors });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
};
