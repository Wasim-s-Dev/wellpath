/** Shows pop-up messages above every page. Rendered once, outside the router, so messages survive navigation. */
import { dismissToast, useToasts } from '../lib/toast'
import { Icon } from './landing/ui'

export function Toaster() {
  const toasts = useToasts()
  return (
    // Top right, just below the 64px header so it never covers the navigation.
    <div className="pointer-events-none fixed inset-x-4 top-20 z-[70] flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:items-end" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="pop pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl bg-heading px-4 py-3.5 text-sm text-white shadow-2xl">
          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${t.tone === 'success' ? 'bg-mint' : 'bg-red-500'}`}>
            <Icon name="check" className="h-3.5 w-3.5" />
          </span>
          <span className="flex-1">{t.text}</span>
          <button type="button" onClick={() => dismissToast(t.id)} className="rounded-lg px-1.5 py-0.5 text-white/70 hover:bg-white/10 hover:text-white" aria-label="Dismiss message">
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
