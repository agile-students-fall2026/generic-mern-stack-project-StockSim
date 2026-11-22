import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import PageIntro from '../../components/layout/PageIntro.jsx'
import Modal from '../../components/ui/Modal.jsx'
import { useAuth } from '../../context/AuthContext.js'

const menuButtonClass =
  'inline-flex min-h-12 w-full items-center justify-center rounded-[2rem] border border-border px-6 py-3.5 font-[650] text-ink no-underline hover:bg-hover'

function AccountPage() {
  const [confirmingLogout, setConfirmingLogout] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState(null)
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    if (loggingOut) return
    setLoggingOut(true)
    setLogoutError(null)
    try {
      await logout()
      navigate('/login', { replace: true, state: { notice: 'You have been logged out.' } })
    } catch (error) {
      setLogoutError(error.message)
    } finally {
      setLoggingOut(false)
    }
  }

  return (
    <>
      <PageIntro eyebrow="Practice account" title="Account" description="Your profile and practice settings." />

      <section aria-label="Account summary" className="rounded-2xl border border-border p-6">
        <p className="break-words text-xl font-semibold tracking-[-0.03em]">{user.name}</p>
        <p className="mt-1 break-all text-muted">{user.email}</p>
      </section>

      <nav aria-label="Account options" className="mt-6 flex flex-col gap-3">
        <Link to="/account/profile" className={menuButtonClass}>
          Profile
        </Link>
        <Link to="/account/reset-password" className={menuButtonClass}>
          Reset password
        </Link>
        <Link to="/learn" className={menuButtonClass}>
          Learning progress
        </Link>
        <Link to="/account/achievements" className={menuButtonClass}>
          Achievements
        </Link>
        <Link to="/learn" className={menuButtonClass}>
          Replay tutorial
        </Link>
        <Link to="/leaderboard" className={menuButtonClass}>
          Leaderboard privacy
        </Link>
        <button type="button" onClick={() => { setLogoutError(null); setConfirmingLogout(true) }} className={`${menuButtonClass} cursor-pointer bg-surface`}>
          Log out
        </button>
      </nav>

      {confirmingLogout && (
        <Modal title="Log out?" onClose={() => { if (!loggingOut) setConfirmingLogout(false) }}>
          <p>Your saved practice portfolio will be here when you log in again.</p>
          {logoutError && <p role="alert" className="mt-3 text-sm text-red-700">{logoutError}</p>}
          <div className="mt-5 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="min-h-12 w-full cursor-pointer rounded-[2rem] bg-accent px-6 py-3.5 font-[650] text-ink hover:bg-accent-hover disabled:cursor-wait disabled:opacity-60"
            >
              {loggingOut ? 'Logging out…' : 'Log out'}
            </button>
            <button
              type="button"
              onClick={() => setConfirmingLogout(false)}
              disabled={loggingOut}
              className="min-h-12 w-full cursor-pointer rounded-[2rem] border border-border px-6 py-3.5 font-[650] text-ink hover:bg-hover"
            >
              Stay logged in
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}

export default AccountPage
