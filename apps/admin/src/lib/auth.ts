/** Admin sign-in, using the shared auth client against the admin-only routes. */
import { useSyncExternalStore } from 'react'
import { createAuthClient } from '@wellpath/shared/auth-client'
import { API_URL } from './api'

export { ApiError } from '@wellpath/shared/auth-client'

const client = createAuthClient({ baseUrl: API_URL, authPath: '/api/v1/admin/auth' })

export const { api, currentUser, logout, restoreSession } = client

export const login = (email: string, password: string) => client.login({ email, password })

export function useAuth() {
  return useSyncExternalStore(client.subscribe, client.getState)
}
