import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { z } from 'zod'
import { registerSchema } from '@wellpath/shared'
import { AuthLayout, FormError, SubmitButton, TextField, firstErrors } from '../components/auth/AuthLayout'
import { ApiError, register, useAuth } from '../lib/auth'

export function SignUp() {
  const auth = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<{ message: string; exists?: boolean } | null>(null)
  const [busy, setBusy] = useState(false)

  if (auth.status === 'signed-in' && !busy) return <Navigate to="/app" replace />

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setErrors((errs) => ({ ...errs, [key]: '' }))
    setFormError(null)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    // Same rules the API uses, so most mistakes are caught before any request.
    const parsed = registerSchema.safeParse(form)
    if (!parsed.success) return setErrors(firstErrors(z.flattenError(parsed.error).fieldErrors))
    setBusy(true)
    try {
      await register(parsed.data)
      navigate('/app', { replace: true })
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) setFormError({ message: err.message, exists: true })
      else if (err instanceof ApiError && Object.keys(err.fields).length) setErrors(firstErrors(err.fields))
      else setFormError({ message: err instanceof ApiError ? err.message : 'Something went wrong. Please try again.' })
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      title="Create your free account"
      sub="Save your plan, track your progress and get a plan that adapts every week."
      footer={<>Already have an account? <Link to="/login" className="font-semibold text-violet hover:underline">Log in</Link></>}
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        {formError && (
          <FormError>
            {formError.message}
            {formError.exists && <>. <Link to="/login" className="font-semibold underline">Log in instead</Link></>}
          </FormError>
        )}
        <TextField label="Name" autoComplete="name" value={form.name} onChange={update('name')} error={errors.name} />
        <TextField label="Email" type="email" autoComplete="email" inputMode="email" value={form.email} onChange={update('email')} error={errors.email} />
        <TextField label="Password" type="password" autoComplete="new-password" value={form.password} onChange={update('password')} error={errors.password} hint="At least 8 characters." />
        <SubmitButton busy={busy} busyLabel="Creating your account…">Create account</SubmitButton>
      </form>
    </AuthLayout>
  )
}
