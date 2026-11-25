import { describe, it } from 'mocha'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createDiskCache } from '../src/services/diskCache.js'

describe('Disk cache', () => {
  it('keeps entries across new cache objects that use the same file', () => {
    const file = join(mkdtempSync(join(tmpdir(), 'stocksim-')), 'nested', 'quotes.json')
    createDiskCache(file).set('AAPL', { value: { price: 1 }, expires: 5 })
    assert.deepEqual(createDiskCache(file).get('AAPL'), { value: { price: 1 }, expires: 5 })
    assert.equal(createDiskCache(file).get('MSFT'), undefined)
  })

  it('ignores a damaged file, inherited keys and entries without an expiry', () => {
    const file = join(mkdtempSync(join(tmpdir(), 'stocksim-')), 'quotes.json')
    writeFileSync(file, '{not json')
    const cache = createDiskCache(file)
    assert.equal(cache.get('AAPL'), undefined)
    assert.equal(cache.get('constructor'), undefined)
    cache.set('AAPL', { value: 1 })
    assert.equal(cache.get('AAPL'), undefined)
  })

  it('keeps only the newest entries up to the limit', () => {
    const file = join(mkdtempSync(join(tmpdir(), 'stocksim-')), 'quotes.json')
    const cache = createDiskCache(file, 2)
    for (const key of ['A', 'B', 'C']) cache.set(key, { value: key, expires: 1 })
    assert.equal(createDiskCache(file, 2).get('A'), undefined)
    assert.equal(createDiskCache(file, 2).get('C').value, 'C')
  })
})