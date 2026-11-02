/**
 * POST /api/v1/plan/preview
 * Takes onboarding answers and returns calorie + macro targets from the rule engine.
 * No login needed yet; this is the first real feature to build on.
 */
import { Router } from "express";
import { profileSchema } from "@wellpath/shared";
import { calculateDailyTargets } from "@wellpath/engine";

export const planRouter = Router();

planRouter.post("/preview", (req, res) => {
  const profile = profileSchema.parse(req.body); // throws ZodError -> 400 via error handler
  res.json({ targets: calculateDailyTargets(profile) });
});
