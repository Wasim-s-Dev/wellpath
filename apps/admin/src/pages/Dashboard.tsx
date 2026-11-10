import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { AreaChart, BarList, StackedBars } from '../components/charts'
import { Icon } from '../components/icons'
import { Avatar, Badge, Card, CardHeader, PageHeader, td, th } from '../components/ui'
import { API_URL } from '../lib/api'
import { aiUsage } from '../lib/seed'
import { useStore } from '../lib/store'
import { GOAL_LABEL } from '../lib/types'
import { fmt, timeAgo } from '../lib/format'

const DAY = 86_400_000

export function Dashboard() {
  const users = useStore((s) => s.users)
  const ai = useStore((s) => s.ai)
  const [api, setApi] = useState<'checking' | 'online' | 'offline'>('checking')
  const [latency, setLatency] = useState<number | null>(null)

  useEffect(() => {
    const t0 = performance.now()
    fetch(`${API_URL}/health`).then((r) => r.json()).then((d) => { setApi(d.status === 'ok' ? 'online' : 'offline'); setLatency(Math.round(performance.now() - t0)) }).catch(() => setApi('offline'))
  }, [])

  const k = useMemo(() => {
    const now = Date.now()
    const active7 = users.filter((u) => now - +new Date(u.lastActiveAt) < 7 * DAY).length
    const new7 = users.filter((u) => now - +new Date(u.joinedAt) < 7 * DAY).length
    const prev7 = users.filter((u) => { const a = now - +new Date(u.joinedAt); return a >= 7 * DAY && a < 14 * DAY }).length
    const aiToday = users.reduce((a, u) => a + u.aiQuestionsToday, 0)
    const atLimit = users.filter((u) => u.aiQuestionsToday >= ai.dailyLimitPerUser).length
    const flagged = users.filter((u) => u.conditions.length > 0).length
    const growth = Array.from({ length: 30 }, (_, i) => {
      const end = now - (29 - i) * DAY
      return { x: new Date(end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }), y: users.filter((u) => +new Date(u.joinedAt) <= end).length }
    })
    const goals = Object.entries(GOAL_LABEL).map(([g, label]) => ({ label, value: users.filter((u) => u.goal === g).length })).sort((a, b) => b.value - a.value)
    return { active7, new7, prev7, aiToday, atLimit, flagged, growth, goals }
  }, [users, ai.dailyLimitPerUser])

  const delta = k.prev7 ? Math.round(((k.new7 - k.prev7) / k.prev7) * 100) : 100
  const stats = [
    { label: 'Total users', value: fmt.format(users.length), note: `+${k.new7} this week`, trend: delta, icon: 'users' },
    { label: 'Active in last 7 days', value: fmt.format(k.active7), note: `${Math.round((k.active7 / users.length) * 100)}% of all users`, icon: 'bolt' },
    { label: 'AI questions today', value: fmt.format(k.aiToday), note: `${k.atLimit} users hit the daily limit`, icon: 'sparkles' },
    { label: 'Users with safety rules', value: fmt.format(k.flagged), note: 'Injury or condition on profile', icon: 'shield' },
  ]

  return (
    <div className="fade-in space-y-6">
      <PageHeader title="Dashboard" sub="How WellPath is doing today." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted">{s.label}</p>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink-3 text-violet"><Icon name={s.icon} /></span>
            </div>
            <p className="mt-3 text-3xl font-extrabold tracking-tight text-heading tabular-nums">{s.value}</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
              {s.trend !== undefined && <span className={`inline-flex items-center font-semibold ${s.trend >= 0 ? 'text-green-600' : 'text-rose'}`}><Icon name={s.trend >= 0 ? 'up' : 'down'} className="h-3 w-3" />{Math.abs(s.trend)}%</span>}
              {s.note}
            </p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="User growth" sub="Total registered users, last 30 days" />
          <div className="p-5"><AreaChart data={k.growth} label="Total users over the last 30 days" /></div>
        </Card>
        <Card>
          <CardHeader title="Goals" sub="What users are working towards" />
          <div className="p-5"><BarList items={k.goals} /></div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="AI requests" sub="Last 7 days by source" action={<Link to="/ai" className="text-sm font-semibold text-violet hover:underline">AI settings</Link>} />
          <div className="p-5"><StackedBars rows={aiUsage} keys={['gemini', 'groq', 'cached']} colors={['#4f46e5', '#a5b4fc', '#22c55e']} label="AI requests per day by provider" /></div>
        </Card>
        <Card>
          <CardHeader title="System health" />
          <ul className="divide-y divide-line">
            {[
              { k: 'API', v: api === 'checking' ? 'Checking' : api === 'online' ? `Online${latency !== null ? `, ${latency} ms` : ''}` : 'Offline', tone: api === 'online' ? 'green' : api === 'offline' ? 'red' : 'gray' },
              { k: 'Database', v: 'Not connected yet', tone: 'amber' },
              { k: 'AI primary', v: ai.enabled ? 'Google Gemini' : 'Disabled', tone: ai.enabled ? 'green' : 'red' },
              { k: 'AI fallback', v: 'Groq, then saved answer', tone: 'indigo' },
              { k: 'Response cache', v: ai.cacheEnabled ? 'On' : 'Off', tone: ai.cacheEnabled ? 'green' : 'gray' },
            ].map((r) => (
              <li key={r.k} className="flex items-center justify-between px-5 py-3.5 text-sm">
                <span className="text-text">{r.k}</span>
                <Badge tone={r.tone as 'green'}>{r.v}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card>
        <CardHeader title="Newest users" action={<Link to="/users" className="text-sm font-semibold text-violet hover:underline">View all</Link>} />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-ink-2/60"><tr><th className={th}>User</th><th className={th}>Goal</th><th className={th}>Country</th><th className={th}>Joined</th></tr></thead>
            <tbody className="divide-y divide-line">
              {users.slice(0, 6).map((u) => (
                <tr key={u.id} className="hover:bg-ink-2/60">
                  <td className={td}><div className="flex items-center gap-3"><Avatar name={u.name} /><div><p className="font-medium text-heading">{u.name}</p><p className="text-xs text-muted">{u.email}</p></div></div></td>
                  <td className={td}><Badge tone="indigo">{GOAL_LABEL[u.goal]}</Badge></td>
                  <td className={`${td} text-text`}>{u.country}</td>
                  <td className={`${td} text-muted`}>{timeAgo(u.joinedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
