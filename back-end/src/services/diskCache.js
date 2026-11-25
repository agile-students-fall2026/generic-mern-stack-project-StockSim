import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

export function createDiskCache(file, limit = 100) {
  let entries = null

  function all() {
    if (entries) return entries
    try {
      entries = JSON.parse(readFileSync(file, 'utf8'))
    } catch {
      entries = null
    }
    if (!entries || typeof entries !== 'object' || Array.isArray(entries)) entries = {}
    return entries
  }

  return {
    get(key) {
      const entry = Object.hasOwn(all(), key) ? all()[key] : null
      return entry && typeof entry.expires === 'number' ? entry : undefined
    },
    set(key, entry) {
      const saved = all()
      saved[key] = entry
      const keys = Object.keys(saved)
      for (const old of keys.slice(0, Math.max(0, keys.length - limit))) delete saved[old]
      try {
        mkdirSync(dirname(file), { recursive: true })
        writeFileSync(`${file}.tmp`, JSON.stringify(saved))
        renameSync(`${file}.tmp`, file)
      } catch {
        // The saved copy is only a convenience, so a write problem must not break a request.
      }
    },
  }
}
