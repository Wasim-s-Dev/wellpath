import { useState } from 'react'
import { Badge, Button, Card, CardHeader, Field, Input, PageHeader, Toggle, td, th } from '../components/ui'
import { StackedBars } from '../components/charts'
import { toast } from '../components/toast'
import { aiUsage } from '../lib/seed'
import { setState, useStore } from '../lib/store'
import { PROVIDER_LABEL, type AiSettings as AiS, type Provider } from '../lib/types'
import { fmt } from '../lib/format'

export function AiSettings() {
  const saved = useStore((s) => s.ai)
  const [ai, setAi] = useState<AiS>(saved)
  const dirty = JSON.stringify(ai) !== JSON.stringify(saved)

  const move = (i: number, d: -1 | 1) => {
    const order = [...ai.fallbackOrder]
    const j = i + d
    if (j < 0 || j >= order.length) return
    ;[order[i], order[j]] = [order[j], order[i]]
    setAi({ ...ai, fallbackOrder: order })
  }
  const save = () => { setState(() => ({ ai }), { action: 'Updated AI settings', target: `limit ${ai.dailyLimitPerUser}, primary ${PROVIDER_LABEL[ai.fallbackOrder[0]]}` }); toast('AI settings saved') }

  const totals = aiUsage.reduce((a, d) => ({ gemini: a.gemini + d.gemini, groq: a.groq + d.groq, cached: a.cached + d.cached, errors: a.errors + d.errors }), { gemini: 0, groq: 0, cached: 0, errors: 0 })
  const all = totals.gemini + totals.groq + totals.cached
  const status: Record<Provider, { tone: 'green' | 'gray'; text: string }> = { gemini: { tone: 'green', text: 'Free tier' }, groq: { tone: 'green', text: 'Free tier' }, openai: { tone: 'gray', text: 'Paid, off by default' } }

  return (
    <div className="fade-in space-y-6">
      <PageHeader title="AI settings" sub="Control providers, limits and cost. Calorie targets and safety rules are never changed by the AI." actions={<><Button disabled={!dirty} onClick={() => setAi(saved)}>Discard</Button><Button variant="primary" disabled={!dirty} onClick={save}>Save changes</Button></>} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[['Requests, 7 days', fmt.format(all)], ['Served from cache', `${Math.round((totals.cached / all) * 100)}%`], ['Error rate', `${((totals.errors / all) * 100).toFixed(1)}%`], ['Estimated cost', '$0.00']].map(([k, v]) => (
          <Card key={k} className="p-5"><p className="text-sm text-muted">{k}</p><p className="mt-2 text-2xl font-extrabold text-heading">{v}</p></Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader title="Provider fallback order" sub="If a provider fails or hits its limit, WellPath tries the next one, then a saved answer." />
          <ol className="divide-y divide-line">
            {ai.fallbackOrder.map((p, i) => (
              <li key={p} className="flex items-center gap-3 px-5 py-3.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-3 text-xs font-bold text-violet">{i + 1}</span>
                <div className="flex-1"><p className="text-sm font-medium text-heading">{PROVIDER_LABEL[p]}</p></div>
                <Badge tone={status[p].tone}>{status[p].text}</Badge>
                <Button variant="ghost" icon="up" aria-label={`Move ${PROVIDER_LABEL[p]} up`} disabled={i === 0} onClick={() => move(i, -1)} className="!p-1.5" />
                <Button variant="ghost" icon="down" aria-label={`Move ${PROVIDER_LABEL[p]} down`} disabled={i === ai.fallbackOrder.length - 1} onClick={() => move(i, 1)} className="!p-1.5" />
              </li>
            ))}
            <li className="flex items-center gap-3 px-5 py-3.5 text-sm text-muted"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-2 text-xs font-bold">{ai.fallbackOrder.length + 1}</span>Saved answer (always available)</li>
          </ol>
        </Card>

        <Card>
          <CardHeader title="Limits and behaviour" />
          <div className="space-y-5 p-5">
            <div className="flex items-center justify-between gap-4">
              <div><p className="text-sm font-medium text-heading">AI coach enabled</p><p className="text-xs text-muted">Kill switch. When off, users see saved answers only.</p></div>
              <Toggle label="AI coach enabled" checked={ai.enabled} onChange={(v) => setAi({ ...ai, enabled: v })} />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div><p className="text-sm font-medium text-heading">Response cache</p><p className="text-xs text-muted">Reuse answers to common questions to save cost.</p></div>
              <Toggle label="Response cache" checked={ai.cacheEnabled} onChange={(v) => setAi({ ...ai, cacheEnabled: v })} />
            </div>
            <Field label={`Daily questions per user: ${ai.dailyLimitPerUser}`} hint="Free plan limit. Resets at midnight.">
              <input type="range" min={5} max={50} step={5} value={ai.dailyLimitPerUser} onChange={(e) => setAi({ ...ai, dailyLimitPerUser: Number(e.target.value) })} className="w-full accent-violet" />
            </Field>
            <Field label={`Temperature: ${ai.temperature.toFixed(1)}`} hint="Lower is more consistent. Keep at 0.3 or below for health answers.">
              <input type="range" min={0} max={1} step={0.1} value={ai.temperature} onChange={(e) => setAi({ ...ai, temperature: Number(e.target.value) })} className="w-full accent-violet" />
            </Field>
            <Field label="Prompt version" hint="Versioned so answers can be traced and rolled back."><Input value={ai.promptVersion} onChange={(e) => setAi({ ...ai, promptVersion: e.target.value })} /></Field>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Requests by source" sub="Last 7 days" />
        <div className="p-5"><StackedBars rows={aiUsage} keys={['gemini', 'groq', 'cached']} colors={['#4f46e5', '#a5b4fc', '#22c55e']} label="AI requests per day by source" /></div>
        <div className="overflow-x-auto border-t border-line">
          <table className="w-full min-w-[600px]">
            <thead className="bg-ink-2/60"><tr><th className={th}>Day</th><th className={th}>Gemini</th><th className={th}>Groq</th><th className={th}>Cached</th><th className={th}>Errors</th><th className={th}>Median latency</th></tr></thead>
            <tbody className="divide-y divide-line">
              {aiUsage.map((d) => (
                <tr key={d.day}><td className={`${td} font-medium text-heading`}>{d.day}</td><td className={`${td} tabular-nums`}>{d.gemini}</td><td className={`${td} tabular-nums`}>{d.groq}</td><td className={`${td} tabular-nums`}>{d.cached}</td><td className={`${td} tabular-nums`}>{d.errors}</td><td className={`${td} tabular-nums`}>{d.p50ms} ms</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
