import { randomBytes, scrypt } from 'node:crypto'
import { promisify } from 'node:util'

const deriveKey = promisify(scrypt)
// OWASP scrypt settings: N=2^15, r=8, p=3 (32 MiB of memory).
const options = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 }

export async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const key = await deriveKey(password, salt, 64, options)
  return ['scrypt', options.N, options.r, options.p, salt, key.toString('hex')].join('$')
}
