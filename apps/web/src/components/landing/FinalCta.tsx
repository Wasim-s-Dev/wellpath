import { Link } from 'react-router'
import { Logo, Reveal } from './ui'

/** Closing call to action on the deep indigo gradient, as on replyze.co. */
export function FinalCta() {
  return (
    <section id="final" className="bg-deep relative overflow-hidden px-4 py-24 text-center sm:px-6">
      <div className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18)_0_1px,transparent_2px),radial-gradient(circle_at_80%_60%,rgba(255,255,255,0.15)_0_1px,transparent_2px)] [background-size:120px_120px,160px_160px]" aria-hidden="true" />
      <Reveal className="relative mx-auto max-w-3xl">
        <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">Stop guessing. Start a plan that adapts.</h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-indigo-100/90">Your first plan takes 60 seconds. It gets smarter every week after that.</p>
        <Link to="/signup" className="mt-9 inline-block rounded-xl bg-white px-8 py-4 text-base font-bold text-violet shadow-lg transition-transform hover:-translate-y-0.5">Build my free plan</Link>
        <p className="mt-6 text-sm text-indigo-100/80">No card needed · Every number explained · Delete your data any time</p>
      </Reveal>
    </section>
  )
}

export function Footer() {
  const cols = [
    { h: 'Product', l: [['Features', '#features'], ['How it works', '#how'], ['AI coach', '#coach'], ['Pricing', '#pricing'], ['FAQ', '#faq']] },
    { h: 'Company', l: [['About', '#top'], ['Contact', '#final']] },
    { h: 'Legal', l: [['Privacy', '#safety'], ['Terms', '#safety'], ['Health disclaimer', '#safety']] },
  ]
  return (
    <footer className="bg-footer py-14 text-gray-400">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Logo dark />
          <p className="mt-4 max-w-xs text-sm">The AI coach for food, training and habits that adapts to your real progress.</p>
        </div>
        {cols.map((c) => (
          <div key={c.h}>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">{c.h}</p>
            <ul className="mt-4 space-y-2.5 text-sm text-gray-300">
              {c.l.map(([label, href]) => <li key={label}><a href={href} className="hover:text-white">{label}</a></li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-12 flex max-w-6xl flex-col gap-2 border-t border-white/10 px-4 pt-6 text-xs sm:flex-row sm:justify-between sm:px-6">
        <p>&copy; {new Date().getFullYear()} WellPath. All rights reserved.</p>
        <p>Wellness guidance only. Not medical advice. Consult a doctor for medical conditions.</p>
      </div>
    </footer>
  )
}
