import { normalizeBioCode, stockKey } from "./bioCodes"
import type { EnvioCajaRow, EnvioRow } from "./enviosPageData"

export const STOCK_BOX_ICON_MAX = 12

export type StockExtras = {
  Codigo_BIO: string
  LN: string
  Lugar: string
  Cajas_Quedan: number | null
}

export type StockEnvioRef = {
  id: number
  Sales_Order: string
  Fecha_Llegada: string
  Fecha_Envio: string
  Num_Cajas: number
}

export type StockLnGroup = {
  Codigo_BIO: string
  LN: string
  Lugar: string
  Cajas_Quedan: number | null
  totalCajas: number
  envios: StockEnvioRef[]
}

export type StockBioGroup = {
  Codigo_BIO: string
  Nombre: string
  totalCajas: number
  lns: StockLnGroup[]
}

export function parseStockExtras(row: Record<string, unknown>): StockExtras | null {
  const bio = normalizeBioCode(String(row.Codigo_BIO ?? ""))
  const ln = String(row.LN ?? "").trim()
  if (!bio || !ln) return null
  const rawQuedan = row.Cajas_Quedan
  let quedan: number | null = null
  if (rawQuedan != null && String(rawQuedan).trim() !== "") {
    const n = Number(rawQuedan)
    if (Number.isFinite(n)) quedan = n
  }
  return {
    Codigo_BIO: bio,
    LN: ln,
    Lugar: String(row.Lugar ?? "").trim(),
    Cajas_Quedan: quedan,
  }
}

function compareStockDatesAsc(a: string, b: string): number {
  if (!a && !b) return 0
  if (!a) return 1
  if (!b) return -1
  return a.localeCompare(b)
}

function compareStockEnvios(a: StockEnvioRef, b: StockEnvioRef): number {
  const byArrive = b.Fecha_Llegada.localeCompare(a.Fecha_Llegada)
  if (byArrive !== 0) return byArrive
  const so = a.Sales_Order.localeCompare(b.Sales_Order, undefined, { numeric: true })
  if (so !== 0) return so
  return a.id - b.id
}

function compareStockEnviosOldestFirst(a: StockEnvioRef, b: StockEnvioRef): number {
  const byArrive = compareStockDatesAsc(a.Fecha_Llegada, b.Fecha_Llegada)
  if (byArrive !== 0) return byArrive
  const byShip = compareStockDatesAsc(a.Fecha_Envio, b.Fecha_Envio)
  if (byShip !== 0) return byShip
  return a.id - b.id
}

export function consumedCountForQuedan(totalCajas: number, quedan: number | null): number {
  if (quedan == null) return 0
  const total = Math.max(0, Math.floor(totalCajas))
  const rem = Math.max(0, Math.floor(quedan))
  return Math.min(total, Math.max(0, total - rem))
}

/** Boxes already used, assigned to the oldest shipments first. */
export function consumedBoxesByEnvio(
  envios: StockEnvioRef[],
  quedan: number | null
): Map<number, number> {
  const total = envios.reduce((n, e) => n + Math.max(0, Math.floor(e.Num_Cajas)), 0)
  let remainingToConsume = consumedCountForQuedan(total, quedan)
  const out = new Map<number, number>()
  for (const envio of [...envios].sort(compareStockEnviosOldestFirst)) {
    const n = Math.max(0, Math.floor(envio.Num_Cajas))
    const take = Math.min(n, remainingToConsume)
    out.set(envio.id, take)
    remainingToConsume -= take
  }
  return out
}

export function buildStockGroups(
  cajas: EnvioCajaRow[],
  extras: StockExtras[],
  envios: EnvioRow[],
  catalogNombres: Record<string, string> = {}
): StockBioGroup[] {
  const extraByKey = new Map(extras.map((e) => [stockKey(e.Codigo_BIO, e.LN), e]))
  const envioById = new Map(envios.map((e) => [e.id, e]))
  const lnMap = new Map<
    string,
    {
      Codigo_BIO: string
      LN: string
      Nombre: string
      total: number
      envios: Map<number, number>
    }
  >()

  for (const caja of cajas) {
    const bio = normalizeBioCode(caja.Codigo_BIO)
    const ln = caja.LN.trim()
    if (!bio || !ln) continue
    const key = stockKey(bio, ln)
    const qty = Number.isFinite(caja.Num_Cajas) ? Math.max(0, caja.Num_Cajas) : 0
    const catalogName = String(catalogNombres[bio] ?? "").trim()
    const cur = lnMap.get(key)
    if (cur) {
      cur.total += qty
      cur.envios.set(caja.idEnvio, (cur.envios.get(caja.idEnvio) ?? 0) + qty)
      if (!cur.Nombre.trim()) cur.Nombre = catalogName || caja.Nombre.trim()
    } else {
      lnMap.set(key, {
        Codigo_BIO: bio,
        LN: ln,
        Nombre: catalogName || caja.Nombre.trim(),
        total: qty,
        envios: new Map([[caja.idEnvio, qty]]),
      })
    }
  }

  const bioMap = new Map<string, StockBioGroup>()
  for (const g of lnMap.values()) {
    const extra = extraByKey.get(stockKey(g.Codigo_BIO, g.LN))
    const envioRefs: StockEnvioRef[] = [...g.envios.entries()]
      .map(([id, num]) => {
        const envio = envioById.get(id)
        return {
          id,
          Sales_Order: envio?.Sales_Order.trim() || "",
          Fecha_Llegada: envio?.Fecha_Llegada.trim() || "",
          Fecha_Envio: envio?.Fecha_Envio.trim() || "",
          Num_Cajas: num,
        }
      })
      .sort(compareStockEnvios)
    const lnRow: StockLnGroup = {
      Codigo_BIO: g.Codigo_BIO,
      LN: g.LN,
      Lugar: extra?.Lugar ?? "",
      Cajas_Quedan: extra?.Cajas_Quedan ?? null,
      totalCajas: g.total,
      envios: envioRefs,
    }
    const bio = bioMap.get(g.Codigo_BIO)
    if (bio) {
      bio.lns.push(lnRow)
      bio.totalCajas += g.total
      if (!bio.Nombre.trim() && g.Nombre.trim()) bio.Nombre = g.Nombre
    } else {
      bioMap.set(g.Codigo_BIO, {
        Codigo_BIO: g.Codigo_BIO,
        Nombre: String(catalogNombres[g.Codigo_BIO] ?? "").trim() || g.Nombre,
        totalCajas: g.total,
        lns: [lnRow],
      })
    }
  }

  return [...bioMap.values()]
    .map((bio) => ({
      ...bio,
      lns: [...bio.lns].sort((a, b) => a.LN.localeCompare(b.LN, undefined, { numeric: true })),
    }))
    .sort((a, b) => a.Codigo_BIO.localeCompare(b.Codigo_BIO, undefined, { numeric: true }))
}

export function filterStockGroups(groups: StockBioGroup[], query: string): StockBioGroup[] {
  const q = query.trim().toLowerCase()
  if (!q) return groups
  return groups
    .map((bio) => {
      const bioHit =
        bio.Codigo_BIO.toLowerCase().includes(q) || bio.Nombre.toLowerCase().includes(q)
      if (bioHit) return bio
      const lns = bio.lns.filter(
        (ln) =>
          ln.LN.toLowerCase().includes(q) ||
          ln.Lugar.toLowerCase().includes(q) ||
          ln.envios.some((e) => e.Sales_Order.toLowerCase().includes(q))
      )
      if (!lns.length) return null
      return { ...bio, lns, totalCajas: lns.reduce((n, ln) => n + ln.totalCajas, 0) }
    })
    .filter((g): g is StockBioGroup => g != null)
}

export function parseQuedanInput(raw: string): number | null | "invalid" {
  const s = String(raw ?? "").trim()
  if (!s) return null
  const n = Number(s)
  if (!Number.isInteger(n) || n < 0) return "invalid"
  return n
}

export function nombreForBio(cajas: EnvioCajaRow[], bio: string): string {
  const code = normalizeBioCode(bio)
  if (!code) return ""
  for (let i = cajas.length - 1; i >= 0; i--) {
    if (normalizeBioCode(cajas[i].Codigo_BIO) === code && cajas[i].Nombre.trim()) {
      return cajas[i].Nombre.trim()
    }
  }
  return ""
}

export function boxIconCount(n: number): { shown: number; extra: number } {
  const total = Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0
  if (total <= STOCK_BOX_ICON_MAX) return { shown: total, extra: 0 }
  return { shown: STOCK_BOX_ICON_MAX, extra: total - STOCK_BOX_ICON_MAX }
}

export function boxIconStates(
  numCajas: number,
  consumed: number
): { shown: number; shownConsumed: number; extra: number } {
  const { shown, extra } = boxIconCount(numCajas)
  const used = Math.max(0, Math.floor(consumed))
  return { shown, shownConsumed: Math.min(shown, used), extra }
}

export function catalogNombresFromRows(
  rows: Array<{ Codigo_BIO?: string; Nombre?: string }>
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const row of rows) {
    const code = normalizeBioCode(String(row.Codigo_BIO ?? ""))
    const name = String(row.Nombre ?? "").trim()
    if (code && name) out[code] = name
  }
  return out
}
