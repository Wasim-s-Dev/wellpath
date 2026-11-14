/** Shared frame for the sign-up and login pages, plus their form fields. */
import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { Logo } from '../landing/ui'

export function AuthLayout({ title, sub, children, footer }: { title: string; sub: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="hero-glow relative min-h-screen">
      <div className="grid-fade pointer-events-none absolute inset-0" aria-hidden="true" />
      <header className="relative mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">
        <Logo href="/" />
      </header>
      <main className="relative mx-auto flex max-w-6xl justify-center px-4 pb-16 pt-6 sm:px-6 sm:pt-12">
        <div className="w-full max-w-md">
          <div className="card card-glow p-6 sm:p-8">
            <h1 className="text-2xl font-extrabold tracking-tight text-heading">{title}</h1>
            <p className="mt-1.5 text-sm text-muted">{sub}</p>
            <div className="mt-6">{children}</div>
          </div>
          <p className="mt-6 text-center text-sm text-muted">{footer}</p>
          <p className="mt-3 text-center text-xs text-muted">Wellness guidance only. Not medical advice.</p>
        </div>
      </main>
    </div>
  )
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; hint?: string }

export function TextField({ label, error, hint, type = 'text', ...input }: FieldProps) {
  const id = useId()
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  const note = error ?? hint
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-heading">{label}</label>
      <div className="relative mt-1.5">
        <input
          id={id}
          type={isPassword && show ? 'text' : type}
          aria-invalid={!!error}
          aria-describedby={note ? `${id}-note` : undefined}
          className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-heading outline-none transition placeholder:text-muted/70 focus:ring-4 ${isPassword ? 'pr-16' : ''} ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-line focus:border-violet focus:ring-violet/10'}`}
          {...input}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-pressed={show}
            aria-label={show ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-2 my-auto h-8 rounded-lg px-2.5 text-xs font-semibold text-muted hover:bg-ink-2 hover:text-heading"
          >
            {show ? 'Hide' : 'Show'}
          </button>
        )}
      </div>
      {note && <p id={`${id}-note`} className={`mt-1.5 text-xs ${error ? 'text-red-600' : 'text-muted'}`}>{note}</p>}
    </div>
  )
}

export function FormError({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700" role="alert">{children}</div>
}

export function SubmitButton({ busy, children, busyLabel }: { busy: boolean; children: ReactNode; busyLabel: string }) {
  return (
    <button type="submit" disabled={busy} className="btn-primary w-full rounded-xl px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
      {busy ? busyLabel : children}
    </button>
  )
}

/** First message for each field from a Zod flatten() result or an API error. */
export function firstErrors(fields: Record<string, string[] | undefined>): Record<string, string> {
  return Object.fromEntries(Object.entries(fields).flatMap(([k, v]) => (v?.[0] ? [[k, v[0]]] : [])))
}
