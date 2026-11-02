/** GET /health: used by Render and uptime checks to see the API is alive. */
import { Router } from "express";
import type { HealthResponse } from "@wellpath/shared";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  const body: HealthResponse = { status: "ok", service: "wellpath-api", time: new Date().toISOString() };
  res.json(body);
});
