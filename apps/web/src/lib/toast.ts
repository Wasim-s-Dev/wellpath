/** Pop-up messages. Call toast('Saved') from anywhere; <Toaster /> shows them on every page. */
import { useSyncExternalStore } from 'react'

export type Toast = { id: number; text: string; tone: 'success' | 'error' }

const DURATION_MS = 5000
let items: Toast[] = []
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export function dismissToast(id: number) {
  items = items.filter((t) => t.id !== id)
  emit()
}

export function toast(text: string, tone: Toast['tone'] = 'success') {
  const t = { id: Date.now() + Math.random(), text, tone }
  items = [...items, t]
  emit()
  setTimeout(() => dismissToast(t.id), DURATION_MS)
}

export function useToasts(): Toast[] {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => items,
  )
}
