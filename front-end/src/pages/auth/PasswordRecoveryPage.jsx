import { useState } from 'react'
import { Link } from 'react-router'
import AuthLayout from '../../components/layout/AuthLayout.jsx'

function PasswordRecoveryPage({ resetting = false }) {
  const [feedback, setFeedback] = useState(null)
  const fields = resetting
    ? [
        { name: 'newPassword', label: 'New password', type: 'password', autoComplete: 'new-password' },
        { name: 'confirmPassword', label: 'Confirm new password', type: 'password', autoComplete: 'new-password' },
      ]
    : [{ name: 'email', label: 'Email', type: 'email', autoComplete: 'email' }]

  function handleSubmit(event) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    if (resetting && data.get('newPassword') !== data.get('confirmPassword')) {
      setFeedback({ field: 'confirmPassword', message: 'Passwords do not match.' })
      return
    }
    setFeedback({ message: 'Password reset is not available yet. Please try again later.' })
  }

  const content = (
    <>
      <h1 tabIndex={-1} className="text-[clamp(2.5rem,7vw,4rem)] leading-[1.1] font-semibold tracking-[-0.05em]">
        {resetting ? 'Reset password' : 'Forgot password?'}
      </h1>
      <p className="mt-5 max-w-[42ch] text-lg leading-[1.7] text-muted">
        {resetting ? 'Choose a new password for your StockSim account.' : 'Enter your account email to request a password reset link.'}
      </p>
      <form className="mt-8 flex max-w-sm flex-col gap-5" onSubmit={handleSubmit} onChange={() => setFeedback(null)}>
        {fields.map(({ name, label, type, autoComplete }) => (
          <label key={name} className="font-[550]" htmlFor={name}>
            {label}
            <input
              className="mt-2 min-h-12 w-full rounded-xl border border-border bg-surface px-4 py-3 text-ink"
              id={name}
              name={name}
              type={type}
              autoComplete={autoComplete}
              required
              aria-invalid={feedback?.field === name || undefined}
              aria-describedby={feedback?.field === name ? 'recovery-feedback' : undefined}
            />
          </label>
        ))}
        <button className="min-h-12 cursor-pointer rounded-[2rem] bg-accent px-6 py-3.5 font-[650] text-ink hover:bg-accent-hover" type="submit">
          {resetting ? 'Reset password' : 'Send reset link'}
        </button>
        {feedback && (
          <p id="recovery-feedback" role={feedback.field ? 'alert' : 'status'} className="text-sm leading-relaxed text-muted">
            {feedback.message}
          </p>
        )}
      </form>
      <Link className="mt-6 inline-flex min-h-11 items-center font-[650] text-ink underline underline-offset-[0.3em]" to={resetting ? '/account' : '/login'}>
        {resetting ? 'Back to account' : 'Back to log in'}
      </Link>
    </>
  )

  return resetting ? <section>{content}</section> : <AuthLayout>{content}</AuthLayout>
}

export default PasswordRecoveryPage
