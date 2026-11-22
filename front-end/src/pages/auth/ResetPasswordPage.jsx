import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import AuthLayout from '../../components/layout/AuthLayout.jsx'
import AuthField from '../../components/forms/AuthField.jsx'
import FormFeedback from '../../components/forms/FormFeedback.jsx'
import { useAuth } from '../../context/AuthContext.js'
import authApi from '../../services/authApi.js'

export default function ResetPasswordPage() {
  const { clearSession } = useAuth()
  const [token, setToken] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('token') || '')
  const [pending, setPending] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const complete = feedback?.type === 'success'
  const invalid = !/^[0-9a-f]{64}$/.test(token)

  useEffect(() => {
    // Keep the secret only in this page's memory, never in storage or history.
    if (window.location.hash) window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search)
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    if (pending || invalid || complete) return
    const data = new FormData(event.currentTarget)
    const password = data.get('password')
    const confirmPassword = data.get('confirmPassword')
    if (password !== confirmPassword) {
      setFeedback({ type: 'error', message: 'Passwords do not match.', fields: { confirmPassword: 'Passwords do not match.' } })
      return
    }
    setPending(true)
    setFeedback(null)
    try {
      const result = await authApi.resetPassword({ token, password, confirmPassword })
      setToken('')
      clearSession()
      setFeedback({ type: 'success', message: result.message })
    } catch (error) {
      if (error.code === 'INVALID_RESET_TOKEN') setToken('')
      setFeedback({ type: 'error', message: error.message, fields: error.fields })
    } finally {
      setPending(false)
    }
  }

  return (
    <AuthLayout>
      <h1 tabIndex={-1} className="text-[clamp(2.5rem,7vw,4rem)] leading-[1.1] font-semibold tracking-[-0.05em]">Reset password</h1>
      {complete ? (
        <div className="mt-6 max-w-sm"><FormFeedback feedback={feedback} /></div>
      ) : invalid ? (
        <p role="alert" className="mt-6 max-w-sm text-red-700">{feedback?.message || 'This reset link is missing or invalid. Request a new link to continue.'}</p>
      ) : (
        <>
          <p className="mt-5 max-w-[42ch] text-lg leading-[1.7] text-muted">Choose a new password with 8 to 128 characters.</p>
          <form className="mt-8 flex max-w-sm flex-col gap-5" noValidate onSubmit={handleSubmit} onChange={() => setFeedback(null)} aria-busy={pending}>
            <AuthField name="password" label="New password" type="password" autoComplete="new-password" disabled={pending} error={feedback?.fields?.password} />
            <AuthField name="confirmPassword" label="Confirm new password" type="password" autoComplete="new-password" disabled={pending} error={feedback?.fields?.confirmPassword} />
            <button className="min-h-12 cursor-pointer rounded-[2rem] bg-accent px-6 py-3.5 font-[650] text-ink hover:bg-accent-hover disabled:cursor-wait disabled:opacity-60" type="submit" disabled={pending}>
              {pending ? 'Resetting…' : 'Reset password'}
            </button>
            <FormFeedback feedback={feedback} />
          </form>
        </>
      )}
      <div className="mt-6 flex flex-col items-start gap-2">
        {invalid && !complete && <Link className="inline-flex min-h-11 items-center font-[650] underline underline-offset-[0.3em]" to="/forgot-password">Request a new reset link</Link>}
        <Link className="inline-flex min-h-11 items-center font-[650] underline underline-offset-[0.3em]" to="/login">{complete ? 'Log in with your new password' : 'Back to log in'}</Link>
      </div>
    </AuthLayout>
  )
}
