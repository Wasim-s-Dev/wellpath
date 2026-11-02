/** Connects to MongoDB. Skipped (with a warning) if MONGODB_URI is not set yet. */
import mongoose from "mongoose";
import { env } from "../config/env.js";

export async function connectDb(): Promise<void> {
  if (!env.MONGODB_URI) {
    console.warn("MONGODB_URI not set: running without a database (fine for the first steps).");
    return;
  }
  await mongoose.connect(env.MONGODB_URI);
  console.log("Connected to MongoDB");
}
