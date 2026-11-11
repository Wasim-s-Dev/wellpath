import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../../lib/auth'
import { Logo } from './ui'

const links = [
  { href: '#features', label: 'Features' },
  { href: '#how', label: 'How it works' },
  { href: '#coach', label: 'AI coach' },
  { href: '#safety', label: 'Safety' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#faq', label: 'FAQ' },
]

export function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const signedIn = useAuth().status === 'signed-in'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${scrolled || open ? 'border-b border-line bg-white/85 backdrop-blur-xl' : 'border-b border-transparent'}`}>
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <ul className="hidden items-center gap-1 rounded-full border border-line bg-white px-2 py-1.5 text-sm font-medium text-text shadow-sm md:flex">
          {links.map((l) => (
            <li key={l.href}><a className="rounded-full px-3.5 py-1.5 transition-colors hover:bg-ink-3 hover:text-violet" href={l.href}>{l.label}</a></li>
          ))}
        </ul>
        <div className="flex items-center gap-3">
          {signedIn ? (
            <Link to="/app" className="btn-primary hidden rounded-xl px-5 py-2.5 text-sm font-semibold text-white sm:inline-block">Open the app</Link>
          ) : (
            <>
              <Link to="/login" className="hidden rounded-xl px-3 py-2.5 text-sm font-semibold text-heading hover:text-violet sm:inline-block">Log in</Link>
              <Link to="/signup" className="btn-primary hidden rounded-xl px-5 py-2.5 text-sm font-semibold text-white sm:inline-block">Get started free</Link>
            </>
          )}
          <button
            type="button"
            className="rounded-lg p-2 text-muted hover:text-heading md:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </nav>
      {open && (
        <ul className="space-y-1 border-t border-line px-4 pb-4 pt-2 md:hidden">
          {links.map((l) => (
            <li key={l.href}>
              <a className="block rounded-lg px-3 py-2.5 text-muted hover:bg-ink-2 hover:text-heading" href={l.href} onClick={() => setOpen(false)}>{l.label}</a>
            </li>
          ))}
          {signedIn ? (
            <li className="pt-2"><Link to="/app" className="btn-primary block rounded-full px-4 py-2.5 text-center text-sm font-semibold text-white">Open the app</Link></li>
          ) : (
            <>
              <li className="pt-2"><Link to="/signup" className="btn-primary block rounded-full px-4 py-2.5 text-center text-sm font-semibold text-white">Get started free</Link></li>
              <li><Link to="/login" className="block rounded-full px-4 py-2.5 text-center text-sm font-semibold text-heading">Log in</Link></li>
            </>
          )}
        </ul>
      )}
    </header>
  )
}
