/**
 * Deterministic demo data so the panel looks real before the API exists.
 * A seeded random generator means everyone sees the same data on every reload.
 */
import type { AiSettings, AuditEntry, Condition, Exercise, FeatureFlags, Food, SafetyRule, User } from './types'
import { ACTIVITY_LEVELS, GOALS } from '@wellpath/shared'

function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
}
const rand = rng(42)
const pick = <T,>(arr: readonly T[]) => arr[Math.floor(rand() * arr.length)]
const int = (min: number, max: number) => Math.floor(min + rand() * (max - min + 1))
const DAY = 86_400_000
const now = Date.now()

const first = ['Ayesha', 'Omar', 'Sara', 'Ali', 'Fatima', 'Hassan', 'Zara', 'Bilal', 'Hina', 'Usman', 'Maria', 'John', 'Emma', 'Liam', 'Noah', 'Aisha', 'Daniel', 'Sofia', 'Ahmed', 'Mehak', 'Ibrahim', 'Laila', 'Ryan', 'Nadia', 'Kamran', 'Olivia', 'Yusuf', 'Hamza', 'Iqra', 'Lucas']
const last = ['Khan', 'Ahmed', 'Raza', 'Malik', 'Sheikh', 'Iqbal', 'Hussain', 'Butt', 'Chaudhry', 'Garcia', 'Miller', 'Wilson', 'Chen', 'Smith', 'Rahman', 'Siddiqui', 'Qureshi', 'Brown', 'Patel', 'Ali']
const countries = ['Pakistan', 'Pakistan', 'Pakistan', 'United Arab Emirates', 'United Kingdom', 'United States', 'Saudi Arabia', 'Canada']
const conds: Condition[] = ['knee_pain', 'lower_back_pain', 'high_blood_pressure', 'shoulder_injury']

export function seedUsers(n = 140): User[] {
  return Array.from({ length: n }, (_, i) => {
    const f = pick(first), l = pick(last)
    const sex = rand() > 0.5 ? 'female' as const : 'male' as const
    const joined = now - Math.pow(rand(), 0.7) * 60 * DAY
    const conditions = conds.filter(() => rand() < 0.05)
    return {
      id: `usr_${(1000 + i).toString(36)}${int(100, 999)}`,
      name: `${f} ${l}`,
      email: `${f}.${l}${int(1, 99)}@example.com`.toLowerCase(),
      country: pick(countries),
      sex,
      age: int(18, 58),
      heightCm: sex === 'male' ? int(162, 190) : int(150, 175),
      weightKg: sex === 'male' ? int(60, 112) : int(48, 95),
      activityLevel: pick(ACTIVITY_LEVELS),
      goal: pick(GOALS),
      conditions,
      status: (rand() < 0.04 ? 'suspended' : 'active') as User['status'],
      joinedAt: new Date(joined).toISOString(),
      lastActiveAt: new Date(Math.min(now, joined + rand() * (now - joined))).toISOString(),
      aiQuestionsToday: int(0, 20),
      streakDays: int(0, 45),
      weightChangeKg: Math.round((rand() * 5 - 3.2) * 10) / 10,
    }
  }).sort((a, b) => b.joinedAt.localeCompare(a.joinedAt))
}

// Approximate values for demo purposes only. Verify against a nutrition database before launch.
export const seedFoods: Food[] = [
  ['Roti (whole wheat)', '1 medium', 40, 120, 3.5, 24, 1, 'South Asian'],
  ['Daal (lentil curry)', '1 katori', 150, 180, 9, 24, 5, 'South Asian'],
  ['Chicken karahi', '1 plate', 250, 430, 32, 8, 30, 'South Asian'],
  ['Chicken biryani', '1 plate', 300, 520, 24, 62, 18, 'South Asian'],
  ['Plain paratha', '1 piece', 80, 260, 5, 32, 12, 'South Asian'],
  ['Chana chaat', '1 bowl', 200, 240, 11, 36, 6, 'South Asian'],
  ['Haleem', '1 bowl', 250, 390, 26, 34, 16, 'South Asian'],
  ['Boiled egg', '1 large', 50, 75, 6, 0.5, 5, 'Global'],
  ['Cooked white rice', '1 cup', 160, 205, 4, 45, 0.5, 'Global'],
  ['Oats with milk', '1 bowl', 250, 300, 12, 45, 8, 'Global'],
  ['Greek yogurt, plain', '1 cup', 200, 130, 20, 8, 1, 'Global'],
  ['Grilled chicken breast', '1 piece', 120, 200, 37, 0, 5, 'Global'],
  ['Banana', '1 medium', 118, 105, 1.3, 27, 0.4, 'Global'],
  ['Apple', '1 medium', 180, 95, 0.5, 25, 0.3, 'Global'],
  ['Milk tea (chai)', '1 cup', 200, 110, 4, 14, 4, 'South Asian'],
  ['Salmon fillet', '1 fillet', 150, 310, 34, 0, 19, 'Global'],
  ['Pasta with tomato sauce', '1 plate', 300, 420, 13, 78, 7, 'Global'],
  ['Mixed vegetable sabzi', '1 katori', 150, 140, 3, 14, 8, 'South Asian'],
].map(([name, portion, grams, kcal, p, c, f, cuisine], i) => ({
  id: `food_${i + 1}`, name: name as string, portion: portion as string, grams: grams as number, kcal: kcal as number,
  proteinG: p as number, carbsG: c as number, fatG: f as number, cuisine: cuisine as string, verified: i % 4 !== 3,
}))

export const seedExercises: Exercise[] = [
  ['Bodyweight squat', 'Legs', 'beginner', 'None', 5],
  ['Glute bridge', 'Glutes', 'beginner', 'None', 5],
  ['Step-up', 'Legs', 'beginner', 'Stairs or step', 6],
  ['Forward lunge', 'Legs', 'intermediate', 'None', 6],
  ['Jump squat', 'Legs', 'advanced', 'None', 5],
  ['Push-up', 'Chest', 'intermediate', 'None', 5],
  ['Incline push-up', 'Chest', 'beginner', 'Table or wall', 5],
  ['Overhead press', 'Shoulders', 'intermediate', 'Dumbbells', 6],
  ['Bird dog', 'Core', 'beginner', 'None', 5],
  ['Plank', 'Core', 'beginner', 'None', 3],
  ['Crunches', 'Core', 'beginner', 'None', 4],
  ['Burpees', 'Full body', 'advanced', 'None', 5],
  ['Brisk walk', 'Cardio', 'beginner', 'None', 20],
  ['Mountain climbers', 'Cardio', 'intermediate', 'None', 4],
  ['Deadlift', 'Back', 'advanced', 'Barbell', 8],
  ['Resistance band row', 'Back', 'beginner', 'Band', 6],
].map(([name, muscleGroup, level, equipment, minutes], i) => ({
  id: `ex_${i + 1}`, name: name as string, muscleGroup: muscleGroup as string,
  level: level as Exercise['level'], equipment: equipment as string, minutes: minutes as number,
}))

export const seedRules: SafetyRule[] = [
  { id: 'rule_1', condition: 'knee_pain', blocked: ['Jump squat', 'Forward lunge', 'Burpees'], swaps: 'Glute bridge, step-up, brisk walk', notice: 'If knee pain is sharp, swollen or lasts more than a few days, see a doctor.', active: true },
  { id: 'rule_2', condition: 'lower_back_pain', blocked: ['Deadlift', 'Crunches', 'Burpees'], swaps: 'Bird dog, plank, glute bridge', notice: 'Stop if pain spreads down the leg and consult a doctor.', active: true },
  { id: 'rule_3', condition: 'high_blood_pressure', blocked: ['Burpees', 'Jump squat', 'Overhead press'], swaps: 'Brisk walk, incline push-up, band row', notice: 'Avoid holding your breath while exercising. Follow your doctor’s advice.', active: true },
  { id: 'rule_4', condition: 'shoulder_injury', blocked: ['Overhead press', 'Push-up', 'Burpees'], swaps: 'Resistance band row (light), brisk walk', notice: 'Get a doctor or physiotherapist to clear upper-body training first.', active: true },
]

export const seedAiSettings: AiSettings = {
  enabled: true,
  fallbackOrder: ['gemini', 'groq', 'openai'],
  dailyLimitPerUser: 20,
  temperature: 0.3,
  cacheEnabled: true,
  promptVersion: 'coach-v1.3',
}

export const seedFlags: FeatureFlags = { maintenanceMode: false, ramadanMode: false, photoLogging: false, weeklyReports: true, signupsOpen: true }

export const seedAudit: AuditEntry[] = [
  { id: 'a1', at: new Date(now - 2 * 3600_000).toISOString(), actor: 'Demo admin', action: 'Updated AI daily limit', target: '15 to 20' },
  { id: 'a2', at: new Date(now - 26 * 3600_000).toISOString(), actor: 'Demo admin', action: 'Verified food', target: 'Chicken karahi' },
  { id: 'a3', at: new Date(now - 3 * DAY).toISOString(), actor: 'Demo admin', action: 'Suspended user', target: 'spam account' },
]

/** Seven days of AI usage by provider, for the dashboard and AI pages. */
export const aiUsage = Array.from({ length: 7 }, (_, i) => {
  const d = new Date(now - (6 - i) * DAY)
  const gemini = int(380, 620)
  const groq = int(40, 120)
  const cached = int(150, 260)
  return { day: d.toLocaleDateString('en-GB', { weekday: 'short' }), gemini, groq, openai: 0, cached, errors: int(2, 14), p50ms: int(900, 1500) }
})
