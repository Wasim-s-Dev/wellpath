/**
 * "Try it" section. Runs the REAL plan engine (@wellpath/engine) in the browser,
 * so visitors see their own targets instantly, with the reasons behind them.
 */
import { useMemo, useState } from 'react'
import { calculateDailyTargets } from '@wellpath/engine'
import type { ActivityLevel, Goal, Profile, Sex } from '@wellpath/shared'
import { useCountUp } from '../../hooks/useCountUp'
import { Reveal, SectionHeading } from './ui'

const goals: { v: Goal; label: string }[] = [
  { v: 'lose_weight', label: 'Lose weight' },
  { v: 'maintain', label: 'Maintain' },
  { v: 'gain_weight', label: 'Gain weight' },
  { v: 'general_fitness', label: 'Get fitter' },
]
const activities: { v: ActivityLevel; label: string }[] = [
  { v: 'sedentary', label: 'Mostly sitting' },
  { v: 'light', label: 'Light (1-3 days)' },
  { v: 'moderate', label: 'Moderate (3-5 days)' },
  { v: 'active', label: 'Active (6-7 days)' },
  { v: 'very_active', label: 'Very active' },
]

export function LiveTargets() {
  const [p, setP] = useState<Profile>({ sex: 'female', age: 28, heightCm: 163, weightKg: 68, activityLevel: 'light', goal: 'lose_weight' })
  const t = useMemo(() => calculateDailyTargets(p), [p])
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setP((prev) => ({ ...prev, [k]: v }))

  const kcal = useCountUp(t.calories)
  const protein = useCountUp(t.proteinG)
  const carbs = useCountUp(t.carbsG)
  const fat = useCountUp(t.fatG)

  return (
    <section id="try" className="relative py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          eyebrow="Try it now"
          title={<>Your daily targets in <span className="text-gradient">10 seconds</span></>}
          sub="Move the sliders. This runs the same engine the app uses, so every number comes with the reason behind it."
        />

        <Reveal className="mt-12 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div className="card space-y-6 p-6 sm:p-8">
            <Segmented label="Goal" value={p.goal} options={goals} onChange={(v) => set('goal', v)} />
            <Segmented label="Sex" value={p.sex} options={[{ v: 'female' as Sex, label: 'Female' }, { v: 'male' as Sex, label: 'Male' }]} onChange={(v) => set('sex', v)} />
            <Slider label="Age" unit="years" min={16} max={80} value={p.age} onChange={(v) => set('age', v)} />
            <Slider label="Height" unit="cm" min={140} max={210} value={p.heightCm} onChange={(v) => set('heightCm', v)} />
            <Slider label="Weight" unit="kg" min={40} max={160} value={p.weightKg} onChange={(v) => set('weightKg', v)} />
            <label className="block">
              <span className="text-sm font-medium text-heading">Activity</span>
              <select
                value={p.activityLevel}
                onChange={(e) => set('activityLevel', e.target.value as ActivityLevel)}
                className="mt-2 w-full rounded-xl border border-line bg-ink-2 px-4 py-3 text-sm text-heading outline-none focus:border-violet"
              >
                {activities.map((a) => <option key={a.v} value={a.v}>{a.label}</option>)}
              </select>
            </label>
          </div>

          <div className="card card-glow relative overflow-hidden p-6 sm:p-8" aria-live="polite">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet/10 blur-3xl" aria-hidden="true" />
            <p className="text-sm text-muted">Your daily target</p>
            <p className="mt-1 text-5xl font-extrabold tracking-tight text-heading sm:text-6xl">{kcal.toLocaleString()}<span className="ml-2 text-lg font-semibold text-muted">kcal</span></p>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[{ k: 'Protein', v: protein, c: 'text-lilac' }, { k: 'Carbs', v: carbs, c: 'text-violet' }, { k: 'Fat', v: fat, c: 'text-mint' }].map((m) => (
                <div key={m.k} className="rounded-xl border border-line bg-ink-2/70 p-3 text-center">
                  <p className={`text-xl font-bold ${m.c}`}>{m.v}g</p>
                  <p className="text-xs text-muted">{m.k}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-xl border border-line bg-ink-2/50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Why these numbers</p>
              <ul className="mt-3 space-y-2 text-sm text-text">
                {t.reasons.map((r) => <li key={r} className="flex gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-lilac" />{r}</li>)}
              </ul>
            </div>
            <p className="mt-5 text-xs text-muted">In the app, these targets recalibrate every week from your weight trend. Wellness guidance only, not medical advice.</p>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { v: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-heading">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.v}
            type="button"
            aria-pressed={value === o.v}
            onClick={() => onChange(o.v)}
            className={`rounded-full px-4 py-2 text-sm transition-all ${value === o.v ? 'btn-primary text-white' : 'border border-line bg-white text-muted hover:text-heading'}`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

function Slider({ label, unit, min, max, value, onChange }: { label: string; unit: string; min: number; max: number; value: number; onChange: (v: number) => void }) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <label className="block">
      <span className="flex justify-between text-sm">
        <span className="font-medium text-heading">{label}</span>
        <span className="text-muted">{value} {unit}</span>
      </span>
      <input
        type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-full accent-violet"
        style={{ background: `linear-gradient(90deg, #4f46e5 ${pct}%, #ebebf0 ${pct}%)` }}
      />
    </label>
  )
}
