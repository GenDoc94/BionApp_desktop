import type Database from 'better-sqlite3'

export const LOTE_TABLE = {
  extraido: 'Lotes_Extraido',
  marcado: 'Lotes_Marcado',
  membrana: 'Lotes_Membrana',
  chip: 'Lotes_Chips'
} as const

export const LOTE_ID_COL = {
  extraido: 'Id_LtE',
  marcado: 'Id_LtM',
  membrana: 'Id_LtMm',
  chip: 'Id_LtC'
} as const

const SKIP_MARCADO_MEMBRANA = new Set(['1:1', '1:3', '1:4'])

export function normLotText(value: unknown): string | null {
  if (value == null) return null
  const s = String(value).trim()
  return s === '' ? null : s
}

/** Quita el sufijo de kit "-N" (80060-1 → 80060). */
export function stripPnKitSuffix(pn: string): string {
  const m = pn.match(/^(\d+)-\d+$/)
  return m ? m[1] : pn
}

export function normalizePN(
  value: unknown,
  opts?: { map18606571?: boolean }
): string | null {
  let pn = normLotText(value)
  if (!pn) return null
  if (opts?.map18606571 && pn === '18606571') pn = '80118'
  return stripPnKitSuffix(pn)
}

export function lotKey(pn: string, ln: string, exp: string): string {
  return `${pn}\u0000${ln}\u0000${exp}`
}

export type LoteKind = 'extraido' | 'marcado' | 'membrana' | 'chip'

/** Caducidad canónica (DD/MM/AAAA) cuando el LN está duplicado por formato o error. */
const LOT_EXP_BY_LN: Record<LoteKind, Record<string, string>> = {
  extraido: {
    '250428048': '26/08/2026'
  },
  marcado: {
    '240212010': '19/01/2025',
    '240212011': '16/08/2025',
    '240223012': '17/04/2025',
    '250616051': '30/01/2027'
  },
  membrana: {
    '240123002': '27/07/2026',
    '240208020': '30/01/2027',
    '240209012': '30/01/2026',
    '250506015': '19/05/2028',
    '251125001': '10/12/2028'
  },
  chip: {}
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function parseLotDate(value: unknown): { d: number; m: number; y: number } | null {
  const raw = normLotText(value)
  if (!raw) return null
  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (iso) {
    const y = Number(iso[1])
    const m = Number(iso[2])
    const d = Number(iso[3])
    if (m < 1 || m > 12 || d < 1 || d > 31) return null
    return { d, m, y }
  }
  const parts = raw.replace(/-/g, '/').split('/').map((p) => p.trim())
  if (parts.length !== 3) return null
  const a = Number(parts[0])
  const b = Number(parts[1])
  const c = Number(parts[2])
  if (![a, b, c].every((n) => Number.isInteger(n))) return null
  let day: number
  let month: number
  let year: number
  if (a >= 1000 && a <= 9999) {
    year = a
    month = b
    day = c
  } else {
    year = c
    if (year < 1000 || year > 9999) return null
    if (a > 12 && b >= 1 && b <= 12) {
      day = a
      month = b
    } else if (b > 12 && a >= 1 && a <= 12) {
      day = b
      month = a
    } else {
      day = a
      month = b
    }
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  return { d: day, m: month, y: year }
}

export function formatLotDate(parts: { d: number; m: number; y: number } | null): string | null {
  if (!parts) return null
  return `${pad2(parts.d)}/${pad2(parts.m)}/${parts.y}`
}

export function canonicalizeLotExp(kind: LoteKind, ln: unknown, exp: unknown): string {
  const lnN = normLotText(ln) ?? ''
  const override = lnN ? LOT_EXP_BY_LN[kind][lnN] : undefined
  if (override) return override
  return formatLotDate(parseLotDate(exp)) ?? normLotText(exp) ?? ''
}

export function loteKindFromTable(table: string): LoteKind | null {
  if (table === LOTE_TABLE.extraido) return 'extraido'
  if (table === LOTE_TABLE.marcado) return 'marcado'
  if (table === LOTE_TABLE.membrana) return 'membrana'
  if (table === LOTE_TABLE.chip) return 'chip'
  return null
}

function tableExists(db: Database.Database, table: string): boolean {
  const row = db
    .prepare(`SELECT 1 AS ok FROM sqlite_master WHERE type IN ('table','view') AND name = ?`)
    .get(table) as { ok: number } | undefined
  return !!row
}

export function tableHasColumn(db: Database.Database, table: string, column: string): boolean {
  if (!tableExists(db, table)) return false
  const cols = db.prepare(`PRAGMA table_info("${table}")`).all() as Array<{ name: string }>
  return cols.some((c) => c.name === column)
}

export function findOrCreateLote(
  db: Database.Database,
  table: string,
  idCol: string,
  pn: string,
  ln: string,
  exp: string
): number {
  const existing = db
    .prepare(`SELECT "${idCol}" AS id FROM "${table}" WHERE PN = ? AND LN = ? AND Exp = ?`)
    .get(pn, ln, exp) as { id: number } | undefined
  if (existing?.id != null) return Number(existing.id)
  const info = db
    .prepare(`INSERT INTO "${table}" (PN, LN, Exp) VALUES (?, ?, ?)`)
    .run(pn, ln, exp)
  return Number(info.lastInsertRowid)
}

function loteIdForTriple(
  db: Database.Database,
  table: string,
  idCol: string,
  pn: string | null,
  ln: unknown,
  exp: unknown
): number | null {
  if (!pn) return null
  const kind = loteKindFromTable(table)
  const lnN = normLotText(ln) ?? ''
  const expN = kind ? canonicalizeLotExp(kind, lnN, exp) : (normLotText(exp) ?? '')
  return findOrCreateLote(db, table, idCol, pn, lnN, expN)
}

type LmSource = {
  NumBN_LM: number
  NumLectura_LM: number
  NumLectMarc: number
  PN_LM?: unknown
  LN_LM?: unknown
  Exp_LM?: unknown
  PNM_LM?: unknown
  LNM_LM?: unknown
  ExpM_LM?: unknown
}

export function markingSourceTriples(row: LmSource): {
  marcado: { pn: unknown; ln: unknown; exp: unknown } | null
  membrana: { pn: unknown; ln: unknown; exp: unknown } | null
} {
  const skipKey = `${row.NumBN_LM}:${row.NumLectura_LM}`
  if (SKIP_MARCADO_MEMBRANA.has(skipKey)) {
    return { marcado: null, membrana: null }
  }

  let pn = row.PN_LM
  let ln = row.LN_LM
  let exp = row.Exp_LM
  let pnm = row.PNM_LM
  let lnm = row.LNM_LM
  let expm = row.ExpM_LM

  if (row.NumBN_LM === 72 && row.NumLectura_LM === 2 && Number(row.NumLectMarc) === 1) {
    ;[pn, ln, exp, pnm, lnm, expm] = [pnm, lnm, expm, pn, ln, exp]
  }

  return {
    marcado: { pn, ln, exp },
    membrana: { pn: pnm, ln: lnm, exp: expm }
  }
}

function attachById(
  db: Database.Database,
  rows: Record<string, unknown>[],
  table: string,
  idCol: string,
  mapFields: (lot: { PN: string; LN: string; Exp: string } | null, row: Record<string, unknown>) => void
): void {
  const ids = [
    ...new Set(rows.map((r) => r[idCol]).filter((v) => v != null).map((v) => Number(v)))
  ]
  const lots = new Map<number, { PN: string; LN: string; Exp: string }>()
  if (ids.length) {
    const placeholders = ids.map(() => '?').join(',')
    const found = db
      .prepare(`SELECT "${idCol}" AS id, PN, LN, Exp FROM "${table}" WHERE "${idCol}" IN (${placeholders})`)
      .all(...ids) as Array<{ id: number; PN: string; LN: string; Exp: string }>
    for (const lot of found) lots.set(Number(lot.id), lot)
  }
  for (const row of rows) {
    const id = row[idCol] == null ? null : Number(row[idCol])
    mapFields(id == null ? null : lots.get(id) ?? null, row)
  }
}

export function attachLotFields(db: Database.Database, table: string, rows: Record<string, unknown>[]): void {
  if (!rows.length) return
  if (table === 'Muestras' && tableHasColumn(db, 'Muestras', 'Id_LtE')) {
    attachById(db, rows, LOTE_TABLE.extraido, LOTE_ID_COL.extraido, (lot, row) => {
      row.PN = lot?.PN ?? null
      row.LN = lot?.LN ?? null
      row.Exp = lot?.Exp ?? null
    })
  }
  if (table === 'Lecturas_Marcado' && tableHasColumn(db, 'Lecturas_Marcado', 'Id_LtM')) {
    attachById(db, rows, LOTE_TABLE.marcado, LOTE_ID_COL.marcado, (lot, row) => {
      row.PN_LM = lot?.PN ?? null
      row.LN_LM = lot?.LN ?? null
      row.Exp_LM = lot?.Exp ?? null
    })
    attachById(db, rows, LOTE_TABLE.membrana, LOTE_ID_COL.membrana, (lot, row) => {
      row.PNM_LM = lot?.PN ?? null
      row.LNM_LM = lot?.LN ?? null
      row.ExpM_LM = lot?.Exp ?? null
    })
  }
  if (table === 'DChips' && tableHasColumn(db, 'DChips', 'Id_LtC')) {
    attachById(db, rows, LOTE_TABLE.chip, LOTE_ID_COL.chip, (lot, row) => {
      row.PN = lot?.PN ?? null
      row.LN = lot?.LN ?? null
      row.Exp = lot?.Exp ?? null
    })
  }
}

export function applyLotWrite(
  db: Database.Database,
  table: string,
  row: Record<string, unknown>
): Record<string, unknown> {
  const next = { ...row }
  if (table === 'Muestras' && tableHasColumn(db, 'Muestras', 'Id_LtE')) {
    if ('PN' in next || 'LN' in next || 'Exp' in next) {
      const id = loteIdForTriple(
        db,
        LOTE_TABLE.extraido,
        LOTE_ID_COL.extraido,
        normalizePN(next.PN),
        next.LN,
        next.Exp
      )
      delete next.PN
      delete next.LN
      delete next.Exp
      next.Id_LtE = id
    }
  }
  if (table === 'Lecturas_Marcado' && tableHasColumn(db, 'Lecturas_Marcado', 'Id_LtM')) {
    const hasMarcado = 'PN_LM' in next || 'LN_LM' in next || 'Exp_LM' in next
    const hasMembrana = 'PNM_LM' in next || 'LNM_LM' in next || 'ExpM_LM' in next
    if (hasMarcado) {
      next.Id_LtM = loteIdForTriple(
        db,
        LOTE_TABLE.marcado,
        LOTE_ID_COL.marcado,
        normalizePN(next.PN_LM),
        next.LN_LM,
        next.Exp_LM
      )
      delete next.PN_LM
      delete next.LN_LM
      delete next.Exp_LM
    }
    if (hasMembrana) {
      next.Id_LtMm = loteIdForTriple(
        db,
        LOTE_TABLE.membrana,
        LOTE_ID_COL.membrana,
        normalizePN(next.PNM_LM),
        next.LNM_LM,
        next.ExpM_LM
      )
      delete next.PNM_LM
      delete next.LNM_LM
      delete next.ExpM_LM
    }
  }
  if (table === 'DChips' && tableHasColumn(db, 'DChips', 'Id_LtC')) {
    if ('PN' in next || 'LN' in next || 'Exp' in next) {
      const id = loteIdForTriple(
        db,
        LOTE_TABLE.chip,
        LOTE_ID_COL.chip,
        normalizePN(next.PN),
        next.LN,
        next.Exp
      )
      delete next.PN
      delete next.LN
      delete next.Exp
      next.Id_LtC = id
    }
  }
  if (
    table === LOTE_TABLE.extraido ||
    table === LOTE_TABLE.marcado ||
    table === LOTE_TABLE.membrana ||
    table === LOTE_TABLE.chip
  ) {
    if ('PN' in next) {
      const pn = normalizePN(next.PN)
      if (!pn) throw new Error('PN de lote vacío')
      next.PN = pn
    }
    if ('LN' in next) next.LN = normLotText(next.LN) ?? ''
    if ('Exp' in next) {
      next.Exp = formatLotDate(parseLotDate(next.Exp)) ?? (normLotText(next.Exp) ?? '')
    }
  }
  for (const col of ['PN_M', 'LN_M', 'Exp_M', 'PN_Membrana', 'LN_Membrana', 'Exp_Membrana']) {
    delete next[col]
  }
  return next
}

function dropColumnsIfExist(db: Database.Database, table: string, columns: string[]): void {
  for (const col of columns) {
    if (tableHasColumn(db, table, col)) {
      db.exec(`ALTER TABLE "${table}" DROP COLUMN "${col}"`)
    }
  }
}

function addFkColumnIfMissing(db: Database.Database, table: string, column: string, refTable: string, refCol: string): void {
  if (tableHasColumn(db, table, column)) return
  db.exec(
    `ALTER TABLE "${table}" ADD COLUMN "${column}" INTEGER REFERENCES "${refTable}"("${refCol}") ON UPDATE CASCADE ON DELETE SET NULL`
  )
}

/**
 * Migra PN/LN/Exp denormalizados a catálogos Lotes_* y deja FKs en Muestras / Lecturas_Marcado.
 * Idempotente: si las columnas viejas ya no existen, no hace nada.
 */
export function migrateLegacyLotColumns(db: Database.Database): void {
  const needMuestras = tableHasColumn(db, 'Muestras', 'PN')
  const needLm = tableHasColumn(db, 'Lecturas_Marcado', 'PN_LM')
  const needMarcado = tableHasColumn(db, 'Marcado', 'PN_M') || tableHasColumn(db, 'Marcado', 'PN_Membrana')
  if (!needMuestras && !needLm && !needMarcado) return

  const run = db.transaction(() => {
    if (needMuestras) {
      addFkColumnIfMissing(db, 'Muestras', 'Id_LtE', LOTE_TABLE.extraido, LOTE_ID_COL.extraido)
      const rows = db.prepare(`SELECT NumBN, PN, LN, Exp FROM Muestras`).all() as Array<{
        NumBN: number
        PN: unknown
        LN: unknown
        Exp: unknown
      }>
      const upd = db.prepare(`UPDATE Muestras SET Id_LtE = ? WHERE NumBN = ?`)
      for (const row of rows) {
        const id = loteIdForTriple(
          db,
          LOTE_TABLE.extraido,
          LOTE_ID_COL.extraido,
          normalizePN(row.PN, { map18606571: true }),
          row.LN,
          row.Exp
        )
        upd.run(id, row.NumBN)
      }
      dropColumnsIfExist(db, 'Muestras', ['PN', 'LN', 'Exp'])
    }

    if (needLm) {
      addFkColumnIfMissing(db, 'Lecturas_Marcado', 'Id_LtM', LOTE_TABLE.marcado, LOTE_ID_COL.marcado)
      addFkColumnIfMissing(db, 'Lecturas_Marcado', 'Id_LtMm', LOTE_TABLE.membrana, LOTE_ID_COL.membrana)
      const rows = db
        .prepare(
          `SELECT NumBN_LM, NumLectura_LM, NumLectMarc, PN_LM, LN_LM, Exp_LM, PNM_LM, LNM_LM, ExpM_LM
           FROM Lecturas_Marcado`
        )
        .all() as LmSource[]
      const upd = db.prepare(
        `UPDATE Lecturas_Marcado SET Id_LtM = ?, Id_LtMm = ?
         WHERE NumBN_LM = ? AND NumLectura_LM = ? AND NumLectMarc = ?`
      )
      for (const row of rows) {
        const src = markingSourceTriples(row)
        const idM = src.marcado
          ? loteIdForTriple(
              db,
              LOTE_TABLE.marcado,
              LOTE_ID_COL.marcado,
              normalizePN(src.marcado.pn),
              src.marcado.ln,
              src.marcado.exp
            )
          : null
        const idMm = src.membrana
          ? loteIdForTriple(
              db,
              LOTE_TABLE.membrana,
              LOTE_ID_COL.membrana,
              normalizePN(src.membrana.pn),
              src.membrana.ln,
              src.membrana.exp
            )
          : null
        upd.run(idM, idMm, row.NumBN_LM, row.NumLectura_LM, row.NumLectMarc)
      }
      dropColumnsIfExist(db, 'Lecturas_Marcado', [
        'PN_LM',
        'LN_LM',
        'Exp_LM',
        'PNM_LM',
        'LNM_LM',
        'ExpM_LM'
      ])
    }

    if (needMarcado) {
      dropColumnsIfExist(db, 'Marcado', [
        'PN_M',
        'LN_M',
        'Exp_M',
        'PN_Membrana',
        'LN_Membrana',
        'Exp_Membrana'
      ])
    }
  })
  run()
}

function mergeLotCatalog(
  db: Database.Database,
  table: string,
  idCol: string,
  kind: LoteKind,
  retarget: (fromId: number, toId: number) => void
): void {
  if (!tableExists(db, table)) return
  const rows = db.prepare(`SELECT "${idCol}" AS id, PN, LN, Exp FROM "${table}"`).all() as Array<{
    id: number
    PN: string
    LN: string
    Exp: string
  }>
  const groups = new Map<string, { ids: number[]; exp: string }>()
  for (const row of rows) {
    const exp = canonicalizeLotExp(kind, row.LN, row.Exp)
    const key = lotKey(row.PN, row.LN, exp)
    const group = groups.get(key)
    if (group) group.ids.push(Number(row.id))
    else groups.set(key, { ids: [Number(row.id)], exp })
  }

  const updExp = db.prepare(`UPDATE "${table}" SET Exp = ? WHERE "${idCol}" = ?`)
  const del = db.prepare(`DELETE FROM "${table}" WHERE "${idCol}" = ?`)
  for (const group of groups.values()) {
    const survivor = Math.min(...group.ids)
    for (const id of group.ids) {
      if (id === survivor) continue
      retarget(id, survivor)
      del.run(id)
    }
    updExp.run(group.exp, survivor)
  }
}

/** Unifica caducidades (DD/MM/AAAA, LN duplicados) y fusiona filas equivalentes. Idempotente. */
export function migrateHomogenizeLotExps(db: Database.Database): void {
  if (!tableExists(db, LOTE_TABLE.extraido)) return
  const run = db.transaction(() => {
    mergeLotCatalog(db, LOTE_TABLE.extraido, LOTE_ID_COL.extraido, 'extraido', (fromId, toId) => {
      if (tableHasColumn(db, 'Muestras', 'Id_LtE')) {
        db.prepare(`UPDATE Muestras SET Id_LtE = ? WHERE Id_LtE = ?`).run(toId, fromId)
      }
    })
    mergeLotCatalog(db, LOTE_TABLE.marcado, LOTE_ID_COL.marcado, 'marcado', (fromId, toId) => {
      if (tableHasColumn(db, 'Lecturas_Marcado', 'Id_LtM')) {
        db.prepare(`UPDATE Lecturas_Marcado SET Id_LtM = ? WHERE Id_LtM = ?`).run(toId, fromId)
      }
    })
    mergeLotCatalog(db, LOTE_TABLE.membrana, LOTE_ID_COL.membrana, 'membrana', (fromId, toId) => {
      if (tableHasColumn(db, 'Lecturas_Marcado', 'Id_LtMm')) {
        db.prepare(`UPDATE Lecturas_Marcado SET Id_LtMm = ? WHERE Id_LtMm = ?`).run(toId, fromId)
      }
    })
    mergeLotCatalog(db, LOTE_TABLE.chip, LOTE_ID_COL.chip, 'chip', (fromId, toId) => {
      if (tableHasColumn(db, 'DChips', 'Id_LtC')) {
        db.prepare(`UPDATE DChips SET Id_LtC = ? WHERE Id_LtC = ?`).run(toId, fromId)
      }
    })
  })
  run()
}

/** Catálogo de lotes de chip (PN+LN+Exp) y FK inferencial DChips.Id_LtC. Idempotente. */
export function ensureLotesChipsSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS Lotes_Chips (
      Id_LtC INTEGER PRIMARY KEY AUTOINCREMENT,
      PN TEXT NOT NULL,
      LN TEXT NOT NULL DEFAULT '',
      Exp TEXT NOT NULL DEFAULT '',
      UNIQUE (PN, LN, Exp)
    );
  `)
  addFkColumnIfMissing(db, 'DChips', 'Id_LtC', LOTE_TABLE.chip, LOTE_ID_COL.chip)
  db.exec(`CREATE INDEX IF NOT EXISTS DChips_Id_LtC_idx ON DChips(Id_LtC);`)
}

/** Catálogo de envíos y FK inferencial Lotes_*.Id_Envio. Idempotente. */
export function ensureEnviosSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS Envios (
      Id_Envio INTEGER PRIMARY KEY AUTOINCREMENT,
      Sales_Order TEXT NOT NULL,
      Fecha_Llegada TEXT NOT NULL DEFAULT '',
      UNIQUE (Sales_Order)
    );
  `)
  addFkColumnIfMissing(db, LOTE_TABLE.extraido, 'Id_Envio', 'Envios', 'Id_Envio')
  addFkColumnIfMissing(db, LOTE_TABLE.marcado, 'Id_Envio', 'Envios', 'Id_Envio')
  addFkColumnIfMissing(db, LOTE_TABLE.membrana, 'Id_Envio', 'Envios', 'Id_Envio')
  addFkColumnIfMissing(db, LOTE_TABLE.chip, 'Id_Envio', 'Envios', 'Id_Envio')
  db.exec(`
    CREATE INDEX IF NOT EXISTS Lotes_Extraido_Id_Envio_idx ON Lotes_Extraido(Id_Envio);
    CREATE INDEX IF NOT EXISTS Lotes_Marcado_Id_Envio_idx ON Lotes_Marcado(Id_Envio);
    CREATE INDEX IF NOT EXISTS Lotes_Membrana_Id_Envio_idx ON Lotes_Membrana(Id_Envio);
    CREATE INDEX IF NOT EXISTS Lotes_Chips_Id_Envio_idx ON Lotes_Chips(Id_Envio);
  `)
  try {
    db.exec(
      `CREATE UNIQUE INDEX IF NOT EXISTS Envios_Sales_Order_ci ON Envios(Sales_Order COLLATE NOCASE);`
    )
  } catch {
    /* Filas previas que solo se diferencian por mayúsculas. */
  }
}
