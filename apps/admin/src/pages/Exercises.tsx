import { useMemo, useState } from 'react'
import { Badge, Button, Card, Confirm, Field, Input, Modal, PageHeader, SearchInput, Select, td, th } from '../components/ui'
import { toast } from '../components/toast'
import { newId, setState, useStore } from '../lib/store'
import type { Exercise } from '../lib/types'

const levelTone = { beginner: 'green', intermediate: 'indigo', advanced: 'amber' } as const

export function Exercises() {
  const items = useStore((s) => s.exercises)
  const rules = useStore((s) => s.rules)
  const [q, setQ] = useState('')
  const [level, setLevel] = useState('all')
  const [editing, setEditing] = useState<Exercise | null | 'new'>(null)
  const [toDelete, setToDelete] = useState<Exercise | null>(null)
  const rows = useMemo(() => items.filter((e) => e.name.toLowerCase().includes(q.toLowerCase()) && (level === 'all' || e.level === level)), [items, q, level])
  const blockedBy = (name: string) => rules.filter((r) => r.active && r.blocked.includes(name)).length

  return (
    <div className="fade-in">
      <PageHeader title="Exercises" sub={`${items.length} exercises in the home workout library`} actions={<Button variant="primary" icon="plus" onClick={() => setEditing('new')}>Add exercise</Button>} />
      <Card>
        <div className="flex flex-col gap-3 border-b border-line p-4 md:flex-row">
          <div className="flex-1"><SearchInput value={q} onChange={setQ} placeholder="Search exercises" /></div>
          <Select value={level} onChange={(e) => setLevel(e.target.value)} className="md:w-44" aria-label="Filter by level"><option value="all">All levels</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></Select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead className="bg-ink-2/60"><tr><th className={th}>Exercise</th><th className={th}>Level</th><th className={th}>Equipment</th><th className={th}>Minutes</th><th className={th}>Safety rules</th><th className={th}><span className="sr-only">Actions</span></th></tr></thead>
            <tbody className="divide-y divide-line">
              {rows.map((e) => (
                <tr key={e.id} className="hover:bg-ink-2/60">
                  <td className={td}><p className="font-medium text-heading">{e.name}</p><p className="text-xs text-muted">{e.muscleGroup}</p></td>
                  <td className={td}><Badge tone={levelTone[e.level]}>{e.level}</Badge></td>
                  <td className={`${td} text-text`}>{e.equipment}</td>
                  <td className={`${td} tabular-nums text-text`}>{e.minutes}</td>
                  <td className={td}>{blockedBy(e.name) ? <Badge tone="amber">Blocked by {blockedBy(e.name)}</Badge> : <span className="text-sm text-muted">None</span>}</td>
                  <td className={`${td} text-right`}><div className="flex justify-end gap-1"><Button variant="ghost" icon="edit" aria-label={`Edit ${e.name}`} onClick={() => setEditing(e)} /><Button variant="ghost" icon="trash" aria-label={`Delete ${e.name}`} onClick={() => setToDelete(e)} /></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      {editing && <ExerciseForm ex={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
      {toDelete && <Confirm title="Delete exercise" body={`Delete "${toDelete.name}"?`} confirmLabel="Delete" danger onClose={() => setToDelete(null)} onConfirm={() => { setState((s) => ({ exercises: s.exercises.filter((x) => x.id !== toDelete.id) }), { action: 'Deleted exercise', target: toDelete.name }); toast('Exercise deleted') }} />}
    </div>
  )
}

function ExerciseForm({ ex, onClose }: { ex: Exercise | null; onClose: () => void }) {
  const [f, setF] = useState<Exercise>(ex ?? { id: newId('ex'), name: '', muscleGroup: 'Full body', level: 'beginner', equipment: 'None', minutes: 5 })
  const [err, setErr] = useState('')
  const save = () => {
    if (f.name.trim().length < 2) return setErr('Name is required.')
    setState((s) => ({ exercises: ex ? s.exercises.map((x) => (x.id === f.id ? f : x)) : [f, ...s.exercises] }), { action: ex ? 'Edited exercise' : 'Added exercise', target: f.name })
    toast(ex ? 'Exercise updated' : 'Exercise added')
    onClose()
  }
  return (
    <Modal title={ex ? 'Edit exercise' : 'Add exercise'} onClose={onClose} footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" onClick={save}>Save</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Field label="Name" error={err}><Input value={f.name} onChange={(e) => { setF({ ...f, name: e.target.value }); setErr('') }} /></Field></div>
        <Field label="Muscle group"><Input value={f.muscleGroup} onChange={(e) => setF({ ...f, muscleGroup: e.target.value })} /></Field>
        <Field label="Level"><Select value={f.level} onChange={(e) => setF({ ...f, level: e.target.value as Exercise['level'] })}><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></Select></Field>
        <Field label="Equipment"><Input value={f.equipment} onChange={(e) => setF({ ...f, equipment: e.target.value })} /></Field>
        <Field label="Minutes"><Input type="number" min={1} value={f.minutes} onChange={(e) => setF({ ...f, minutes: Number(e.target.value) })} /></Field>
      </div>
    </Modal>
  )
}
