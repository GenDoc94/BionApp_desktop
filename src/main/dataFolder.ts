import fs from 'fs'
import Database from 'better-sqlite3'
import { dbPathFor } from './db'
import { hasAdminCode } from './auth'
import type { DataFolderInspection } from '../shared/types'

function emptyInspection(): DataFolderInspection {
  return { sqliteExists: false, hasAdminCode: false, needsNewAdminCode: true }
}

function existingInspection(hasCode: boolean): DataFolderInspection {
  return { sqliteExists: true, hasAdminCode: hasCode, needsNewAdminCode: false }
}

export function sqliteExistsInFolder(dataPath: string): boolean {
  const dir = String(dataPath ?? '').trim()
  return Boolean(dir && fs.existsSync(dbPathFor(dir)))
}

/** Mira la carpeta sin abrirla como base activa: no crea ni sustituye bionapp.sqlite. */
export function inspectDataFolder(dataPath: string): DataFolderInspection {
  if (!sqliteExistsInFolder(dataPath)) {
    return emptyInspection()
  }

  let probe: Database.Database | null = null
  try {
    probe = new Database(dbPathFor(dataPath), { fileMustExist: true, readonly: true })
    let hasCode = false
    try {
      hasCode = hasAdminCode(probe)
    } catch {
      hasCode = false
    }
    return existingInspection(hasCode)
  } catch {
    // El archivo existe pero no se pudo leer (bloqueado, red, etc.): no pedir un código nuevo.
    return existingInspection(true)
  } finally {
    try {
      probe?.close()
    } catch {
      /* ignore */
    }
  }
}
