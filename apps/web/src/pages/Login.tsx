import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { z } from 'zod'
import { loginSchema } from '@wellpath/shared'
import { AuthLayout, FormError, SubmitButton, TextField, firstErrors } from '../components/auth/AuthLayout'
import { ApiError, login, useAuth } from '../lib/auth'

export function Login() {
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  // Only paths on this site ("//other.site" would leave it), so login never sends people elsewhere.
  const target: unknown = location.state?.from
  const from = typeof target === 'string' && target.startsWith('/') && !target.startsWith('//') ? target : '/app'
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)

  if (auth.status === 'signed-in' && !busy) return <Navigate to={from} replace />

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setErrors((errs) => ({ ...errs, [key]: '' }))
    setFormError('')
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const parsed = loginSchema.safeParse(form)
    if (!parsed.success) return setErrors(firstErrors(z.flattenError(parsed.error).fieldErrors))
    setBusy(true)
    try {
      await login(parsed.data)
      navigate(from, { replace: true })
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      sub="Log in to see your plan and today's progress."
      footer={<>New to WellPath? <Link to="/signup" className="font-semibold text-violet hover:underline">Create a free account</Link></>}
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        {formError && <FormError>{formError}</FormError>}
        <TextField label="Email" type="email" autoComplete="email" inputMode="email" value={form.email} onChange={update('email')} error={errors.email} />
        <TextField label="Password" type="password" autoComplete="current-password" value={form.password} onChange={update('password')} error={errors.password} />
        <p className="-mt-1 text-right text-sm">
          <Link to="/forgot-password" className="font-semibold text-violet hover:underline">Forgot password?</Link>
        </p>
        <SubmitButton busy={busy} busyLabel="Logging in…">Log in</SubmitButton>
      </form>
    </AuthLayout>
  )
}
