import fs from 'fs'
import path from 'path'
import { dialog, BrowserWindow } from 'electron'
import Database from 'better-sqlite3'
import JSZip from 'jszip'
import * as XLSX from 'xlsx'
import { dbPathFor } from './db'
import {
  EXPORT_TABLES,
  areAllExportTables,
  defaultExportFileName,
  exportOutputKind,
  sanitizeExportTables,
  stamp,
  type ExportTableName,
  type TableDump
} from '../shared/exportTables'
import { mt } from './i18n'
import type { ExportFormat } from '../shared/types'

function collectDump(db: Database.Database, tables: readonly ExportTableName[]): TableDump {
  const dump: TableDump = {}
  for (const table of tables) {
    try {
      dump[table] = db.prepare(`SELECT * FROM "${table}"`).all() as Record<string, unknown>[]
    } catch {
      dump[table] = []
    }
  }
  return dump
}

function workbookForTable(name: string, rows: Record<string, unknown>[]): Buffer {
  const wb = XLSX.utils.book_new()
  const ws = rows.length
    ? XLSX.utils.json_to_sheet(rows)
    : XLSX.utils.aoa_to_sheet([[mt('emptySheet')]])
  XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31))
  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
}

async function buildExcelZip(dump: TableDump): Promise<Buffer> {
  const zip = new JSZip()
  for (const [name, rows] of Object.entries(dump)) {
    zip.file(`${name}.xlsx`, workbookForTable(name, rows))
  }
  return Buffer.from(await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }))
}

async function buildJsonZip(dump: TableDump): Promise<Buffer> {
  const zip = new JSZip()
  for (const [name, rows] of Object.entries(dump)) {
    zip.file(`${name}.json`, JSON.stringify(rows, null, 2))
  }
  return Buffer.from(await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }))
}

function quoteIdent(name: string): string {
  return `"${name.replace(/"/g, '""')}"`
}

function copySelectedTablesToSqlite(
  src: Database.Database,
  destPath: string,
  tables: readonly ExportTableName[]
): void {
  if (fs.existsSync(destPath)) fs.unlinkSync(destPath)
  const dest = new Database(destPath)
  try {
    dest.pragma('journal_mode = DELETE')
    dest.pragma('foreign_keys = OFF')
    dest.exec('BEGIN')
    for (const table of tables) {
      const create = src
        .prepare(`SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?`)
        .get(table) as { sql: string } | undefined
      if (!create?.sql) continue
      dest.exec(create.sql)
      const rows = src.prepare(`SELECT * FROM ${quoteIdent(table)}`).all() as Record<
        string,
        unknown
      >[]
      if (rows.length) {
        const cols = Object.keys(rows[0])
        const quoted = cols.map(quoteIdent).join(',')
        const placeholders = cols.map(() => '?').join(',')
        const ins = dest.prepare(
          `INSERT INTO ${quoteIdent(table)} (${quoted}) VALUES (${placeholders})`
        )
        const insertAll = dest.transaction((items: Record<string, unknown>[]) => {
          for (const row of items) ins.run(...cols.map((col) => row[col]))
        })
        insertAll(rows)
      }
      const extras = src
        .prepare(
          `SELECT sql FROM sqlite_master WHERE tbl_name = ? AND type IN ('index', 'trigger') AND sql IS NOT NULL`
        )
        .all(table) as Array<{ sql: string }>
      for (const extra of extras) {
        try {
          dest.exec(extra.sql)
        } catch {
          /* skip duplicate or unavailable extras */
        }
      }
    }
    dest.exec('COMMIT')
  } catch (e) {
    try {
      dest.exec('ROLLBACK')
    } catch {
      /* ignore */
    }
    dest.close()
    try {
      fs.unlinkSync(destPath)
    } catch {
      /* ignore */
    }
    throw e
  }
  dest.close()
}

function ensureExtension(filePath: string, ext: string): string {
  const suffix = `.${ext}`
  return filePath.toLowerCase().endsWith(suffix) ? filePath : `${filePath}${suffix}`
}

export async function exportDatabase(
  db: Database.Database,
  dataPath: string,
  format: ExportFormat,
  tablesInput: unknown,
  parent?: BrowserWindow | null
): Promise<{ ok: true; path: string } | { ok: false; canceled?: boolean; error?: string }> {
  if (format !== 'xlsx' && format !== 'json' && format !== 'sqlite') {
    return { ok: false, error: 'Formato no soportado' }
  }
  const tables = sanitizeExportTables(tablesInput ?? [...EXPORT_TABLES])
  if (tables.length === 0) {
    return { ok: false, error: 'Selecciona al menos una tabla' }
  }

  const ts = stamp()
  const file = defaultExportFileName(format, tables, ts)
  const kind = exportOutputKind(format, tables)
  const saveOpts = {
    title: mt('exportDialog'),
    defaultPath: file.name,
    filters: [{ name: file.extensions[0].toUpperCase(), extensions: file.extensions }]
  }
  const result = parent
    ? await dialog.showSaveDialog(parent, saveOpts)
    : await dialog.showSaveDialog(saveOpts)
  if (result.canceled || !result.filePath) {
    return { ok: false, canceled: true }
  }

  let dest = ensureExtension(result.filePath, file.extensions[0])
  const srcSqlite = path.resolve(dbPathFor(dataPath))
  if (path.resolve(dest) === srcSqlite) {
    return { ok: false, error: 'No se puede exportar sobre la base de datos en uso' }
  }

  try {
    if (format === 'sqlite') {
      try {
        db.pragma('wal_checkpoint(TRUNCATE)')
      } catch {
        /* ignore */
      }
      if (areAllExportTables(tables)) {
        fs.copyFileSync(dbPathFor(dataPath), dest)
        return { ok: true, path: dest }
      }
      copySelectedTablesToSqlite(db, dest, tables)
      return { ok: true, path: dest }
    }

    const dump = collectDump(db, tables)
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    if (kind === 'xlsx') {
      const name = tables[0]
      fs.writeFileSync(dest, workbookForTable(name, dump[name] ?? []))
      return { ok: true, path: dest }
    }
    if (kind === 'json') {
      const name = tables[0]
      fs.writeFileSync(dest, JSON.stringify(dump[name] ?? [], null, 2), 'utf8')
      return { ok: true, path: dest }
    }
    const buf = format === 'xlsx' ? await buildExcelZip(dump) : await buildJsonZip(dump)
    fs.writeFileSync(dest, buf)
    return { ok: true, path: dest }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}
