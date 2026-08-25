/** Tablas de dominio exportables (sin secretos: meta, password hashes). */
export const EXPORT_TABLES = [
  'DMuestra',
  'DDx',
  'DChips',
  'Tags',
  'Muestras',
  'Lectura',
  'Marcado',
  'Lecturas_Marcado',
  'Chips',
  'Preselect',
  'Muestra_Tags',
  'profiles'
] as const

export type TableDump = Record<string, Record<string, unknown>[]>

export function stamp(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`
}
