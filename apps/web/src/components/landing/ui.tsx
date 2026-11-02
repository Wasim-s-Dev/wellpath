/** Small shared building blocks for the landing page. */
import type { ReactNode } from 'react'
import { useReveal } from '../../hooks/useReveal'

export function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useReveal<HTMLDivElement>()
  return (
    <div ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-violet/20 bg-ink-3 px-3 py-1 text-xs font-semibold tracking-wide text-violet">
      <span className="h-1.5 w-1.5 rounded-full bg-violet" />
      {children}
    </span>
  )
}

export function SectionHeading({ eyebrow, title, sub, align = 'center' }: { eyebrow: string; title: ReactNode; sub?: string; align?: 'center' | 'left' }) {
  return (
    <Reveal className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-xl text-center lg:text-left'}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-heading sm:text-4xl">{title}</h2>
      {sub && <p className="mt-4 text-base leading-relaxed text-muted sm:text-lg">{sub}</p>}
    </Reveal>
  )
}

export function Logo({ className = '', dark = false }: { className?: string; dark?: boolean }) {
  return (
    <a href="#top" className={`flex items-center gap-2.5 ${className}`} aria-label="WellPath home">
      <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
        <defs>
          <linearGradient id="wp-logo" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#4F46E5" />
            <stop offset="1" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="9" fill="url(#wp-logo)" />
        <path d="M8 20c4 0 5-8 9-8s4 6 7 6" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="24" cy="18" r="2.2" fill="#fff" />
      </svg>
      <span className={`text-lg font-bold tracking-tight ${dark ? 'text-white' : 'text-heading'}`}>WellPath</span>
    </a>
  )
}

/** Minimal line icons, drawn inline so the page loads no image files. */
const paths: Record<string, ReactNode> = {
  adapt: <path d="M4 17l5-5 4 4 7-8M15 8h5v5" />,
  food: <><path d="M5 11h14a7 7 0 01-14 0z" /><path d="M9 7c0-1.5 1-2 1-3M13 7c0-1.5 1-2 1-3" /></>,
  chat: <><path d="M5 5h14v10H9l-4 4z" /><path d="M9 9h6M9 12h4" /></>,
  shield: <><path d="M12 3l7 3v6c0 4-3 7.5-7 9-4-1.5-7-5-7-9V6z" /><path d="M9 12l2 2 4-4" /></>,
  moon: <path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z" />,
  wallet: <><path d="M4 7h15v12H4z" /><path d="M4 7l11-3v3M15 13h2" /></>,
  chart: <><path d="M4 20V4M4 20h16" /><path d="M8 16v-4M12 16V8M16 16v-6" /></>,
  bell: <><path d="M6 16V11a6 6 0 0112 0v5l2 2H4z" /><path d="M10 20a2 2 0 004 0" /></>,
  lock: <><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 018 0v3" /></>,
  family: <><circle cx="8" cy="8" r="3" /><circle cx="16" cy="9" r="2.5" /><path d="M3 20c0-3 2.5-5 5-5s5 2 5 5M13 20c0-2.5 1.5-4 3-4s3 1.5 3 4" /></>,
  check: <path d="M5 12l4 4 10-10" />,
}

export function Icon({ name, className = 'h-5 w-5' }: { name: keyof typeof paths | string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {paths[name]}
    </svg>
  )
}
