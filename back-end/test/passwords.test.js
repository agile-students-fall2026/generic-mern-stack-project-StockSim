import { scrypt } from 'node:crypto'
import { promisify } from 'node:util'
import { describe, it } from 'mocha'
import { expect } from 'chai'
import { hashPassword, verifyPassword } from '../src/services/passwords.js'

const deriveKey = promisify(scrypt)

describe('Password hashing', () => {
  it('uses a new random salt for the same password', async () => {
    const first = await hashPassword('practice-password')
    const second = await hashPassword('practice-password')

    expect(first).not.to.equal(second)
    expect(first).to.match(/^scrypt\$32768\$8\$3\$[0-9a-f]{32}\$[0-9a-f]{128}$/)
    expect(first).not.to.include('practice-password')
  })

  it('hashes the exact password, including surrounding spaces', async () => {
    const password = '  practice-password  '
    const encoded = await hashPassword(password)
    const [, n, r, p, salt, hash] = encoded.split('$')
    const options = { N: Number(n), r: Number(r), p: Number(p), maxmem: 64 * 1024 * 1024 }
    const expected = await deriveKey(password, salt, 64, options)
    const trimmed = await deriveKey(password.trim(), salt, 64, options)

    expect(hash).to.equal(expected.toString('hex'))
    expect(hash).not.to.equal(trimmed.toString('hex'))
  })
})

describe('Password verification', () => {
  it('accepts only the original password and preserves surrounding spaces', async () => {
    const hash = await hashPassword('  practice-password  ')
    expect(await verifyPassword('  practice-password  ', hash)).to.equal(true)
    expect(await verifyPassword('practice-password', hash)).to.equal(false)
    expect(await verifyPassword('wrong-password', hash)).to.equal(false)
  })

  it('rejects missing, corrupt, and unsupported hashes without trusting their work factors', async () => {
    for (const hash of [undefined, '', 'not-a-hash', 'scrypt$999999999999$8$3$salt$hash']) {
      expect(await verifyPassword('password', hash)).to.equal(false)
    }
    expect(await verifyPassword(undefined, 'hash')).to.equal(false)
  })
})
