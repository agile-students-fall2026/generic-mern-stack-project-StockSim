import { beforeEach, describe, it } from 'mocha'
import { expect } from 'chai'
import jwt from 'jsonwebtoken'
import { createSessionService, SESSION_SECONDS } from '../src/services/sessions.js'

const secret = 'test-signing-key-with-at-least-32-bytes'

describe('JWT sessions', () => {
  let time
  let sessions
  beforeEach(() => {
    time = Date.now()
    sessions = createSessionService({ secret, production: false, now: () => time })
  })

  it('issues a signed JWT with a user ID, unique session ID, and 15-minute expiry', () => {
    const token = sessions.issue('user-1')
    const claims = jwt.verify(token, secret, { algorithms: ['HS256'], issuer: 'stocksim-api', audience: 'stocksim-web' })

    expect(claims.sub).to.equal('user-1')
    expect(claims.exp - claims.iat).to.equal(SESSION_SECONDS)
    expect(sessions.read(token)).to.deep.equal({ userId: 'user-1', sessionId: claims.jti, authVersion: 0 })
    expect(sessions.issue('user-1')).not.to.equal(token)
  })

  it('rejects a session at its expiry time', () => {
    const token = sessions.issue('user-1')
    time += SESSION_SECONDS * 1000
    expect(sessions.read(token)).to.equal(null)
  })

  it('revokes one session without logging out another session', () => {
    const first = sessions.issue('user-1')
    const second = sessions.issue('user-1')
    sessions.revoke(first)

    expect(sessions.read(first)).to.equal(null)
    expect(sessions.read(second).userId).to.equal('user-1')
    sessions.revoke(first)
    sessions.revoke(undefined)
  })

  it('rejects missing, malformed, and non-string tokens', () => {
    for (const token of [undefined, null, '', 'invalid-token', {}, ['token']]) {
      expect(sessions.read(token)).to.equal(null)
    }
  })

  it('rejects other signatures, algorithms, issuers, audiences, and unknown session IDs', () => {
    const token = sessions.issue('user-1')
    const claims = jwt.decode(token)
    const payload = { sub: claims.sub, jti: claims.jti, iat: claims.iat, ver: claims.ver }
    const options = { expiresIn: SESSION_SECONDS, algorithm: 'HS256', issuer: 'stocksim-api', audience: 'stocksim-web' }
    const tokens = [
      jwt.sign(payload, 'another-key-with-at-least-32-bytes', options),
      jwt.sign(payload, secret, { ...options, algorithm: 'HS384' }),
      jwt.sign(payload, secret, { ...options, issuer: 'another-api' }),
      jwt.sign(payload, secret, { ...options, audience: 'another-app' }),
      jwt.sign({ ...payload, jti: 'unknown-session' }, secret, options),
      jwt.sign({ ...payload, sub: 'another-user' }, secret, options),
      jwt.sign(payload, secret, { ...options, expiresIn: SESSION_SECONDS * 2 }),
      jwt.sign({ iat: claims.iat }, secret, options),
    ]
    for (const invalid of tokens) expect(sessions.read(invalid)).to.equal(null)
    expect(sessions.read(token).userId).to.equal('user-1')
  })

  it('uses an ephemeral development key and does not restore old sessions', () => {
    const first = createSessionService({ secret: '', production: false })
    const second = createSessionService({ secret: '', production: false })
    expect(second.read(first.issue('user-1'))).to.equal(null)
  })

  it('revokes every session for one account while retaining other accounts', () => {
    const first = sessions.issue('user-1', 0)
    const second = sessions.issue('user-1', 0)
    const other = sessions.issue('user-2', 3)
    sessions.revokeAll('user-1')
    expect(sessions.read(first)).to.equal(null)
    expect(sessions.read(second)).to.equal(null)
    expect(sessions.read(other).authVersion).to.equal(3)
  })

  it('requires a strong configured secret in production and marks cookies Secure', () => {
    expect(() => createSessionService({ secret: '', production: true })).to.throw('JWT_SECRET')
    expect(() => createSessionService({ secret: 'short', production: false })).to.throw('JWT_SECRET')
    const secure = createSessionService({ secret, production: true })
    expect(secure.cookieOptions).to.deep.equal({ httpOnly: true, sameSite: 'strict', secure: true, path: '/api' })
  })
})
