import fs from 'fs'
import os from 'os'
import path from 'path'
import { afterEach, describe, expect, it } from 'vitest'
import { DB_FILENAME } from './db'
import { inspectDataFolder, sqliteExistsInFolder } from './dataFolder'

const dirs: string[] = []

function tmpDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bionapp-folder-'))
  dirs.push(dir)
  return dir
}

afterEach(() => {
  for (const dir of dirs.splice(0)) {
    try {
      fs.rmSync(dir, { recursive: true, force: true })
    } catch {
      /* ignore */
    }
  }
})

describe('inspectDataFolder', () => {
  it('treats an empty folder as a new database', () => {
    const dir = tmpDir()
    expect(sqliteExistsInFolder(dir)).toBe(false)
    expect(inspectDataFolder(dir)).toEqual({
      sqliteExists: false,
      hasAdminCode: false,
      needsNewAdminCode: true
    })
  })

  it('does not ask for a new master code if bionapp.sqlite is already there', () => {
    const dir = tmpDir()
    fs.writeFileSync(path.join(dir, DB_FILENAME), '')
    expect(sqliteExistsInFolder(dir)).toBe(true)
    const info = inspectDataFolder(dir)
    expect(info.sqliteExists).toBe(true)
    expect(info.needsNewAdminCode).toBe(false)
  })
})
