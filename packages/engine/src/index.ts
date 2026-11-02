/**
 * @wellpath/engine
 * The rule-based plan engine. Pure functions only: same input -> same output.
 * The LLM never changes these numbers; it can only explain them.
 *
 * Reference: Mifflin, M. D. et al. (1990), American Journal of Clinical Nutrition, 51(2), 241-247.
 */
import type { ActivityLevel, Goal, Profile, Sex } from "@wellpath/shared";

/** Multipliers that turn resting energy (BMR) into daily energy needs (TDEE). */
export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

/** Daily calorie change applied for each goal (kcal). */
export const GOAL_ADJUSTMENT: Record<Goal, number> = {
  lose_weight: -500,
  gain_weight: 300,
  maintain: 0,
  general_fitness: 0,
};

/** Safety floor: never recommend less than this many kcal per day. */
export const MIN_CALORIES: Record<Sex, number> = { male: 1500, female: 1200 };

/** Basal metabolic rate (kcal/day) using the Mifflin-St Jeor equation. */
export function calculateBmr(p: Pick<Profile, "sex" | "age" | "heightCm" | "weightKg">): number {
  const base = 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age;
  return Math.round(p.sex === "male" ? base + 5 : base - 161);
}

/** Total daily energy expenditure (kcal/day). */
export function calculateTdee(p: Profile): number {
  return Math.round(calculateBmr(p) * ACTIVITY_FACTORS[p.activityLevel]);
}

export type DailyTargets = {
  bmr: number;
  tdee: number;
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  /** Plain-language reasons the UI and the AI assistant can show the user. */
  reasons: string[];
};

/** Daily calorie and macro targets for a profile, with the reasons behind them. */
export function calculateDailyTargets(p: Profile): DailyTargets {
  const bmr = calculateBmr(p);
  const tdee = calculateTdee(p);
  const reasons = [
    `Your body uses about ${bmr} kcal at rest (Mifflin-St Jeor equation).`,
    `With your activity level you use about ${tdee} kcal per day.`,
  ];

  let calories = tdee + GOAL_ADJUSTMENT[p.goal];
  if (GOAL_ADJUSTMENT[p.goal] !== 0) {
    reasons.push(`Adjusted by ${GOAL_ADJUSTMENT[p.goal]} kcal for your goal.`);
  }
  if (calories < MIN_CALORIES[p.sex]) {
    calories = MIN_CALORIES[p.sex];
    reasons.push(`Raised to the safe minimum of ${calories} kcal per day.`);
  }

  // Protein 1.6 g/kg, fat 25% of calories, carbs fill the rest.
  const proteinG = Math.round(1.6 * p.weightKg);
  const fatG = Math.round((calories * 0.25) / 9);
  const carbsG = Math.max(0, Math.round((calories - proteinG * 4 - fatG * 9) / 4));

  return { bmr, tdee, calories, proteinG, fatG, carbsG, reasons };
}
