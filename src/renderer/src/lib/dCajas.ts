import { normalizeBioCode } from "./bioCodes"
import { sortLots, type LoteTipo } from "./lotesPageData"
import type { LoteCatalogo } from "./enviosPageData"
import {
  CAJA_TIPOS as CAJA_TIPOS_SRC,
  DEFAULT_DCJAS as DEFAULT_DCJAS_SRC,
  parseCajaTipo as parseCajaTipoSrc,
  type CajaLotTipo,
  type CajaTipo,
  type DCajaSeed,
} from "@shared/dCajas"

export const CAJA_TIPOS = CAJA_TIPOS_SRC
export const DEFAULT_DCJAS = DEFAULT_DCJAS_SRC
export const parseCajaTipo = parseCajaTipoSrc
export type { CajaTipo, CajaLotTipo, DCajaSeed }

export type DCajaRow = {
  Codigo_BIO: string
  Nombre: string
  Tipo: CajaTipo
}

export function lotTiposForCajaTipo(tipo: CajaTipo): CajaLotTipo[] {
  if (tipo === "marcado") return ["marcado"]
  if (tipo === "chip") return ["chip"]
  return ["extraido"]
}

export function parseDCajaRow(row: Record<string, unknown>): DCajaRow | null {
  const code = normalizeBioCode(String(row.Codigo_BIO ?? row.codigo_bio ?? ""))
  let tipo = parseCajaTipo(row.Tipo ?? row.tipo)
  if (!tipo) {
    tipo = DEFAULT_DCJAS.find((seed) => seed.Codigo_BIO === code)?.Tipo ?? null
  }
  if (!code || !tipo) return null
  return {
    Codigo_BIO: code,
    Nombre: String(row.Nombre ?? "").trim(),
    Tipo: tipo,
  }
}

export function findDCaja(rows: DCajaRow[], bio: string): DCajaRow | null {
  const code = normalizeBioCode(bio)
  if (!code) return null
  return rows.find((caja) => caja.Codigo_BIO === code) ?? null
}

export function sortDCajas(rows: DCajaRow[]): DCajaRow[] {
  return [...rows].sort((a, b) =>
    a.Codigo_BIO.localeCompare(b.Codigo_BIO, undefined, { numeric: true })
  )
}

export function lotsForCajaTipo(lotes: LoteCatalogo[], tipo: CajaTipo | null | undefined): LoteCatalogo[] {
  const allowed = tipo ? lotTiposForCajaTipo(tipo) : []
  if (!allowed.length) return []
  return sortLots(lotes.filter((lot) => allowed.includes(lot.tipo))) as LoteCatalogo[]
}

/** LN del catálogo Lotes según el tipo de caja (BIO). El PN del lote no entra. */
export function lotsForCaja(lotes: LoteCatalogo[], caja: DCajaRow | null | undefined): LoteCatalogo[] {
  if (!caja) return []
  return lotsForCajaTipo(lotes, caja.Tipo)
}

export function lotAssignKey(tipo: LoteTipo, id: number): string {
  return `${tipo}:${id}`
}

export function parseLotAssignKey(key: string): { tipo: LoteTipo; id: number } | null {
  const m = String(key ?? "").match(/^(extraido|marcado|membrana|chip):(\d+)$/)
  if (!m) return null
  return { tipo: m[1] as LoteTipo, id: Number(m[2]) }
}
