import { describe, expect, it } from 'vitest'
import { formatDbLastWrite } from './dbActivityDisplay'

describe('formatDbLastWrite', () => {
  it('formats an ISO timestamp for es and en', () => {
    const iso = "2026-09-24T12:00:00.000Z"
    expect(formatDbLastWrite(iso, "es")).toMatch(/2026/)
    expect(formatDbLastWrite(iso, "en")).toMatch(/2026/)
    expect(formatDbLastWrite('', 'es')).toBe(null)
    expect(formatDbLastWrite('nope', 'es')).toBe(null)
  })
})
