import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

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

/**
 * Esquema equivalente al Postgres de BionApp_online (sin RLS/auth.users).
 * Jerarquía cascade: Muestras → Lectura → Marcado → Lecturas_Marcado → Chips
 * Media/SD/CV se calculan en la capa de escritura (SQLite no permite mutar NEW).
 */
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

    CREATE TABLE IF NOT EXISTS Muestras (
      NumBN INTEGER PRIMARY KEY,
      Posic TEXT,
      Petic INTEGER,
      Dx INTEGER REFERENCES DDx(Cod) ON UPDATE CASCADE ON DELETE CASCADE,
      Muestra INTEGER REFERENCES DMuestra(Cod) ON UPDATE CASCADE ON DELETE CASCADE,
      Proces TEXT,
      Coment_Muestra TEXT,
      Chip_Muestra TEXT,
      Chip_FC_Muestra TEXT,
      Pellet TEXT,
      Fecha TEXT,
      PN TEXT,
      LN INTEGER,
      Exp TEXT,
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
      PN_Membrana TEXT,
      LN_Membrana INTEGER,
      Exp_Membrana TEXT,
      Comentario_Membrana TEXT,
      Fecha_Lect_Marc TEXT,
      Cargado_M TEXT,
      Izq_M REAL,
      Dcha_M REAL,
      PN_M TEXT,
      LN_M INTEGER,
      Exp_M TEXT,
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
      PN_LM TEXT,
      LN_LM TEXT,
      Exp_LM TEXT,
      Estado_LMarcado INTEGER,
      Comentario_LMarcado TEXT,
      Media_LM REAL,
      SD_LM REAL,
      CV_LM REAL,
      PNM_LM TEXT,
      LNM_LM TEXT,
      ExpM_LM TEXT,
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
      Petic_Preselect INTEGER PRIMARY KEY,
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
}
