/**
 * Tiny persistent store (no extra library) for content that is still demo data.
 * Saves to localStorage so admin changes survive a reload during the demo.
 * Later, swap these functions for real API calls: the pages will not need to change.
 * Sign-in is real and lives in ./auth, not here.
 */
import { useSyncExternalStore } from 'react'
import type { AiSettings, AuditEntry, Exercise, FeatureFlags, Food, SafetyRule, User } from './types'
import { seedAiSettings, seedAudit, seedExercises, seedFlags, seedFoods, seedRules, seedUsers } from './seed'
import { currentUser } from './auth'

type State = {
  users: User[]
  foods: Food[]
  exercises: Exercise[]
  rules: SafetyRule[]
  ai: AiSettings
  flags: FeatureFlags
  audit: AuditEntry[]
}

const KEY = 'wellpath-admin-v1'

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as State
  } catch { /* storage blocked: fall back to seed */ }
  return { users: seedUsers(), foods: seedFoods, exercises: seedExercises, rules: seedRules, ai: seedAiSettings, flags: seedFlags, audit: seedAudit }
}

let state: State = load()
const listeners = new Set<() => void>()

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* ignore */ }
}

export function setState(update: (s: State) => Partial<State>, audit?: { action: string; target: string }) {
  state = { ...state, ...update(state) }
  if (audit) {
    const entry: AuditEntry = { id: crypto.randomUUID(), at: new Date().toISOString(), actor: currentUser()?.email ?? 'system', ...audit }
    state = { ...state, audit: [entry, ...state.audit].slice(0, 500) }
  }
  save()
  listeners.forEach((l) => l())
}

export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb) },
    () => selector(state),
  )
}

export function resetDemoData() {
  try { localStorage.removeItem(KEY) } catch { /* ignore */ }
  state = load()
  save()
  listeners.forEach((l) => l())
}

export const newId = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 9)}`
