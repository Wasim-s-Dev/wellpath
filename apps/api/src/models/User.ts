/** A WellPath account. The password hash is excluded from queries unless explicitly selected. */
import { type HydratedDocument, type InferSchemaType, Schema, model } from "mongoose";
import {
  ACTIVITY_LEVELS,
  CONDITIONS,
  DIET_TYPES,
  GOALS,
  ROLES,
  SEXES,
  WORKOUT_MINUTES,
  type PublicUser,
  type SavedProfile,
} from "@wellpath/shared";

/** Onboarding answers. Health data: only read for the owner, never sent to the AI with identity data. */
const profileSchema = new Schema(
  {
    sex: { type: String, enum: SEXES, required: true },
    age: { type: Number, required: true },
    heightCm: { type: Number, required: true },
    weightKg: { type: Number, required: true },
    activityLevel: { type: String, enum: ACTIVITY_LEVELS, required: true },
    goal: { type: String, enum: GOALS, required: true },
    conditions: { type: [{ type: String, enum: CONDITIONS }], default: [] },
    pregnantOrBreastfeeding: { type: Boolean, required: true },
    dietType: { type: String, enum: DIET_TYPES, required: true },
    workoutMinutes: { type: Number, enum: WORKOUT_MINUTES, required: true },
    consentedAt: { type: Date, required: true },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, required: true, default: "user" },
    status: { type: String, enum: ["active", "suspended"], required: true, default: "active" },
    profile: { type: profileSchema, default: undefined },
  },
  { timestamps: true },
);

export const User = model("User", userSchema);
export type UserDocument = HydratedDocument<InferSchemaType<typeof userSchema>>;

export function toPublicUser(user: UserDocument): PublicUser {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

/** The saved profile in the shape the browser expects, or null before onboarding. */
export function toSavedProfile(user: UserDocument): SavedProfile | null {
  const p = user.profile;
  if (!p) return null;
  return {
    sex: p.sex,
    age: p.age,
    heightCm: p.heightCm,
    weightKg: p.weightKg,
    activityLevel: p.activityLevel,
    goal: p.goal,
    conditions: [...p.conditions],
    pregnantOrBreastfeeding: p.pregnantOrBreastfeeding,
    dietType: p.dietType,
    workoutMinutes: p.workoutMinutes as SavedProfile["workoutMinutes"],
    consentedAt: p.consentedAt.toISOString(),
  };
}
