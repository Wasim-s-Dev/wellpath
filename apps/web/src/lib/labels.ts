/** Plain-language labels for profile options, shared by onboarding and the home page. */
import type { ActivityLevel, Condition, DietType, Goal, Sex } from '@wellpath/shared'

export const GOAL_OPTIONS: { value: Goal; label: string; hint: string }[] = [
  { value: 'lose_weight', label: 'Lose weight', hint: 'Slow, steady loss you can keep' },
  { value: 'maintain', label: 'Stay at my weight', hint: 'Eat well and keep your weight steady' },
  { value: 'gain_weight', label: 'Gain weight', hint: 'Add healthy weight and strength' },
  { value: 'general_fitness', label: 'Get fitter', hint: 'More energy, strength and stamina' },
]

export const SEX_OPTIONS: { value: Sex; label: string }[] = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
]

export const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; hint: string }[] = [
  { value: 'sedentary', label: 'Mostly sitting', hint: 'Desk work, little walking' },
  { value: 'light', label: 'Lightly active', hint: 'Exercise 1 to 3 days a week' },
  { value: 'moderate', label: 'Moderately active', hint: 'Exercise 3 to 5 days a week' },
  { value: 'active', label: 'Active', hint: 'Exercise 6 to 7 days a week' },
  { value: 'very_active', label: 'Very active', hint: 'Physical job or training twice a day' },
]

export const CONDITION_OPTIONS: { value: Condition; label: string }[] = [
  { value: 'knee_pain', label: 'Knee pain' },
  { value: 'lower_back_pain', label: 'Lower back pain' },
  { value: 'shoulder_injury', label: 'Shoulder injury' },
  { value: 'high_blood_pressure', label: 'High blood pressure' },
  { value: 'diabetes', label: 'Diabetes' },
]

export const DIET_OPTIONS: { value: DietType; label: string; hint: string }[] = [
  { value: 'non_vegetarian', label: 'Non-vegetarian', hint: 'Meat, fish and eggs' },
  { value: 'eggetarian', label: 'Vegetarian plus eggs', hint: 'No meat or fish' },
  { value: 'vegetarian', label: 'Vegetarian', hint: 'No meat, fish or eggs' },
]

export const labelOf = <T extends string | number>(options: { value: T; label: string }[], value: T) =>
  options.find((o) => o.value === value)?.label ?? String(value)
