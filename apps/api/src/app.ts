/**
 * Builds the Express app (without starting it), so tests can use it directly.
 */
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { env } from "./config/env.js";
import { healthRouter } from "./routes/health.js";
import { planRouter } from "./routes/plan.js";
import { errorHandler, notFound } from "./middleware/errors.js";

export function createApp() {
  const app = express();

  app.use(helmet()); // secure HTTP headers
  app.use(cors({ origin: env.corsOrigins, credentials: true })); // only our frontends
  app.use(express.json({ limit: "100kb" }));
  app.use("/api", rateLimit({ windowMs: 60_000, limit: 100 })); // 100 requests/min per IP

  app.use("/health", healthRouter);
  app.use("/api/v1/plan", planRouter);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
