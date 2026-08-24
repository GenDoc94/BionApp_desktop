/**
 * Importa migration-data/_supabase-dump.json a SQLite.
 * Debe ejecutarse con Electron (ABI nativo de better-sqlite3):
 *   ELECTRON_RUN_AS_NODE=1 electron scripts/import-dump-with-electron.cjs <db> <json>
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

function insertRows(table, rows) {
  if (!rows?.length) {
    console.log(`  ${table}: 0 filas`)
    return
  }
  const cols = Object.keys(rows[0])
  const sql = `INSERT INTO "${table}" (${cols.map((c) => `"${c}"`).join(',')}) VALUES (${cols.map(() => '?').join(',')})`
  const stmt = db.prepare(sql)
  const tx = db.transaction((list) => {
    for (const row of list) {
      stmt.run(
        ...cols.map((c) => {
          const v = row[c]
          if (v === undefined) return null
          if (typeof v === 'boolean') return v ? 1 : 0
          if (v !== null && typeof v === 'object') return JSON.stringify(v)
          return v
        })
      )
    }
  })
  tx(rows)
  console.log(`  ${table}: ${rows.length} filas`)
}

db.exec('PRAGMA foreign_keys = OFF')
for (const t of [...order].reverse()) {
  db.prepare(`DELETE FROM "${t}"`).run()
}
db.exec('PRAGMA foreign_keys = ON')

const run = db.transaction(() => {
  for (const t of order) insertRows(t, dump[t] || [])
  try {
    for (const [table, col] of [
      ['DChips', 'NumChip_D'],
      ['Tags', 'Tag_Number']
    ]) {
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
