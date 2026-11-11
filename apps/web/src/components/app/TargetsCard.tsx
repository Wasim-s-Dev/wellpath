/** Daily calorie and macro targets, with the reasons and any safety warnings. */
import type { DailyTargets } from '@wellpath/engine'
import { Notice } from './AppShell'

export function TargetsCard({ targets, notices }: { targets: DailyTargets; notices: string[] }) {
  return (
    <div className="space-y-4">
      <Notice tone="amber" title="Important" items={targets.warnings} />
      <div className="card p-6 sm:p-8">
        <p className="text-sm text-muted">Your daily target</p>
        <p className="mt-1 text-5xl font-extrabold tracking-tight text-heading">
          {targets.calories.toLocaleString()}<span className="ml-2 text-lg font-semibold text-muted">kcal</span>
        </p>
        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { k: 'Protein', v: targets.proteinG, c: 'text-lilac' },
            { k: 'Carbs', v: targets.carbsG, c: 'text-violet' },
            { k: 'Fat', v: targets.fatG, c: 'text-mint' },
          ].map((m) => (
            <div key={m.k} className="rounded-xl border border-line bg-ink-2/70 p-3 text-center">
              <p className={`text-xl font-bold ${m.c}`}>{m.v}g</p>
              <p className="text-xs text-muted">{m.k}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-xl border border-line bg-ink-2/50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Why these numbers</p>
          <ul className="mt-3 space-y-2 text-sm text-text">
            {targets.reasons.map((r) => <li key={r} className="flex gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-lilac" />{r}</li>)}
          </ul>
        </div>
      </div>
      <Notice tone="blue" title="Safety notes for your workouts" items={notices} />
    </div>
  )
}
