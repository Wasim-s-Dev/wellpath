/** Lightweight toast notifications. Call toast('Saved') from anywhere. */
import { useSyncExternalStore } from 'react'
import { Icon } from './icons'

type T = { id: number; text: string; tone: 'success' | 'error' }
let items: T[] = []
const subs = new Set<() => void>()
const emit = () => subs.forEach((s) => s())

export function toast(text: string, tone: T['tone'] = 'success') {
  const t = { id: Date.now() + Math.random(), text, tone }
  items = [...items, t]
  emit()
  setTimeout(() => { items = items.filter((i) => i.id !== t.id); emit() }, 3000)
}

export function Toaster() {
  const list = useSyncExternalStore((cb) => { subs.add(cb); return () => subs.delete(cb) }, () => items)
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex flex-col gap-2" aria-live="polite">
      {list.map((t) => (
        <div key={t.id} className="fade-in pointer-events-auto flex items-center gap-2.5 rounded-xl bg-heading px-4 py-3 text-sm text-white shadow-xl">
          <span className={`flex h-5 w-5 items-center justify-center rounded-full ${t.tone === 'success' ? 'bg-mint' : 'bg-rose'}`}>
            <Icon name={t.tone === 'success' ? 'check' : 'x'} className="h-3 w-3" />
          </span>
          {t.text}
        </div>
      ))}
    </div>
  )
}
