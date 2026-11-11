import { describe, expect, it } from "vitest";
import { calculateBmr, calculateDailyTargets, conditionNotices } from "./index";

const base = { sex: "male", age: 30, heightCm: 180, weightKg: 80, activityLevel: "moderate", goal: "lose_weight" } as const;

describe("calculateBmr", () => {
  it("matches the Mifflin-St Jeor equation for a male", () => {
    // 10*80 + 6.25*180 - 5*30 + 5 = 1780
    expect(calculateBmr({ sex: "male", age: 30, heightCm: 180, weightKg: 80 })).toBe(1780);
  });

  it("matches the Mifflin-St Jeor equation for a female", () => {
    // 10*60 + 6.25*165 - 5*25 - 161 = 1345.25 -> 1345
    expect(calculateBmr({ sex: "female", age: 25, heightCm: 165, weightKg: 60 })).toBe(1345);
  });
});

describe("calculateDailyTargets: weight loss", () => {
  it("applies a 500 kcal deficit when that is under 20% of daily needs", () => {
    const t = calculateDailyTargets(base);
    expect(t.tdee).toBe(2759); // 1780 * 1.55
    expect(t.calories).toBe(2259);
    expect(t.warnings).toEqual([]);
  });

  it("caps the deficit at 20% of daily needs", () => {
    // BMR 10*60 + 6.25*165 - 5*30 - 161 = 1320.25 -> 1320, TDEE 1320 * 1.375 = 1815, 20% = 363
    const t = calculateDailyTargets({ sex: "female", age: 30, heightCm: 165, weightKg: 60, activityLevel: "light", goal: "lose_weight" });
    expect(t.tdee).toBe(1815);
    expect(t.calories).toBe(1815 - 363);
  });

  it("raises the target to the safe minimum when the deficit goes below it", () => {
    // BMR 550 + 1000 - 200 - 161 = 1189, TDEE 1427, 20% = 285, 1142 < 1200
    const t = calculateDailyTargets({ sex: "female", age: 40, heightCm: 160, weightKg: 55, activityLevel: "sedentary", goal: "lose_weight" });
    expect(t.calories).toBe(1200);
    expect(t.reasons.some((r) => r.includes("safe minimum"))).toBe(true);
  });

  it("never sets a weight-loss target above daily needs", () => {
    // TDEE 1112 is below the 1200 minimum, so the old engine produced a surplus.
    const t = calculateDailyTargets({ sex: "female", age: 60, heightCm: 150, weightKg: 45, activityLevel: "sedentary", goal: "lose_weight" });
    expect(t.tdee).toBe(1112);
    expect(t.calories).toBe(1112);
    expect(t.calories).toBeLessThanOrEqual(t.tdee);
  });

  it("sets no deficit for an underweight person", () => {
    const t = calculateDailyTargets({ ...base, weightKg: 48, heightCm: 178, age: 22, activityLevel: "sedentary" });
    expect(t.bmi).toBeLessThan(18.5);
    expect(t.calories).toBe(t.tdee);
    expect(t.warnings[0]).toMatch(/below the healthy range/);
  });

  it("sets no deficit for under-18s", () => {
    const t = calculateDailyTargets({ ...base, age: 17 });
    expect(t.calories).toBe(t.tdee);
    expect(t.warnings[0]).toMatch(/under 18/);
  });

  it("sets no deficit during pregnancy or breastfeeding", () => {
    const t = calculateDailyTargets({ sex: "female", age: 30, heightCm: 165, weightKg: 70, activityLevel: "light", goal: "lose_weight", pregnantOrBreastfeeding: true });
    expect(t.calories).toBe(t.tdee);
    expect(t.warnings[0]).toMatch(/pregnancy/);
  });
});

describe("calculateDailyTargets: other goals", () => {
  it("adds a surplus for weight gain", () => {
    const t = calculateDailyTargets({ ...base, goal: "gain_weight" });
    expect(t.calories).toBe(t.tdee + 300);
  });

  it("matches daily needs for maintenance, even below the diet minimum", () => {
    const t = calculateDailyTargets({ sex: "female", age: 60, heightCm: 150, weightKg: 45, activityLevel: "sedentary", goal: "maintain" });
    expect(t.calories).toBe(t.tdee);
  });
});

describe("calculateDailyTargets: macros", () => {
  it("uses 1.6 g/kg of body weight for protein", () => {
    expect(calculateDailyTargets(base).proteinG).toBe(128);
  });

  it("uses a reference weight for protein above BMI 30", () => {
    const t = calculateDailyTargets({ ...base, weightKg: 130 }); // BMI 40.1
    expect(t.proteinG).toBe(Math.round(1.6 * 81)); // 25 * 1.8^2 = 81 kg
  });

  it("keeps macros consistent with the calorie target", () => {
    const t = calculateDailyTargets(base);
    const kcal = t.proteinG * 4 + t.fatG * 9 + t.carbsG * 4;
    expect(Math.abs(kcal - t.calories)).toBeLessThan(10);
  });
});

describe("conditionNotices", () => {
  it("returns a notice per condition in a fixed order", () => {
    const notices = conditionNotices(["diabetes", "knee_pain"]);
    expect(notices).toHaveLength(2);
    expect(notices[0]).toMatch(/^Knee pain/);
    expect(notices[1]).toMatch(/^Diabetes/);
  });

  it("returns nothing when there are no conditions", () => {
    expect(conditionNotices([])).toEqual([]);
  });
});
