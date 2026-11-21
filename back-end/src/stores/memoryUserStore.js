import { randomUUID } from 'node:crypto'

export class DuplicateEmailError extends Error {
  constructor() {
    super('An account with this email already exists.')
    this.name = 'DuplicateEmailError'
  }
}

// Temporary adapter. A future database adapter can implement the same methods.
// Each app instance owns its users; restarting the server clears them.
export function createMemoryUserStore() {
  const usersByEmail = new Map()

  return {
    async findByEmail(email) {
      const user = usersByEmail.get(email)
      return user ? { ...user } : null
    },

    async findById(id) {
      for (const user of usersByEmail.values()) {
        if (user.id === id) return { ...user }
      }
      return null
    },

    async updatePassword(id, passwordHash, expectedAuthVersion) {
      for (const user of usersByEmail.values()) {
        if (user.id !== id) continue
        if (user.authVersion !== expectedAuthVersion) return null
        user.passwordHash = passwordHash
        user.authVersion += 1
        return { ...user }
      }
      return null
    },

    async create({ name, email, passwordHash }) {
      // Check and insert without an await so concurrent requests cannot overwrite a user.
      if (usersByEmail.has(email)) throw new DuplicateEmailError()
      const user = { id: randomUUID(), name, email, passwordHash, authVersion: 0, createdAt: new Date().toISOString() }
      usersByEmail.set(email, user)
      return { ...user }
    },
  }
}
