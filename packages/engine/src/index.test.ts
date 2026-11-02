import { describe, expect, it } from "vitest";
import { calculateBmr, calculateDailyTargets } from "./index";

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

describe("calculateDailyTargets", () => {
  it("applies a deficit for weight loss", () => {
    const t = calculateDailyTargets({
      sex: "male", age: 30, heightCm: 180, weightKg: 80, activityLevel: "moderate", goal: "lose_weight",
    });
    expect(t.tdee).toBe(2759); // 1780 * 1.55
    expect(t.calories).toBe(2259);
  });

  it("never goes below the safe minimum", () => {
    const t = calculateDailyTargets({
      sex: "female", age: 60, heightCm: 150, weightKg: 45, activityLevel: "sedentary", goal: "lose_weight",
    });
    expect(t.calories).toBe(1200);
    expect(t.reasons.some((r) => r.includes("safe minimum"))).toBe(true);
  });
});
