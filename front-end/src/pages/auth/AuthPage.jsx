import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import AuthLayout from '../../components/layout/AuthLayout.jsx'
import AuthField from '../../components/forms/AuthField.jsx'
import FormFeedback from '../../components/forms/FormFeedback.jsx'
import { useAuth } from '../../context/AuthContext.js'
import authApi from '../../services/authApi.js'

function destination(value) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/login')
    ? value : '/portfolio'
}

function AuthPage({ creatingAccount = false }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, status } = useAuth()
  const [pending, setPending] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const title = creatingAccount ? 'Create account' : 'Log in'
  const fields = feedback?.fields || {}

  async function handleSubmit(event) {
    event.preventDefault()
    if (pending) return
    const data = new FormData(event.currentTarget)
    const details = { email: data.get('email'), password: data.get('password') }
    setPending(true)
    setFeedback(null)
    try {
      if (creatingAccount) {
        const created = await authApi.register({ ...details, name: data.get('name') })
        navigate('/login', { replace: true, state: { email: created.email, notice: 'Account created. Log in to start practicing.' } })
      } else {
        await login(details)
      }
    } catch (error) {
      setFeedback({ type: 'error', message: error.message, fields: error.fields })
    } finally {
      setPending(false)
    }
  }

  if (status === 'authenticated') return <Navigate to={destination(location.state?.from)} replace />

  return (
    <AuthLayout>
      <h1 tabIndex={-1} className="text-[clamp(2.5rem,7vw,4rem)] leading-[1.1] font-semibold tracking-[-0.05em]">{title}</h1>
      <p className="mt-5 max-w-[42ch] text-lg leading-[1.7] text-muted">
        {creatingAccount ? 'Start practicing investing with virtual money.' : 'Welcome back to StockSim.'}
      </p>
      {!creatingAccount && location.state?.notice && <p role="status" className="mt-5 text-sm text-muted">{location.state.notice}</p>}
      <form className="mt-8 flex max-w-sm flex-col gap-5" noValidate onSubmit={handleSubmit} onChange={() => setFeedback(null)} aria-busy={pending}>
        {creatingAccount && <AuthField name="name" label="Name" autoComplete="name" disabled={pending} error={fields.name} />}
        <AuthField name="email" label="Email" type="email" autoComplete="email" defaultValue={location.state?.email || ''} disabled={pending} error={fields.email} />
        <AuthField name="password" label="Password" type="password" autoComplete={creatingAccount ? 'new-password' : 'current-password'} disabled={pending} error={fields.password}
          aside={!creatingAccount && <Link to="/forgot-password" className="inline-flex min-h-11 items-center text-sm font-[650] text-ink underline underline-offset-[0.3em]">Forgot password?</Link>}
        />
        <button className="min-h-12 cursor-pointer rounded-[2rem] bg-accent px-6 py-3.5 font-[650] text-ink hover:bg-accent-hover disabled:cursor-wait disabled:opacity-60" type="submit" disabled={pending}>
          {pending ? (creatingAccount ? 'Creating account…' : 'Logging in…') : title}
        </button>
        <FormFeedback feedback={feedback} />
      </form>
      <p className="mt-6 text-muted">
        {creatingAccount ? 'Already have an account? ' : 'New to StockSim? '}
        <Link className="inline-flex min-h-11 items-center font-[650] text-ink underline underline-offset-[0.3em]" to={creatingAccount ? '/login' : '/create-account'}>
          {creatingAccount ? 'Log in' : 'Create account'}
        </Link>
      </p>
    </AuthLayout>
  )
}

export default AuthPage
