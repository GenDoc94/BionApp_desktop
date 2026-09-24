import { describe, expect, it } from 'vitest'
import { laterIso, nowIso } from './dbActivity'

describe('laterIso', () => {
  it('returns the later timestamp', () => {
    expect(laterIso('2026-09-18T10:00:00.000Z', '2026-09-24T08:00:00.000Z')).toBe(
      '2026-09-24T08:00:00.000Z'
    )
    expect(laterIso(null, '2026-09-24T08:00:00.000Z')).toBe('2026-09-24T08:00:00.000Z')
    expect(laterIso('2026-09-24T08:00:00.000Z', '')).toBe('2026-09-24T08:00:00.000Z')
  })
})

describe('nowIso', () => {
  it('serializes the given date', () => {
    expect(nowIso(new Date('2026-09-24T07:39:00.000Z'))).toBe('2026-09-24T07:39:00.000Z')
  })
})
