/**
 * /api/v1/profile: the signed-in user's onboarding answers and the targets built from them.
 * Targets are calculated on every read, so they always follow the current engine rules.
 */
import { type Request, type Response, Router } from "express";
import { calculateDailyTargets, conditionNotices } from "@wellpath/engine";
import { onboardingSchema } from "@wellpath/shared";
import { HttpError } from "../middleware/errors.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { User, type UserDocument, toSavedProfile } from "../models/User.js";

export const profileRouter = Router();
profileRouter.use(requireAuth);

async function activeUser(req: Request): Promise<UserDocument> {
  const user = await User.findById(req.auth!.userId);
  if (!user || user.status !== "active") throw new HttpError(401, "Not signed in");
  return user;
}

function sendProfile(res: Response, user: UserDocument) {
  const profile = toSavedProfile(user);
  res.json({
    profile,
    targets: profile ? calculateDailyTargets(profile) : null,
    notices: profile ? conditionNotices(profile.conditions) : [],
  });
}

profileRouter.get("/", async (req, res) => {
  sendProfile(res, await activeUser(req));
});

profileRouter.put("/", async (req, res) => {
  const { healthDataConsent: _consent, ...answers } = onboardingSchema.parse(req.body);
  const user = await activeUser(req);
  user.profile = { ...answers, consentedAt: user.profile?.consentedAt ?? new Date() };
  await user.save();
  sendProfile(res, user);
});
