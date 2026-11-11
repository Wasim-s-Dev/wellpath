/**
 * Gives an existing account admin access, or takes it away.
 *   npm run make-admin -- you@example.com
 *   npm run make-admin -- --remove you@example.com
 * Register the account in the app first. This never handles passwords.
 */
import mongoose from "mongoose";
import { env } from "../src/config/env.js";
import { User } from "../src/models/User.js";

const args = process.argv.slice(2);
const remove = args.includes("--remove");
const email = args.find((a) => !a.startsWith("--"))?.trim().toLowerCase();

if (!email) {
  console.error("Usage: npm run make-admin -- [--remove] <email>");
  process.exit(1);
}
if (!env.MONGODB_URI) {
  console.error("MONGODB_URI is not set in apps/api/.env. Run npm run doctor.");
  process.exit(1);
}

await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 10_000 });
try {
  const user = await User.findOneAndUpdate({ email }, { role: remove ? "user" : "admin" }, { new: true });
  if (!user) {
    console.error(`No account found for ${email}. Register it first, then run this again.`);
    process.exitCode = 1;
  } else {
    console.log(remove ? `${user.email} is no longer an admin.` : `${user.email} is now an admin.`);
  }
} finally {
  await mongoose.disconnect();
}
