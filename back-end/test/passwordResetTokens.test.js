import { beforeEach, describe, it } from 'mocha'
import { expect } from 'chai'
import { createPasswordResetTokens, RESET_TOKEN_TTL_MS } from '../src/services/passwordResetTokens.js'

describe('Password reset tokens', () => {
  let tokens
  let time
  beforeEach(() => {
    time = Date.now()
    tokens = createPasswordResetTokens({ now: () => time })
  })

  it('issues random, account-bound tokens with a 15-minute expiry', () => {
    const first = tokens.issue('user-a', 3)
    const second = tokens.issue('user-b', 0)
    expect(first).to.match(/^[0-9a-f]{64}$/)
    expect(first).not.to.equal(second)
    expect(tokens.inspect(first)).to.deep.equal({ userId: 'user-a', authVersion: 3, expiresAt: time + RESET_TOKEN_TTL_MS })
    expect(JSON.stringify(tokens.inspect(first))).not.to.include(first)
  })

  it('expires tokens at the deadline and rejects malformed/unknown tokens', () => {
    const token = tokens.issue('user-a')
    time += RESET_TOKEN_TTL_MS
    expect(tokens.inspect(token)).to.equal(null)
    for (const value of [undefined, null, {}, [], '', 'short', 'a'.repeat(64)]) {
      expect(tokens.claim(value)).to.equal(null)
    }
  })

  it('allows only one active link per account without affecting another account', () => {
    const old = tokens.issue('user-a')
    const other = tokens.issue('user-b')
    const current = tokens.issue('user-a')
    expect(tokens.inspect(old)).to.equal(null)
    expect(tokens.inspect(current).userId).to.equal('user-a')
    expect(tokens.inspect(other).userId).to.equal('user-b')
  })

  it('allows only one claimant and supports release after a failed update', () => {
    const token = tokens.issue('user-a')
    expect(tokens.claim(token).userId).to.equal('user-a')
    expect(tokens.claim(token)).to.equal(null)
    expect(tokens.inspect(token)).to.equal(null)
    tokens.release(token)
    expect(tokens.claim(token).userId).to.equal('user-a')
    tokens.revoke(token)
    expect(tokens.inspect(token)).to.equal(null)
  })

  it('does not resurrect expired or superseded claims', () => {
    const old = tokens.issue('user-a')
    tokens.claim(old)
    const current = tokens.issue('user-a')
    tokens.release(old)
    tokens.revoke(old)
    expect(tokens.inspect(current).userId).to.equal('user-a')
    time += RESET_TOKEN_TTL_MS
    tokens.release(current)
    expect(tokens.inspect(current)).to.equal(null)
  })

  it('revokes an account link and starts empty after a restart', () => {
    const token = tokens.issue('user-a')
    expect(createPasswordResetTokens().inspect(token)).to.equal(null)
    tokens.revokeAll('missing')
    tokens.revokeAll('user-a')
    expect(tokens.inspect(token)).to.equal(null)
  })
})
