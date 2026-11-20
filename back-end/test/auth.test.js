import { before, beforeEach, describe, it } from 'mocha'
import { expect } from 'chai'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { hashPassword } from '../src/services/passwords.js'
import { createSessionService, SESSION_COOKIE, SESSION_SECONDS } from '../src/services/sessions.js'
import { createMemoryUserStore } from '../src/stores/memoryUserStore.js'

const credentials = { email: 'jordan@example.com', password: 'practice-password' }
const cookieFrom = (response) => response.headers['set-cookie'][0].split(';')[0]

describe('Login, logout, and protected access', () => {
  let passwordHash
  let app
  let store
  let user
  let time
  before(async () => { passwordHash = await hashPassword(credentials.password) })
  beforeEach(async () => {
    time = Date.now()
    store = createMemoryUserStore()
    user = await store.create({ ...credentials, name: 'Jordan Avery', passwordHash })
    app = createApp({ userStore: store, sessions: createSessionService({ production: false, now: () => time }) })
  })

  it('logs in and sets an HttpOnly, SameSite cookie without exposing the JWT in JSON', async () => {
    const response = await request(app).post('/api/auth/login').send(credentials)

    expect(response.status).to.equal(200)
    expect(response.body.user.id).to.equal(user.id)
    expect(response.body).to.have.all.keys('user')
    expect(response.body.user).to.have.all.keys('id', 'name', 'email', 'createdAt')
    const cookie = response.headers['set-cookie'][0]
    expect(cookie).to.include(`${SESSION_COOKIE}=`)
    expect(cookie).to.include('HttpOnly').and.include('SameSite=Strict').and.include('Path=/api')
    expect(cookie).to.include(`Max-Age=${SESSION_SECONDS}`)
    expect(cookie).not.to.include('Secure')
    expect(response.headers['cache-control']).to.equal('no-store')
    expect(JSON.stringify(response.body)).not.to.include(passwordHash)
    expect(JSON.stringify(response.body)).not.to.include(credentials.password)
  })

  it('accepts trimmed, case-insensitive email addresses', async () => {
    const response = await request(app).post('/api/auth/login').send({ ...credentials, email: ' Jordan@Example.COM ' })
    expect(response.status).to.equal(200)
    expect(response.body.user.email).to.equal(credentials.email)
  })

  it('lets a cookie-authenticated user access the protected /me endpoint', async () => {
    const agent = request.agent(app)
    await agent.post('/api/auth/login').send(credentials).expect(200)
    const response = await agent.get('/api/auth/me')

    expect(response.status).to.equal(200)
    expect(response.body.user.id).to.equal(user.id)
    expect(response.body.user).not.to.have.property('passwordHash')
    expect(response.headers['cache-control']).to.equal('no-store')
  })

  it('requires login for /me', async () => {
    const response = await request(app).get('/api/auth/me')
    expect(response.status).to.equal(401)
    expect(response.body.error.code).to.equal('UNAUTHORIZED')
  })

  it('returns the same generic error for a wrong password or unknown email', async () => {
    const wrong = await request(app).post('/api/auth/login').send({ ...credentials, password: 'wrong-password' })
    const unknown = await request(app).post('/api/auth/login').send({ ...credentials, email: 'missing@example.com' })

    expect(wrong.status).to.equal(401)
    expect(unknown.status).to.equal(401)
    expect(unknown.body).to.deep.equal(wrong.body)
    expect(wrong.body.error.code).to.equal('INVALID_CREDENTIALS')
    expect(wrong.headers['set-cookie']).to.equal(undefined)
    expect(unknown.headers['set-cookie']).to.equal(undefined)
  })

  for (const [label, body] of [
    ['missing fields', {}],
    ['an invalid email', { ...credentials, email: 'invalid' }],
    ['a non-string password', { ...credentials, password: { value: 'secret' } }],
    ['an oversized password', { ...credentials, password: 'a'.repeat(129) }],
  ]) {
    it(`validates ${label} before checking credentials`, async () => {
      const response = await request(app).post('/api/auth/login').send(body)
      expect(response.status).to.equal(400)
      expect(response.body.error.code).to.equal('VALIDATION_ERROR')
      expect(response.headers['set-cookie']).to.equal(undefined)
    })
  }

  it('rejects corrupted cookies and ignores tokens in the query string or Authorization header', async () => {
    const login = await request(app).post('/api/auth/login').send(credentials)
    const cookie = cookieFrom(login)
    const token = cookie.slice(cookie.indexOf('=') + 1)
    const parts = token.split('.')
    parts[2] = (parts[2][0] === 'A' ? 'B' : 'A') + parts[2].slice(1)
    await request(app).get('/api/auth/me').set('Cookie', `${SESSION_COOKIE}=${parts.join('.')}`).expect(401)
    await request(app).get('/api/auth/me').set('Cookie', `${SESSION_COOKIE}=j:%7B%7D`).expect(401)
    await request(app).get('/api/auth/me').query({ token }).expect(401)
    await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`).expect(401)
  })

  it('rejects an expired cookie even if the browser sends it', async () => {
    const login = await request(app).post('/api/auth/login').send(credentials)
    time += SESSION_SECONDS * 1000
    await request(app).get('/api/auth/me').set('Cookie', cookieFrom(login)).expect(401)
  })

  it('clears the cookie and invalidates copied tokens on logout', async () => {
    const login = await request(app).post('/api/auth/login').send(credentials)
    const cookie = cookieFrom(login)
    const logout = await request(app).post('/api/auth/logout').set('Cookie', cookie)

    expect(logout.status).to.equal(204)
    expect(logout.text).to.equal('')
    expect(logout.headers['set-cookie'][0]).to.include(`${SESSION_COOKIE}=;`).and.include('Path=/api')
    await request(app).get('/api/auth/me').set('Cookie', cookie).expect(401)
  })

  it('allows logout when already logged out or holding an invalid cookie', async () => {
    await request(app).post('/api/auth/logout').expect(204)
    await request(app).post('/api/auth/logout').set('Cookie', `${SESSION_COOKIE}=invalid`).expect(204)
  })

  it('rotates the current browser session after another successful login', async () => {
    const first = await request(app).post('/api/auth/login').send(credentials)
    const second = await request(app).post('/api/auth/login').set('Cookie', cookieFrom(first)).send(credentials)
    expect(cookieFrom(second)).not.to.equal(cookieFrom(first))
    await request(app).get('/api/auth/me').set('Cookie', cookieFrom(first)).expect(401)
    await request(app).get('/api/auth/me').set('Cookie', cookieFrom(second)).expect(200)
  })

  it('does not log out a separate device session', async () => {
    const first = await request(app).post('/api/auth/login').send(credentials)
    const second = await request(app).post('/api/auth/login').send(credentials)
    await request(app).post('/api/auth/logout').set('Cookie', cookieFrom(first)).expect(204)
    await request(app).get('/api/auth/me').set('Cookie', cookieFrom(second)).expect(200)
  })

  it('rejects sessions whose user no longer exists', async () => {
    const login = await request(app).post('/api/auth/login').send(credentials)
    store.findById = async () => null
    await request(app).get('/api/auth/me').set('Cookie', cookieFrom(login)).expect(401)
  })

  it('keeps unexpected user-store errors private', async () => {
    const login = await request(app).post('/api/auth/login').send(credentials)
    store.findById = async () => { throw new Error('Private backend error') }
    const response = await request(app).get('/api/auth/me').set('Cookie', cookieFrom(login))
    expect(response.status).to.equal(500)
    expect(response.body.error.code).to.equal('INTERNAL_ERROR')
    expect(JSON.stringify(response.body)).not.to.include('Private backend error')
  })

  it('blocks untrusted browser origins without logging the user out', async () => {
    const login = await request(app).post('/api/auth/login').send(credentials)
    await request(app).post('/api/auth/login').set('Origin', 'https://untrusted.example').send(credentials).expect(403)
    await request(app).post('/api/auth/logout').set('Origin', 'https://untrusted.example').set('Cookie', cookieFrom(login)).expect(403)
    await request(app).post('/api/auth/logout').set('Sec-Fetch-Site', 'cross-site').set('Cookie', cookieFrom(login)).expect(403)
    await request(app).get('/api/auth/me').set('Cookie', cookieFrom(login)).expect(200)
  })

  it('accepts the local frontend origin', async () => {
    await request(app).post('/api/auth/login').set('Origin', 'http://127.0.0.1:5173').send(credentials).expect(200)
  })

  it('limits repeated failed login requests', async () => {
    for (let i = 0; i < 10; i++) await request(app).post('/api/auth/login').send({}).expect(400)
    const response = await request(app).post('/api/auth/login').send({})
    expect(response.status).to.equal(429)
    expect(response.body.error.code).to.equal('TOO_MANY_ATTEMPTS')
    expect(response.headers['retry-after']).to.be.a('string')
  })

  it('marks authentication cookies Secure in production', async () => {
    const productionApp = createApp({ userStore: store, sessions: createSessionService({
      production: true, secret: 'test-production-signing-key-at-least-32-bytes',
    }) })
    const response = await request(productionApp).post('/api/auth/login').send(credentials)
    expect(response.status).to.equal(200)
    expect(response.headers['set-cookie'][0]).to.include('Secure')
  })

  it('supports registration, login, protected access, and logout as one flow', async () => {
    const agent = request.agent(app)
    const details = { name: 'Another Learner', email: 'learner@example.com', password: 'another-password' }
    await agent.post('/api/auth/register').send(details).expect(201)
    await agent.get('/api/auth/me').expect(401)
    await agent.post('/api/auth/login').send(details).expect(200)
    const me = await agent.get('/api/auth/me').expect(200)
    expect(me.body.user.email).to.equal(details.email)
    await agent.post('/api/auth/logout').expect(204)
    await agent.get('/api/auth/me').expect(401)
  })
})
