import type Database from 'better-sqlite3'
import type { DbFilter, DbOrder, DbRequest, DbResponse } from '../shared/types'

const ALLOWED_TABLES = new Set([
  'Muestras',
  'Lectura',
  'Marcado',
  'Lecturas_Marcado',
  'Chips',
  'DChips',
  'DDx',
  'DMuestra',
  'Tags',
  'Muestra_Tags',
  'Preselect',
  'profiles',
  'users'
])

/** Embeds PostgREST → JOIN (relación inferencial del esquema online). */
const EMBEDS: Record<
  string,
  Record<string, { table: string; localKey: string; foreignKey: string; columns: string[] }>
> = {
  Muestras: {
    DDx: { table: 'DDx', localKey: 'Dx', foreignKey: 'Cod', columns: ['Dx'] },
    DMuestra: {
      table: 'DMuestra',
      localKey: 'Muestra',
      foreignKey: 'Cod',
      columns: ['TipoMuestra']
    }
  },
  Preselect: {
    DDx: { table: 'DDx', localKey: 'Dx_Preselect', foreignKey: 'Cod', columns: ['Dx'] }
  },
  Muestra_Tags: {
    Tags: {
      table: 'Tags',
      localKey: 'Tag_Number',
      foreignKey: 'Tag_Number',
      columns: ['Tag_Name', 'Tag_Color']
    }
  }
}

function quoteId(id: string): string {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(id)) {
    throw new Error(`Identificador no permitido: ${id}`)
  }
  return `"${id}"`
}

function parseSelect(select: string | undefined): {
  star: boolean
  columns: string[]
  embeds: string[]
} {
  if (!select || select.trim() === '*' || select.trim() === '') {
    return { star: true, columns: [], embeds: [] }
  }
  const embeds: string[] = []
  const columns: string[] = []
  let star = false
  // Divide por comas fuera de paréntesis
  const parts: string[] = []
  let buf = ''
  let depth = 0
  for (const ch of select) {
    if (ch === '(') depth++
    if (ch === ')') depth = Math.max(0, depth - 1)
    if (ch === ',' && depth === 0) {
      parts.push(buf.trim())
      buf = ''
    } else {
      buf += ch
    }
  }
  if (buf.trim()) parts.push(buf.trim())

  for (const part of parts) {
    if (part === '*') {
      star = true
      continue
    }
    const embedMatch = part.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)$/)
    if (embedMatch) {
      embeds.push(embedMatch[1])
      continue
    }
    columns.push(part.replace(/\s+/g, ''))
  }
  return { star, columns, embeds }
}

function applyMediaLectura(row: Record<string, unknown>): void {
  const izq = Number(row.Izq)
  const cen = Number(row.Cen)
  const dcha = Number(row.Dcha)
  if (![izq, cen, dcha].every((n) => Number.isFinite(n))) return
  const media = (izq + cen + dcha) / 3
  const sd = Math.sqrt(((izq - media) ** 2 + (cen - media) ** 2 + (dcha - media) ** 2) / 3)
  row.Media_Lectura = media
  row.SD_Lectura = sd
  row.CV_Lectura = media === 0 ? null : sd / media
}

function applyMediaLm(row: Record<string, unknown>): void {
  const izq = Number(row.Izq_LM)
  const dcha = Number(row.Dcha_LM)
  if (![izq, dcha].every((n) => Number.isFinite(n))) return
  const media = (izq + dcha) / 2
  const sd = Math.sqrt(((izq - media) ** 2 + (dcha - media) ** 2) / 2)
  row.Media_LM = media
  row.SD_LM = sd
  row.CV_LM = media === 0 ? null : sd / media
}

function enrichRow(table: string, row: Record<string, unknown>): Record<string, unknown> {
  const next = { ...row }
  if (table === 'Lectura') applyMediaLectura(next)
  if (table === 'Lecturas_Marcado') applyMediaLm(next)
  return next
}

function buildWhere(
  filters: DbFilter[] | undefined,
  alias: string
): { sql: string; params: unknown[] } {
  if (!filters?.length) return { sql: '', params: [] }
  const parts: string[] = []
  const params: unknown[] = []
  for (const f of filters) {
    const col = `${alias}.${quoteId(f.column)}`
    if (f.type === 'eq') {
      parts.push(`${col} = ?`)
      params.push(f.value)
    } else if (f.type === 'neq') {
      parts.push(`${col} != ?`)
      params.push(f.value)
    } else if (f.type === 'is') {
      parts.push(`${col} IS NULL`)
    } else if (f.type === 'in') {
      const vals = f.value ?? []
      if (vals.length === 0) {
        parts.push('0 = 1')
      } else {
        parts.push(`${col} IN (${vals.map(() => '?').join(',')})`)
        params.push(...vals)
      }
    }
  }
  return { sql: ` WHERE ${parts.join(' AND ')}`, params }
}

function buildOrder(order: DbOrder[] | undefined, alias: string): string {
  if (!order?.length) return ''
  return (
    ' ORDER BY ' +
    order
      .map((o) => `${alias}.${quoteId(o.column)} ${o.ascending ? 'ASC' : 'DESC'}`)
      .join(', ')
  )
}

function attachEmbeds(
  db: Database.Database,
  table: string,
  rows: Record<string, unknown>[],
  embedNames: string[]
): void {
  const tableEmbeds = EMBEDS[table]
  if (!tableEmbeds || !embedNames.length || !rows.length) return

  for (const name of embedNames) {
    const emb = tableEmbeds[name]
    if (!emb) continue
    const keys = [...new Set(rows.map((r) => r[emb.localKey]).filter((v) => v != null))]
    if (keys.length === 0) {
      for (const r of rows) r[name] = null
      continue
    }
    const placeholders = keys.map(() => '?').join(',')
    const cols = emb.columns.map(quoteId).join(', ')
    const fk = quoteId(emb.foreignKey)
    const related = db
      .prepare(
        `SELECT ${fk} AS __fk, ${cols} FROM ${quoteId(emb.table)} WHERE ${fk} IN (${placeholders})`
      )
      .all(...keys) as Array<Record<string, unknown>>
    const map = new Map<unknown, Record<string, unknown>>()
    for (const rel of related) {
      const { __fk, ...rest } = rel
      map.set(__fk, rest)
    }
    for (const r of rows) {
      const key = r[emb.localKey]
      r[name] = key == null ? null : map.get(key) ?? null
    }
  }
}

function tableColumns(db: Database.Database, table: string): string[] {
  const info = db.prepare(`PRAGMA table_info(${quoteId(table)})`).all() as Array<{ name: string }>
  return info.map((c) => c.name)
}

function ok(data: unknown): DbResponse {
  return { data, error: null }
}

function fail(message: string): DbResponse {
  return { data: null, error: { message } }
}

export function executeDbRequest(db: Database.Database, req: DbRequest): DbResponse {
  try {
    if (!ALLOWED_TABLES.has(req.table)) {
      return fail(`Tabla no permitida: ${req.table}`)
    }
    // profiles es vista de solo lectura
    if (req.table === 'profiles' && req.action !== 'select') {
      return fail('profiles es de solo lectura; use auth para gestionar usuarios')
    }
    if (req.table === 'users') {
      return fail('Acceso directo a users no permitido')
    }

    const alias = 't'
    const { sql: whereSql, params: whereParams } = buildWhere(req.filters, alias)
    const orderSql = buildOrder(req.order, alias)

    if (req.action === 'select') {
      const parsed = parseSelect(req.select)
      const rows = db
        .prepare(`SELECT ${alias}.* FROM ${quoteId(req.table)} ${alias}${whereSql}${orderSql}`)
        .all(...whereParams) as Record<string, unknown>[]
      attachEmbeds(db, req.table, rows, parsed.embeds)
      if (!parsed.star && parsed.columns.length) {
        const keep = new Set([...parsed.columns, ...parsed.embeds])
        for (let i = 0; i < rows.length; i++) {
          const slim: Record<string, unknown> = {}
          for (const k of Object.keys(rows[i])) {
            if (keep.has(k)) slim[k] = rows[i][k]
          }
          rows[i] = slim
        }
      }
      return ok(rows)
    }

    if (req.action === 'insert') {
      const rowsIn = Array.isArray(req.data) ? req.data : req.data ? [req.data] : []
      if (!rowsIn.length) return fail('insert sin datos')
      const cols = tableColumns(db, req.table)
      const inserted: Record<string, unknown>[] = []
      const tx = db.transaction(() => {
        for (const raw of rowsIn) {
          const row = enrichRow(req.table, raw)
          const keys = Object.keys(row).filter((k) => cols.includes(k) && row[k] !== undefined)
          if (!keys.length) throw new Error('Fila vacía')
          const sql = `INSERT INTO ${quoteId(req.table)} (${keys.map(quoteId).join(',')})
                       VALUES (${keys.map(() => '?').join(',')})`
          const info = db.prepare(sql).run(...keys.map((k) => row[k]))
          // Para AUTOINCREMENT (Tags, DChips), rellenar PK si faltaba
          if (req.table === 'Tags' && row.Tag_Number == null) {
            row.Tag_Number = Number(info.lastInsertRowid)
          }
          if (req.table === 'DChips' && row.NumChip_D == null) {
            row.NumChip_D = Number(info.lastInsertRowid)
          }
          inserted.push(row)
        }
      })
      tx()
      return ok(Array.isArray(req.data) ? inserted : inserted[0])
    }

    if (req.action === 'update') {
      if (!req.data || Array.isArray(req.data)) return fail('update requiere un objeto')
      if (!req.filters?.length) return fail('update sin filtro rechazado')
      const row = enrichRow(req.table, req.data)
      const cols = tableColumns(db, req.table)
      const keys = Object.keys(row).filter((k) => cols.includes(k) && row[k] !== undefined)
      if (!keys.length) return fail('update sin columnas')
      const parts: string[] = []
      const params: unknown[] = keys.map((k) => row[k])
      for (const f of req.filters) {
        if (f.type === 'eq') {
          parts.push(`${quoteId(f.column)} = ?`)
          params.push(f.value)
        } else if (f.type === 'neq') {
          parts.push(`${quoteId(f.column)} != ?`)
          params.push(f.value)
        } else if (f.type === 'is') {
          parts.push(`${quoteId(f.column)} IS NULL`)
        } else if (f.type === 'in') {
          const vals = f.value ?? []
          if (!vals.length) parts.push('0 = 1')
          else {
            parts.push(`${quoteId(f.column)} IN (${vals.map(() => '?').join(',')})`)
            params.push(...vals)
          }
        }
      }
      db.prepare(
        `UPDATE ${quoteId(req.table)} SET ${keys.map((k) => `${quoteId(k)} = ?`).join(', ')} WHERE ${parts.join(' AND ')}`
      ).run(...params)
      const updated = db
        .prepare(`SELECT * FROM ${quoteId(req.table)} WHERE ${parts.join(' AND ')}`)
        .all(...params.slice(keys.length)) as Record<string, unknown>[]
      return ok(updated)
    }

    if (req.action === 'delete') {
      if (!req.filters?.length) return fail('delete sin filtro rechazado')
      const parts: string[] = []
      const params: unknown[] = []
      for (const f of req.filters) {
        if (f.type === 'eq') {
          parts.push(`${quoteId(f.column)} = ?`)
          params.push(f.value)
        } else if (f.type === 'in') {
          const vals = f.value ?? []
          if (!vals.length) parts.push('0 = 1')
          else {
            parts.push(`${quoteId(f.column)} IN (${vals.map(() => '?').join(',')})`)
            params.push(...vals)
          }
        } else if (f.type === 'is') {
          parts.push(`${quoteId(f.column)} IS NULL`)
        } else if (f.type === 'neq') {
          parts.push(`${quoteId(f.column)} != ?`)
          params.push(f.value)
        }
      }
      db.prepare(`DELETE FROM ${quoteId(req.table)} WHERE ${parts.join(' AND ')}`).run(...params)
      return ok(null)
    }

    if (req.action === 'upsert') {
      const rowsIn = Array.isArray(req.data) ? req.data : req.data ? [req.data] : []
      if (!rowsIn.length) return fail('upsert sin datos')
      const cols = tableColumns(db, req.table)
      const pkInfo = db.prepare(`PRAGMA table_info(${quoteId(req.table)})`).all() as Array<{
        name: string
        pk: number
      }>
      const pkCols = pkInfo.filter((c) => c.pk > 0).sort((a, b) => a.pk - b.pk).map((c) => c.name)
      const conflict = (req.onConflict ? req.onConflict.split(',') : pkCols).map((s) => s.trim())
      const upserted: Record<string, unknown>[] = []
      const tx = db.transaction(() => {
        for (const raw of rowsIn) {
          const row = enrichRow(req.table, raw)
          const keys = Object.keys(row).filter((k) => cols.includes(k) && row[k] !== undefined)
          const updateKeys = keys.filter((k) => !conflict.includes(k))
          const sql = `INSERT INTO ${quoteId(req.table)} (${keys.map(quoteId).join(',')})
                       VALUES (${keys.map(() => '?').join(',')})
                       ON CONFLICT(${conflict.map(quoteId).join(',')})
                       DO UPDATE SET ${
                         updateKeys.length
                           ? updateKeys.map((k) => `${quoteId(k)} = excluded.${quoteId(k)}`).join(', ')
                           : `${quoteId(conflict[0])} = ${quoteId(conflict[0])}`
                       }`
          db.prepare(sql).run(...keys.map((k) => row[k]))
          upserted.push(row)
        }
      })
      tx()
      return ok(Array.isArray(req.data) ? upserted : upserted[0])
    }

    return fail(`Acción no soportada: ${req.action}`)
  } catch (err) {
    return fail(err instanceof Error ? err.message : String(err))
  }
}
