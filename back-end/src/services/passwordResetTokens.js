import { createHash, randomBytes } from 'node:crypto'

export const RESET_TOKEN_TTL_MS = 15 * 60 * 1000
const digest = token => createHash('sha256').update(token).digest('hex')

export function createPasswordResetTokens({ now = Date.now } = {}) {
  const records = new Map()
  const byUser = new Map()

  function remove(key) {
    const record = records.get(key)
    if (record && byUser.get(record.userId) === key) byUser.delete(record.userId)
    records.delete(key)
  }

  function lookup(token, includeClaimed = false) {
    for (const [key, record] of records) {
      if (record.expiresAt <= now()) remove(key)
    }
    if (typeof token !== 'string' || !/^[0-9a-f]{64}$/.test(token)) return null
    const record = records.get(digest(token))
    return record && (includeClaimed || !record.claimed) ? record : null
  }

  const details = record => record
    ? { userId: record.userId, authVersion: record.authVersion, expiresAt: record.expiresAt }
    : null

  return {
    issue(userId, authVersion = 0) {
      // Cleanup also bounds expired entries when new links are requested.
      lookup('')
      const previous = byUser.get(userId)
      if (previous) remove(previous)
      const token = randomBytes(32).toString('hex')
      const key = digest(token)
      records.set(key, { userId, authVersion, expiresAt: now() + RESET_TOKEN_TTL_MS, claimed: false })
      byUser.set(userId, key)
      return token
    },
    inspect(token) { return details(lookup(token)) },
    claim(token) {
      // This synchronous claim prevents two reset requests from using one token.
      const record = lookup(token)
      if (!record) return null
      record.claimed = true
      return details(record)
    },
    release(token) {
      const record = lookup(token, true)
      if (record) record.claimed = false
    },
    revoke(token) {
      if (lookup(token, true)) remove(digest(token))
    },
    revokeAll(userId) {
      const key = byUser.get(userId)
      if (key) remove(key)
    },
  }
}
