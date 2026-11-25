import { randomUUID } from 'node:crypto'
import mongoose from 'mongoose'
import { DuplicateEmailError } from './memoryUserStore.js'

export async function connectAccountStore(uri) {
  const connection = mongoose.createConnection(uri, { serverSelectionTimeoutMS: 5000 })
  try {
    await connection.asPromise()
    const schema = new mongoose.Schema({
      _id: String,
      name: { type: String, required: true },
      email: { type: String, required: true, unique: true },
      passwordHash: { type: String, required: true },
      authVersion: { type: Number, default: 0 },
      createdAt: { type: String, required: true },
      watchlist: { type: [String], default: [] },
    }, { versionKey: false })
    const Account = connection.model('Account', schema, 'accounts')
    await Account.init()
    return { ...accountAdapters(Account), close: () => connection.close() }
  } catch (error) {
    await connection.close()
    throw error
  }
}

function asUser(account) {
  if (!account) return null
  const { _id, name, email, passwordHash, authVersion, createdAt } = account
  return { id: _id, name, email, passwordHash, authVersion, createdAt }
}

export function accountAdapters(Account) {
  return {
    userStore: {
      async findByEmail(email) { return asUser(await Account.findOne({ email }).lean()) },
      async findById(id) { return asUser(await Account.findById(id).lean()) },
      async updatePassword(id, passwordHash, expectedAuthVersion) {
        return asUser(await Account.findOneAndUpdate(
          { _id: id, authVersion: expectedAuthVersion },
          { $set: { passwordHash }, $inc: { authVersion: 1 } },
          { returnDocument: 'after' },
        ).lean())
      },
      async create({ name, email, passwordHash }) {
        try {
          return asUser(await Account.create({ _id: randomUUID(), name, email, passwordHash, createdAt: new Date().toISOString() }))
        } catch (error) {
          if (error.code === 11000 && error.keyPattern?.email === 1) throw new DuplicateEmailError()
          throw error
        }
      },
    },
    watchlistStore: {
      async list(userId) {
        const account = await Account.findById(userId).select('watchlist').lean()
        return account?.watchlist || []
      },
      async add(userId, symbol, limit) {
        // One atomic update enforces both the cap and duplicate protection.
        const result = await Account.updateOne(
          { _id: userId, watchlist: { $ne: symbol }, [`watchlist.${limit - 1}`]: { $exists: false } },
          { $addToSet: { watchlist: symbol } },
        )
        if (result.modifiedCount) return 'added'
        return await Account.exists({ _id: userId, watchlist: symbol }) ? 'exists' : 'full'
      },
      async remove(userId, symbol) {
        await Account.updateOne({ _id: userId }, { $pull: { watchlist: symbol } })
      },
    },
  }
}
