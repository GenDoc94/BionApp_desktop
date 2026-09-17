import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { migrateHomogenizeLotExps, migrateLegacyLotColumns } from './lotes'

export const DB_FILENAME = 'bionapp.sqlite'

export function dbPathFor(dataDir: string): string {
  return path.join(dataDir, DB_FILENAME)
}

export function openDatabase(dataDir: string): Database.Database {
  fs.mkdirSync(dataDir, { recursive: true })
  const db = new Database(dbPathFor(dataDir))
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.pragma('busy_timeout = 5000')
  return db
}

export function getMeta(db: Database.Database, key: string): string | null {
  const row = db.prepare('SELECT value FROM meta WHERE key = ?').get(key) as
    | { value: string }
    | undefined
  return row?.value ?? null
}

export function setMeta(db: Database.Database, key: string, value: string): void {
  db.prepare(
    `INSERT INTO meta(key, value) VALUES(?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run(key, value)
}

export function sha256(value: string): string {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex')
}

function tableColumnDeclaredType(
  db: Database.Database,
  table: string,
  column: string
): string | null {
  const cols = db.prepare(`PRAGMA table_info("${table}")`).all() as Array<{
    name: string
    type: string
  }>
  const col = cols.find((c) => c.name === column)
  return col ? String(col.type || '') : null
}

function rewriteCreateTableName(sql: string, tmpName: string): string {
  return sql.replace(
    /^CREATE TABLE\s+(IF NOT EXISTS\s+)?("([^"]+)"|'([^']+)'|`([^`]+)`|\w+)/i,
    `CREATE TABLE "${tmpName}"`
  )
}

function migrateTableColumnToText(
  db: Database.Database,
  table: string,
  column: string
): void {
  const declared = tableColumnDeclaredType(db, table, column)
  if (declared == null) return
  if (declared.toUpperCase() === 'TEXT') return

  const createRow = db
    .prepare(`SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?`)
    .get(table) as { sql: string } | undefined
  if (!createRow?.sql) return

  const colRe = new RegExp(`(["'\`]?)${column}\\1\\s+INTEGER\\b`, 'i')
  if (!colRe.test(createRow.sql)) return

  const tmp = `${table}__petic_txt`
  const createSql = rewriteCreateTableName(
    createRow.sql.replace(colRe, `$1${column}$1 TEXT`),
    tmp
  )
  const info = db.prepare(`PRAGMA table_info("${table}")`).all() as Array<{ name: string }>
  const names = info.map((c) => `"${c.name}"`).join(', ')
  const selectList = info
    .map((c) =>
      c.name === column
        ? `CASE WHEN "${c.name}" IS NULL THEN NULL ELSE CAST("${c.name}" AS TEXT) END AS "${c.name}"`
        : `"${c.name}"`
    )
    .join(', ')
  const indexes = db
    .prepare(
      `SELECT sql FROM sqlite_master WHERE type = 'index' AND tbl_name = ? AND sql IS NOT NULL`
    )
    .all(table) as Array<{ sql: string }>

  const fkOn = Boolean(db.pragma('foreign_keys', { simple: true }))
  db.pragma('foreign_keys = OFF')
  try {
    db.transaction(() => {
      db.exec(`DROP TABLE IF EXISTS "${tmp}"`)
      db.exec(createSql)
      db.exec(`INSERT INTO "${tmp}" (${names}) SELECT ${selectList} FROM "${table}"`)
      db.exec(`DROP TABLE "${table}"`)
      db.exec(`ALTER TABLE "${tmp}" RENAME TO "${table}"`)
      for (const idx of indexes) {
        if (idx.sql) db.exec(idx.sql)
      }
    })()
  } finally {
    db.pragma(`foreign_keys = ${fkOn ? 'ON' : 'OFF'}`)
  }
}

/** Nº de petición alfanumérico (letras y números de hospitales). */
export function migratePeticColumnsToText(db: Database.Database): void {
  migrateTableColumnToText(db, 'Muestras', 'Petic')
  migrateTableColumnToText(db, 'Preselect', 'Petic_Preselect')
}

/**
 * Esquema equivalente al Postgres de BionApp_online (sin RLS/auth.users).
 * Jerarquía cascade: Muestras → Lectura → Marcado → Lecturas_Marcado → Chips
 * Lotes_Extraido / Lotes_Marcado / Lotes_Membrana son catálogos (PN+LN+Exp)
 * referenciados por Muestras.Id_LtE y Lecturas_Marcado.Id_LtM / Id_LtMm.
 * Filtros registra colocación/retirada de filtros (NumFiltro, FechaColoc, FechaRetir).
 * Media/SD/CV se calculan en la capa de escritura (SQLite no permite mutar NEW).
 */
export function ensureFiltrosSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS Filtros (
      NumFiltro INTEGER PRIMARY KEY,
      FechaColoc TEXT NOT NULL,
      FechaRetir TEXT
    );
  `)
}

export function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user','admin')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE VIEW IF NOT EXISTS profiles AS
      SELECT id, username, role FROM users;

    CREATE TABLE IF NOT EXISTS DChips (
      NumChip_D INTEGER PRIMARY KEY AUTOINCREMENT,
      Nombre_Chip TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS DDx (
      Cod INTEGER PRIMARY KEY,
      Dx TEXT
    );

    CREATE TABLE IF NOT EXISTS DMuestra (
      Cod INTEGER PRIMARY KEY,
      TipoMuestra TEXT
    );

    CREATE TABLE IF NOT EXISTS Tags (
      Tag_Number INTEGER PRIMARY KEY AUTOINCREMENT,
      Tag_Name TEXT NOT NULL,
      Tag_Color TEXT NOT NULL CHECK(Tag_Color GLOB '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'),
      Created_At TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE UNIQUE INDEX IF NOT EXISTS Tags_Tag_Name_ci_uniq
      ON Tags(lower(Tag_Name));

    CREATE TABLE IF NOT EXISTS Lotes_Extraido (
      Id_LtE INTEGER PRIMARY KEY AUTOINCREMENT,
      PN TEXT NOT NULL,
      LN TEXT NOT NULL DEFAULT '',
      Exp TEXT NOT NULL DEFAULT '',
      UNIQUE (PN, LN, Exp)
    );

    CREATE TABLE IF NOT EXISTS Lotes_Marcado (
      Id_LtM INTEGER PRIMARY KEY AUTOINCREMENT,
      PN TEXT NOT NULL,
      LN TEXT NOT NULL DEFAULT '',
      Exp TEXT NOT NULL DEFAULT '',
      UNIQUE (PN, LN, Exp)
    );

    CREATE TABLE IF NOT EXISTS Lotes_Membrana (
      Id_LtMm INTEGER PRIMARY KEY AUTOINCREMENT,
      PN TEXT NOT NULL,
      LN TEXT NOT NULL DEFAULT '',
      Exp TEXT NOT NULL DEFAULT '',
      UNIQUE (PN, LN, Exp)
    );

    CREATE TABLE IF NOT EXISTS Filtros (
      NumFiltro INTEGER PRIMARY KEY,
      FechaColoc TEXT NOT NULL,
      FechaRetir TEXT
    );

    CREATE TABLE IF NOT EXISTS Muestras (
      NumBN INTEGER PRIMARY KEY,
      Posic TEXT,
      Petic TEXT,
      Dx INTEGER REFERENCES DDx(Cod) ON UPDATE CASCADE ON DELETE CASCADE,
      Muestra INTEGER REFERENCES DMuestra(Cod) ON UPDATE CASCADE ON DELETE CASCADE,
      Proces TEXT,
      Coment_Muestra TEXT,
      Chip_Muestra TEXT,
      Chip_FC_Muestra TEXT,
      Pellet TEXT,
      Fecha TEXT,
      Id_LtE INTEGER REFERENCES Lotes_Extraido(Id_LtE) ON UPDATE CASCADE ON DELETE SET NULL,
      Medusa TEXT,
      Coment_Extracc TEXT,
      Estado_Muestra INTEGER,
      Visco_grado INTEGER
    );

    CREATE TABLE IF NOT EXISTS Lectura (
      NumBN_L INTEGER NOT NULL REFERENCES Muestras(NumBN) ON UPDATE CASCADE ON DELETE CASCADE,
      NumLectura INTEGER NOT NULL,
      Fecha_lectura TEXT,
      Izq REAL,
      Cen REAL,
      Dcha REAL,
      Coment_Lectura TEXT,
      Estado_Lectura INTEGER,
      Marcado INTEGER,
      Media_Lectura REAL,
      SD_Lectura REAL,
      CV_Lectura REAL,
      PRIMARY KEY (NumBN_L, NumLectura)
    );

    CREATE TABLE IF NOT EXISTS Marcado (
      NumBN_M INTEGER NOT NULL,
      NumLectura_M INTEGER NOT NULL,
      Fecha_Marcado TEXT,
      Comentario_Membrana TEXT,
      Fecha_Lect_Marc TEXT,
      Cargado_M TEXT,
      Izq_M REAL,
      Dcha_M REAL,
      Estado_Marcado INTEGER,
      PRIMARY KEY (NumBN_M, NumLectura_M),
      FOREIGN KEY (NumBN_M, NumLectura_M)
        REFERENCES Lectura(NumBN_L, NumLectura)
        ON UPDATE CASCADE ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS Lecturas_Marcado (
      NumBN_LM INTEGER NOT NULL,
      NumLectura_LM INTEGER NOT NULL,
      NumLectMarc INTEGER NOT NULL,
      Fecha_Lect_Marc TEXT,
      Cargado_LM INTEGER,
      Izq_LM REAL,
      Dcha_LM REAL,
      Id_LtM INTEGER REFERENCES Lotes_Marcado(Id_LtM) ON UPDATE CASCADE ON DELETE SET NULL,
      Estado_LMarcado INTEGER,
      Comentario_LMarcado TEXT,
      Media_LM REAL,
      SD_LM REAL,
      CV_LM REAL,
      Id_LtMm INTEGER REFERENCES Lotes_Membrana(Id_LtMm) ON UPDATE CASCADE ON DELETE SET NULL,
      PRIMARY KEY (NumBN_LM, NumLectura_LM, NumLectMarc),
      FOREIGN KEY (NumBN_LM, NumLectura_LM)
        REFERENCES Marcado(NumBN_M, NumLectura_M)
        ON UPDATE CASCADE ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS Chips (
      NumBN_C INTEGER NOT NULL,
      NumLectura_C INTEGER NOT NULL,
      NumLectMarc_C INTEGER NOT NULL,
      NumChip INTEGER NOT NULL REFERENCES DChips(NumChip_D) ON UPDATE CASCADE ON DELETE CASCADE,
      Chip_Nombre TEXT,
      FC INTEGER,
      Coment_Chip TEXT,
      Repetir_Chip INTEGER,
      PRIMARY KEY (NumBN_C, NumLectura_C, NumLectMarc_C, NumChip),
      FOREIGN KEY (NumBN_C, NumLectura_C, NumLectMarc_C)
        REFERENCES Lecturas_Marcado(NumBN_LM, NumLectura_LM, NumLectMarc)
        ON UPDATE CASCADE ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS Preselect (
      Petic_Preselect TEXT PRIMARY KEY,
      Coment_Preselect TEXT,
      NumBN_Preselect INTEGER UNIQUE
        REFERENCES Muestras(NumBN) ON UPDATE CASCADE ON DELETE SET NULL,
      Fecha_Preselect TEXT,
      Dx_Preselect INTEGER
        REFERENCES DDx(Cod) ON UPDATE CASCADE ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS Muestra_Tags (
      NumBN_Tag INTEGER NOT NULL REFERENCES Muestras(NumBN) ON UPDATE CASCADE ON DELETE CASCADE,
      Tag_Number INTEGER NOT NULL REFERENCES Tags(Tag_Number) ON UPDATE CASCADE ON DELETE CASCADE,
      Created_At TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (NumBN_Tag, Tag_Number)
    );

    CREATE INDEX IF NOT EXISTS Muestra_Tags_Tag_Number_idx ON Muestra_Tags(Tag_Number);
    CREATE INDEX IF NOT EXISTS Muestra_Tags_NumBN_Tag_idx ON Muestra_Tags(NumBN_Tag);
    CREATE INDEX IF NOT EXISTS Lectura_NumBN_idx ON Lectura(NumBN_L);
    CREATE INDEX IF NOT EXISTS Chips_NumBN_idx ON Chips(NumBN_C);
  `)
  migrateLegacyLotColumns(db)
  migrateHomogenizeLotExps(db)
  migratePeticColumnsToText(db)
  ensureFiltrosSchema(db)
  db.exec(`
    CREATE INDEX IF NOT EXISTS Muestras_Id_LtE_idx ON Muestras(Id_LtE);
    CREATE INDEX IF NOT EXISTS Lecturas_Marcado_Id_LtM_idx ON Lecturas_Marcado(Id_LtM);
    CREATE INDEX IF NOT EXISTS Lecturas_Marcado_Id_LtMm_idx ON Lecturas_Marcado(Id_LtMm);
  `)
}
