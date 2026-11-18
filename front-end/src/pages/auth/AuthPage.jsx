import { Link, useNavigate } from 'react-router'
import AuthLayout from '../../components/layout/AuthLayout.jsx'

function AuthPage({ creatingAccount = false }) {
  const navigate = useNavigate()
  const title = creatingAccount ? 'Create account' : 'Log in'
  const inputClassName = 'mt-2 min-h-12 w-full rounded-xl border border-border bg-surface px-4 py-3 text-ink'

  function handleSubmit(event) {
    event.preventDefault()
    navigate('/portfolio')
  }

  return (
    <AuthLayout>
      <h1 tabIndex={-1} className="text-[clamp(2.5rem,7vw,4rem)] leading-[1.1] font-semibold tracking-[-0.05em]">
        {title}
      </h1>
      <p className="mt-5 max-w-[42ch] text-lg leading-[1.7] text-muted">
        {creatingAccount
          ? 'Start practicing investing with virtual money.'
          : 'Welcome back to StockSim.'}
      </p>
      <form className="mt-8 flex max-w-sm flex-col gap-5" noValidate onSubmit={handleSubmit}>
        {creatingAccount && (
          <label className="font-[550]" htmlFor="name">
            Name
            <input className={inputClassName} id="name" name="name" autoComplete="name" />
          </label>
        )}
        <label className="font-[550]" htmlFor="email">
          Email
          <input className={inputClassName} id="email" name="email" type="email" autoComplete="email" />
        </label>
        <div>
          <div className="flex items-center justify-between gap-4">
            <label className="font-[550]" htmlFor="password">Password</label>
            {!creatingAccount && (
              <Link to="/forgot-password" className="inline-flex min-h-11 items-center text-sm font-[650] text-ink underline underline-offset-[0.3em]">
                Forgot password?
              </Link>
            )}
          </div>
          <input
            className={inputClassName}
            id="password"
            name="password"
            type="password"
            autoComplete={creatingAccount ? 'new-password' : 'current-password'}
          />
        </div>
        <button className="min-h-12 cursor-pointer rounded-[2rem] bg-accent px-6 py-3.5 font-[650] text-ink hover:bg-accent-hover" type="submit">
          {title}
        </button>
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
