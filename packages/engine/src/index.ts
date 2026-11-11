/**
 * @wellpath/engine
 * The rule-based plan engine. Pure functions only: same input -> same output.
 * The LLM never changes these numbers; it can only explain them.
 *
 * Reference: Mifflin, M. D. et al. (1990), American Journal of Clinical Nutrition, 51(2), 241-247.
 */
import { calculateBmi, type ActivityLevel, type Condition, type Goal, type Profile, type Sex, UNDERWEIGHT_BMI } from "@wellpath/shared";

/** Multipliers that turn resting energy (BMR) into daily energy needs (TDEE). */
export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

/** Largest daily deficit for weight loss (kcal), and never more than this share of daily needs. */
export const MAX_DEFICIT_KCAL = 500;
export const MAX_DEFICIT_SHARE = 0.2;

/** Daily surplus for weight gain (kcal). */
export const GAIN_SURPLUS_KCAL = 300;

/** A diet never goes below this many kcal per day. */
export const MIN_CALORIES: Record<Sex, number> = { male: 1500, female: 1200 };

/** Under this age, WellPath never sets a calorie deficit. */
export const ADULT_AGE = 18;

/** Above this BMI, protein is based on a reference weight (BMI 25) instead of total weight. */
const HIGH_BMI = 30;
const REFERENCE_BMI = 25;
const KCAL_PER_KG = 7700;

export type TargetInput = Profile & { pregnantOrBreastfeeding?: boolean };

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
  bmi: number;
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  /** Plain-language reasons the UI and the AI assistant can show the user. */
  reasons: string[];
  /** Safety messages the UI must show prominently. */
  warnings: string[];
};

/** Why a weight-loss deficit is not safe for this person, or null if it is. */
function deficitBlocker(p: TargetInput, bmi: number): string | null {
  if (bmi < UNDERWEIGHT_BMI) {
    return "Your weight is already below the healthy range for your height, so WellPath will not set a calorie deficit. Please talk to a doctor about your weight.";
  }
  if (p.age < ADULT_AGE) {
    return "WellPath does not set a calorie deficit for people under 18, because your body is still growing. Focus on regular activity and balanced meals, and talk to a doctor before dieting.";
  }
  if (p.pregnantOrBreastfeeding) {
    return "WellPath does not set a calorie deficit during pregnancy or breastfeeding. Please ask your doctor or midwife about your energy needs.";
  }
  return null;
}

const perWeek = (kcalPerDay: number) => Math.round(((kcalPerDay * 7) / KCAL_PER_KG) * 10) / 10;

/** Daily calorie and macro targets for a profile, with the reasons behind them. */
export function calculateDailyTargets(p: TargetInput): DailyTargets {
  const bmr = calculateBmr(p);
  const tdee = calculateTdee(p);
  const bmi = calculateBmi(p.heightCm, p.weightKg);
  const reasons = [
    `Your body uses about ${bmr} kcal at rest (Mifflin-St Jeor equation).`,
    `With your activity level you use about ${tdee} kcal per day.`,
  ];
  const warnings: string[] = [];

  let calories = tdee;
  if (p.goal === "lose_weight") {
    const blocker = deficitBlocker(p, bmi);
    if (blocker) {
      warnings.push(blocker);
      reasons.push("Your target matches what you use each day, so your weight stays steady.");
    } else {
      const deficit = Math.min(MAX_DEFICIT_KCAL, Math.round(tdee * MAX_DEFICIT_SHARE));
      const floor = MIN_CALORIES[p.sex];
      calories = tdee - deficit;
      if (floor >= tdee) {
        calories = tdee;
        reasons.push(
          `A safe calorie deficit is not possible at your current size and activity, because your daily needs are below the ${floor} kcal minimum. Your target is set to maintain, and adding activity is the safer way to lose weight.`,
        );
      } else if (calories < floor) {
        calories = floor;
        reasons.push(`Reduced to the safe minimum of ${floor} kcal per day, about ${perWeek(tdee - floor)} kg per week.`);
      } else {
        reasons.push(`Reduced by ${deficit} kcal for weight loss, about ${perWeek(deficit)} kg per week. Slow loss is easier to keep.`);
      }
    }
  } else if (p.goal === "gain_weight") {
    calories = tdee + GAIN_SURPLUS_KCAL;
    reasons.push(`Increased by ${GAIN_SURPLUS_KCAL} kcal for steady weight gain, about ${perWeek(GAIN_SURPLUS_KCAL)} kg per week.`);
  }

  // Protein 1.6 g/kg. Above BMI 30 it uses the weight at BMI 25, so the target stays realistic.
  let proteinWeight = p.weightKg;
  if (bmi > HIGH_BMI) {
    proteinWeight = Math.round(REFERENCE_BMI * (p.heightCm / 100) ** 2);
    reasons.push(`Protein is based on a reference weight of ${proteinWeight} kg for your height.`);
  }
  const proteinG = Math.round(1.6 * proteinWeight);
  // Fat 25% of calories, carbs fill the rest.
  const fatG = Math.round((calories * 0.25) / 9);
  const carbsG = Math.max(0, Math.round((calories - proteinG * 4 - fatG * 9) / 4));

  return { bmr, tdee, bmi, calories, proteinG, fatG, carbsG, reasons, warnings };
}

const CONDITION_NOTICES: Record<Condition, string> = {
  knee_pain:
    "Knee pain: your workouts will avoid deep squats, lunges and jumping. Stop and see a doctor if pain is sharp, causes swelling or lasts more than a few days.",
  lower_back_pain:
    "Back pain: your workouts will avoid heavy bending and twisting. See a doctor if pain spreads down your leg, causes numbness or lasts more than a few weeks.",
  shoulder_injury:
    "Shoulder injury: your workouts will avoid overhead pressing and push-ups. See a doctor if movement is very limited or painful.",
  high_blood_pressure:
    "High blood pressure: check with your doctor before starting new exercise, and breathe out when you lift instead of holding your breath.",
  diabetes:
    "Diabetes: if you take insulin or medicine that lowers blood sugar, talk to your doctor before cutting calories or starting new exercise.",
};

/** Doctor notices for the user's conditions, in a fixed order. */
export function conditionNotices(conditions: readonly Condition[]): string[] {
  return (Object.keys(CONDITION_NOTICES) as Condition[]).filter((c) => conditions.includes(c)).map((c) => CONDITION_NOTICES[c]);
}

export type { Goal };
