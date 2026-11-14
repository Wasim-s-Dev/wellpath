/** Short-lived JWT access tokens and random refresh tokens. */
import { createHash, randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";
import { ROLES, type Role } from "@wellpath/shared";
import { env } from "../config/env.js";

const ISSUER = "wellpath-api";
const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;

export const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type AccessClaims = { userId: string; role: Role };

function jwtSecret(): string {
  if (!env.JWT_SECRET) throw new Error("JWT_SECRET is not set");
  return env.JWT_SECRET;
}

export function signAccessToken({ userId, role }: AccessClaims): string {
  return jwt.sign({ role }, jwtSecret(), {
    algorithm: "HS256",
    issuer: ISSUER,
    subject: userId,
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  });
}

/** Returns the claims, or null when the token is invalid or expired. */
export function verifyAccessToken(token: string): AccessClaims | null {
  try {
    const claims = jwt.verify(token, jwtSecret(), { algorithms: ["HS256"], issuer: ISSUER });
    if (typeof claims === "string" || !claims.sub) return null;
    const role = ROLES.find((r) => r === claims.role);
    return role ? { userId: claims.sub, role } : null;
  } catch {
    return null;
  }
}

/** 256 random bits, safe to put in a cookie or a URL. Store only its hash. */
export const newSecretToken = () => randomBytes(32).toString("base64url");
export const newRefreshToken = newSecretToken;

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
