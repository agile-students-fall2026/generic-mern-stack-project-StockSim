import { describe, it } from 'mocha'
import { expect } from 'chai'
import { createMemoryUserStore, DuplicateEmailError } from '../src/stores/memoryUserStore.js'

const user = { name: 'Jordan', email: 'jordan@example.com', passwordHash: 'test-hash' }

describe('Temporary user store', () => {
  it('returns null for an unknown email', async () => {
    expect(await createMemoryUserStore().findByEmail(user.email)).to.equal(null)
  })

  it('protects stored users from mutations to returned records', async () => {
    const store = createMemoryUserStore()
    const created = await store.create(user)
    created.name = 'Changed name'
    const found = await store.findByEmail(user.email)
    found.passwordHash = 'Changed hash'

    expect((await store.findByEmail(user.email)).name).to.equal(user.name)
    expect((await store.findByEmail(user.email)).passwordHash).to.equal(user.passwordHash)
  })

  it('rejects duplicate emails without replacing the original record', async () => {
    const store = createMemoryUserStore()
    const created = await store.create(user)
    let caught
    try {
      await store.create({ ...user, name: 'Replacement' })
    } catch (error) {
      caught = error
    }

    expect(caught).to.be.instanceOf(DuplicateEmailError)
    expect(await store.findByEmail(user.email)).to.deep.equal(created)
  })

  it('looks up users by ID without returning a mutable stored record', async () => {
    const store = createMemoryUserStore()
    const created = await store.create(user)
    const found = await store.findById(created.id)
    expect(found).to.deep.equal(created)
    found.name = 'Changed'
    expect((await store.findById(created.id)).name).to.equal(user.name)
    expect(await store.findById('missing')).to.equal(null)
  })

  it('starts empty for a new app/server store', async () => {
    await createMemoryUserStore().create(user)
    expect(await createMemoryUserStore().findByEmail(user.email)).to.equal(null)
  })
})
