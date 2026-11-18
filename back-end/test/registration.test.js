import { beforeEach, describe, it } from 'mocha'
import { expect } from 'chai'
import request from 'supertest'
import { createApp } from '../src/app.js'
import { createMemoryUserStore } from '../src/stores/memoryUserStore.js'

const validUser = { name: 'Jordan Avery', email: 'jordan@example.com', password: 'practice-password' }

describe('POST /api/auth/register', () => {
  let app
  let store

  beforeEach(() => {
    store = createMemoryUserStore()
    app = createApp({ userStore: store })
  })

  it('creates a user with public details and stores only a password hash', async () => {
    const response = await request(app).post('/api/auth/register').send(validUser)

    expect(response.status).to.equal(201)
    expect(response.body.user).to.have.all.keys('id', 'name', 'email', 'createdAt')
    expect(response.body.user).to.include({ name: validUser.name, email: validUser.email })
    expect(response.body.user.id).to.match(/^[0-9a-f-]{36}$/)
    expect(Number.isNaN(Date.parse(response.body.user.createdAt))).to.equal(false)
    expect(response.headers['set-cookie']).to.equal(undefined)
    const stored = await store.findByEmail(validUser.email)
    expect(stored).not.to.have.property('password')
    expect(stored.passwordHash).to.match(/^scrypt\$/)
    expect(JSON.stringify(response.body)).not.to.include(stored.passwordHash)
    expect(JSON.stringify(response.body)).not.to.include(validUser.password)
  })

  it('trims names/emails and treats email addresses case-insensitively', async () => {
    const response = await request(app).post('/api/auth/register').send({
      ...validUser, name: '  Jordan Avery  ', email: '  Jordan@Example.COM  ',
    })

    expect(response.status).to.equal(201)
    expect(response.body.user.name).to.equal(validUser.name)
    expect(response.body.user.email).to.equal(validUser.email)
    const duplicate = await request(app).post('/api/auth/register').send(validUser)
    expect(duplicate.status).to.equal(409)
    expect(duplicate.body.error.code).to.equal('EMAIL_IN_USE')
    expect(duplicate.body.error.fields).to.have.property('email')
  })

  const invalidFields = [
    ['blank name', { name: '   ' }, 'name'],
    ['non-text name', { name: 123 }, 'name'],
    ['long name', { name: 'a'.repeat(81) }, 'name'],
    ['invalid email', { email: 'not-an-email' }, 'email'],
    ['array email', { email: ['jordan@example.com'] }, 'email'],
    ['object email', { email: { address: 'jordan@example.com' } }, 'email'],
    ['long email', { email: `${'a'.repeat(245)}@example.com` }, 'email'],
    ['short password', { password: '1234567' }, 'password'],
    ['long password', { password: 'x'.repeat(129) }, 'password'],
    ['blank password', { password: ' '.repeat(8) }, 'password'],
    ['non-text password', { password: 12345678 }, 'password'],
  ]

  for (const [label, overrides, field] of invalidFields) {
    it(`rejects ${label} without saving a user or echoing inputs`, async () => {
      const response = await request(app).post('/api/auth/register').send({ ...validUser, ...overrides })

      expect(response.status).to.equal(400)
      expect(response.body.error.code).to.equal('VALIDATION_ERROR')
      expect(response.body.error.fields[field]).to.be.a('string')
      expect(JSON.stringify(response.body)).not.to.include(validUser.password)
      expect(await store.findByEmail(validUser.email)).to.equal(null)
    })
  }

  it('reports all missing fields', async () => {
    const response = await request(app).post('/api/auth/register').send({})

    expect(response.status).to.equal(400)
    expect(response.body.error.fields).to.have.all.keys('name', 'email', 'password')
  })

  it('handles a request without a JSON body', async () => {
    const response = await request(app).post('/api/auth/register')

    expect(response.status).to.equal(400)
    expect(response.body.error.fields).to.have.all.keys('name', 'email', 'password')
  })

  it('does not accept registration fields from the query string', async () => {
    const response = await request(app).post('/api/auth/register').query(validUser).send({})

    expect(response.status).to.equal(400)
    expect(await store.findByEmail(validUser.email)).to.equal(null)
  })

  it('ignores client-supplied IDs, roles, and password hashes', async () => {
    const response = await request(app).post('/api/auth/register').send({
      ...validUser, id: 'client-id', role: 'admin', passwordHash: 'client-hash',
    })

    expect(response.status).to.equal(201)
    const stored = await store.findByEmail(validUser.email)
    expect(stored.id).not.to.equal('client-id')
    expect(stored).not.to.have.property('role')
    expect(stored.passwordHash).not.to.equal('client-hash')
  })

  it('allows only one registration when duplicate requests arrive together', async () => {
    const responses = await Promise.all([
      request(app).post('/api/auth/register').send(validUser),
      request(app).post('/api/auth/register').send({ ...validUser, name: 'Another User' }),
    ])

    expect(responses.map((response) => response.status).sort()).to.deep.equal([201, 409])
    const created = responses.find((response) => response.status === 201).body.user
    expect((await store.findByEmail(validUser.email)).id).to.equal(created.id)
  })

  it('does not expose internal storage errors or passwords', async () => {
    const failingApp = createApp({ userStore: {
      async findByEmail() { throw new Error('Private storage error') },
    } })
    const response = await request(failingApp).post('/api/auth/register').send(validUser)

    expect(response.status).to.equal(500)
    expect(response.body.error.code).to.equal('INTERNAL_ERROR')
    expect(JSON.stringify(response.body)).not.to.include('Private storage error')
    expect(JSON.stringify(response.body)).not.to.include(validUser.password)
  })
})
