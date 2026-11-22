import { hashPassword } from './passwords.js'
import { createPasswordResetTokens } from './passwordResetTokens.js'
import { createResetMailer } from './resetMailer.js'

export function createPasswordRecovery({
  userStore,
  sessions,
  tokens = createPasswordResetTokens(),
  mailer = createResetMailer(),
  frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  production = process.env.NODE_ENV === 'production',
  onDeliveryError = () => console.error('Password reset email could not be delivered.'),
} = {}) {
  let resetPage
  try {
    const origin = new URL(frontendOrigin)
    if (!['http:', 'https:'].includes(origin.protocol) || origin.username || origin.password || (production && origin.protocol !== 'https:')) throw new Error()
    resetPage = new URL('/reset-password', origin.origin)
  } catch {
    throw new Error('FRONTEND_ORIGIN must use HTTP(S), with HTTPS required in production.')
  }
  const jobs = new Set()

  return {
    request(email) {
      // Respond before account lookup or email delivery to avoid account enumeration.
      // Limit pending delivery work, in addition to the HTTP request rate limit.
      if (jobs.size >= 100) return
      let issued
      const job = Promise.resolve().then(async () => {
        const user = await userStore.findByEmail(email)
        if (!user) return
        issued = tokens.issue(user.id, user.authVersion)
        const link = new URL(resetPage)
        // Fragments keep reset tokens out of HTTP request URLs and referrers.
        link.hash = new URLSearchParams({ token: issued }).toString()
        await mailer.sendResetLink({ to: user.email, resetUrl: link.href })
      }).catch(() => {
        if (issued) tokens.revoke(issued)
        // Do not log email addresses, tokens, URLs, or provider error text.
        onDeliveryError()
      }).finally(() => jobs.delete(job))
      jobs.add(job)
    },
    async whenIdle() { await Promise.all([...jobs]) },
    async reset(token, password) {
      const pending = tokens.inspect(token)
      if (!pending) return false
      const user = await userStore.findById(pending.userId)
      if (!user || user.authVersion !== pending.authVersion) {
        tokens.revoke(token)
        return false
      }
      const passwordHash = await hashPassword(password)
      const claimed = tokens.claim(token)
      if (!claimed) return false
      try {
        const updated = await userStore.updatePassword(claimed.userId, passwordHash, claimed.authVersion)
        if (!updated) {
          tokens.revoke(token)
          return false
        }
      } catch (error) {
        // A failed storage update must not permanently consume a valid reset link.
        tokens.release(token)
        throw error
      }
      tokens.revokeAll(claimed.userId)
      sessions.revokeAll(claimed.userId)
      return true
    },
  }
}
