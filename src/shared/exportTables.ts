import type { ExportFormat } from './types'

/** Tablas de dominio exportables (sin secretos: meta, password hashes). */
export const EXPORT_TABLES = [
  'DMuestra',
  'DDx',
  'DCajas',
  'DChips',
  'Tags',
  'Lotes_Extraido',
  'Lotes_Marcado',
  'Lotes_Membrana',
  'Lotes_Chips',
  'Envios',
  'Envio_Cajas',
  'Stock',
  'Filtros',
  'Muestras',
  'Lectura',
  'Marcado',
  'Lecturas_Marcado',
  'Chips',
  'Preselect',
  'Muestra_Tags',
  'profiles'
] as const

export type ExportTableName = (typeof EXPORT_TABLES)[number]

export type ExportTableGroupId = 'catalog' | 'lots' | 'shipments' | 'samples' | 'users'

export type ExportTableGroup = {
  id: ExportTableGroupId
  tables: readonly ExportTableName[]
}

export const EXPORT_TABLE_GROUPS: readonly ExportTableGroup[] = [
  { id: 'catalog', tables: ['DMuestra', 'DDx', 'DCajas', 'DChips', 'Tags'] },
  { id: 'lots', tables: ['Lotes_Extraido', 'Lotes_Marcado', 'Lotes_Membrana', 'Lotes_Chips'] },
  { id: 'shipments', tables: ['Envios', 'Envio_Cajas', 'Stock'] },
  {
    id: 'samples',
    tables: [
      'Filtros',
      'Muestras',
      'Lectura',
      'Marcado',
      'Lecturas_Marcado',
      'Chips',
      'Preselect',
      'Muestra_Tags'
    ]
  },
  { id: 'users', tables: ['profiles'] }
]

export type TableDump = Record<string, Record<string, unknown>[]>

export type ExportOutputKind = 'zip' | 'xlsx' | 'json' | 'sqlite'

const EXPORT_TABLE_SET = new Set<string>(EXPORT_TABLES)

export function isExportTable(name: unknown): name is ExportTableName {
  return typeof name === 'string' && EXPORT_TABLE_SET.has(name)
}

/** Keep known tables in catalog order. Unknown names are dropped. Empty/invalid input → all tables. */
export function sanitizeExportTables(input: unknown): ExportTableName[] {
  if (input == null) return [...EXPORT_TABLES]
  if (!Array.isArray(input)) return [...EXPORT_TABLES]
  const wanted = new Set(input.filter(isExportTable))
  if (wanted.size === 0) return []
  return EXPORT_TABLES.filter((table) => wanted.has(table))
}

export function areAllExportTables(tables: readonly string[]): boolean {
  if (tables.length !== EXPORT_TABLES.length) return false
  const set = new Set(tables)
  return EXPORT_TABLES.every((table) => set.has(table))
}

export function exportOutputKind(
  format: ExportFormat,
  tables: readonly string[]
): ExportOutputKind {
  if (format === 'sqlite') return 'sqlite'
  if (tables.length === 1) return format
  return 'zip'
}

export function defaultExportFileName(
  format: ExportFormat,
  tables: readonly string[],
  ts: string
): { name: string; extensions: string[] } {
  const kind = exportOutputKind(format, tables)
  if (kind === 'sqlite') return { name: `BionApp_${ts}.sqlite`, extensions: ['sqlite'] }
  if (kind === 'xlsx') {
    return { name: `BionApp_${tables[0]}_${ts}.xlsx`, extensions: ['xlsx'] }
  }
  if (kind === 'json') {
    return { name: `BionApp_${tables[0]}_${ts}.json`, extensions: ['json'] }
  }
  return {
    name: format === 'xlsx' ? `BionApp_excel_${ts}.zip` : `BionApp_json_${ts}.zip`,
    extensions: ['zip']
  }
}

export function stamp(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`
}
