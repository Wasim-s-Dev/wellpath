/** Sets a new password using the token from the email link (/reset-password#token=...). */
import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { resetPasswordSchema } from '@wellpath/shared'
import { AuthLayout, FormError, SubmitButton, TextField } from '../components/auth/AuthLayout'
import { ApiError, resetPassword } from '../lib/auth'
import { toast } from '../lib/toast'

export function ResetPassword() {
  const navigate = useNavigate()
  // The token is after #, so it never reaches a server log or another site.
  const token = new URLSearchParams(useLocation().hash.slice(1)).get('token') ?? ''
  const [password, setPassword] = useState('')
  const [fieldError, setFieldError] = useState('')
  const [linkError, setLinkError] = useState(token ? '' : 'This reset link is incomplete. Please request a new one.')
  const [busy, setBusy] = useState(false)

  const requestNew = <Link to="/forgot-password" className="font-semibold underline">Request a new link</Link>

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const parsed = resetPasswordSchema.safeParse({ token, password })
    if (!parsed.success) {
      const issue = parsed.error.issues[0]
      return issue.path[0] === 'token' ? setLinkError(issue.message) : setFieldError(issue.message)
    }
    setBusy(true)
    try {
      await resetPassword(parsed.data.token, parsed.data.password)
      toast('Your password has been changed. Please log in.')
      navigate('/login', { replace: true })
    } catch (err) {
      if (err instanceof ApiError && err.fields.password) setFieldError(err.fields.password[0])
      else setLinkError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.')
      setBusy(false)
    }
  }

  return (
    <AuthLayout
      title="Choose a new password"
      sub="You will be signed out on all devices, then you can log in with your new password."
      footer={<Link to="/login" className="font-semibold text-violet hover:underline">Back to log in</Link>}
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        {linkError && <FormError>{linkError} {requestNew}</FormError>}
        <TextField
          label="New password" type="password" autoComplete="new-password" autoFocus hint="At least 8 characters."
          value={password} onChange={(e) => { setPassword(e.target.value); setFieldError('') }} error={fieldError}
        />
        <SubmitButton busy={busy} busyLabel="Saving…">Save new password</SubmitButton>
      </form>
    </AuthLayout>
  )
}
