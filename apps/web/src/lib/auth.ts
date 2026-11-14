/** User sign-in, using the shared auth client against /api/v1/auth. */
import { useSyncExternalStore } from 'react'
import { createAuthClient } from '@wellpath/shared/auth-client'
import { toast } from './toast'

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

export const { api, login, register, requestPasswordReset, resetPassword, restoreSession } = client

// Set when the person chose to sign out (logout or account deletion), so protected pages
// send them to the home page instead of the login page. Cleared on the next sign-in.
let signedOutOnPurpose = false
client.subscribe(() => {
  if (client.getState().status === 'signed-in') signedOutOnPurpose = false
})

export const wasSignedOutOnPurpose = () => signedOutOnPurpose

export async function logout(): Promise<void> {
  signedOutOnPurpose = true
  await client.logout()
  toast('You have been logged out.')
}

/** Deletes the account (password required), signs out and shows a success message. */
export async function deleteAccount(password: string): Promise<void> {
  await client.deleteAccount(password, () => { signedOutOnPurpose = true })
  toast('Your account has been deleted successfully.')
}

export function useAuth() {
  return useSyncExternalStore(client.subscribe, client.getState)
}
