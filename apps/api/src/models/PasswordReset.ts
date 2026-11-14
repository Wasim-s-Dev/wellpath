/**
 * A one-time password reset link. Only the token's hash is stored.
 * Links work for 30 minutes, but rows are kept for a day so the per-hour request limit can count them.
 */
import { Schema, model } from "mongoose";

const passwordResetSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
    deleteAt: { type: Date, required: true, expires: 0 }, // MongoDB removes the row at this time
  },
  { timestamps: true },
);

export const PasswordReset = model("PasswordReset", passwordResetSchema);
