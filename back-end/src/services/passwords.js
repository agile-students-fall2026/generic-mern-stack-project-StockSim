import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const deriveKey = promisify(scrypt)
// OWASP scrypt settings: N=2^15, r=8, p=3 (32 MiB of memory).
const options = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 }

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const key = await deriveKey(password, salt, 64, options)
  return ['scrypt', options.N, options.r, options.p, salt, key.toString('hex')].join('$')
}

export async function verifyPassword(password, encoded) {
  if (typeof password !== 'string' || typeof encoded !== 'string') return false
  // Only accept our known work factors; corrupted records cannot request unbounded work.
  const match = encoded.match(/^scrypt\$32768\$8\$3\$([0-9a-f]{32})\$([0-9a-f]{128})$/)
  if (!match) return false
  const [, salt, hash] = match
  const key = await deriveKey(password, salt, 64, options)
  return timingSafeEqual(key, Buffer.from(hash, 'hex'))
}
