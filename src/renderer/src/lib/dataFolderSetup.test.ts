import { describe, expect, it } from 'vitest'
import { setupNeedsNewAdminCode } from './dataFolderSetup'

describe('setupNeedsNewAdminCode', () => {
  it('is false until a folder has been inspected', () => {
    expect(setupNeedsNewAdminCode(null)).toBe(false)
  })

  it('is true only for a folder without bionapp.sqlite', () => {
    expect(
      setupNeedsNewAdminCode({
        sqliteExists: false,
        hasAdminCode: false,
        needsNewAdminCode: true
      })
    ).toBe(true)
    expect(
      setupNeedsNewAdminCode({
        sqliteExists: true,
        hasAdminCode: true,
        needsNewAdminCode: false
      })
    ).toBe(false)
  })
})
