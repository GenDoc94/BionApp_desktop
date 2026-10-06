import { describe, expect, it } from 'vitest'
import {
  EXPORT_TABLE_GROUPS,
  EXPORT_TABLES,
  areAllExportTables,
  defaultExportFileName,
  exportOutputKind,
  sanitizeExportTables
} from './exportTables'

describe('sanitizeExportTables', () => {
  it('returns every catalog table when input is omitted', () => {
    expect(sanitizeExportTables(undefined)).toEqual([...EXPORT_TABLES])
    expect(sanitizeExportTables(null)).toEqual([...EXPORT_TABLES])
  })

  it('keeps known tables in catalog order and drops the rest', () => {
    expect(sanitizeExportTables(['Stock', 'Muestras', 'nope', 'Stock'])).toEqual([
      'Stock',
      'Muestras'
    ])
  })

  it('returns an empty list when nothing valid is selected', () => {
    expect(sanitizeExportTables([])).toEqual([])
    expect(sanitizeExportTables(['secret'])).toEqual([])
  })
})

describe('export output', () => {
  it('uses a single file when only one table is chosen', () => {
    expect(exportOutputKind('xlsx', ['Muestras'])).toBe('xlsx')
    expect(exportOutputKind('json', ['Muestras'])).toBe('json')
    expect(defaultExportFileName('xlsx', ['Muestras'], '20261006_1018').name).toBe(
      'BionApp_Muestras_20261006_1018.xlsx'
    )
  })

  it('zips Excel/JSON when several tables are chosen', () => {
    expect(exportOutputKind('xlsx', ['Muestras', 'Lectura'])).toBe('zip')
    expect(defaultExportFileName('json', ['Muestras', 'Lectura'], '20261006_1018').name).toBe(
      'BionApp_json_20261006_1018.zip'
    )
  })

  it('always uses sqlite for that format', () => {
    expect(exportOutputKind('sqlite', ['Muestras'])).toBe('sqlite')
    expect(areAllExportTables(EXPORT_TABLES)).toBe(true)
    expect(areAllExportTables(['Muestras'])).toBe(false)
  })

  it('lists every export table in a group exactly once', () => {
    const grouped = EXPORT_TABLE_GROUPS.flatMap((g) => [...g.tables])
    expect(grouped.sort()).toEqual([...EXPORT_TABLES].sort())
  })
})
