/** Header and page frame for signed-in pages. */
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { Logo } from '../landing/ui'
import { logout, useAuth } from '../../lib/auth'

export function AppShell({ children, narrow = false }: { children: ReactNode; narrow?: boolean }) {
  const auth = useAuth()
  const navigate = useNavigate()
  const email = auth.status === 'signed-in' ? auth.user.email : ''

  const signOut = async () => {
    await logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="min-h-screen bg-ink-2">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
          <Logo href="/app" />
          <div className="flex min-w-0 items-center gap-3">
            <span className="hidden truncate text-sm text-muted sm:inline">{email}</span>
            <button type="button" onClick={signOut} className="shrink-0 rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold text-heading hover:bg-ink-2">
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className={`mx-auto px-4 py-8 sm:px-6 sm:py-10 ${narrow ? 'max-w-2xl' : 'max-w-5xl'}`}>{children}</main>
      <p className="pb-8 text-center text-xs text-muted">Wellness guidance only. Not medical advice.</p>
    </div>
  )
}

export function Notice({ tone, title, items }: { tone: 'amber' | 'blue'; title: string; items: string[] }) {
  if (!items.length) return null
  const styles = tone === 'amber' ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-indigo-100 bg-ink-3 text-heading'
  return (
    <div className={`rounded-2xl border p-4 text-sm ${styles}`} role="note">
      <p className="font-semibold">{title}</p>
      <ul className="mt-2 space-y-1.5">
        {items.map((t) => <li key={t} className="leading-relaxed">{t}</li>)}
      </ul>
    </div>
  )
}
