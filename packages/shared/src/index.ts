/**
 * @wellpath/shared
 * Validation schemas and types used by BOTH the frontends and the API,
 * so the browser and the server always agree on what valid data looks like.
 */
import { z } from "zod";

export const GOALS = ["lose_weight", "gain_weight", "maintain", "general_fitness"] as const;
export const ACTIVITY_LEVELS = ["sedentary", "light", "moderate", "active", "very_active"] as const;
export const SEXES = ["male", "female"] as const;

/** Data collected in the onboarding quiz. */
export const profileSchema = z.object({
  sex: z.enum(SEXES),
  age: z.number().int().min(16).max(90),
  heightCm: z.number().min(120).max(230),
  weightKg: z.number().min(30).max(250),
  activityLevel: z.enum(ACTIVITY_LEVELS),
  goal: z.enum(GOALS),
});

export type Profile = z.infer<typeof profileSchema>;
export type Goal = (typeof GOALS)[number];
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];
export type Sex = (typeof SEXES)[number];

/** Shape of the API health check response. */
export type HealthResponse = { status: "ok"; service: "wellpath-api"; time: string };
