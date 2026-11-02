import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { Button, Field, Input } from '../components/ui'
import { setState } from '../lib/store'

/** Demo sign-in. Replace with POST /api/v1/auth/login (JWT + admin role check) when the API is ready. */
export function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid email address.')
    if (password.length < 6) return setError('Password must be at least 6 characters.')
    const name = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    setState(() => ({ session: { email, name } }), { action: 'Signed in', target: email })
    navigate('/')
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
          <Field label="Password"><Input type="password" autoComplete="current-password" value={password} onChange={(e) => { setPassword(e.target.value); setError('') }} placeholder="At least 6 characters" /></Field>
          {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p>}
          <Button type="submit" variant="primary" className="w-full !py-3">Sign in</Button>
          <p className="rounded-xl bg-ink-3 px-3 py-2.5 text-xs text-violet">Demo mode: any valid email and a 6+ character password signs you in. Real authentication arrives with the API.</p>
        </form>
      </div>
    </div>
  )
}
