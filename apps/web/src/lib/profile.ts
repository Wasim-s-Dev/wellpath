/** Loading and saving the signed-in user's profile. */
import { useCallback, useEffect, useState } from 'react'
import type { DailyTargets } from '@wellpath/engine'
import type { OnboardingInput, SavedProfile } from '@wellpath/shared'
import { ApiError, api } from './auth'

export type ProfileResponse = { profile: SavedProfile | null; targets: DailyTargets | null; notices: string[] }

const PATH = '/api/v1/profile'

export const saveProfile = (input: OnboardingInput) =>
  api<ProfileResponse>(PATH, { method: 'PUT', body: JSON.stringify(input) })

type LoadState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; data: ProfileResponse }

export function useProfile() {
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let live = true
    api<ProfileResponse>(PATH)
      .then((data) => { if (live) setState({ status: 'ready', data }) })
      .catch((err: unknown) => {
        if (live) setState({ status: 'error', message: err instanceof ApiError ? err.message : 'Could not load your profile.' })
      })
    return () => { live = false }
  }, [attempt])

  const retry = useCallback(() => {
    setState({ status: 'loading' })
    setAttempt((a) => a + 1)
  }, [])

  return { state, retry }
}
