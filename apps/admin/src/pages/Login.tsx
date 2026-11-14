import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { Button, Field, Input } from '../components/ui'
import { ApiError, login, useAuth } from '../lib/auth'
import { setState } from '../lib/store'

/** Admin sign-in. Only accounts with the admin role can get in. */
export function Login() {
  const navigate = useNavigate()
  const auth = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (auth.status === 'signed-in') return <Navigate to="/" replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email address.')
    if (!password) return setError('Enter your password.')
    setBusy(true)
    try {
      const user = await login(email, password)
      setState(() => ({}), { action: 'Signed in', target: user.email })
      navigate('/')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden lg:block" style={{ background: 'linear-gradient(160deg,#1e1b4b,#312e81 40%,#4f46e5)' }}>
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.08)_1px,transparent_1px)] [background-size:44px_44px]" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <div className="flex items-center gap-2.5"><img src="/favicon.svg" alt="" className="h-9 w-9" /><span className="text-lg font-bold">WellPath Admin</span></div>
          <div>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight">Run the platform.<br />Keep every user safe.</h1>
            <p className="mt-4 max-w-md text-indigo-100/90">Manage users, food and exercise content, safety rules and AI limits from one place. Every change is recorded in the audit log.</p>
          </div>
          <p className="text-sm text-indigo-100/70">Restricted area. Authorised staff only.</p>
        </div>
      </div>

      <div className="flex items-center justify-center bg-white px-6 py-12">
        <form onSubmit={submit} className="w-full max-w-sm space-y-5" noValidate>
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-heading">Sign in</h2>
            <p className="mt-1 text-sm text-muted">Use your admin account to continue.</p>
          </div>
          <Field label="Email"><Input type="email" autoComplete="username" value={email} onChange={(e) => { setEmail(e.target.value); setError('') }} placeholder="you@company.com" /></Field>
          <Field label="Password"><Input type="password" autoComplete="current-password" value={password} onChange={(e) => { setPassword(e.target.value); setError('') }} /></Field>
          {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
          <Button type="submit" variant="primary" className="w-full !py-3" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</Button>
        </form>
      </div>
    </div>
  )
}
