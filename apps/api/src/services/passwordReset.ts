/** Forgot password: one-time links sent by email, and setting a new password with one. */
import { hashPassword } from "../auth/passwords.js";
import { hashToken, newSecretToken } from "../auth/tokens.js";
import { env } from "../config/env.js";
import { PasswordReset } from "../models/PasswordReset.js";
import { Session } from "../models/Session.js";
import { User } from "../models/User.js";
import { renderEmail } from "./emailTemplate.js";
import { type Mail, sendMail } from "./mailer.js";

export const RESET_LINK_TTL_MINUTES = 30;
/** Stops someone flooding a person's inbox with reset emails. */
const MAX_REQUESTS_PER_HOUR = 3;
const HOUR_MS = 60 * 60_000;

/**
 * Emails a reset link if an active account exists. Callers must respond the same way either way,
 * so the form never reveals who has an account. Sending is not awaited, so slow email does not
 * make known addresses take longer to answer.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const user = await User.findOne({ email });
  if (!user || user.status !== "active") return;

  const now = Date.now();
  const recent = await PasswordReset.countDocuments({ userId: user._id, createdAt: { $gte: new Date(now - HOUR_MS) } });
  if (recent >= MAX_REQUESTS_PER_HOUR) return;

  // Only the newest link works.
  await PasswordReset.updateMany({ userId: user._id, usedAt: null }, { usedAt: new Date(now) });
  const token = newSecretToken();
  await PasswordReset.create({
    userId: user._id,
    tokenHash: hashToken(token),
    expiresAt: new Date(now + RESET_LINK_TTL_MINUTES * 60_000),
    deleteAt: new Date(now + 24 * HOUR_MS),
  });

  // The token goes after #, so browsers never send it to a server or leak it in the Referer header.
  const link = `${env.APP_URL}/reset-password#token=${token}`;
  void sendMail(resetEmail(user, link)).catch((err: unknown) => console.error("Password reset email failed:", err));
}

type Recipient = { name: string; email: string };

export function resetEmail(user: Recipient, link: string): Mail {
  const { html, attachments } = renderEmail({
    preheader: `Use this link within ${RESET_LINK_TTL_MINUTES} minutes to choose a new password.`,
    icon: "password-reset",
    heading: "Reset your password",
    paragraphs: [
      `Hi ${user.name},`,
      "We received a request to reset the password for your WellPath account. Click the button below to choose a new one.",
    ],
    button: { label: "Reset password", url: link },
    note: `This link expires in ${RESET_LINK_TTL_MINUTES} minutes and can only be used once. If you did not ask for this, you can ignore this email. Your password will not change.`,
    reason: `You received this email because a password reset was requested for ${user.email}.`,
  });
  return {
    to: user.email,
    subject: "Reset your WellPath password",
    text: `Hi ${user.name},\n\nWe received a request to reset the password for your WellPath account. Open this link to choose a new one:\n\n${link}\n\nThis link expires in ${RESET_LINK_TTL_MINUTES} minutes and can only be used once. If you did not ask for this, you can ignore this email. Your password will not change.\n\nWellPath`,
    html,
    attachments,
  };
}

export function passwordChangedEmail(user: Recipient): Mail {
  const resetLink = `${env.APP_URL}/forgot-password`;
  const { html, attachments } = renderEmail({
    preheader: "Your password was changed and you were signed out on all devices.",
    icon: "password-changed",
    heading: "Your password was changed",
    paragraphs: [
      `Hi ${user.name},`,
      "The password for your WellPath account was just changed. For your security, you have been signed out on all devices.",
      "If you made this change, there is nothing else to do.",
    ],
    button: { label: "This was not me", url: resetLink },
    note: "If you did not change your password, reset it straight away to secure your account.",
    reason: `You received this email because the password for ${user.email} was changed.`,
  });
  return {
    to: user.email,
    subject: "Your WellPath password was changed",
    text: `Hi ${user.name},\n\nThe password for your WellPath account was just changed. For your security, you have been signed out on all devices.\n\nIf you made this change, there is nothing else to do. If you did not, reset your password now: ${resetLink}\n\nWellPath`,
    html,
    attachments,
  };
}

/**
 * Sets a new password if the link is valid, unused and not expired.
 * Signs the account out everywhere, because a reset often means the old password was exposed.
 */
export async function resetPassword(token: string, password: string): Promise<boolean> {
  const now = new Date();
  // Atomic, so a link cannot be used twice even by two requests at the same moment.
  const reset = await PasswordReset.findOneAndUpdate(
    { tokenHash: hashToken(token), usedAt: null, expiresAt: { $gt: now } },
    { usedAt: now },
  );
  if (!reset) return false;
  const user = await User.findById(reset.userId);
  if (!user || user.status !== "active") return false;

  await User.updateOne({ _id: user._id }, { passwordHash: await hashPassword(password) });
  await Session.updateMany({ userId: user._id, revokedAt: null }, { revokedAt: now });
  await PasswordReset.updateMany({ userId: user._id, usedAt: null }, { usedAt: now });

  void sendMail(passwordChangedEmail(user)).catch((err: unknown) => console.error("Password changed email failed:", err));
  return true;
}
