import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { Icon } from './icons'
import { Avatar, Badge } from './ui'
import { Toaster } from './toast'
import { setState, useStore } from '../lib/store'
import { logout, useAuth } from '../lib/auth'

const nav = [
  { group: 'Overview', items: [{ to: '/', label: 'Dashboard', icon: 'dashboard' }, { to: '/users', label: 'Users', icon: 'users' }] },
  { group: 'Content', items: [{ to: '/foods', label: 'Foods', icon: 'food' }, { to: '/exercises', label: 'Exercises', icon: 'dumbbell' }, { to: '/safety', label: 'Safety rules', icon: 'shield' }] },
  { group: 'Platform', items: [{ to: '/ai', label: 'AI settings', icon: 'sparkles' }, { to: '/audit', label: 'Audit log', icon: 'log' }, { to: '/settings', label: 'Settings', icon: 'settings' }] },
]

export function Layout() {
  const auth = useAuth()
  const user = auth.status === 'signed-in' ? auth.user : null
  const maintenance = useStore((s) => s.flags.maintenanceMode)
  const [open, setOpen] = useState(false)
  const loc = useLocation()
  const navigate = useNavigate()
  useEffect(() => setOpen(false), [loc.pathname])

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <img src="/favicon.svg" alt="" className="h-8 w-8" />
        <span className="font-bold tracking-tight text-heading">WellPath</span>
        <Badge tone="indigo">Admin</Badge>
      </div>
      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4" aria-label="Admin">
        {nav.map((g) => (
          <div key={g.group}>
            <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted/80">{g.group}</p>
            <ul className="mt-2 space-y-0.5">
              {g.items.map((it) => (
                <li key={it.to}>
                  <NavLink
                    to={it.to} end={it.to === '/'}
                    className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-ink-3 text-violet' : 'text-text hover:bg-ink-2 hover:text-heading'}`}
                  >
                    <Icon name={it.icon} />{it.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-line p-3">
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <Avatar name={user?.name ?? 'Admin'} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-heading">{user?.name}</p>
            <p className="truncate text-xs text-muted">{user?.email}</p>
          </div>
          <button
            className="rounded-lg p-2 text-muted hover:bg-ink-2 hover:text-heading" aria-label="Sign out"
            onClick={async () => { setState(() => ({}), { action: 'Signed out', target: user?.email ?? '-' }); await logout(); navigate('/login') }}
          ><Icon name="logout" /></button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line bg-white lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-heading/30" onClick={() => setOpen(false)} />
          <aside className="fade-in absolute inset-y-0 left-0 w-64 bg-white shadow-2xl">{sidebar}</aside>
        </div>
      )}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-white/85 px-4 backdrop-blur sm:px-6">
          <button className="rounded-lg p-2 text-muted hover:bg-ink-2 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Icon name="menu" /></button>
          <div className="flex-1" />
          {maintenance && <Badge tone="amber"><Icon name="alert" className="h-3.5 w-3.5" />Maintenance mode on</Badge>}
          <Badge tone="gray">Demo data</Badge>
          <a href="http://localhost:5173" target="_blank" rel="noreferrer" className="hidden rounded-xl border border-line px-3 py-1.5 text-sm font-medium text-text hover:bg-ink-2 sm:block">View site</a>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6"><Outlet /></main>
      </div>
      <Toaster />
    </div>
  )
}
