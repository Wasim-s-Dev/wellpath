/** Rejects requests without a valid access token and exposes the caller as req.auth. */
import type { RequestHandler } from "express";
import { type AccessClaims, verifyAccessToken } from "../auth/tokens.js";
import { HttpError } from "./errors.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AccessClaims;
    }
  }
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const [scheme, token] = req.get("authorization")?.split(" ") ?? [];
  const claims = scheme === "Bearer" && token ? verifyAccessToken(token) : null;
  if (!claims) throw new HttpError(401, "Not signed in");
  req.auth = claims;
  next();
};
