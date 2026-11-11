/** Account settings: details, a link to edit answers, and account deletion. */
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { deleteAccountSchema } from '@wellpath/shared'
import { AppShell } from '../components/app/AppShell'
import { FormError, TextField } from '../components/auth/AuthLayout'
import { ApiError, deleteAccount, useAuth } from '../lib/auth'

export function Settings() {
  const auth = useAuth()
  const [confirming, setConfirming] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (auth.status !== 'signed-in') return null
  const { user } = auth

  const cancel = () => {
    setConfirming(false)
    setPassword('')
    setError('')
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const parsed = deleteAccountSchema.safeParse({ password })
    if (!parsed.success) return setError(parsed.error.issues[0].message)
    setBusy(true)
    try {
      // On success the app signs out, shows a message, and the protected page sends you home.
      await deleteAccount(parsed.data.password)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
      setBusy(false)
    }
  }

  return (
    <AppShell narrow>
      <h1 className="text-3xl font-extrabold tracking-tight text-heading">Settings</h1>

      <section className="card mt-8 p-6" aria-labelledby="account-heading">
        <h2 id="account-heading" className="text-lg font-bold text-heading">Your account</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div><dt className="text-muted">Name</dt><dd className="font-medium text-heading">{user.name}</dd></div>
          <div><dt className="text-muted">Email</dt><dd className="font-medium text-heading">{user.email}</dd></div>
        </dl>
        <Link to="/onboarding" className="mt-5 inline-block text-sm font-semibold text-violet hover:underline">Edit my goal and health answers</Link>
      </section>

      <section className="mt-6 rounded-[22px] border border-red-200 bg-white p-6" aria-labelledby="delete-heading">
        <h2 id="delete-heading" className="text-lg font-bold text-heading">Delete account</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          This permanently deletes your account, your health answers and your plan. It cannot be undone.
        </p>

        {!confirming ? (
          <button type="button" onClick={() => setConfirming(true)} className="mt-5 rounded-xl border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50">
            Delete my account
          </button>
        ) : (
          <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
            {error && <FormError>{error}</FormError>}
            <TextField
              label="Enter your password to confirm" type="password" autoComplete="current-password" autoFocus
              value={password} onChange={(e) => { setPassword(e.target.value); setError('') }}
            />
            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={busy} className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60">
                {busy ? 'Deleting…' : 'Permanently delete my account'}
              </button>
              <button type="button" onClick={cancel} disabled={busy} className="rounded-xl border border-line bg-white px-5 py-2.5 text-sm font-semibold text-heading hover:bg-ink-2">
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>
    </AppShell>
  )
}
