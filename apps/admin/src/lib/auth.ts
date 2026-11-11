/**
 * Admin sign-in state.
 * The access token lives only in memory. On page load the httpOnly refresh cookie restores the session.
 */
import { useSyncExternalStore } from 'react'
import type { AuthResponse, PublicUser } from '@wellpath/shared'
import { API_URL } from './api'

type AuthState =
  | { status: 'loading' }
  | { status: 'signed-out' }
  | { status: 'signed-in'; user: PublicUser }

const AUTH = '/api/v1/admin/auth'

let state: AuthState = { status: 'loading' }
let accessToken: string | null = null
let refreshing: Promise<boolean> | null = null
const listeners = new Set<() => void>()

function setAuth(next: AuthState) {
  state = next
  listeners.forEach((l) => l())
}

function applySession(res: AuthResponse) {
  accessToken = res.accessToken
  setAuth({ status: 'signed-in', user: res.user })
}

function clearSession() {
  accessToken = null
  setAuth({ status: 'signed-out' })
}

export class ApiError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function send(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
  return fetch(`${API_URL}${path}`, { ...init, headers, credentials: 'include' })
}

async function toError(res: Response) {
  const body = (await res.json().catch(() => null)) as { error?: string } | null
  return new ApiError(res.status, body?.error ?? 'Something went wrong. Please try again.')
}

/**
 * Swaps the refresh cookie for a new access token.
 * Callers share one request: each refresh token works once, so two parallel calls would end the session.
 */
export function refreshSession(): Promise<boolean> {
  refreshing ??= (async () => {
    try {
      const res = await send(`${AUTH}/refresh`, { method: 'POST' })
      if (!res.ok) {
        clearSession()
        return false
      }
      applySession((await res.json()) as AuthResponse)
      return true
    } catch {
      clearSession()
      return false
    } finally {
      refreshing = null
    }
  })()
  return refreshing
}

/** Calls the API as the signed-in admin, refreshing the access token once if it has expired. */
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  let res = await send(path, init)
  if (res.status === 401 && accessToken && (await refreshSession())) res = await send(path, init)
  if (!res.ok) throw await toError(res)
  return (res.status === 204 ? undefined : await res.json()) as T
}

export async function login(email: string, password: string): Promise<PublicUser> {
  let res: Response
  try {
    res = await send(`${AUTH}/login`, { method: 'POST', body: JSON.stringify({ email, password }) })
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check that the API is running.')
  }
  if (!res.ok) throw await toError(res)
  const body = (await res.json()) as AuthResponse
  applySession(body)
  return body.user
}

export async function logout(): Promise<void> {
  try {
    await send(`${AUTH}/logout`, { method: 'POST' })
  } finally {
    clearSession()
  }
}

export const currentUser = (): PublicUser | null => (state.status === 'signed-in' ? state.user : null)

export function useAuth(): AuthState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => state,
  )
}
