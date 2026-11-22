import { useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../../context/AuthContext.js'
import AuthLayout from '../layout/AuthLayout.jsx'

export default function RequireLogin() {
  const { status, user, error, refresh } = useAuth()
  const location = useLocation()
  const [retrying, setRetrying] = useState(false)

  if (status === 'loading') {
    return <AuthLayout><h1 tabIndex={-1} className="text-2xl font-semibold">Checking your session…</h1></AuthLayout>
  }
  if (status === 'error') {
    return (
      <AuthLayout>
        <h1 tabIndex={-1} className="text-3xl font-semibold">Unable to connect</h1>
        <p role="alert" className="mt-4 text-muted">{error}</p>
        <button type="button" disabled={retrying} className="mt-6 min-h-12 cursor-pointer rounded-[2rem] bg-accent px-6 py-3 font-[650] disabled:opacity-60" onClick={async () => {
          setRetrying(true)
          try { await refresh() } finally { setRetrying(false) }
        }}>
          {retrying ? 'Checking…' : 'Try again'}
        </button>
      </AuthLayout>
    )
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search, notice: 'Please log in to continue.' }} />
  return <Outlet />
}
