/**
 * Onboarding in five short steps: goal, body, health, food and time, then review and consent.
 * Each step is checked with the same schema the API uses. Also used to edit answers later.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import { calculateDailyTargets, conditionNotices } from '@wellpath/engine'
import {
  calculateBmi,
  onboardingSchema,
  profileSchema,
  UNDERWEIGHT_BMI,
  WORKOUT_MINUTES,
  type ActivityLevel,
  type Condition,
  type DietType,
  type Goal,
  type SavedProfile,
  type Sex,
} from '@wellpath/shared'
import { AppShell, Notice } from '../components/app/AppShell'
import { TargetsCard } from '../components/app/TargetsCard'
import { FormError } from '../components/auth/AuthLayout'
import { ApiError } from '../lib/auth'
import { ACTIVITY_OPTIONS, CONDITION_OPTIONS, DIET_OPTIONS, GOAL_OPTIONS, SEX_OPTIONS, labelOf } from '../lib/labels'
import { saveProfile, useProfile } from '../lib/profile'

type Draft = {
  goal: Goal | null
  sex: Sex | null
  age: string
  heightUnit: 'cm' | 'ft'
  heightCm: string
  heightFt: string
  heightIn: string
  weightKg: string
  activityLevel: ActivityLevel | null
  conditions: Condition[]
  pregnantOrBreastfeeding: boolean
  dietType: DietType | null
  workoutMinutes: number | null
  healthDataConsent: boolean
}

const EMPTY: Draft = {
  goal: null, sex: null, age: '', heightUnit: 'cm', heightCm: '', heightFt: '', heightIn: '', weightKg: '',
  activityLevel: null, conditions: [], pregnantOrBreastfeeding: false, dietType: null, workoutMinutes: null, healthDataConsent: false,
}

const STEPS = [
  { title: 'What is your main goal?', sub: 'You can change it any time.', fields: ['goal'] },
  { title: 'About you', sub: 'We use these to estimate how much energy your body uses each day.', fields: ['sex', 'age', 'heightCm', 'weightKg', 'activityLevel'] },
  { title: 'Any injuries or health conditions?', sub: 'We use these to keep your workouts safe. Choose all that apply.', fields: ['conditions', 'pregnantOrBreastfeeding'] },
  { title: 'Your food and time', sub: 'So your plan fits the way you eat and your day.', fields: ['dietType', 'workoutMinutes'] },
  { title: 'Check your answers', sub: 'These are your starting targets. They adjust as you log your progress.', fields: ['healthDataConsent'] },
] as const

const num = (s: string) => (s.trim() === '' ? undefined : Number(s))

function heightInCm(d: Draft): number | undefined {
  if (d.heightUnit === 'cm') return num(d.heightCm)
  const ft = num(d.heightFt)
  if (ft === undefined) return undefined
  return Math.round((ft * 12 + (num(d.heightIn) ?? 0)) * 2.54)
}

/** The draft in the shape the schema expects. Empty answers become undefined so they get "Enter ..." messages. */
function toInput(d: Draft) {
  return {
    goal: d.goal ?? undefined,
    sex: d.sex ?? undefined,
    age: num(d.age),
    heightCm: heightInCm(d),
    weightKg: num(d.weightKg),
    activityLevel: d.activityLevel ?? undefined,
    conditions: d.conditions,
    pregnantOrBreastfeeding: d.sex === 'female' && d.pregnantOrBreastfeeding,
    dietType: d.dietType ?? undefined,
    workoutMinutes: d.workoutMinutes ?? undefined,
    healthDataConsent: d.healthDataConsent,
  }
}

function fromProfile(p: SavedProfile): Draft {
  return {
    ...EMPTY,
    goal: p.goal, sex: p.sex, age: String(p.age), heightCm: String(p.heightCm), weightKg: String(p.weightKg),
    activityLevel: p.activityLevel, conditions: p.conditions, pregnantOrBreastfeeding: p.pregnantOrBreastfeeding,
    dietType: p.dietType, workoutMinutes: p.workoutMinutes,
  }
}

/** First error message for each of the given fields. */
function errorsFor(d: Draft, fields: readonly string[]): Record<string, string> {
  const result = onboardingSchema.safeParse(toInput(d))
  if (result.success) return {}
  const errors: Record<string, string> = {}
  for (const issue of result.error.issues) {
    const field = String(issue.path[0])
    if (fields.includes(field) && !errors[field]) errors[field] = issue.message
  }
  return errors
}

const stepOf = (field: string) => Math.max(0, STEPS.findIndex((s) => (s.fields as readonly string[]).includes(field)))

export function Onboarding() {
  const navigate = useNavigate()
  const { state } = useProfile()
  const [draft, setDraft] = useState<Draft>(EMPTY)
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [underweightGoal, setUnderweightGoal] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [busy, setBusy] = useState(false)
  const [loadedFrom, setLoadedFrom] = useState<SavedProfile | null>(null)
  const heading = useRef<HTMLHeadingElement>(null)

  const existing = state.status === 'ready' ? state.data.profile : null
  // Editing: start from the saved answers once they arrive.
  if (existing && existing !== loadedFrom) {
    setLoadedFrom(existing)
    setDraft(fromProfile(existing))
  }

  useEffect(() => { heading.current?.focus() }, [step])

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }))
    setErrors((e) => ({ ...e, [key === 'heightFt' || key === 'heightIn' ? 'heightCm' : key]: '' }))
    setSubmitError('')
    setUnderweightGoal(false)
  }

  const input = toInput(draft)
  const body = profileSchema.safeParse(input)
  const preview = body.success ? calculateDailyTargets({ ...body.data, pregnantOrBreastfeeding: input.pregnantOrBreastfeeding }) : null

  const next = () => {
    const stepErrors = errorsFor(draft, STEPS[step].fields)
    if (Object.keys(stepErrors).length) return setErrors(stepErrors)
    // Checked here so people learn about it straight after entering their height and weight.
    if (step === 1 && draft.goal === 'lose_weight' && input.heightCm && input.weightKg && calculateBmi(input.heightCm, input.weightKg) < UNDERWEIGHT_BMI) {
      return setUnderweightGoal(true)
    }
    setErrors({})
    setStep((s) => s + 1)
  }

  const back = () => {
    setErrors({})
    setUnderweightGoal(false)
    setStep((s) => s - 1)
  }

  const submit = async () => {
    const parsed = onboardingSchema.safeParse(input)
    if (!parsed.success) {
      const field = String(parsed.error.issues[0].path[0])
      setErrors(errorsFor(draft, STEPS.flatMap((s) => [...s.fields])))
      return setStep(stepOf(field))
    }
    setBusy(true)
    try {
      await saveProfile(parsed.data)
      navigate('/app', { replace: true })
    } catch (err) {
      if (err instanceof ApiError && Object.keys(err.fields).length) {
        const field = Object.keys(err.fields)[0]
        setErrors(Object.fromEntries(Object.entries(err.fields).map(([k, v]) => [k, v[0]])))
        setStep(stepOf(field))
      } else {
        setSubmitError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
      }
      setBusy(false)
    }
  }

  if (state.status === 'loading') {
    return <AppShell narrow><p className="text-sm text-muted" role="status">Loading…</p></AppShell>
  }

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <AppShell narrow>
      <div className="flex items-center justify-between text-sm text-muted">
        <span>Step {step + 1} of {STEPS.length}</span>
        {existing && <Link to="/app" className="font-semibold text-violet hover:underline">Cancel</Link>}
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line" aria-hidden="true">
        <div className="h-full rounded-full bg-violet transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
      </div>

      <h1 ref={heading} tabIndex={-1} className="mt-8 text-2xl font-extrabold tracking-tight text-heading outline-none sm:text-3xl">{current.title}</h1>
      <p className="mt-2 text-muted">{current.sub}</p>

      <form
        className="mt-8 space-y-6"
        noValidate
        onSubmit={(e) => { e.preventDefault(); if (isLast) void submit(); else next() }}
      >
        {step === 0 && (
          <Choices name="goal" legend="Goal" hideLegend options={GOAL_OPTIONS} value={draft.goal} onChange={(v) => set('goal', v)} error={errors.goal} />
        )}

        {step === 1 && (
          <>
            <Choices name="sex" legend="Sex" options={SEX_OPTIONS} value={draft.sex} onChange={(v) => set('sex', v)} error={errors.sex} columns={2} />
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField label="Age" unit="years" value={draft.age} onChange={(v) => set('age', v)} error={errors.age} />
              <NumberField label="Weight" unit="kg" value={draft.weightKg} onChange={(v) => set('weightKg', v)} error={errors.weightKg} decimal />
            </div>
            <fieldset>
              <div className="flex items-center justify-between">
                <legend className="text-sm font-medium text-heading">Height</legend>
                <div className="flex rounded-lg border border-line bg-white p-0.5 text-xs font-semibold" role="group" aria-label="Height unit">
                  {(['cm', 'ft'] as const).map((u) => (
                    <button key={u} type="button" aria-pressed={draft.heightUnit === u} onClick={() => set('heightUnit', u)}
                      className={`rounded-md px-3 py-1 ${draft.heightUnit === u ? 'bg-violet text-white' : 'text-muted'}`}>
                      {u === 'cm' ? 'cm' : 'feet + inches'}
                    </button>
                  ))}
                </div>
              </div>
              {draft.heightUnit === 'cm' ? (
                <NumberField label="Height in centimetres" hideLabel unit="cm" value={draft.heightCm} onChange={(v) => set('heightCm', v)} error={errors.heightCm} />
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <NumberField label="Feet" hideLabel unit="ft" value={draft.heightFt} onChange={(v) => set('heightFt', v)} invalid={!!errors.heightCm} />
                    <NumberField label="Inches" hideLabel unit="in" value={draft.heightIn} onChange={(v) => set('heightIn', v)} invalid={!!errors.heightCm} />
                  </div>
                  {errors.heightCm && <p className="mt-1.5 text-xs text-red-600">{errors.heightCm}</p>}
                  {!errors.heightCm && input.heightCm && <p className="mt-1.5 text-xs text-muted">That is {input.heightCm} cm.</p>}
                </>
              )}
            </fieldset>
            <Choices name="activity" legend="How active are you?" options={ACTIVITY_OPTIONS} value={draft.activityLevel} onChange={(v) => set('activityLevel', v)} error={errors.activityLevel} />

            {underweightGoal && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="alert">
                <p className="font-semibold">Let's choose a different goal</p>
                <p className="mt-1 leading-relaxed">
                  Your weight is already below the healthy range for your height, so WellPath will not set a weight-loss goal. If you are worried about your weight, please talk to a doctor.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {GOAL_OPTIONS.filter((g) => g.value !== 'lose_weight').map((g) => (
                    <button key={g.value} type="button" className="rounded-xl border border-amber-300 bg-white px-3 py-2 font-semibold text-heading hover:bg-amber-100"
                      onClick={() => { set('goal', g.value); setStep(2) }}>
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {step === 2 && (
          <>
            <fieldset>
              <legend className="sr-only">Conditions</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {CONDITION_OPTIONS.map((c) => {
                  const checked = draft.conditions.includes(c.value)
                  return (
                    <OptionCard key={c.value} type="checkbox" name="conditions" checked={checked} label={c.label}
                      onChange={() => set('conditions', checked ? draft.conditions.filter((x) => x !== c.value) : [...draft.conditions, c.value])} />
                  )
                })}
                <OptionCard type="checkbox" name="conditions" checked={draft.conditions.length === 0} label="None of these" onChange={() => set('conditions', [])} />
              </div>
              {errors.conditions && <p className="mt-1.5 text-xs text-red-600">{errors.conditions}</p>}
            </fieldset>
            {draft.sex === 'female' && (
              <OptionCard type="checkbox" name="pregnant" checked={draft.pregnantOrBreastfeeding} label="I am pregnant or breastfeeding"
                hint="We will not set a calorie deficit, and will remind you to check with your doctor."
                onChange={() => set('pregnantOrBreastfeeding', !draft.pregnantOrBreastfeeding)} />
            )}
            <p className="text-xs leading-relaxed text-muted">For anything not listed, or if you are unsure, please check with your doctor before starting a new plan.</p>
          </>
        )}

        {step === 3 && (
          <>
            <Choices name="diet" legend="What do you eat?" options={DIET_OPTIONS} value={draft.dietType} onChange={(v) => set('dietType', v)} error={errors.dietType} />
            <Choices
              name="minutes" legend="Time for exercise on most days" columns={5}
              options={WORKOUT_MINUTES.map((m) => ({ value: m, label: `${m} min` }))}
              value={draft.workoutMinutes} onChange={(v) => set('workoutMinutes', v)} error={errors.workoutMinutes}
            />
          </>
        )}

        {isLast && (
          <>
            <dl className="card divide-y divide-line text-sm">
              {[
                { label: 'Goal', value: draft.goal && labelOf(GOAL_OPTIONS, draft.goal), step: 0 },
                { label: 'About you', value: `${draft.sex && labelOf(SEX_OPTIONS, draft.sex)}, ${input.age} years, ${input.heightCm} cm, ${input.weightKg} kg`, step: 1 },
                { label: 'Activity', value: draft.activityLevel && labelOf(ACTIVITY_OPTIONS, draft.activityLevel), step: 1 },
                {
                  label: 'Health',
                  value: [...draft.conditions.map((c) => labelOf(CONDITION_OPTIONS, c)), ...(input.pregnantOrBreastfeeding ? ['Pregnant or breastfeeding'] : [])].join(', ') || 'None',
                  step: 2,
                },
                { label: 'Food and time', value: `${draft.dietType && labelOf(DIET_OPTIONS, draft.dietType)}, ${draft.workoutMinutes} min a day`, step: 3 },
              ].map((row) => (
                <div key={row.label} className="flex items-start justify-between gap-4 px-5 py-3.5">
                  <div>
                    <dt className="text-muted">{row.label}</dt>
                    <dd className="mt-0.5 font-medium text-heading">{row.value}</dd>
                  </div>
                  <button type="button" onClick={() => { setErrors({}); setStep(row.step) }} className="shrink-0 font-semibold text-violet hover:underline" aria-label={`Change ${row.label.toLowerCase()}`}>
                    Change
                  </button>
                </div>
              ))}
            </dl>

            {preview && <TargetsCard targets={preview} notices={conditionNotices(draft.conditions)} />}

            <OptionCard
              type="checkbox" name="consent" checked={draft.healthDataConsent} invalid={!!errors.healthDataConsent}
              label="I agree to WellPath storing these details to build my plan"
              hint="WellPath gives general wellness guidance, not medical advice. Your name and email are never sent to the AI. You can delete your data at any time."
              onChange={() => set('healthDataConsent', !draft.healthDataConsent)}
            />
            {errors.healthDataConsent && <p className="-mt-4 text-xs text-red-600">{errors.healthDataConsent}</p>}
            {submitError && <FormError>{submitError}</FormError>}
          </>
        )}

        {state.status === 'error' && step === 0 && (
          <Notice tone="amber" title="We could not load your saved answers" items={[state.message]} />
        )}

        <div className="flex gap-3 pt-2">
          {step > 0 && (
            <button type="button" onClick={back} className="rounded-xl border border-line bg-white px-5 py-3 text-sm font-semibold text-heading hover:bg-ink-2">Back</button>
          )}
          <button type="submit" disabled={busy} className="btn-primary flex-1 rounded-xl px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
            {isLast ? (busy ? 'Saving…' : existing ? 'Save my answers' : 'Create my plan') : 'Continue'}
          </button>
        </div>
      </form>
    </AppShell>
  )
}

function OptionCard({ type, name, checked, label, hint, invalid = false, onChange }: {
  type: 'radio' | 'checkbox'; name: string; checked: boolean; label: ReactNode; hint?: string; invalid?: boolean; onChange: () => void
}) {
  return (
    <label className={`flex cursor-pointer items-start gap-3 rounded-2xl border bg-white p-4 transition has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-violet/15 ${checked ? 'border-violet bg-ink-3/60' : invalid ? 'border-red-400' : 'border-line hover:border-violet/40'}`}>
      <input type={type} name={name} checked={checked} onChange={onChange} aria-invalid={invalid || undefined} className="mt-0.5 h-4 w-4 shrink-0 accent-violet" />
      <span>
        <span className="block text-sm font-semibold text-heading">{label}</span>
        {hint && <span className="mt-0.5 block text-xs leading-relaxed text-muted">{hint}</span>}
      </span>
    </label>
  )
}

function Choices<T extends string | number>({ name, legend, hideLegend = false, options, value, onChange, error, columns = 1 }: {
  name: string; legend: string; hideLegend?: boolean; options: { value: T; label: string; hint?: string }[]
  value: T | null; onChange: (v: T) => void; error?: string; columns?: 1 | 2 | 5
}) {
  const grid = columns === 5 ? 'grid-cols-3 sm:grid-cols-5' : columns === 2 ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'
  return (
    <fieldset>
      <legend className={hideLegend ? 'sr-only' : 'mb-2 text-sm font-medium text-heading'}>{legend}</legend>
      <div className={`grid gap-2 ${grid}`}>
        {options.map((o) => (
          <OptionCard key={String(o.value)} type="radio" name={name} checked={value === o.value} label={o.label} hint={o.hint} invalid={!!error} onChange={() => onChange(o.value)} />
        ))}
      </div>
      {error && <p className="mt-1.5 text-xs text-red-600" role="alert">{error}</p>}
    </fieldset>
  )
}

function NumberField({ label, hideLabel = false, unit, value, onChange, error, invalid, decimal = false }: {
  label: string; hideLabel?: boolean; unit: string; value: string; onChange: (v: string) => void; error?: string; invalid?: boolean; decimal?: boolean
}) {
  return (
    <label className="block">
      <span className={hideLabel ? 'sr-only' : 'text-sm font-medium text-heading'}>{label}</span>
      <span className={`relative block ${hideLabel ? '' : 'mt-1.5'}`}>
        <input
          type="text" inputMode={decimal ? 'decimal' : 'numeric'} value={value} aria-invalid={!!error || invalid}
          onChange={(e) => onChange(e.target.value.replace(decimal ? /[^\d.]/g : /\D/g, ''))}
          className={`w-full rounded-xl border bg-white py-3 pl-4 pr-14 text-sm text-heading outline-none focus:ring-4 ${error || invalid ? 'border-red-400 focus:ring-red-100' : 'border-line focus:border-violet focus:ring-violet/10'}`}
        />
        <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-muted">{unit}</span>
      </span>
      {error && <span className="mt-1.5 block text-xs text-red-600">{error}</span>}
    </label>
  )
}
