/**
 * Sign-in routes, built once for each frontend:
 *   /api/v1/auth        the user app: register, login, refresh, logout, me
 *   /api/v1/admin/auth  the admin panel: admins only, no registration
 * The access token goes in the response body. The refresh token stays in an httpOnly cookie,
 * with a different name and path per frontend so the two sessions never overwrite each other.
 */
import { type CookieOptions, type Request, type Response, Router } from "express";
import rateLimit from "express-rate-limit";
import { mongo } from "mongoose";
import {
  type AuthResponse,
  deleteAccountSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "@wellpath/shared";
import { burnPasswordCheck, hashPassword, verifyPassword } from "../auth/passwords.js";
import { endSession, revokeFamily, rotateSession, startSession } from "../auth/sessions.js";
import { REFRESH_TOKEN_TTL_MS, signAccessToken } from "../auth/tokens.js";
import { env } from "../config/env.js";
import { HttpError } from "../middleware/errors.js";
import { requireAuth } from "../middleware/requireAuth.js";
import type { SessionClient } from "../models/Session.js";
import { User, type UserDocument, toPublicUser } from "../models/User.js";
import { deleteUserData, isLastAdmin } from "../services/accounts.js";
import { requestPasswordReset, resetPassword } from "../services/passwordReset.js";

type AuthRouterOptions = {
  client: SessionClient;
  cookieName: string;
  /** Must match the path this router is mounted on. */
  cookiePath: string;
  adminOnly: boolean;
  /** Lets people create and delete their own account. */
  selfService: boolean;
};

const isProduction = env.NODE_ENV === "production";
const isDuplicateKey = (err: unknown) => err instanceof mongo.MongoServerError && err.code === 11000;

function createAuthRouter({ client, cookieName, cookiePath, adminOnly, selfService }: AuthRouterOptions) {
  const router = Router();

  const cookieOptions: CookieOptions = {
    httpOnly: true,
    secure: isProduction,
    // The hosted frontends and API are on different sites, which requires SameSite=None.
    sameSite: isProduction ? "none" : "lax",
    path: cookiePath,
  };

  const credentialsLimiter = rateLimit({
    windowMs: 15 * 60_000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => env.NODE_ENV === "test",
    message: { error: "Too many attempts. Please try again later." },
  });

  /** Active, and an admin when this router is admin-only. */
  const mayUse = (user: UserDocument | null): user is UserDocument =>
    !!user && user.status === "active" && (!adminOnly || user.role === "admin");

  /** cookie-parser can turn a crafted cookie into an object, so only plain strings are accepted. */
  function readRefreshCookie(req: Request): string | null {
    const value: unknown = req.cookies?.[cookieName];
    return typeof value === "string" && value ? value : null;
  }

  function clearRefreshCookie(res: Response) {
    res.clearCookie(cookieName, cookieOptions);
  }

  async function signIn(res: Response, user: UserDocument, status = 200) {
    const refreshToken = await startSession(user._id, client);
    res.cookie(cookieName, refreshToken, { ...cookieOptions, maxAge: REFRESH_TOKEN_TTL_MS });
    const body: AuthResponse = {
      accessToken: signAccessToken({ userId: user.id, role: user.role }),
      user: toPublicUser(user),
    };
    res.status(status).json(body);
  }

  if (selfService) {
    router.post("/register", credentialsLimiter, async (req, res) => {
      const { name, email, password } = registerSchema.parse(req.body);
      const passwordHash = await hashPassword(password);
      const user = await User.create({ name, email, passwordHash }).catch((err: unknown) => {
        if (isDuplicateKey(err)) throw new HttpError(409, "An account with this email already exists");
        throw err;
      });
      await signIn(res, user, 201);
    });

    // Same answer whether or not the account exists, so this cannot be used to find out who is registered.
    router.post("/forgot-password", credentialsLimiter, async (req, res) => {
      const { email } = forgotPasswordSchema.parse(req.body);
      await requestPasswordReset(email);
      res.status(202).json({ message: "If an account exists for this email, we have sent a link to reset the password." });
    });

    router.post("/reset-password", credentialsLimiter, async (req, res) => {
      const { token, password } = resetPasswordSchema.parse(req.body);
      if (!(await resetPassword(token, password))) {
        throw new HttpError(400, "This reset link is invalid or has expired. Please request a new one.");
      }
      clearRefreshCookie(res);
      res.status(204).end();
    });

    // Asks for the password again, so a forgotten open laptop cannot delete someone's account.
    router.delete("/account", requireAuth, credentialsLimiter, async (req, res) => {
      const { password } = deleteAccountSchema.parse(req.body);
      const user = await User.findById(req.auth!.userId).select("+passwordHash");
      if (!user) throw new HttpError(401, "Not signed in");
      // 403, not 401: the session is fine, only the password is wrong.
      if (!(await verifyPassword(user.passwordHash, password))) throw new HttpError(403, "Incorrect password");
      if (await isLastAdmin(user._id)) {
        throw new HttpError(409, "You are the only admin. Make another account an admin before deleting this one.");
      }
      await deleteUserData(user._id);
      clearRefreshCookie(res);
      res.status(204).end();
    });
  }

  router.post("/login", credentialsLimiter, async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user) {
      await burnPasswordCheck(password);
      throw new HttpError(401, "Invalid email or password");
    }
    // Non-admins get the same answer as a wrong password, so the admin login reveals nothing.
    if (!(await verifyPassword(user.passwordHash, password)) || (adminOnly && user.role !== "admin")) {
      throw new HttpError(401, "Invalid email or password");
    }
    if (user.status !== "active") throw new HttpError(403, "This account is suspended");
    await signIn(res, user);
  });

  router.post("/refresh", async (req, res) => {
    const token = readRefreshCookie(req);
    const rotated = token ? await rotateSession(token, client) : null;
    const user = rotated ? await User.findById(rotated.userId) : null;
    if (!rotated || !mayUse(user)) {
      if (rotated) await revokeFamily(rotated.familyId);
      clearRefreshCookie(res);
      throw new HttpError(401, "Session expired");
    }
    res.cookie(cookieName, rotated.token, { ...cookieOptions, maxAge: REFRESH_TOKEN_TTL_MS });
    const body: AuthResponse = {
      accessToken: signAccessToken({ userId: user.id, role: user.role }),
      user: toPublicUser(user),
    };
    res.json(body);
  });

  router.post("/logout", async (req, res) => {
    const token = readRefreshCookie(req);
    if (token) await endSession(token, client);
    clearRefreshCookie(res);
    res.status(204).end();
  });

  router.get("/me", requireAuth, async (req, res) => {
    const user = await User.findById(req.auth!.userId);
    if (!mayUse(user)) throw new HttpError(401, "Not signed in");
    res.json({ user: toPublicUser(user) });
  });

  return router;
}

export const authRouter = createAuthRouter({
  client: "app",
  cookieName: "wellpath_refresh",
  cookiePath: "/api/v1/auth",
  adminOnly: false,
  selfService: true,
});

export const adminAuthRouter = createAuthRouter({
  client: "admin",
  cookieName: "wellpath_admin_refresh",
  cookiePath: "/api/v1/admin/auth",
  adminOnly: true,
  selfService: false,
});
