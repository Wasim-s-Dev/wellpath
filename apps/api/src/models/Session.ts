/**
 * One refresh token. Only its hash is stored, so a database leak does not expose live sessions.
 * Tokens rotated from the same login share a familyId, which lets a replayed token end the whole login.
 */
import { Schema, model } from "mongoose";

/** Which frontend a session belongs to. App and admin sessions never unlock each other. */
export const SESSION_CLIENTS = ["app", "admin"] as const;
export type SessionClient = (typeof SESSION_CLIENTS)[number];

const sessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    client: { type: String, enum: SESSION_CLIENTS, required: true },
    familyId: { type: String, required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    revokedAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true, expires: 0 }, // MongoDB deletes the row at this time
  },
  { timestamps: true },
);

export const Session = model("Session", sessionSchema);
