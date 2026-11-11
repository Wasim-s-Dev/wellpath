/** Signed-in home: sends new users to onboarding, then shows their targets. */
import { Link, Navigate } from 'react-router'
import { AppShell } from '../components/app/AppShell'
import { TargetsCard } from '../components/app/TargetsCard'
import { useAuth } from '../lib/auth'
import { GOAL_OPTIONS, labelOf } from '../lib/labels'
import { useProfile } from '../lib/profile'

export function Home() {
  const auth = useAuth()
  const { state, retry } = useProfile()
  const firstName = auth.status === 'signed-in' ? auth.user.name.split(' ')[0] : ''

  if (state.status === 'ready' && !state.data.profile) return <Navigate to="/onboarding" replace />

  return (
    <AppShell>
      <h1 className="text-3xl font-extrabold tracking-tight text-heading">Welcome, {firstName}</h1>

      {state.status === 'loading' && <p className="mt-8 text-sm text-muted" role="status">Loading your plan…</p>}

      {state.status === 'error' && (
        <div className="card mt-8 p-6" role="alert">
          <p className="text-sm text-heading">{state.message}</p>
          <button type="button" onClick={retry} className="btn-primary mt-4 rounded-xl px-5 py-2.5 text-sm font-semibold text-white">Try again</button>
        </div>
      )}

      {state.status === 'ready' && state.data.profile && state.data.targets && (
        <>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
            <p className="text-muted">Goal: <span className="font-semibold text-heading">{labelOf(GOAL_OPTIONS, state.data.profile.goal)}</span></p>
            <Link to="/onboarding" className="text-sm font-semibold text-violet hover:underline">Edit my answers</Link>
          </div>
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <TargetsCard targets={state.data.targets} notices={state.data.notices} />
            <div className="card h-fit p-6">
              <p className="text-sm font-semibold uppercase tracking-wider text-violet">Coming next</p>
              <h2 className="mt-2 text-lg font-bold text-heading">Your meals and workouts</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Daily meals and home workouts built around these targets, your food choices and your safety notes are being added next.
              </p>
            </div>
          </div>
        </>
      )}
    </AppShell>
  )
}
