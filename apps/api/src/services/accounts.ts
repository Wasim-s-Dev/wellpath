/** Removing an account and everything stored about it. */
import type { Types } from "mongoose";
import { PasswordReset } from "../models/PasswordReset.js";
import { Session } from "../models/Session.js";
import { User } from "../models/User.js";

/**
 * Deletes the user and all of their data.
 * Every new collection that stores user data (logs, plans, chats) must be added here.
 */
export async function deleteUserData(userId: Types.ObjectId): Promise<void> {
  await Session.deleteMany({ userId });
  await PasswordReset.deleteMany({ userId });
  await User.deleteOne({ _id: userId });
}

/** True when this user is the only admin left, so deleting them would lock everyone out of the admin panel. */
export async function isLastAdmin(userId: Types.ObjectId): Promise<boolean> {
  const user = await User.findById(userId, { role: 1 });
  if (user?.role !== "admin") return false;
  return (await User.countDocuments({ role: "admin", _id: { $ne: userId } })) === 0;
}
