/**
 * Descarga tablas de Supabase e importa a SQLite vía Electron
 * (así no se rompe el ABI de better-sqlite3 para la app).
 *
 * Uso: npm run db:pull-supabase
 *      npm run db:pull-supabase -- "C:\\ruta\\datos"
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'
import { createClient } from '@supabase/supabase-js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const onlineEnv = path.resolve(root, '..', 'BionApp_online', '.env')
const dumpPath = path.join(root, 'migration-data', '_supabase-dump.json')

function loadEnvFile(file) {
  if (!fs.existsSync(file)) throw new Error(`No existe ${file}`)
  const out = {}
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
    if (!m) continue
    let v = m[2].trim()
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1)
    }
    out[m[1]] = v
  }
  return out
}

function resolveDataDir() {
  const arg = process.argv.find((a, i) => i >= 2 && !a.startsWith('-'))
  if (arg) return path.resolve(arg)
  const cfg = path.join(process.env.APPDATA || '', 'bionapp-desktop', 'bionapp-desktop-config.json')
  if (fs.existsSync(cfg)) {
    const j = JSON.parse(fs.readFileSync(cfg, 'utf8'))
    if (j.dataPath) return j.dataPath
  }
  throw new Error('Pasa la carpeta de datos como argumento')
}

async function fetchAll(supabase, table, orderCol) {
  const pageSize = 1000
  let from = 0
  const rows = []
  for (;;) {
    let q = supabase.from(table).select('*').range(from, from + pageSize - 1)
    if (orderCol) q = q.order(orderCol, { ascending: true })
    const { data, error } = await q
    if (error) throw new Error(`${table}: ${error.message}`)
    rows.push(...(data || []))
    if (!data || data.length < pageSize) break
    from += pageSize
  }
  return rows
}

function runElectronImport(dbPath, jsonPath) {
  return new Promise((resolve, reject) => {
    const electronBin = path.join(root, 'node_modules', 'electron', 'cli.js')
    const importer = path.join(__dirname, 'import-dump-with-electron.cjs')
    const child = spawn(process.execPath, [electronBin, importer, dbPath, jsonPath], {
      cwd: root,
      stdio: 'inherit',
      env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }
    })
    // ELECTRON_RUN_AS_NODE makes electron act as node but with Electron's NODE_MODULE_VERSION
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`Import Electron salió con código ${code}`))
    })
  })
}

async function main() {
  const env = loadEnvFile(onlineEnv)
  const url = env.VITE_SUPABASE_URL?.trim()
  const key = env.VITE_SUPABASE_ANON_KEY?.trim()
  if (!url || !key) throw new Error('Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY')

  const dataDir = resolveDataDir()
  const dbPath = path.join(dataDir, 'bionapp.sqlite')
  if (!fs.existsSync(dbPath)) {
    throw new Error(`No hay SQLite en ${dbPath}. Completa el setup de la app antes.`)
  }

  console.log('Origen:', url)
  console.log('Destino:', dbPath)

  const supabase = createClient(url, key)
  console.log('Descargando…')
  const dump = {
    DDx: await fetchAll(supabase, 'DDx', 'Cod'),
    DMuestra: await fetchAll(supabase, 'DMuestra', 'Cod'),
    DChips: await fetchAll(supabase, 'DChips', 'NumChip_D'),
    Tags: await fetchAll(supabase, 'Tags', 'Tag_Number'),
    Muestras: await fetchAll(supabase, 'Muestras', 'NumBN'),
    Lectura: await fetchAll(supabase, 'Lectura', 'NumBN_L'),
    Marcado: await fetchAll(supabase, 'Marcado', 'NumBN_M'),
    Lecturas_Marcado: await fetchAll(supabase, 'Lecturas_Marcado', 'NumBN_LM'),
    Chips: await fetchAll(supabase, 'Chips', 'NumBN_C'),
    Preselect: await fetchAll(supabase, 'Preselect', 'Petic_Preselect'),
    Muestra_Tags: await fetchAll(supabase, 'Muestra_Tags', 'NumBN_Tag')
  }

  fs.mkdirSync(path.dirname(dumpPath), { recursive: true })
  fs.writeFileSync(dumpPath, JSON.stringify(dump))
  console.log('Dump guardado. Importando con ABI de Electron…')
  await runElectronImport(dbPath, dumpPath)
  console.log('Listo. Reinicia BionApp desktop si estaba abierta.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
