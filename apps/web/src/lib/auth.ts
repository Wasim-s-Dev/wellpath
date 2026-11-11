/** User sign-in, using the shared auth client against /api/v1/auth. */
import { useSyncExternalStore } from 'react'
import { createAuthClient } from '@wellpath/shared/auth-client'

export { ApiError } from '@wellpath/shared/auth-client'

/** API origin. Empty in development, where the Vite proxy forwards /api to the API. */
const API_URL: string = import.meta.env.VITE_API_URL ?? ''
const HINT_KEY = 'wellpath_signed_in'

const client = createAuthClient({
  baseUrl: API_URL,
  authPath: '/api/v1/auth',
  // Lets the landing page skip the refresh call for visitors who never signed in.
  sessionHint: {
    get: () => {
      try { return localStorage.getItem(HINT_KEY) === '1' } catch { return true }
    },
    set: (on) => {
      try { if (on) localStorage.setItem(HINT_KEY, '1'); else localStorage.removeItem(HINT_KEY) } catch { /* storage blocked */ }
    },
  },
})

export const { api, login, logout, register, restoreSession } = client

export function useAuth() {
  return useSyncExternalStore(client.subscribe, client.getState)
}
