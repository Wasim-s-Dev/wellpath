/** Data shapes used across the admin panel. They mirror the planned MongoDB models. */
import type { ActivityLevel, Goal, Sex } from '@wellpath/shared'

export type UserStatus = 'active' | 'suspended'
export type Condition = 'knee_pain' | 'lower_back_pain' | 'high_blood_pressure' | 'shoulder_injury'

export type User = {
  id: string
  name: string
  email: string
  country: string
  sex: Sex
  age: number
  heightCm: number
  weightKg: number
  activityLevel: ActivityLevel
  goal: Goal
  conditions: Condition[]
  status: UserStatus
  joinedAt: string
  lastActiveAt: string
  aiQuestionsToday: number
  streakDays: number
  weightChangeKg: number
}

export type Food = {
  id: string
  name: string
  portion: string
  grams: number
  kcal: number
  proteinG: number
  carbsG: number
  fatG: number
  cuisine: string
  verified: boolean
}

export type Exercise = {
  id: string
  name: string
  muscleGroup: string
  level: 'beginner' | 'intermediate' | 'advanced'
  equipment: string
  minutes: number
}

export type SafetyRule = {
  id: string
  condition: Condition
  blocked: string[]
  swaps: string
  notice: string
  active: boolean
}

export type Provider = 'gemini' | 'groq' | 'openai'
export type AiSettings = {
  enabled: boolean
  fallbackOrder: Provider[]
  dailyLimitPerUser: number
  temperature: number
  cacheEnabled: boolean
  promptVersion: string
}

export type AuditEntry = { id: string; at: string; actor: string; action: string; target: string }

export type FeatureFlags = {
  maintenanceMode: boolean
  ramadanMode: boolean
  photoLogging: boolean
  weeklyReports: boolean
  signupsOpen: boolean
}

export const CONDITION_LABEL: Record<Condition, string> = {
  knee_pain: 'Knee pain',
  lower_back_pain: 'Lower back pain',
  high_blood_pressure: 'High blood pressure',
  shoulder_injury: 'Shoulder injury',
}
export const GOAL_LABEL: Record<Goal, string> = {
  lose_weight: 'Lose weight',
  gain_weight: 'Gain weight',
  maintain: 'Maintain',
  general_fitness: 'General fitness',
}
export const PROVIDER_LABEL: Record<Provider, string> = { gemini: 'Google Gemini', groq: 'Groq', openai: 'OpenAI' }
