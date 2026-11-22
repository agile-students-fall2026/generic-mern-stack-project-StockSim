import { randomBytes, randomUUID } from 'node:crypto'
import jwt from 'jsonwebtoken'

export const SESSION_COOKIE = 'stocksim_session'
export const SESSION_SECONDS = 15 * 60
const issuer = 'stocksim-api'
const audience = 'stocksim-web'

export function createSessionService({
  secret = process.env.JWT_SECRET,
  production = process.env.NODE_ENV === 'production',
  now = Date.now,
} = {}) {
  if (!secret && !production) secret = randomBytes(32).toString('hex')
  if (typeof secret !== 'string' || Buffer.byteLength(secret) < 32) {
    throw new Error('JWT_SECRET must contain at least 32 bytes; it is required in production.')
  }
  const sessions = new Map()
  const cookieOptions = { httpOnly: true, sameSite: 'strict', secure: production, path: '/api' }

  function removeExpired() {
    const seconds = Math.floor(now() / 1000)
    for (const [id, session] of sessions) {
      if (session.expiresAt <= seconds) sessions.delete(id)
    }
  }

  function read(token) {
    removeExpired()
    if (typeof token !== 'string') return null
    let claims
    try {
      claims = jwt.verify(token, secret, {
        algorithms: ['HS256'], issuer, audience, clockTimestamp: Math.floor(now() / 1000),
      })
    } catch {
      return null
    }
    if (!claims || typeof claims !== 'object' || typeof claims.jti !== 'string' || typeof claims.sub !== 'string') return null
    const session = sessions.get(claims.jti)
    if (!session || session.userId !== claims.sub || session.expiresAt !== claims.exp || session.authVersion !== claims.ver) return null
    return { userId: session.userId, sessionId: claims.jti, authVersion: session.authVersion }
  }

  return {
    cookieOptions,
    issue(userId, authVersion = 0) {
      removeExpired()
      const id = randomUUID()
      const issuedAt = Math.floor(now() / 1000)
      const token = jwt.sign({ sub: userId, jti: id, iat: issuedAt, ver: authVersion }, secret, {
        algorithm: 'HS256', issuer, audience, expiresIn: SESSION_SECONDS,
      })
      sessions.set(id, { userId, authVersion, expiresAt: issuedAt + SESSION_SECONDS })
      return token
    },
    read,
    revokeAll(userId) {
      for (const [id, session] of sessions) {
        if (session.userId === userId) sessions.delete(id)
      }
    },
    revoke(token) {
      const session = read(token)
      if (session) sessions.delete(session.sessionId)
    },
  }
}
