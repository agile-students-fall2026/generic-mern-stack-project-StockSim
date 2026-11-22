import { afterEach, beforeEach, describe, it } from 'mocha'
import { expect } from 'chai'
import { createApp } from '../src/app.js'
import { createMemoryUserStore } from '../src/stores/memoryUserStore.js'
import { createSessionService, SESSION_SECONDS } from '../src/services/sessions.js'
import { createPasswordResetTokens } from '../src/services/passwordResetTokens.js'
import { createPasswordRecovery } from '../src/services/passwordRecovery.js'
import { AuthApiError, createAuthApi } from '../../front-end/src/services/authApi.js'

const account = { name: 'Frontend Learner', email: 'frontend@example.com', password: 'practice-password' }

async function apiFailure(operation, status, code) {
  try {
    await operation
    expect.fail('Expected an API error')
  } catch (error) {
    expect(error).to.be.instanceOf(AuthApiError)
    expect(error.status).to.equal(status)
    expect(error.code).to.equal(code)
    return error
  }
}

describe('Frontend auth client with the real Express HTTP API', () => {
  let server
  let api
  let recovery
  let messages
  let time

  beforeEach(async () => {
    time = Date.now()
    messages = []
    const userStore = createMemoryUserStore()
    const sessions = createSessionService({ production: false, now: () => time })
    recovery = createPasswordRecovery({ userStore, sessions,
      tokens: createPasswordResetTokens({ now: () => time }),
      mailer: { async sendResetLink(message) { messages.push(message) } },
    })
    const app = createApp({ userStore, sessions, recovery })
    server = await new Promise((resolve, reject) => {
      const next = app.listen(0, '127.0.0.1', () => resolve(next))
      next.once('error', reject)
    })
    const origin = `http://127.0.0.1:${server.address().port}`
    let cookie = ''
    // Node fetch does not have a browser cookie jar. Model its same-origin cookie
    // behavior here; actual browser cookie/route behavior is also checked in Chrome.
    api = createAuthApi({ fetchFn: async (path, options) => {
      const headers = new Headers(options.headers)
      if (cookie && options.credentials === 'same-origin') headers.set('Cookie', cookie)
      const response = await fetch(new URL(path, origin), { ...options, headers })
      if (options.credentials === 'same-origin') {
        for (const value of response.headers.getSetCookie()) {
          const pair = value.split(';')[0]
          cookie = pair.endsWith('=') ? '' : pair
        }
      }
      return response
    } })
  })

  afterEach(async () => {
    await recovery?.whenIdle()
    if (server) {
      server.closeAllConnections()
      await new Promise(resolve => server.close(resolve))
    }
  })

  it('registers, requires login, restores the cookie-authenticated user, and logs out', async () => {
    const created = await api.register(account)
    expect(created).to.include({ name: account.name, email: account.email })
    expect(created).to.have.all.keys('id', 'name', 'email', 'createdAt')
    await apiFailure(api.me(), 401, 'UNAUTHORIZED')
    const loggedIn = await api.login({ email: account.email, password: account.password })
    expect(loggedIn.id).to.equal(created.id)
    expect((await api.me()).id).to.equal(created.id)
    expect(await api.logout()).to.equal(null)
    await apiFailure(api.me(), 401, 'UNAUTHORIZED')
  })

  it('preserves server field errors and duplicate-email errors for the forms', async () => {
    const invalid = await apiFailure(api.register({ name: '', email: 'bad', password: 'short' }), 400, 'VALIDATION_ERROR')
    expect(invalid.fields).to.have.all.keys('name', 'email', 'password')
    expect(invalid.message).not.to.include('short')
    await api.register(account)
    const duplicate = await apiFailure(api.register(account), 409, 'EMAIL_IN_USE')
    expect(duplicate.fields).to.have.property('email')
  })

  it('keeps invalid credentials rejected without creating a browser session', async () => {
    await api.register(account)
    await apiFailure(api.login({ email: account.email, password: 'wrong-password' }), 401, 'INVALID_CREDENTIALS')
    await apiFailure(api.me(), 401, 'UNAUTHORIZED')
  })

  it('submits forgot/reset password, clears the login cookie, and accepts only the new password', async () => {
    await api.register(account)
    await api.login(account)
    const accepted = await api.forgotPassword({ email: account.email })
    expect(accepted.message).to.include('If an account exists')
    await recovery.whenIdle()
    expect(messages).to.have.lengthOf(1)
    const token = new URLSearchParams(new URL(messages[0].resetUrl).hash.slice(1)).get('token')
    const payload = { token, password: 'new-practice-password', confirmPassword: 'new-practice-password' }
    const reset = await api.resetPassword(payload)
    expect(reset.message).to.include('has been reset')
    await apiFailure(api.me(), 401, 'UNAUTHORIZED')
    await apiFailure(api.login(account), 401, 'INVALID_CREDENTIALS')
    expect((await api.login({ ...account, password: payload.password })).email).to.equal(account.email)
    await apiFailure(api.resetPassword(payload), 400, 'INVALID_RESET_TOKEN')
  })

  it('reports session expiry from the server instead of trusting cached user details', async () => {
    await api.register(account)
    await api.login(account)
    time += SESSION_SECONDS * 1000
    await apiFailure(api.me(), 401, 'UNAUTHORIZED')
  })

  it('preserves rate-limit feedback for repeated invalid login requests', async () => {
    for (let i = 0; i < 10; i++) await apiFailure(api.login({}), 400, 'VALIDATION_ERROR')
    const limited = await apiFailure(api.login({}), 429, 'TOO_MANY_ATTEMPTS')
    expect(limited.message).to.include('Too many login attempts')
  })
})

describe('Frontend auth client failure handling', () => {
  it('reports network failure without exposing raw connection details', async () => {
    const api = createAuthApi({ fetchFn: async () => { throw new TypeError('private network details') } })
    const error = await apiFailure(api.login(account), 0, 'NETWORK_ERROR')
    expect(error.message).not.to.include('private network')
  })

  it('rejects a non-JSON proxy response and an invalid successful user response', async () => {
    const unavailable = createAuthApi({ fetchFn: async () => new Response('Bad gateway', { status: 502 }) })
    await apiFailure(unavailable.me(), 502, 'INVALID_RESPONSE')
    const invalid = createAuthApi({ fetchFn: async () => Response.json({ user: { email: account.email } }) })
    await apiFailure(invalid.me(), 502, 'INVALID_RESPONSE')
  })

  it('reports a timeout and leaves caller-aborted requests canceled', async () => {
    const timeout = createAuthApi({ fetchFn: async () => { throw new DOMException('private timeout', 'TimeoutError') } })
    await apiFailure(timeout.me(), 0, 'REQUEST_TIMEOUT')
    const controller = new AbortController()
    controller.abort()
    const aborted = createAuthApi({ fetchFn: async (_path, options) => { throw options.signal.reason } })
    let caught
    try { await aborted.me({ signal: controller.signal }) } catch (error) { caught = error }
    expect(caught.name).to.equal('AbortError')
  })
})
