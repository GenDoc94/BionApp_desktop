import fs from 'fs'
import path from 'path'
import { dialog, BrowserWindow } from 'electron'
import type Database from 'better-sqlite3'
import JSZip from 'jszip'
import * as XLSX from 'xlsx'
import { dbPathFor } from './db'
import { EXPORT_TABLES, stamp, type TableDump } from '../shared/exportTables'
import { mt } from './i18n'
import type { ExportFormat } from '../shared/types'

function collectDump(db: Database.Database): TableDump {
  const dump: TableDump = {}
  for (const table of EXPORT_TABLES) {
    try {
      dump[table] = db.prepare(`SELECT * FROM "${table}"`).all() as Record<string, unknown>[]
    } catch {
      dump[table] = []
    }
  }
  return dump
}

async function buildExcelZip(dump: TableDump): Promise<Buffer> {
  const zip = new JSZip()
  for (const [name, rows] of Object.entries(dump)) {
    const wb = XLSX.utils.book_new()
    const ws = rows.length
      ? XLSX.utils.json_to_sheet(rows)
      : XLSX.utils.aoa_to_sheet([[mt('emptySheet')]])
    XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31))
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer
    zip.file(`${name}.xlsx`, buf)
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

export async function exportDatabase(
  db: Database.Database,
  dataPath: string,
  format: ExportFormat,
  parent?: BrowserWindow | null
): Promise<{ ok: true; path: string } | { ok: false; canceled?: boolean; error?: string }> {
  const ts = stamp()
  const filters =
    format === 'sqlite'
      ? [{ name: 'SQLite', extensions: ['sqlite'] }]
      : [{ name: 'ZIP', extensions: ['zip'] }]
  const defaultName =
    format === 'xlsx'
      ? `BionApp_excel_${ts}.zip`
      : format === 'json'
        ? `BionApp_json_${ts}.zip`
        : `BionApp_${ts}.sqlite`

  const saveOpts = {
    title: mt('exportDialog'),
    defaultPath: defaultName,
    filters
  }
  const result = parent
    ? await dialog.showSaveDialog(parent, saveOpts)
    : await dialog.showSaveDialog(saveOpts)
  if (result.canceled || !result.filePath) {
    return { ok: false, canceled: true }
  }

  let dest = result.filePath
  if (format === 'sqlite' && !dest.toLowerCase().endsWith('.sqlite')) {
    dest += '.sqlite'
  }
  if ((format === 'xlsx' || format === 'json') && !dest.toLowerCase().endsWith('.zip')) {
    dest += '.zip'
  }

  try {
    if (format === 'sqlite') {
      // Vaciar WAL para copiar un .sqlite coherente
      try {
        db.pragma('wal_checkpoint(TRUNCATE)')
      } catch {
        /* ignore */
      }
      const src = dbPathFor(dataPath)
      fs.copyFileSync(src, dest)
      return { ok: true, path: dest }
    }

    const dump = collectDump(db)
    const buf = format === 'xlsx' ? await buildExcelZip(dump) : await buildJsonZip(dump)
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.writeFileSync(dest, buf)
    return { ok: true, path: dest }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}
