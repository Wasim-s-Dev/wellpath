/**
 * /api/v1/auth: register, login, refresh, logout and current user.
 * The access token goes in the response body. The refresh token stays in an httpOnly cookie.
 */
import { type CookieOptions, type Request, type Response, Router } from "express";
import rateLimit from "express-rate-limit";
import { mongo } from "mongoose";
import { type AuthResponse, loginSchema, registerSchema } from "@wellpath/shared";
import { burnPasswordCheck, hashPassword, verifyPassword } from "../auth/passwords.js";
import { endSession, revokeFamily, rotateSession, startSession } from "../auth/sessions.js";
import { REFRESH_TOKEN_TTL_MS, signAccessToken } from "../auth/tokens.js";
import { env } from "../config/env.js";
import { HttpError } from "../middleware/errors.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { User, type UserDocument, toPublicUser } from "../models/User.js";

export const authRouter = Router();

const REFRESH_COOKIE = "wellpath_refresh";
const isProduction = env.NODE_ENV === "production";

const refreshCookie: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  // The hosted frontends and API are on different sites, which requires SameSite=None.
  sameSite: isProduction ? "none" : "lax",
  path: "/api/v1/auth",
};

const credentialsLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === "test",
  message: { error: "Too many attempts. Please try again later." },
});

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, { ...refreshCookie, maxAge: REFRESH_TOKEN_TTL_MS });
}

/** cookie-parser can turn a crafted cookie into an object, so only plain strings are accepted. */
function readRefreshCookie(req: Request): string | null {
  const value: unknown = req.cookies?.[REFRESH_COOKIE];
  return typeof value === "string" && value ? value : null;
}

function authResponse(user: UserDocument): AuthResponse {
  return {
    accessToken: signAccessToken({ userId: user.id, role: user.role }),
    user: toPublicUser(user),
  };
}

const isDuplicateKey = (err: unknown) => err instanceof mongo.MongoServerError && err.code === 11000;

authRouter.post("/register", credentialsLimiter, async (req, res) => {
  const { name, email, password } = registerSchema.parse(req.body);
  const passwordHash = await hashPassword(password);
  const user = await User.create({ name, email, passwordHash }).catch((err: unknown) => {
    if (isDuplicateKey(err)) throw new HttpError(409, "An account with this email already exists");
    throw err;
  });
  setRefreshCookie(res, await startSession(user._id));
  res.status(201).json(authResponse(user));
});

authRouter.post("/login", credentialsLimiter, async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user) {
    await burnPasswordCheck(password);
    throw new HttpError(401, "Invalid email or password");
  }
  if (!(await verifyPassword(user.passwordHash, password))) {
    throw new HttpError(401, "Invalid email or password");
  }
  if (user.status !== "active") throw new HttpError(403, "This account is suspended");
  setRefreshCookie(res, await startSession(user._id));
  res.json(authResponse(user));
});

authRouter.post("/refresh", async (req, res) => {
  const token = readRefreshCookie(req);
  const rotated = token ? await rotateSession(token) : null;
  if (!rotated) {
    res.clearCookie(REFRESH_COOKIE, refreshCookie);
    throw new HttpError(401, "Session expired");
  }
  const user = await User.findById(rotated.userId);
  if (!user || user.status !== "active") {
    await revokeFamily(rotated.familyId);
    res.clearCookie(REFRESH_COOKIE, refreshCookie);
    throw new HttpError(401, "Session expired");
  }
  setRefreshCookie(res, rotated.token);
  res.json(authResponse(user));
});

authRouter.post("/logout", async (req, res) => {
  const token = readRefreshCookie(req);
  if (token) await endSession(token);
  res.clearCookie(REFRESH_COOKIE, refreshCookie);
  res.status(204).end();
});

authRouter.get("/me", requireAuth, async (req, res) => {
  const user = await User.findById(req.auth!.userId);
  if (!user || user.status !== "active") throw new HttpError(401, "Not signed in");
  res.json({ user: toPublicUser(user) });
});
