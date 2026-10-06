import { LOTE_TIPOS, type LoteEnvioAsignado, type LoteRow, type LoteTipo } from "./lotesPageData"
import { normalizeBioCode, sameLn } from "./bioCodes"

export type EnvioRow = {
  id: number
  Sales_Order: string
  Fecha_Llegada: string
  Fecha_Envio: string
}

export type EnvioCajaRow = {
  id: number
  idEnvio: number
  Codigo_BIO: string
  Nombre: string
  LN: string
  Num_Cajas: number
}

export type LoteCatalogo = LoteRow & { tipo: LoteTipo }

export function parseEnvioRow(row: Record<string, unknown>): EnvioRow | null {
  const id = Number(row.Id_Envio)
  if (!Number.isFinite(id) || id <= 0) return null
  return {
    id,
    Sales_Order: String(row.Sales_Order ?? "").trim(),
    Fecha_Llegada: String(row.Fecha_Llegada ?? "").trim(),
    Fecha_Envio: String(row.Fecha_Envio ?? "").trim(),
  }
}

export function parseEnvioCajaRow(row: Record<string, unknown>): EnvioCajaRow | null {
  const id = Number(row.Id_EnvioCaja)
  const idEnvio = Number(row.Id_Envio)
  if (!Number.isFinite(id) || id <= 0 || !Number.isFinite(idEnvio) || idEnvio <= 0) return null
  const qty = Number(row.Num_Cajas)
  return {
    id,
    idEnvio,
    Codigo_BIO: normalizeBioCode(String(row.Codigo_BIO ?? "")),
    Nombre: String(row.Nombre ?? "").trim(),
    LN: String(row.LN ?? "").trim(),
    Num_Cajas: Number.isFinite(qty) ? qty : 0,
  }
}

function compareEnviosDeLote(a: EnvioRow, b: EnvioRow): number {
  const byArrive = b.Fecha_Llegada.localeCompare(a.Fecha_Llegada)
  if (byArrive !== 0) return byArrive
  const ae = a.Fecha_Envio.trim()
  const be = b.Fecha_Envio.trim()
  if (ae && be) {
    const byShip = be.localeCompare(ae)
    if (byShip !== 0) return byShip
  } else if (ae) return -1
  else if (be) return 1
  return a.Sales_Order.localeCompare(b.Sales_Order, undefined, { numeric: true })
}

export function attachEnvioSalesOrders(
  lots: LoteRow[],
  envios: EnvioRow[],
  cajas: EnvioCajaRow[] = []
): LoteRow[] {
  const byId = new Map(envios.map((envio) => [envio.id, envio]))
  return lots.map((lot) => {
    const fromCajas = enviosDeLote(lot, envios, cajas)
    const fallback =
      fromCajas.length === 0 && lot.idEnvio != null ? byId.get(lot.idEnvio) : undefined
    const list = (fromCajas.length > 0 ? fromCajas : fallback ? [fallback] : []).slice()
    list.sort(compareEnviosDeLote)
    const asignados: LoteEnvioAsignado[] = list
      .map((e) => ({
        id: e.id,
        Sales_Order: e.Sales_Order.trim(),
        Fecha_Llegada: e.Fecha_Llegada.trim(),
      }))
      .filter((e) => e.Sales_Order)
    const sos = asignados.map((e) => e.Sales_Order)
    return {
      ...lot,
      envioSalesOrder: sos[0] ?? null,
      envioSalesOrders: sos,
      envioFechaLlegada: asignados[0]?.Fecha_Llegada || null,
      envioAsignados: asignados,
    }
  })
}

export function enviosDeLote(
  lot: Pick<LoteRow, "LN">,
  envios: EnvioRow[],
  cajas: EnvioCajaRow[]
): EnvioRow[] {
  const ids = new Set<number>()
  for (const caja of cajas) {
    if (sameLn(caja.LN, lot.LN)) ids.add(caja.idEnvio)
  }
  return envios.filter((e) => ids.has(e.id)).sort(compareEnviosDeLote)
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

export function findDuplicateCaja(
  cajas: EnvioCajaRow[],
  envioId: number,
  ln: string,
  excludeId?: number
): EnvioCajaRow | null {
  const lot = String(ln ?? "").trim()
  if (!lot) return null
  return (
    cajas.find((caja) => {
      if (caja.idEnvio !== envioId) return false
      if (excludeId != null && caja.id === excludeId) return false
      return sameLn(caja.LN, lot)
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

export function filterEnvios(
  rows: EnvioRow[],
  query: string,
  cajas: EnvioCajaRow[] = []
): EnvioRow[] {
  const q = query.trim().toLowerCase()
  if (!q) return rows
  const idsFromCajas = new Set<number>()
  for (const caja of cajas) {
    if (
      caja.Codigo_BIO.toLowerCase().includes(q) ||
      caja.Nombre.toLowerCase().includes(q) ||
      caja.LN.toLowerCase().includes(q)
    ) {
      idsFromCajas.add(caja.idEnvio)
    }
  }
  return rows.filter(
    (r) =>
      r.Sales_Order.toLowerCase().includes(q) ||
      r.Fecha_Llegada.toLowerCase().includes(q) ||
      r.Fecha_Envio.toLowerCase().includes(q) ||
      String(r.id) === q ||
      idsFromCajas.has(r.id)
  )
}

export function cajasDeEnvio(cajas: EnvioCajaRow[], envioId: number): EnvioCajaRow[] {
  return cajas.filter((c) => c.idEnvio === envioId)
}

export function countCajasEnvio(cajas: EnvioCajaRow[], envioId: number): number {
  let n = 0
  for (const c of cajas) if (c.idEnvio === envioId) n += c.Num_Cajas
  return n
}

export function lotesDeEnvio(
  lotes: LoteCatalogo[],
  envioId: number,
  cajas: EnvioCajaRow[] = []
): Record<LoteTipo, LoteCatalogo[]> {
  const out: Record<LoteTipo, LoteCatalogo[]> = {
    extraido: [],
    marcado: [],
    membrana: [],
    chip: [],
  }
  const lines = cajasDeEnvio(cajas, envioId)
  for (const lot of lotes) {
    const viaCajas = lines.length > 0 && lines.some((caja) => sameLn(caja.LN, lot.LN))
    const viaLegacy = lines.length === 0 && lot.idEnvio === envioId
    if (viaCajas || viaLegacy) {
      const bucket = out[lot.tipo]
      if (bucket) bucket.push(lot)
    }
  }
  return out
}

export { LOTE_TIPOS }
