import { useEffect, useState } from 'react'
import { Eyebrow, Icon } from './ui'

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden pt-32 pb-20 sm:pt-40">
      <div className="hero-glow pointer-events-none absolute inset-0" />
      <div className="grid-fade pointer-events-none absolute inset-0" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <div className="pop"><Eyebrow>AI wellness coach · Free during beta</Eyebrow></div>
          <h1 className="pop mt-6 text-4xl font-extrabold leading-[1.02] tracking-[-0.035em] text-heading sm:text-[4rem]" style={{ animationDelay: '80ms' }}>
            Know what to eat, how to train and what to change, <span className="text-gradient">before another week goes nowhere.</span>
          </h1>
          <p className="pop mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted sm:text-lg" style={{ animationDelay: '160ms' }}>
            WellPath builds your food and workout plan from your goal, explains every number in plain words, and adapts it every week from your real progress. Built for the food you actually eat.
          </p>
          <div className="pop mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row" style={{ animationDelay: '240ms' }}>
            <a href="#try" className="btn-primary w-full rounded-full px-7 py-3.5 text-sm font-semibold text-white sm:w-auto">Build my free plan</a>
            <a href="#how" className="w-full rounded-full border border-line bg-white px-7 py-3.5 text-sm font-semibold text-heading transition-colors hover:bg-ink-2 sm:w-auto">See how it works</a>
          </div>
          <ul className="pop mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted sm:text-sm" style={{ animationDelay: '320ms' }}>
            {['No card needed', 'Every number explained', 'Adapts weekly', 'Not medical advice'].map((t) => (
              <li key={t} className="flex items-center gap-1.5"><Icon name="check" className="h-4 w-4 text-mint" />{t}</li>
            ))}
          </ul>
        </div>

        <HeroMockup />
      </div>
    </section>
  )
}

/** Animated product preview built from HTML and SVG, so there are no heavy images. */
function HeroMockup() {
  const R = 52
  const C = 2 * Math.PI * R
  const eaten = 0.68

  return (
    <div className="pop relative mx-auto mt-16 max-w-4xl" style={{ animationDelay: '420ms' }}>
      <div className="absolute -inset-x-10 -top-10 bottom-0 rounded-[2rem] bg-violet/10 blur-3xl" aria-hidden="true" />
      <div className="card card-glow relative grid gap-5 p-5 sm:p-7 md:grid-cols-[1fr_1.15fr]" role="img" aria-label="Preview of the WellPath daily plan with calorie ring, macros, meals and AI coach">
        {/* Left: targets */}
        <div className="rounded-2xl border border-line bg-ink-2/70 p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-heading">Today</p>
            <span className="rounded-full bg-mint/10 px-2.5 py-1 text-[11px] font-medium text-mint">Plan adapted this week</span>
          </div>
          <div className="mt-5 flex items-center gap-5">
            <svg width="132" height="132" viewBox="0 0 132 132" className="shrink-0 -rotate-90">
              <defs>
                <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#4F46E5" />
                  <stop offset="1" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>
              <circle cx="66" cy="66" r={R} fill="none" stroke="#eef2ff" strokeWidth="12" />
              <circle
                cx="66" cy="66" r={R} fill="none" stroke="url(#ring-grad)" strokeWidth="12" strokeLinecap="round"
                strokeDasharray={C} strokeDashoffset={C * (1 - eaten)}
                className="ring-anim" style={{ ['--ring-full' as string]: C }}
              />
            </svg>
            <div>
              <p className="text-3xl font-bold text-heading">1,395</p>
              <p className="text-xs text-muted">of 2,050 kcal eaten</p>
              <p className="mt-3 text-xs text-muted">655 kcal left for dinner and snacks</p>
            </div>
          </div>
          <div className="mt-6 space-y-3">
            {[
              { k: 'Protein', v: '92 / 128 g', w: '72%', c: 'bg-lilac' },
              { k: 'Carbs', v: '160 / 230 g', w: '70%', c: 'bg-violet' },
              { k: 'Fat', v: '38 / 57 g', w: '66%', c: 'bg-mint' },
            ].map((m, i) => (
              <div key={m.k}>
                <div className="flex justify-between text-xs"><span className="text-muted">{m.k}</span><span className="text-heading">{m.v}</span></div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-3">
                  <div className={`bar-anim h-full rounded-full ${m.c}`} style={{ width: m.w, animationDelay: `${600 + i * 150}ms` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: plan + coach */}
        <div className="flex flex-col gap-3">
          {[
            { t: 'Breakfast', d: '2 eggs, 1 paratha, tea', k: '520 kcal', done: true },
            { t: 'Lunch', d: 'Chicken karahi, 1 roti, salad', k: '640 kcal', done: true },
            { t: 'Workout', d: 'Home full body, 25 min, no equipment', k: 'Knee-safe', done: false },
            { t: 'Water', d: '6 of 8 glasses', k: '75%', done: false },
          ].map((r, i) => (
            <div key={r.t} className="pop flex items-center gap-3 rounded-xl border border-line bg-ink-2/60 px-4 py-3" style={{ animationDelay: `${700 + i * 120}ms` }}>
              <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${r.done ? 'border-mint bg-mint/15 text-mint' : 'border-line text-transparent'}`}>
                <Icon name="check" className="h-3 w-3" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-heading">{r.t}</p>
                <p className="truncate text-xs text-muted">{r.d}</p>
              </div>
              <span className="text-xs text-muted">{r.k}</span>
            </div>
          ))}
          <CoachBubble />
        </div>
      </div>

      <div className="animate-float absolute -right-2 -top-6 hidden rounded-xl border border-line bg-white px-4 py-3 text-xs shadow-xl shadow-violet/10 sm:block lg:-right-10">
        <p className="font-semibold text-heading">Target updated: -120 kcal</p>
        <p className="mt-0.5 text-muted">Your weight trend is slower than planned.</p>
      </div>
    </div>
  )
}

function CoachBubble() {
  const [typing, setTyping] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setTyping(false), 2200)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="rounded-xl border border-violet/30 bg-violet/[0.08] p-4">
      <p className="text-xs text-muted">You: Can I have rice instead of roti tonight?</p>
      <div className="mt-2.5 flex gap-2.5">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet to-lilac text-[10px] font-bold text-white">AI</span>
        {typing ? (
          <span className="flex items-center gap-1 py-2" aria-label="Coach is typing">
            <span className="dot h-1.5 w-1.5 rounded-full bg-lilac" />
            <span className="dot h-1.5 w-1.5 rounded-full bg-lilac" style={{ animationDelay: '0.2s' }} />
            <span className="dot h-1.5 w-1.5 rounded-full bg-lilac" style={{ animationDelay: '0.4s' }} />
          </span>
        ) : (
          <p className="pop text-sm leading-relaxed text-heading">
            Yes. One cup of cooked rice fits your carbs for today and keeps you under target. Pair it with daal or chicken to hit your protein.
          </p>
        )}
      </div>
    </div>
  )
}

export function FoodMarquee() {
  const foods = ['Daal chawal', 'Grilled chicken', 'Oats and berries', 'Chicken biryani', 'Greek yogurt', 'Paratha and eggs', 'Pasta', 'Chana chaat', 'Salmon and rice', 'Roti and sabzi', 'Smoothie bowl', 'Haleem']
  return (
    <section aria-label="Foods WellPath understands" className="border-y border-line bg-ink-2 py-6">
      <p className="mb-4 text-center text-xs font-medium uppercase tracking-[0.18em] text-muted">Plans built around the food you already eat</p>
      <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
        <div className="marquee flex w-max gap-3">
          {[...foods, ...foods].map((f, i) => (
            <span key={i} className="whitespace-nowrap rounded-full border border-line bg-white px-4 py-1.5 text-sm text-text">{f}</span>
          ))}
        </div>
      </div>
    </section>
  )
}
