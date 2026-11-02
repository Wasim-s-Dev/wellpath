import { useState } from 'react'
import { Badge, Button, Card, Field, Input, Modal, PageHeader, Toggle } from '../components/ui'
import { Icon } from '../components/icons'
import { toast } from '../components/toast'
import { setState, useStore } from '../lib/store'
import { CONDITION_LABEL, type SafetyRule } from '../lib/types'

export function SafetyRules() {
  const rules = useStore((s) => s.rules)
  const users = useStore((s) => s.users)
  const exercises = useStore((s) => s.exercises)
  const [editing, setEditing] = useState<SafetyRule | null>(null)

  return (
    <div className="fade-in">
      <PageHeader title="Safety rules" sub="Exercises removed or swapped for users who report an injury or condition. The AI coach cannot override these." />
      <div className="grid gap-4 lg:grid-cols-2">
        {rules.map((r) => {
          const affected = users.filter((u) => u.conditions.includes(r.condition)).length
          return (
            <Card key={r.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${r.active ? 'bg-ink-3 text-violet' : 'bg-ink-2 text-muted'}`}><Icon name="shield" /></span>
                  <div><h2 className="font-semibold text-heading">{CONDITION_LABEL[r.condition]}</h2><p className="text-xs text-muted">Applies to {affected} users</p></div>
                </div>
                <Toggle label={`Rule for ${CONDITION_LABEL[r.condition]}`} checked={r.active} onChange={(v) => { setState((s) => ({ rules: s.rules.map((x) => (x.id === r.id ? { ...x, active: v } : x)) }), { action: v ? 'Enabled safety rule' : 'Disabled safety rule', target: CONDITION_LABEL[r.condition] }); toast(v ? 'Rule enabled' : 'Rule disabled', v ? 'success' : 'error') }} />
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted">Blocked exercises</p>
              <div className="mt-2 flex flex-wrap gap-1.5">{r.blocked.map((b) => <Badge key={b} tone={exercises.some((e) => e.name === b) ? 'red' : 'gray'}>{b}</Badge>)}</div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted">Suggested swaps</p>
              <p className="mt-1 text-sm text-text">{r.swaps}</p>
              <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">{r.notice}</p>
              <div className="mt-4 flex justify-end"><Button icon="edit" onClick={() => setEditing(r)}>Edit rule</Button></div>
            </Card>
          )
        })}
      </div>
      {editing && <RuleForm rule={editing} names={exercises.map((e) => e.name)} onClose={() => setEditing(null)} />}
    </div>
  )
}

function RuleForm({ rule, names, onClose }: { rule: SafetyRule; names: string[]; onClose: () => void }) {
  const [r, setR] = useState(rule)
  const toggle = (n: string) => setR({ ...r, blocked: r.blocked.includes(n) ? r.blocked.filter((b) => b !== n) : [...r.blocked, n] })
  const save = () => { setState((s) => ({ rules: s.rules.map((x) => (x.id === r.id ? r : x)) }), { action: 'Edited safety rule', target: CONDITION_LABEL[r.condition] }); toast('Safety rule saved'); onClose() }
  return (
    <Modal title={`Edit rule: ${CONDITION_LABEL[r.condition]}`} width="max-w-2xl" onClose={onClose} footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" onClick={save}>Save rule</Button></>}>
      <p className="text-sm font-medium text-heading">Blocked exercises</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {names.map((n) => (
          <button key={n} type="button" onClick={() => toggle(n)} aria-pressed={r.blocked.includes(n)} className={`rounded-full border px-3 py-1.5 text-sm transition ${r.blocked.includes(n) ? 'border-rose/40 bg-red-50 text-red-700' : 'border-line text-text hover:bg-ink-2'}`}>{n}</button>
        ))}
      </div>
      <div className="mt-5 grid gap-4">
        <Field label="Suggested swaps"><Input value={r.swaps} onChange={(e) => setR({ ...r, swaps: e.target.value })} /></Field>
        <Field label="Doctor notice shown to the user"><Input value={r.notice} onChange={(e) => setR({ ...r, notice: e.target.value })} /></Field>
      </div>
    </Modal>
  )
}
