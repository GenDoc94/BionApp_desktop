import fs from 'fs'
import type Database from 'better-sqlite3'
import { dbPathFor, getMeta, setMeta } from './db'

export const LAST_WRITE_META = 'last_write_at'

export type DbActivity = {
  lastWriteAt: string | null
  dataPath: string | null
}

export function nowIso(now = new Date()): string {
  return now.toISOString()
}

export function laterIso(a: string | null | undefined, b: string | null | undefined): string | null {
  const left = String(a ?? '').trim() || null
  const right = String(b ?? '').trim() || null
  if (!left) return right
  if (!right) return left
  const ta = Date.parse(left)
  const tb = Date.parse(right)
  if (!Number.isFinite(ta)) return Number.isFinite(tb) ? right : left
  if (!Number.isFinite(tb)) return left
  return ta >= tb ? left : right
}

export function dataDirMtimeMs(dataPath: string): number {
  const base = dbPathFor(dataPath)
  let max = 0
  for (const file of [base, `${base}-wal`, `${base}-shm`]) {
    try {
      if (fs.existsSync(file)) max = Math.max(max, fs.statSync(file).mtimeMs)
    } catch {
      /* ignore */
    }
  }
  return max
}

export function dataDirMtimeIso(dataPath: string | null | undefined): string | null {
  if (!dataPath) return null
  const ms = dataDirMtimeMs(dataPath)
  return ms > 0 ? new Date(ms).toISOString() : null
}

export function touchLastWrite(db: Database.Database, now = new Date()): string {
  const iso = nowIso(now)
  setMeta(db, LAST_WRITE_META, iso)
  return iso
}

export function readLastWriteIso(
  db: Database.Database | null,
  dataPath: string | null
): string | null {
  let metaIso: string | null = null
  if (db) {
    try {
      metaIso = getMeta(db, LAST_WRITE_META)
    } catch {
      metaIso = null
    }
  }
  return laterIso(metaIso, dataDirMtimeIso(dataPath))
}
