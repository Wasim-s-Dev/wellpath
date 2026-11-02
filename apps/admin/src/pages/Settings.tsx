import { useState } from 'react'
import { Button, Card, CardHeader, Confirm, PageHeader, Toggle } from '../components/ui'
import { toast } from '../components/toast'
import { resetDemoData, setState, useStore } from '../lib/store'
import type { FeatureFlags } from '../lib/types'

const flagInfo: { key: keyof FeatureFlags; label: string; body: string }[] = [
  { key: 'signupsOpen', label: 'New sign-ups', body: 'Allow new users to create accounts.' },
  { key: 'weeklyReports', label: 'Weekly AI reports', body: 'Send each user a weekly progress summary.' },
  { key: 'ramadanMode', label: 'Ramadan mode', body: 'Offer sehri and iftar plans to all users.' },
  { key: 'photoLogging', label: 'Photo food logging', body: 'Beta. Lets users log meals with a photo.' },
  { key: 'maintenanceMode', label: 'Maintenance mode', body: 'Show a maintenance page to users. Admins keep access.' },
]

export function Settings() {
  const flags = useStore((s) => s.flags)
  const [reset, setReset] = useState(false)
  return (
    <div className="fade-in space-y-6">
      <PageHeader title="Settings" sub="Feature flags and platform controls." />
      <Card>
        <CardHeader title="Feature flags" sub="Changes apply immediately and are recorded in the audit log." />
        <ul className="divide-y divide-line">
          {flagInfo.map((f) => (
            <li key={f.key} className="flex items-center justify-between gap-6 px-5 py-4">
              <div><p className="text-sm font-medium text-heading">{f.label}</p><p className="text-xs text-muted">{f.body}</p></div>
              <Toggle label={f.label} checked={flags[f.key]} onChange={(v) => { setState((s) => ({ flags: { ...s.flags, [f.key]: v } }), { action: `${v ? 'Enabled' : 'Disabled'} ${f.label.toLowerCase()}`, target: 'feature flag' }); toast(`${f.label} ${v ? 'on' : 'off'}`) }} />
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <CardHeader title="Demo data" sub="Restore the original sample users, foods, rules and settings." />
        <div className="p-5"><Button variant="danger" icon="refresh" onClick={() => setReset(true)}>Reset demo data</Button></div>
      </Card>
      {reset && <Confirm title="Reset demo data" body="All changes you made in this browser will be lost." confirmLabel="Reset" danger onClose={() => setReset(false)} onConfirm={() => { resetDemoData(); toast('Demo data restored') }} />}
    </div>
  )
}
