import { useMemo, useState } from 'react'
import { calculateDailyTargets } from '@wellpath/engine'
import { Avatar, Badge, Button, Card, Confirm, Drawer, Empty, PageHeader, Pagination, SearchInput, Select, td, th } from '../components/ui'
import { Icon } from '../components/icons'
import { toast } from '../components/toast'
import { setState, useStore } from '../lib/store'
import { CONDITION_LABEL, GOAL_LABEL, type User } from '../lib/types'
import { dateFmt, timeAgo } from '../lib/format'

type SortKey = 'joinedAt' | 'name' | 'lastActiveAt' | 'streakDays'
const PAGE = 12

export function Users() {
  const users = useStore((s) => s.users)
  const limit = useStore((s) => s.ai.dailyLimitPerUser)
  const [q, setQ] = useState('')
  const [goal, setGoal] = useState('all')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'joinedAt', dir: -1 })
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<string[]>([])
  const [openId, setOpenId] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<null | { title: string; body: string; label: string; danger?: boolean; run: () => void }>(null)

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    return users
      .filter((u) => (!s || u.name.toLowerCase().includes(s) || u.email.includes(s) || u.id.includes(s)) && (goal === 'all' || u.goal === goal) && (status === 'all' || u.status === status))
      .sort((a, b) => (a[sort.key] > b[sort.key] ? 1 : a[sort.key] < b[sort.key] ? -1 : 0) * sort.dir)
  }, [users, q, goal, status, sort])

  const pages = Math.ceil(filtered.length / PAGE)
  const rows = filtered.slice((page - 1) * PAGE, page * PAGE)
  const open = users.find((u) => u.id === openId) ?? null
  const allOnPage = rows.length > 0 && rows.every((r) => selected.includes(r.id))

  const setSortKey = (key: SortKey) => setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : -1 }))
  const updateUsers = (ids: string[], patch: Partial<User>, action: string, target: string) => {
    setState((s) => ({ users: s.users.map((u) => (ids.includes(u.id) ? { ...u, ...patch } : u)) }), { action, target })
  }
  const exportCsv = () => {
    const head = ['id', 'name', 'email', 'country', 'goal', 'status', 'joinedAt']
    const csv = [head.join(','), ...filtered.map((u) => head.map((h) => `"${String(u[h as keyof User]).replace(/"/g, '""')}"`).join(','))].join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `wellpath-users-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    toast(`Exported ${filtered.length} users`)
  }

  const SortTh = ({ k, children }: { k: SortKey; children: string }) => (
    <th className={th}>
      <button className="inline-flex items-center gap-1 uppercase hover:text-heading" onClick={() => setSortKey(k)}>
        {children}{sort.key === k && <Icon name={sort.dir === 1 ? 'up' : 'down'} className="h-3 w-3" />}
      </button>
    </th>
  )

  return (
    <div className="fade-in">
      <PageHeader title="Users" sub={`${users.length} registered users`} actions={<Button icon="download" onClick={exportCsv}>Export CSV</Button>} />

      <Card>
        <div className="flex flex-col gap-3 border-b border-line p-4 md:flex-row md:items-center">
          <div className="flex-1"><SearchInput value={q} onChange={(v) => { setQ(v); setPage(1) }} placeholder="Search by name, email or ID" /></div>
          <Select value={goal} onChange={(e) => { setGoal(e.target.value); setPage(1) }} className="md:w-48" aria-label="Filter by goal">
            <option value="all">All goals</option>
            {Object.entries(GOAL_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className="md:w-40" aria-label="Filter by status">
            <option value="all">All statuses</option><option value="active">Active</option><option value="suspended">Suspended</option>
          </Select>
        </div>

        {selected.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-line bg-ink-3/60 px-4 py-2.5 text-sm">
            <span className="font-semibold text-violet">{selected.length} selected</span>
            <Button onClick={() => { updateUsers(selected, { aiQuestionsToday: 0 }, 'Reset AI limit', `${selected.length} users`); toast('AI limits reset'); setSelected([]) }}>Reset AI limit</Button>
            <Button onClick={() => setConfirm({ title: 'Suspend users', body: `Suspend ${selected.length} users? They will not be able to sign in.`, label: 'Suspend', danger: true, run: () => { updateUsers(selected, { status: 'suspended' }, 'Suspended users', `${selected.length} users`); toast('Users suspended'); setSelected([]) } })}>Suspend</Button>
            <Button variant="ghost" onClick={() => setSelected([])}>Clear</Button>
          </div>
        )}

        {rows.length === 0 ? <Empty title="No users found" body="Try a different search or filter." /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px]">
              <thead className="bg-ink-2/60">
                <tr>
                  <th className="w-10 px-5"><input type="checkbox" className="accent-violet" checked={allOnPage} onChange={(e) => setSelected(e.target.checked ? [...new Set([...selected, ...rows.map((r) => r.id)])] : selected.filter((id) => !rows.some((r) => r.id === id)))} aria-label="Select all on page" /></th>
                  <SortTh k="name">User</SortTh><th className={th}>Goal</th><th className={th}>Status</th><SortTh k="streakDays">Streak</SortTh><th className={th}>AI today</th><SortTh k="lastActiveAt">Last active</SortTh><SortTh k="joinedAt">Joined</SortTh>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((u) => (
                  <tr key={u.id} className="cursor-pointer hover:bg-ink-2/60" onClick={() => setOpenId(u.id)}>
                    <td className="px-5" onClick={(e) => e.stopPropagation()}><input type="checkbox" className="accent-violet" checked={selected.includes(u.id)} onChange={(e) => setSelected(e.target.checked ? [...selected, u.id] : selected.filter((i) => i !== u.id))} aria-label={`Select ${u.name}`} /></td>
                    <td className={td}><div className="flex items-center gap-3"><Avatar name={u.name} /><div><p className="font-medium text-heading">{u.name}</p><p className="text-xs text-muted">{u.email}</p></div></div></td>
                    <td className={td}><Badge tone="indigo">{GOAL_LABEL[u.goal]}</Badge></td>
                    <td className={td}>{u.status === 'active' ? <Badge tone="green">Active</Badge> : <Badge tone="red">Suspended</Badge>}{u.conditions.length > 0 && <span className="ml-1.5"><Badge tone="amber">Safety</Badge></span>}</td>
                    <td className={`${td} tabular-nums text-text`}>{u.streakDays} days</td>
                    <td className={`${td} tabular-nums ${u.aiQuestionsToday >= limit ? 'font-semibold text-rose' : 'text-text'}`}>{u.aiQuestionsToday} / {limit}</td>
                    <td className={`${td} text-muted`}>{timeAgo(u.lastActiveAt)}</td>
                    <td className={`${td} text-muted`}>{dateFmt(u.joinedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} pages={pages} total={filtered.length} onPage={setPage} />
      </Card>

      {open && (
        <UserDrawer
          user={open} limit={limit} onClose={() => setOpenId(null)}
          onToggleStatus={() => { const s = open.status === 'active' ? 'suspended' : 'active'; updateUsers([open.id], { status: s }, s === 'active' ? 'Reactivated user' : 'Suspended user', open.email); toast(s === 'active' ? 'User reactivated' : 'User suspended') }}
          onResetAi={() => { updateUsers([open.id], { aiQuestionsToday: 0 }, 'Reset AI limit', open.email); toast('AI limit reset') }}
          onDelete={() => setConfirm({ title: 'Delete user', body: `Permanently delete ${open.name} and all their data? This cannot be undone.`, label: 'Delete user', danger: true, run: () => { setState((s) => ({ users: s.users.filter((u) => u.id !== open.id) }), { action: 'Deleted user', target: open.email }); setOpenId(null); toast('User deleted') } })}
        />
      )}
      {confirm && <Confirm title={confirm.title} body={confirm.body} confirmLabel={confirm.label} danger={confirm.danger} onConfirm={confirm.run} onClose={() => setConfirm(null)} />}
    </div>
  )
}

function UserDrawer({ user: u, limit, onClose, onToggleStatus, onResetAi, onDelete }: { user: User; limit: number; onClose: () => void; onToggleStatus: () => void; onResetAi: () => void; onDelete: () => void }) {
  const t = calculateDailyTargets(u)
  const rows: [string, string][] = [['User ID', u.id], ['Country', u.country], ['Sex', u.sex === 'male' ? 'Male' : 'Female'], ['Age', `${u.age}`], ['Height', `${u.heightCm} cm`], ['Weight', `${u.weightKg} kg`], ['Activity', u.activityLevel.replace('_', ' ').replace(/^./, (c) => c.toUpperCase())], ['Joined', dateFmt(u.joinedAt)], ['Last active', timeAgo(u.lastActiveAt)]]
  return (
    <Drawer title="User details" onClose={onClose}>
      <div className="flex items-center gap-4">
        <Avatar name={u.name} size="h-14 w-14 text-base" />
        <div><p className="text-lg font-bold text-heading">{u.name}</p><p className="text-sm text-muted">{u.email}</p>
          <div className="mt-1.5 flex gap-1.5">{u.status === 'active' ? <Badge tone="green">Active</Badge> : <Badge tone="red">Suspended</Badge>}<Badge tone="indigo">{GOAL_LABEL[u.goal]}</Badge></div></div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {[['Streak', `${u.streakDays}d`], ['Weight change', `${u.weightChangeKg > 0 ? '+' : ''}${u.weightChangeKg} kg`], ['AI today', `${u.aiQuestionsToday}/${limit}`]].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-ink-2 p-3 text-center"><p className="font-bold text-heading">{v}</p><p className="text-xs text-muted">{k}</p></div>
        ))}
      </div>

      <section className="mt-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Plan engine targets</h3>
        <div className="mt-2 rounded-xl border border-line p-4">
          <p className="text-2xl font-extrabold text-heading">{t.calories} <span className="text-sm font-medium text-muted">kcal / day</span></p>
          <p className="mt-1 text-sm text-text">Protein {t.proteinG} g · Carbs {t.carbsG} g · Fat {t.fatG} g</p>
          <ul className="mt-3 space-y-1 text-xs text-muted">{t.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
        </div>
      </section>

      <section className="mt-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Safety</h3>
        <div className="mt-2 flex flex-wrap gap-1.5">{u.conditions.length ? u.conditions.map((c) => <Badge key={c} tone="amber">{CONDITION_LABEL[c]}</Badge>) : <span className="text-sm text-muted">No injuries or conditions reported.</span>}</div>
      </section>

      <section className="mt-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">Profile</h3>
        <dl className="mt-2 divide-y divide-line rounded-xl border border-line">
          {rows.map(([k, v]) => <div key={k} className="flex justify-between px-4 py-2.5 text-sm"><dt className="text-muted">{k}</dt><dd className="font-medium text-heading">{v}</dd></div>)}
        </dl>
      </section>

      <div className="mt-6 grid gap-2">
        <Button onClick={onResetAi} icon="refresh">Reset today's AI limit</Button>
        <Button onClick={onToggleStatus}>{u.status === 'active' ? 'Suspend user' : 'Reactivate user'}</Button>
        <Button variant="danger" icon="trash" onClick={onDelete}>Delete user and data</Button>
      </div>
    </Drawer>
  )
}
