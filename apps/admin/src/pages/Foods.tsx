import { useMemo, useState } from 'react'
import { Badge, Button, Card, Confirm, Empty, Field, Input, Modal, PageHeader, SearchInput, Select, td, th } from '../components/ui'
import { toast } from '../components/toast'
import { newId, setState, useStore } from '../lib/store'
import type { Food } from '../lib/types'

const blank: Omit<Food, 'id'> = { name: '', portion: '', grams: 100, kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, cuisine: 'South Asian', verified: false }

export function Foods() {
  const foods = useStore((s) => s.foods)
  const [q, setQ] = useState('')
  const [cuisine, setCuisine] = useState('all')
  const [editing, setEditing] = useState<Food | Omit<Food, 'id'> | null>(null)
  const [toDelete, setToDelete] = useState<Food | null>(null)

  const cuisines = [...new Set(foods.map((f) => f.cuisine))]
  const rows = useMemo(() => foods.filter((f) => f.name.toLowerCase().includes(q.toLowerCase()) && (cuisine === 'all' || f.cuisine === cuisine)), [foods, q, cuisine])
  const unverified = foods.filter((f) => !f.verified).length

  return (
    <div className="fade-in">
      <PageHeader title="Foods" sub={`${foods.length} foods in the database${unverified ? `, ${unverified} waiting for verification` : ''}`} actions={<Button variant="primary" icon="plus" onClick={() => setEditing(blank)}>Add food</Button>} />
      <Card>
        <div className="flex flex-col gap-3 border-b border-line p-4 md:flex-row">
          <div className="flex-1"><SearchInput value={q} onChange={setQ} placeholder="Search foods" /></div>
          <Select value={cuisine} onChange={(e) => setCuisine(e.target.value)} className="md:w-48" aria-label="Filter by cuisine">
            <option value="all">All cuisines</option>{cuisines.map((c) => <option key={c}>{c}</option>)}
          </Select>
        </div>
        {rows.length === 0 ? <Empty title="No foods found" body="Add one or change the filter." /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead className="bg-ink-2/60"><tr><th className={th}>Food</th><th className={th}>Portion</th><th className={th}>kcal</th><th className={th}>Protein</th><th className={th}>Carbs</th><th className={th}>Fat</th><th className={th}>Status</th><th className={th}><span className="sr-only">Actions</span></th></tr></thead>
              <tbody className="divide-y divide-line">
                {rows.map((f) => (
                  <tr key={f.id} className="hover:bg-ink-2/60">
                    <td className={td}><p className="font-medium text-heading">{f.name}</p><p className="text-xs text-muted">{f.cuisine}</p></td>
                    <td className={`${td} text-text`}>{f.portion} <span className="text-muted">({f.grams} g)</span></td>
                    <td className={`${td} font-semibold tabular-nums text-heading`}>{f.kcal}</td>
                    <td className={`${td} tabular-nums text-text`}>{f.proteinG} g</td>
                    <td className={`${td} tabular-nums text-text`}>{f.carbsG} g</td>
                    <td className={`${td} tabular-nums text-text`}>{f.fatG} g</td>
                    <td className={td}>{f.verified ? <Badge tone="green">Verified</Badge> : <Badge tone="amber">Needs review</Badge>}</td>
                    <td className={`${td} text-right`}>
                      <div className="flex justify-end gap-1">
                        {!f.verified && <Button variant="ghost" onClick={() => { setState((s) => ({ foods: s.foods.map((x) => (x.id === f.id ? { ...x, verified: true } : x)) }), { action: 'Verified food', target: f.name }); toast('Food verified') }}>Verify</Button>}
                        <Button variant="ghost" icon="edit" aria-label={`Edit ${f.name}`} onClick={() => setEditing(f)} />
                        <Button variant="ghost" icon="trash" aria-label={`Delete ${f.name}`} onClick={() => setToDelete(f)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <p className="mt-3 text-xs text-muted">Demo values are approximate. Verify each food against a nutrition database before launch.</p>

      {editing && <FoodForm food={editing} onClose={() => setEditing(null)} />}
      {toDelete && <Confirm title="Delete food" body={`Delete "${toDelete.name}"? Plans that use it will need a replacement.`} confirmLabel="Delete" danger onClose={() => setToDelete(null)} onConfirm={() => { setState((s) => ({ foods: s.foods.filter((x) => x.id !== toDelete.id) }), { action: 'Deleted food', target: toDelete.name }); toast('Food deleted') }} />}
    </div>
  )
}

function FoodForm({ food, onClose }: { food: Food | Omit<Food, 'id'>; onClose: () => void }) {
  const [f, setF] = useState(food)
  const [err, setErr] = useState<Record<string, string>>({})
  const isNew = !('id' in food)
  const num = (k: keyof Food) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: Number(e.target.value) })
  const macroKcal = Math.round(f.proteinG * 4 + f.carbsG * 4 + f.fatG * 9)

  const save = () => {
    const e: Record<string, string> = {}
    if (f.name.trim().length < 2) e.name = 'Name is required.'
    if (!f.portion.trim()) e.portion = 'Portion is required.'
    if (f.kcal <= 0) e.kcal = 'Calories must be above 0.'
    if (f.kcal > 0 && Math.abs(macroKcal - f.kcal) / f.kcal > 0.25) e.kcal = `Macros add up to ${macroKcal} kcal. Check the values.`
    setErr(e)
    if (Object.keys(e).length) return
    setState((s) => ({ foods: isNew ? [{ ...(f as Omit<Food, 'id'>), id: newId('food') }, ...s.foods] : s.foods.map((x) => (x.id === (f as Food).id ? (f as Food) : x)) }), { action: isNew ? 'Added food' : 'Edited food', target: f.name })
    toast(isNew ? 'Food added' : 'Food updated')
    onClose()
  }

  return (
    <Modal title={isNew ? 'Add food' : 'Edit food'} onClose={onClose} footer={<><Button onClick={onClose}>Cancel</Button><Button variant="primary" onClick={save}>Save</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2"><Field label="Name" error={err.name}><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. Chicken karahi" /></Field></div>
        <Field label="Portion" error={err.portion}><Input value={f.portion} onChange={(e) => setF({ ...f, portion: e.target.value })} placeholder="1 plate" /></Field>
        <Field label="Grams"><Input type="number" min={1} value={f.grams} onChange={num('grams')} /></Field>
        <Field label="Calories (kcal)" error={err.kcal} hint={`Macros add up to ${macroKcal} kcal`}><Input type="number" min={0} value={f.kcal} onChange={num('kcal')} /></Field>
        <Field label="Cuisine"><Select value={f.cuisine} onChange={(e) => setF({ ...f, cuisine: e.target.value })}><option>South Asian</option><option>Global</option><option>Middle Eastern</option><option>East Asian</option></Select></Field>
        <Field label="Protein (g)"><Input type="number" min={0} step="0.1" value={f.proteinG} onChange={num('proteinG')} /></Field>
        <Field label="Carbs (g)"><Input type="number" min={0} step="0.1" value={f.carbsG} onChange={num('carbsG')} /></Field>
        <Field label="Fat (g)"><Input type="number" min={0} step="0.1" value={f.fatG} onChange={num('fatG')} /></Field>
      </div>
    </Modal>
  )
}
