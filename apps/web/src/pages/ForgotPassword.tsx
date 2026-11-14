/** Asks for a reset link. Always shows the same confirmation, so it never reveals who has an account. */
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { forgotPasswordSchema } from '@wellpath/shared'
import { AuthLayout, FormError, SubmitButton, TextField } from '../components/auth/AuthLayout'
import { ApiError, requestPasswordReset } from '../lib/auth'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [formError, setFormError] = useState('')
  const [sentTo, setSentTo] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const parsed = forgotPasswordSchema.safeParse({ email })
    if (!parsed.success) return setFieldError(parsed.error.issues[0].message)
    setBusy(true)
    try {
      await requestPasswordReset(parsed.data.email)
      setSentTo(parsed.data.email)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const backToLogin = <Link to="/login" className="font-semibold text-violet hover:underline">Back to log in</Link>

  if (sentTo) {
    return (
      <AuthLayout title="Check your email" sub={`If an account exists for ${sentTo}, we have sent a link to reset your password.`} footer={backToLogin}>
        <ul className="space-y-2 text-sm leading-relaxed text-text">
          <li>The link works for 30 minutes.</li>
          <li>If you cannot see the email, check your spam folder.</li>
        </ul>
        <button type="button" onClick={() => setSentTo('')} className="mt-6 text-sm font-semibold text-violet hover:underline">
          Use a different email
        </button>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Forgot your password?" sub="Enter your email and we will send you a link to choose a new one." footer={backToLogin}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {formError && <FormError>{formError}</FormError>}
        <TextField
          label="Email" type="email" autoComplete="email" inputMode="email" autoFocus
          value={email} onChange={(e) => { setEmail(e.target.value); setFieldError(''); setFormError('') }} error={fieldError}
        />
        <SubmitButton busy={busy} busyLabel="Sending…">Send reset link</SubmitButton>
      </form>
    </AuthLayout>
  )
}
