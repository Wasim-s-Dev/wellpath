/**
 * @wellpath/shared
 * Validation schemas and types used by BOTH the frontends and the API,
 * so the browser and the server always agree on what valid data looks like.
 */
import { z } from "zod";

export const GOALS = ["lose_weight", "gain_weight", "maintain", "general_fitness"] as const;
export const ACTIVITY_LEVELS = ["sedentary", "light", "moderate", "active", "very_active"] as const;
export const SEXES = ["male", "female"] as const;

export const CONDITIONS = ["knee_pain", "lower_back_pain", "shoulder_injury", "high_blood_pressure", "diabetes"] as const;
export const DIET_TYPES = ["non_vegetarian", "eggetarian", "vegetarian"] as const;
export const WORKOUT_MINUTES = [10, 20, 30, 45, 60] as const;

/** Below this BMI, WellPath never sets a weight-loss target. */
export const UNDERWEIGHT_BMI = 18.5;

/** Body mass index, rounded to one decimal. */
export function calculateBmi(heightCm: number, weightKg: number): number {
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

/** The body details the plan engine needs. Also used by the public calculator. */
export const profileSchema = z.object({
  sex: z.enum(SEXES, "Choose an option"),
  age: z.number("Enter your age").int("Enter a whole number").min(16, "WellPath is for ages 16 and over").max(90, "Enter an age up to 90"),
  heightCm: z.number("Enter your height").min(120, "Enter a height of at least 120 cm").max(230, "Enter a height up to 230 cm"),
  weightKg: z.number("Enter your weight").min(30, "Enter a weight of at least 30 kg").max(250, "Enter a weight up to 250 kg"),
  activityLevel: z.enum(ACTIVITY_LEVELS, "Choose your activity level"),
  goal: z.enum(GOALS, "Choose a goal"),
});

/** Everything collected during onboarding. The same rules run in the browser and the API. */
export const onboardingSchema = profileSchema
  .extend({
    conditions: z
      .array(z.enum(CONDITIONS))
      .max(CONDITIONS.length)
      .refine((list) => new Set(list).size === list.length, "Each condition can only be chosen once"),
    pregnantOrBreastfeeding: z.boolean(),
    dietType: z.enum(DIET_TYPES, "Choose what you eat"),
    workoutMinutes: z.literal(WORKOUT_MINUTES, "Choose how much time you have"),
    healthDataConsent: z.literal(true, "Please agree so we can store your details and build your plan"),
  })
  .superRefine((p, ctx) => {
    if (p.pregnantOrBreastfeeding && p.sex !== "female") {
      ctx.addIssue({ code: "custom", path: ["pregnantOrBreastfeeding"], message: "This option is only for women" });
    }
    if (p.goal === "lose_weight" && calculateBmi(p.heightCm, p.weightKg) < UNDERWEIGHT_BMI) {
      ctx.addIssue({
        code: "custom",
        path: ["goal"],
        message: "Your weight is already below the healthy range for your height, so WellPath will not set a weight-loss goal. Choose maintain, gain weight or general fitness.",
      });
    }
  });

export type Profile = z.infer<typeof profileSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
/** A saved profile: the onboarding answers without the consent tick, plus when consent was given. */
export type SavedProfile = Omit<OnboardingInput, "healthDataConsent"> & { consentedAt: string };
export type Goal = (typeof GOALS)[number];
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];
export type Sex = (typeof SEXES)[number];
export type Condition = (typeof CONDITIONS)[number];
export type DietType = (typeof DIET_TYPES)[number];

export const ROLES = ["user", "admin"] as const;
export type Role = (typeof ROLES)[number];

// Messages here are shown to users by both the browser and the API.
const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address").max(254, "Email is too long"));

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(80, "Use 80 characters or fewer"),
  email: emailField,
  password: z.string().min(8, "Use at least 8 characters").max(128, "Use 128 characters or fewer"),
});

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Enter your password").max(128, "Use 128 characters or fewer"),
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Enter your password").max(128, "Use 128 characters or fewer"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

/** The user fields that are safe to send to a browser. */
export type PublicUser = { id: string; name: string; email: string; role: Role };
export type AuthResponse = { accessToken: string; user: PublicUser };

/** Shape of the API health check response. */
export type HealthResponse = { status: "ok"; service: "wellpath-api"; time: string };
