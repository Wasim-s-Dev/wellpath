/** Signed-in home. A placeholder until onboarding and the plan screens arrive later in Phase 1. */
import { useNavigate } from 'react-router'
import { Logo } from '../components/landing/ui'
import { logout, useAuth } from '../lib/auth'

export function Home() {
  const auth = useAuth()
  const navigate = useNavigate()
  if (auth.status !== 'signed-in') return null
  const { user } = auth

  const signOut = async () => {
    await logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-ink-2">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Logo href="/app" />
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted sm:inline">{user.email}</span>
            <button type="button" onClick={signOut} className="rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold text-heading hover:bg-ink-2">
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-heading">Welcome, {user.name.split(' ')[0]}</h1>
        <div className="card mt-8 p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-violet">Next step</p>
          <h2 className="mt-2 text-xl font-bold text-heading">Set up your profile</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            Your goal, body details and any injuries will build your first plan. This step is being built next.
          </p>
        </div>
      </main>
    </div>
  )
}
