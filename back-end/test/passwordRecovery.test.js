import { before, beforeEach, describe, it } from 'mocha'
import { expect } from 'chai'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { createMemoryUserStore } from '../src/stores/memoryUserStore.js'
import { hashPassword, verifyPassword } from '../src/services/passwords.js'
import { createSessionService, SESSION_COOKIE } from '../src/services/sessions.js'
import { createPasswordResetTokens, RESET_TOKEN_TTL_MS } from '../src/services/passwordResetTokens.js'
import { createPasswordRecovery } from '../src/services/passwordRecovery.js'

const account = { name: 'Jordan', email: 'jordan@example.com', password: 'old-practice-password' }
const newPassword = 'new-practice-password'
const cookieFrom = response => response.headers['set-cookie'][0].split(';')[0]
const tokenFrom = message => new URLSearchParams(new URL(message.resetUrl).hash.slice(1)).get('token')

describe('Forgot and reset password API', () => {
  let originalHash
  let store
  let user
  let sessions
  let tokens
  let recovery
  let app
  let time
  let sent

  before(async () => { originalHash = await hashPassword(account.password) })
  beforeEach(async () => {
    time = Date.now()
    store = createMemoryUserStore()
    user = await store.create({ name: account.name, email: account.email, passwordHash: originalHash })
    sessions = createSessionService({ production: false, now: () => time })
    tokens = createPasswordResetTokens({ now: () => time })
    sent = []
    recovery = createPasswordRecovery({ userStore: store, sessions, tokens,
      mailer: { async sendResetLink(message) { sent.push(message) } },
      frontendOrigin: 'http://localhost:5173', production: false,
    })
    app = createApp({ userStore: store, sessions, recovery })
  })

  async function requestLink(email = account.email) {
    await request(app).post('/api/auth/forgot-password').send({ email }).expect(202)
    await recovery.whenIdle()
    return tokenFrom(sent[sent.length - 1])
  }

  function reset(token, password = newPassword) {
    return request(app).post('/api/auth/reset-password').send({ token, password, confirmPassword: password })
  }

  it('returns the same response for known and unknown emails without leaking reset details', async () => {
    const known = await request(app).post('/api/auth/forgot-password').send({ email: account.email })
    const unknown = await request(app).post('/api/auth/forgot-password').send({ email: 'missing@example.com' })
    await recovery.whenIdle()
    expect(known.status).to.equal(202)
    expect(unknown.status).to.equal(202)
    expect(known.body).to.deep.equal(unknown.body)
    expect(known.headers['set-cookie']).to.equal(undefined)
    expect(known.headers['cache-control']).to.equal('no-store')
    expect(sent).to.have.lengthOf(1)
    expect(sent[0].to).to.equal(account.email)
    const link = new URL(sent[0].resetUrl)
    expect(link.origin).to.equal('http://localhost:5173')
    expect(link.pathname).to.equal('/reset-password')
    expect(link.search).to.equal('')
    expect(tokenFrom(sent[0])).to.match(/^[0-9a-f]{64}$/)
    expect(JSON.stringify(known.body)).not.to.include(tokenFrom(sent[0])).and.not.to.include(account.email)
  })

  it('normalizes the email and never builds links from the request Host header', async () => {
    await request(app).post('/api/auth/forgot-password').set('Host', 'attacker.example').send({ email: ' Jordan@Example.COM ' }).expect(202)
    await recovery.whenIdle()
    expect(sent).to.have.lengthOf(1)
    expect(new URL(sent[0].resetUrl).host).to.equal('localhost:5173')
    expect(sent[0].to).to.equal(account.email)
  })

  for (const email of [undefined, '', 'invalid', [], { value: account.email }]) {
    it(`rejects invalid recovery email ${JSON.stringify(email)}`, async () => {
      const response = await request(app).post('/api/auth/forgot-password').send({ email })
      expect(response.status).to.equal(400)
      expect(response.body.error.fields).to.have.property('email')
      await recovery.whenIdle()
      expect(sent).to.have.lengthOf(0)
    })
  }

  it('does not wait for email delivery before responding', async () => {
    let finishDelivery
    const blocked = new Promise(resolve => { finishDelivery = resolve })
    const queued = createPasswordRecovery({ userStore: store, sessions, tokens,
      mailer: { async sendResetLink() { await blocked } },
    })
    try {
      await request(createApp({ userStore: store, sessions, recovery: queued }))
        .post('/api/auth/forgot-password').send({ email: account.email }).expect(202)
    } finally {
      finishDelivery()
      await queued.whenIdle()
    }
  })

  it('hides delivery failures and revokes the undelivered token', async () => {
    let issued
    const issue = tokens.issue
    tokens.issue = (...args) => { issued = issue(...args); return issued }
    const errors = []
    const failing = createPasswordRecovery({ userStore: store, sessions, tokens,
      mailer: { async sendResetLink() { throw new Error('Private SMTP credentials and token') } },
      onDeliveryError: (...args) => errors.push(args),
    })
    const response = await request(createApp({ userStore: store, sessions, recovery: failing }))
      .post('/api/auth/forgot-password').send({ email: account.email })
    await failing.whenIdle()
    expect(response.status).to.equal(202)
    expect(tokens.inspect(issued)).to.equal(null)
    expect(errors).to.deep.equal([[]])
    expect(JSON.stringify(response.body)).not.to.include('Private SMTP').and.not.to.include(issued)
  })

  it('changes the password once, revokes all account sessions, and keeps other accounts logged in', async () => {
    const first = await request(app).post('/api/auth/login').send(account).expect(200)
    const second = await request(app).post('/api/auth/login').send(account).expect(200)
    const other = await store.create({ name: 'Other', email: 'other@example.com', passwordHash: originalHash })
    const otherCookie = `${SESSION_COOKIE}=${sessions.issue(other.id, other.authVersion)}`
    const token = await requestLink()
    const response = await reset(token).set('Cookie', cookieFrom(first)).send({ userId: other.id, email: other.email })
    expect(response.status).to.equal(200)
    expect(response.headers['set-cookie'][0]).to.include(`${SESSION_COOKIE}=;`)
    expect(JSON.stringify(response.body)).not.to.include(token).and.not.to.include(newPassword)
    const changed = await store.findById(user.id)
    expect(changed.authVersion).to.equal(1)
    expect((await store.findById(other.id)).passwordHash).to.equal(originalHash)
    expect(changed.passwordHash).not.to.equal(originalHash)
    expect(await verifyPassword(newPassword, changed.passwordHash)).to.equal(true)
    expect(tokens.inspect(token)).to.equal(null)
    await request(app).get('/api/auth/me').set('Cookie', cookieFrom(first)).expect(401)
    await request(app).get('/api/auth/me').set('Cookie', cookieFrom(second)).expect(401)
    await request(app).get('/api/auth/me').set('Cookie', otherCookie).expect(200)
    await request(app).post('/api/auth/login').send(account).expect(401)
    await request(app).post('/api/auth/login').send({ ...account, password: newPassword }).expect(200)
    await reset(token).expect(400)
  })

  it('rejects a stale login that finishes after password-reset session revocation', async () => {
    const previousVersion = user.authVersion
    const token = await requestLink()
    await reset(token).expect(200)
    const staleCookie = `${SESSION_COOKIE}=${sessions.issue(user.id, previousVersion)}`
    await request(app).get('/api/auth/me').set('Cookie', staleCookie).expect(401)
  })

  it('expires a reset token without changing the password', async () => {
    const token = await requestLink()
    time += RESET_TOKEN_TTL_MS
    const response = await reset(token)
    expect(response.status).to.equal(400)
    expect(response.body.error.code).to.equal('INVALID_RESET_TOKEN')
    expect((await store.findById(user.id)).passwordHash).to.equal(originalHash)
  })

  it('rejects unknown tokens with the same generic invalid-link error', async () => {
    const response = await reset('a'.repeat(64))
    expect(response.status).to.equal(400)
    expect(response.body.error.code).to.equal('INVALID_RESET_TOKEN')
  })

  it('invalidates earlier links when a new link is requested', async () => {
    const old = await requestLink()
    const current = await requestLink()
    await reset(old).expect(400)
    await reset(current).expect(200)
  })

  it('rejects password mismatch without consuming the token', async () => {
    const token = await requestLink()
    const response = await request(app).post('/api/auth/reset-password').send({ token, password: newPassword, confirmPassword: 'different-password' })
    expect(response.status).to.equal(400)
    expect(response.body.error.fields.confirmPassword).to.equal('Passwords do not match.')
    expect(JSON.stringify(response.body)).not.to.include(newPassword)
    expect(tokens.inspect(token)).not.to.equal(null)
    await reset(token).expect(200)
  })

  for (const password of ['short', ' '.repeat(8), 'a'.repeat(129), { value: newPassword }]) {
    it('enforces the registration password policy without consuming the link', async () => {
      const token = await requestLink()
      const response = await reset(token, password)
      expect(response.status).to.equal(400)
      expect(response.body.error.fields).to.have.property('password')
      expect(tokens.inspect(token)).not.to.equal(null)
      expect((await store.findById(user.id)).passwordHash).to.equal(originalHash)
    })
  }

  it('rejects missing/non-string tokens and ignores query-string reset parameters', async () => {
    const response = await request(app).post('/api/auth/reset-password').query({ token: 'a'.repeat(64) }).send({ password: newPassword, confirmPassword: newPassword })
    expect(response.status).to.equal(400)
    expect(response.body.error.fields).to.have.property('token')
    const invalid = await request(app).post('/api/auth/reset-password').send({ token: {}, password: newPassword, confirmPassword: newPassword })
    expect(invalid.status).to.equal(400)
  })

  it('allows only one successful reset when two requests race', async () => {
    const token = await requestLink()
    const responses = await Promise.all([reset(token, 'first-new-password'), reset(token, 'second-new-password')])
    expect(responses.map(response => response.status).sort()).to.deep.equal([200, 400])
    expect((await store.findById(user.id)).authVersion).to.equal(1)
  })

  it('releases a token for retry when the password storage update fails', async () => {
    const token = await requestLink()
    const update = store.updatePassword
    store.updatePassword = async () => { throw new Error('Private storage failure') }
    const failed = await reset(token)
    expect(failed.status).to.equal(500)
    expect(JSON.stringify(failed.body)).not.to.include('Private storage')
    expect(tokens.inspect(token)).not.to.equal(null)
    expect((await store.findById(user.id)).passwordHash).to.equal(originalHash)
    store.updatePassword = update
    await reset(token).expect(200)
  })

  it('does not overwrite a password changed concurrently after reset-token validation', async () => {
    const token = await requestLink()
    const update = store.updatePassword
    store.updatePassword = async (id, hash, version) => {
      await update(id, 'concurrent-password-hash', version)
      return update(id, hash, version)
    }
    await reset(token).expect(400)
    expect((await store.findById(user.id)).passwordHash).to.equal('concurrent-password-hash')
    expect(tokens.inspect(token)).to.equal(null)
  })

  it('rejects missing accounts and tokens from a previous password version', async () => {
    const token = await requestLink()
    await store.updatePassword(user.id, 'another-hash', user.authVersion)
    await reset(token).expect(400)
    const next = await requestLink()
    store.findById = async () => null
    await reset(next).expect(400)
  })

  it('rejects cross-site recovery/reset submissions and does not expose the local outbox', async () => {
    await request(app).post('/api/auth/forgot-password').set('Origin', 'https://attacker.example').send({ email: account.email }).expect(403)
    await request(app).post('/api/auth/reset-password').set('Sec-Fetch-Site', 'cross-site').send({}).expect(403)
    await request(app).get('/api/auth/reset-password').expect(404)
    await request(app).get('/.mail').expect(404)
    expect(sent).to.have.lengthOf(0)
  })

  it('limits reset-link requests and password-reset attempts', async () => {
    for (let i = 0; i < 5; i++) await request(app).post('/api/auth/forgot-password').send({ email: 'missing@example.com' }).expect(202)
    const forgot = await request(app).post('/api/auth/forgot-password').send({ email: account.email })
    expect(forgot.status).to.equal(429)
    expect(forgot.headers['retry-after']).to.be.a('string')
    for (let i = 0; i < 10; i++) await reset('a'.repeat(64)).expect(400)
    const response = await reset('a'.repeat(64))
    expect(response.status).to.equal(429)
    expect(response.body.error.code).to.equal('TOO_MANY_RESET_ATTEMPTS')
    await recovery.whenIdle()
  })

  it('bounds pending email jobs without exposing whether work was accepted', async () => {
    let finishDelivery
    let deliveries = 0
    const blocked = new Promise(resolve => { finishDelivery = resolve })
    const queued = createPasswordRecovery({ userStore: store, sessions, tokens,
      mailer: { async sendResetLink() { deliveries += 1; await blocked } },
    })
    try {
      for (let i = 0; i < 101; i++) queued.request(account.email)
      await new Promise(resolve => setImmediate(resolve))
      expect(deliveries).to.equal(100)
    } finally {
      finishDelivery()
      await queued.whenIdle()
    }
  })

  it('accepts a configured HTTPS reset origin and rejects unsafe origin settings', () => {
    const options = { userStore: store, sessions, tokens, mailer: { async sendResetLink() {} } }
    expect(() => createPasswordRecovery({ ...options, production: true, frontendOrigin: 'https://app.example.com' })).not.to.throw()
    for (const frontendOrigin of ['invalid', 'file:///tmp/page', 'https://user:pass@example.com']) {
      expect(() => createPasswordRecovery({ ...options, frontendOrigin })).to.throw('FRONTEND_ORIGIN')
    }
    expect(() => createPasswordRecovery({ ...options, production: true, frontendOrigin: 'http://app.example.com' })).to.throw('HTTPS')
  })
})
