/**
 * Importa migration-data/_supabase-dump.json a SQLite.
 * Debe ejecutarse con Electron (ABI nativo de better-sqlite3):
 *   ELECTRON_RUN_AS_NODE=1 electron scripts/import-dump-with-electron.cjs <db> <json>
 *
 * Si el dump trae PN/LN/Exp en Muestras o Lecturas_Marcado y el esquema ya
 * usa catálogos Lotes_*, se convierten a Id_LtE / Id_LtM / Id_LtMm.
 */
const fs = require('fs')
const Database = require('better-sqlite3')

const dbPath = process.argv[2]
const jsonPath = process.argv[3]
if (!dbPath || !jsonPath) {
  console.error('Uso: import-dump-with-electron.cjs <dbPath> <jsonPath>')
  process.exit(1)
}

const dump = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
const order = [
  'DDx',
  'DMuestra',
  'DChips',
  'Tags',
  'Lotes_Extraido',
  'Lotes_Marcado',
  'Lotes_Membrana',
  'Filtros',
  'Muestras',
  'Lectura',
  'Marcado',
  'Lecturas_Marcado',
  'Chips',
  'Preselect',
  'Muestra_Tags'
]

const db = new Database(dbPath)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

function tableExists(name) {
  return !!db.prepare(`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?`).get(name)
}

function tableCols(table) {
  return db.prepare(`PRAGMA table_info("${table}")`).all().map((c) => c.name)
}

function normText(value) {
  if (value == null) return null
  const s = String(value).trim()
  return s === '' ? null : s
}

function normalizePN(value, map18606571) {
  let pn = normText(value)
  if (!pn) return null
  if (map18606571 && pn === '18606571') pn = '80118'
  const m = pn.match(/^(\d+)-\d+$/)
  return m ? m[1] : pn
}

function findOrCreateLote(table, idCol, pn, ln, exp) {
  if (!pn) return null
  const lnN = normText(ln) ?? ''
  const expN = normText(exp) ?? ''
  const existing = db
    .prepare(`SELECT "${idCol}" AS id FROM "${table}" WHERE PN = ? AND LN = ? AND Exp = ?`)
    .get(pn, lnN, expN)
  if (existing?.id != null) return existing.id
  const info = db.prepare(`INSERT INTO "${table}" (PN, LN, Exp) VALUES (?, ?, ?)`).run(pn, lnN, expN)
  return Number(info.lastInsertRowid)
}

function mapDumpRow(table, row, cols) {
  const next = { ...row }
  if (table === 'Muestras' && cols.includes('Id_LtE')) {
    next.Id_LtE = findOrCreateLote(
      'Lotes_Extraido',
      'Id_LtE',
      normalizePN(next.PN, true),
      next.LN,
      next.Exp
    )
    delete next.PN
    delete next.LN
    delete next.Exp
  }
  if (table === 'Lecturas_Marcado' && cols.includes('Id_LtM')) {
    const skip = next.NumBN_LM === 1 && [1, 3, 4].includes(Number(next.NumLectura_LM))
    let pn = next.PN_LM
    let ln = next.LN_LM
    let exp = next.Exp_LM
    let pnm = next.PNM_LM
    let lnm = next.LNM_LM
    let expm = next.ExpM_LM
    if (next.NumBN_LM === 72 && Number(next.NumLectura_LM) === 2 && Number(next.NumLectMarc) === 1) {
      ;[pn, ln, exp, pnm, lnm, expm] = [pnm, lnm, expm, pn, ln, exp]
    }
    next.Id_LtM = skip
      ? null
      : findOrCreateLote('Lotes_Marcado', 'Id_LtM', normalizePN(pn), ln, exp)
    next.Id_LtMm = skip
      ? null
      : findOrCreateLote('Lotes_Membrana', 'Id_LtMm', normalizePN(pnm), lnm, expm)
    delete next.PN_LM
    delete next.LN_LM
    delete next.Exp_LM
    delete next.PNM_LM
    delete next.LNM_LM
    delete next.ExpM_LM
  }
  if (table === 'Marcado') {
    delete next.PN_M
    delete next.LN_M
    delete next.Exp_M
    delete next.PN_Membrana
    delete next.LN_Membrana
    delete next.Exp_Membrana
  }
  return next
}

function insertRows(table, rows) {
  if (!tableExists(table)) {
    console.log(`  ${table}: omitida (no existe)`)
    return
  }
  if (!rows?.length) {
    console.log(`  ${table}: 0 filas`)
    return
  }
  const cols = tableCols(table)
  const mapped = rows.map((row) => mapDumpRow(table, row, cols))
  const usedCols = cols.filter((c) => mapped.some((r) => r[c] !== undefined))
  if (!usedCols.length) {
    console.log(`  ${table}: 0 columnas coincidentes`)
    return
  }
  const sql = `INSERT INTO "${table}" (${usedCols.map((c) => `"${c}"`).join(',')}) VALUES (${usedCols.map(() => '?').join(',')})`
  const stmt = db.prepare(sql)
  const tx = db.transaction((list) => {
    for (const row of list) {
      stmt.run(
        ...usedCols.map((c) => {
          const v = row[c]
          if (v === undefined) return null
          if (typeof v === 'boolean') return v ? 1 : 0
          if (v !== null && typeof v === 'object') return JSON.stringify(v)
          return v
        })
      )
    }
  })
  tx(mapped)
  console.log(`  ${table}: ${mapped.length} filas`)
}

db.exec('PRAGMA foreign_keys = OFF')
for (const t of [...order].reverse()) {
  if (tableExists(t)) db.prepare(`DELETE FROM "${t}"`).run()
}
db.exec('PRAGMA foreign_keys = ON')

const run = db.transaction(() => {
  for (const t of order) insertRows(t, dump[t] || [])
  try {
    for (const [table, col] of [
      ['DChips', 'NumChip_D'],
      ['Tags', 'Tag_Number'],
      ['Lotes_Extraido', 'Id_LtE'],
      ['Lotes_Marcado', 'Id_LtM'],
      ['Lotes_Membrana', 'Id_LtMm']
    ]) {
      if (!tableExists(table)) continue
      const max = db.prepare(`SELECT MAX("${col}") AS m FROM "${table}"`).get()?.m
      if (max == null) continue
      db.prepare(
        `INSERT INTO sqlite_sequence(name, seq) VALUES(?, ?)
         ON CONFLICT(name) DO UPDATE SET seq = excluded.seq`
      ).run(table, max)
    }
  } catch {
    /* ok */
  }
})
run()
db.close()
console.log('Import SQLite OK')
