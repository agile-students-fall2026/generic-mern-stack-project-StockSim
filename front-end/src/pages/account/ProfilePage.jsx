import { Link } from 'react-router'
import BackLink from '../../components/ui/BackLink.jsx'
import { useAuth } from '../../context/AuthContext.js'

function ProfilePage() {
  const { user } = useAuth()
  const initials = user.name.trim().split(/\s+/).slice(0, 2).map(part => Array.from(part)[0]).join('')
  const memberSince = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(user.createdAt))
  return (
    <>
      <BackLink />
      <h1 tabIndex={-1} className="text-4xl font-semibold tracking-[-0.04em]">Profile</h1>

      <div role="img" aria-label={`${user.name}'s initials`} className="mt-6 flex size-28 items-center justify-center rounded-2xl border border-border bg-selected text-3xl font-semibold text-selected-ink">
        {initials}
      </div>

      <dl className="mt-6 flex flex-col gap-3">
        <div className="rounded-xl border border-border p-4">
          <dt className="text-sm text-muted">Display name</dt>
          <dd className="mt-1 break-all font-[650]">{user.name}</dd>
        </div>
        <div className="rounded-xl border border-border p-4">
          <dt className="text-sm text-muted">Email</dt>
          <dd className="mt-1 break-all font-[650]">{user.email}</dd>
        </div>
        <div className="rounded-xl border border-border p-4">
          <dt className="text-sm text-muted">Member since</dt>
          <dd className="mt-1 break-all font-[650]">{memberSince}</dd>
        </div>
      </dl>

      <Link
        to="/leaderboard"
        className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-[2rem] border border-border px-6 py-3.5 font-[650] text-ink no-underline hover:bg-hover"
      >
        Leaderboard privacy
      </Link>
    </>
  )
}

export default ProfilePage
