/**
 * One refresh token. Only its hash is stored, so a database leak does not expose live sessions.
 * Tokens rotated from the same login share a familyId, which lets a replayed token end the whole login.
 */
import { Schema, model } from "mongoose";

const sessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    familyId: { type: String, required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    revokedAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true, expires: 0 }, // MongoDB deletes the row at this time
  },
  { timestamps: true },
);

export const Session = model("Session", sessionSchema);
