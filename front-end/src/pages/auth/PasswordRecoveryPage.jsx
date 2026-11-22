import { useState } from 'react'
import { Link } from 'react-router'
import AuthLayout from '../../components/layout/AuthLayout.jsx'
import AuthField from '../../components/forms/AuthField.jsx'
import FormFeedback from '../../components/forms/FormFeedback.jsx'
import { useAuth } from '../../context/AuthContext.js'
import authApi from '../../services/authApi.js'

function PasswordRecoveryPage({ accountMode = false }) {
  const { user } = useAuth()
  const [pending, setPending] = useState(false)
  const [feedback, setFeedback] = useState(null)

  async function handleSubmit(event) {
    event.preventDefault()
    if (pending) return
    const email = new FormData(event.currentTarget).get('email')
    setPending(true)
    setFeedback(null)
    try {
      const result = await authApi.forgotPassword({ email })
      setFeedback({ type: 'success', message: result.message })
    } catch (error) {
      setFeedback({ type: 'error', message: error.message, fields: error.fields })
    } finally {
      setPending(false)
    }
  }

  const content = (
    <>
      <h1 tabIndex={-1} className="text-[clamp(2.5rem,7vw,4rem)] leading-[1.1] font-semibold tracking-[-0.05em]">{accountMode ? 'Reset password' : 'Forgot password?'}</h1>
      <p className="mt-5 max-w-[42ch] text-lg leading-[1.7] text-muted">Enter your account email and we’ll send you a password reset link.</p>
      <form className="mt-8 flex max-w-sm flex-col gap-5" noValidate onSubmit={handleSubmit} onChange={() => setFeedback(null)} aria-busy={pending}>
        <AuthField name="email" label="Email" type="email" autoComplete="email" defaultValue={accountMode ? user?.email : ''} readOnly={accountMode} disabled={pending} error={feedback?.fields?.email} />
        <button className="min-h-12 cursor-pointer rounded-[2rem] bg-accent px-6 py-3.5 font-[650] text-ink hover:bg-accent-hover disabled:cursor-wait disabled:opacity-60" type="submit" disabled={pending}>
          {pending ? 'Sending…' : 'Send reset link'}
        </button>
        <FormFeedback feedback={feedback} />
      </form>
      <Link className="mt-6 inline-flex min-h-11 items-center font-[650] text-ink underline underline-offset-[0.3em]" to={accountMode ? '/account' : '/login'}>
        {accountMode ? 'Back to account' : 'Back to log in'}
      </Link>
    </>
  )
  return accountMode ? <section>{content}</section> : <AuthLayout>{content}</AuthLayout>
}

export default PasswordRecoveryPage
