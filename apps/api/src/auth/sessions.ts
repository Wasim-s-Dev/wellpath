/** Refresh token sessions: each token works once, and replaying a used one ends the login. */
import { randomUUID } from "node:crypto";
import type { Types } from "mongoose";
import { Session } from "../models/Session.js";
import { REFRESH_TOKEN_TTL_MS, hashToken, newRefreshToken } from "./tokens.js";

export async function startSession(userId: Types.ObjectId, familyId: string = randomUUID()): Promise<string> {
  const token = newRefreshToken();
  await Session.create({
    userId,
    familyId,
    tokenHash: hashToken(token),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  });
  return token;
}

export async function revokeFamily(familyId: string): Promise<void> {
  await Session.updateMany({ familyId, revokedAt: null }, { revokedAt: new Date() });
}

/** Swaps a refresh token for a new one. Returns null if it is unknown, expired or already used. */
export async function rotateSession(token: string) {
  const tokenHash = hashToken(token);
  const now = new Date();
  // Atomic, so two simultaneous requests cannot both spend the same token.
  const session = await Session.findOneAndUpdate(
    { tokenHash, revokedAt: null, expiresAt: { $gt: now } },
    { revokedAt: now },
  );
  if (!session) {
    const spent = await Session.findOne({ tokenHash, revokedAt: { $ne: null } });
    if (spent) await revokeFamily(spent.familyId);
    return null;
  }
  return {
    userId: session.userId,
    familyId: session.familyId,
    token: await startSession(session.userId, session.familyId),
  };
}

export async function endSession(token: string): Promise<void> {
  const session = await Session.findOne({ tokenHash: hashToken(token) });
  if (session) await revokeFamily(session.familyId);
}
