import { describe, expect, it } from "vitest";
import { calculateBmi, onboardingSchema } from "./index";

const valid = {
  sex: "female",
  age: 28,
  heightCm: 163,
  weightKg: 68,
  activityLevel: "light",
  goal: "lose_weight",
  conditions: [],
  pregnantOrBreastfeeding: false,
  dietType: "non_vegetarian",
  workoutMinutes: 30,
  healthDataConsent: true,
} as const;

const errorsFor = (input: unknown) => {
  const r = onboardingSchema.safeParse(input);
  return r.success ? [] : r.error.issues.map((i) => i.path.join("."));
};

describe("calculateBmi", () => {
  it("rounds to one decimal", () => {
    expect(calculateBmi(180, 80)).toBe(24.7);
  });
});

describe("onboardingSchema", () => {
  it("accepts complete answers", () => {
    expect(errorsFor(valid)).toEqual([]);
  });

  it("refuses a weight-loss goal for an underweight person", () => {
    expect(errorsFor({ ...valid, weightKg: 45, heightCm: 170 })).toEqual(["goal"]);
  });

  it("allows other goals for an underweight person", () => {
    expect(errorsFor({ ...valid, weightKg: 45, heightCm: 170, goal: "gain_weight" })).toEqual([]);
  });

  it("requires consent to store health details", () => {
    expect(errorsFor({ ...valid, healthDataConsent: false })).toEqual(["healthDataConsent"]);
  });

  it("only allows the pregnancy option for women", () => {
    expect(errorsFor({ ...valid, sex: "male", pregnantOrBreastfeeding: true })).toEqual(["pregnantOrBreastfeeding"]);
  });

  it("rejects repeated or unknown conditions and odd workout times", () => {
    expect(errorsFor({ ...valid, conditions: ["knee_pain", "knee_pain"] })).toEqual(["conditions"]);
    expect(errorsFor({ ...valid, conditions: ["cancer"] })).toEqual(["conditions.0"]);
    expect(errorsFor({ ...valid, workoutMinutes: 25 })).toEqual(["workoutMinutes"]);
  });
});
