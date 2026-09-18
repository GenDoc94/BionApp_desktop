import { LOTE_TIPOS, type LoteRow, type LoteTipo } from "./lotesPageData"

export type EnvioRow = {
  id: number
  Sales_Order: string
  Fecha_Llegada: string
}

export type LoteCatalogo = LoteRow & { tipo: LoteTipo }

export function attachEnvioSalesOrders(lots: LoteRow[], envios: EnvioRow[]): LoteRow[] {
  const byId = new Map(envios.map((envio) => [envio.id, envio]))
  return lots.map((lot) => {
    const envio = lot.idEnvio != null ? byId.get(lot.idEnvio) : undefined
    const so = envio?.Sales_Order.trim() || ""
    const fecha = envio?.Fecha_Llegada.trim() || ""
    return {
      ...lot,
      envioSalesOrder: so || null,
      envioFechaLlegada: fecha || null,
    }
  })
}

export function parseEnvioRow(row: Record<string, unknown>): EnvioRow | null {
  const id = Number(row.Id_Envio)
  if (!Number.isFinite(id) || id <= 0) return null
  return {
    id,
    Sales_Order: String(row.Sales_Order ?? "").trim(),
    Fecha_Llegada: String(row.Fecha_Llegada ?? "").trim(),
  }
}

export function findDuplicateEnvio(
  envios: EnvioRow[],
  salesOrder: string,
  excludeId?: number
): EnvioRow | null {
  const so = String(salesOrder ?? "").trim()
  if (!so) return null
  return (
    envios.find((envio) => {
      if (excludeId != null && envio.id === excludeId) return false
      return envio.Sales_Order.trim().toLowerCase() === so.toLowerCase()
    }) ?? null
  )
}

export function sortEnvios(rows: EnvioRow[]): EnvioRow[] {
  return [...rows].sort((a, b) => {
    const f = String(b.Fecha_Llegada).localeCompare(String(a.Fecha_Llegada))
    if (f !== 0) return f
    return String(a.Sales_Order).localeCompare(String(b.Sales_Order), undefined, { numeric: true })
  })
}

export function filterEnvios(rows: EnvioRow[], query: string): EnvioRow[] {
  const q = query.trim().toLowerCase()
  if (!q) return rows
  return rows.filter(
    (r) =>
      r.Sales_Order.toLowerCase().includes(q) ||
      r.Fecha_Llegada.toLowerCase().includes(q) ||
      String(r.id) === q
  )
}

export function lotesDeEnvio(lotes: LoteCatalogo[], envioId: number): Record<LoteTipo, LoteCatalogo[]> {
  const out: Record<LoteTipo, LoteCatalogo[]> = {
    extraido: [],
    marcado: [],
    membrana: [],
    chip: [],
  }
  for (const lot of lotes) {
    if (lot.idEnvio === envioId) out[lot.tipo].push(lot)
  }
  return out
}

export function lotesSinEnvio(lotes: LoteCatalogo[]): Record<LoteTipo, LoteCatalogo[]> {
  const out: Record<LoteTipo, LoteCatalogo[]> = {
    extraido: [],
    marcado: [],
    membrana: [],
    chip: [],
  }
  for (const lot of lotes) {
    if (lot.idEnvio == null) out[lot.tipo].push(lot)
  }
  return out
}

export function countLotesEnvio(lotes: LoteCatalogo[], envioId: number): number {
  let n = 0
  for (const lot of lotes) if (lot.idEnvio === envioId) n++
  return n
}

export { LOTE_TIPOS }
