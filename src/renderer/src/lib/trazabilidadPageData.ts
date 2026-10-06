import type { LoteTipo } from "./lotesPageData"
import type { EnvioCajaRow, EnvioRow, LoteCatalogo } from "./enviosPageData"
import { sameLn } from "./bioCodes"

export type TrazabilidadChip = {
  numChip: number
  nombre: string | null
  fc: number | null
  loteChipLn: string | null
}

export type TrazabilidadLm = {
  numBN: number
  numLectura: number
  numLectMarc: number
  loteMarcadoLn: string | null
  loteMembranaLn: string | null
  chips: TrazabilidadChip[]
}

export type TrazabilidadLectura = {
  numBN: number
  numLectura: number
  lms: TrazabilidadLm[]
}

export type TrazabilidadMuestra = {
  numBN: number
  lecturas: TrazabilidadLectura[]
}

export type TrazabilidadLoteNodo = {
  tipo: LoteTipo
  id: number
  LN: string
  PN: string
  muestras: TrazabilidadMuestra[]
  chipsCatalogo: TrazabilidadChip[]
}

export type TrazabilidadEnvioArbol = {
  envio: EnvioRow | null
  cajas: EnvioCajaRow[]
  lotes: TrazabilidadLoteNodo[]
  posiblesEnvios: EnvioRow[]
}

export type TrazabilidadMuestraInput = {
  NumBN: unknown
  Id_LtE?: unknown
}

export type TrazabilidadLecturaInput = {
  NumBN_L: unknown
  NumLectura: unknown
}

export type TrazabilidadLmInput = {
  NumBN_LM: unknown
  NumLectura_LM: unknown
  NumLectMarc: unknown
  Id_LtM?: unknown
  Id_LtMm?: unknown
}

export type TrazabilidadChipAsigInput = {
  NumBN_C: unknown
  NumLectura_C: unknown
  NumLectMarc_C: unknown
  NumChip: unknown
  FC?: unknown
}

export type TrazabilidadDChipInput = {
  NumChip_D: unknown
  Nombre_Chip?: unknown
  Id_LtC?: unknown
}

export type TrazabilidadCatalogo = {
  envios: EnvioRow[]
  cajas: EnvioCajaRow[]
  lotes: LoteCatalogo[]
  muestras: TrazabilidadMuestraInput[]
  lecturas: TrazabilidadLecturaInput[]
  lms: TrazabilidadLmInput[]
  chips: TrazabilidadChipAsigInput[]
  dchips: TrazabilidadDChipInput[]
}

function num(value: unknown): number | null {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function lnOf(lotes: LoteCatalogo[], tipo: LoteTipo, id: number | null): string | null {
  if (id == null) return null
  const lot = lotes.find((l) => l.tipo === tipo && l.id === id)
  return lot?.LN?.trim() ? lot.LN : null
}

function chipsDeLm(
  catalog: TrazabilidadCatalogo,
  numBN: number,
  numLectura: number,
  numLectMarc: number
): TrazabilidadChip[] {
  const dchipById = new Map<number, TrazabilidadDChipInput>()
  for (const d of catalog.dchips) {
    const id = num(d.NumChip_D)
    if (id != null) dchipById.set(id, d)
  }
  const out: TrazabilidadChip[] = []
  for (const c of catalog.chips) {
    if (num(c.NumBN_C) !== numBN) continue
    if (num(c.NumLectura_C) !== numLectura) continue
    if (num(c.NumLectMarc_C) !== numLectMarc) continue
    const numChip = num(c.NumChip)
    if (numChip == null) continue
    const d = dchipById.get(numChip)
    const idLtC = d ? num(d.Id_LtC) : null
    out.push({
      numChip,
      nombre: d?.Nombre_Chip != null ? String(d.Nombre_Chip) : null,
      fc: num(c.FC),
      loteChipLn: lnOf(catalog.lotes, "chip", idLtC),
    })
  }
  return out.sort((a, b) => a.numChip - b.numChip || (a.fc ?? 0) - (b.fc ?? 0))
}

function lmsDeLectura(
  catalog: TrazabilidadCatalogo,
  numBN: number,
  numLectura: number
): TrazabilidadLm[] {
  const out: TrazabilidadLm[] = []
  for (const lm of catalog.lms) {
    if (num(lm.NumBN_LM) !== numBN || num(lm.NumLectura_LM) !== numLectura) continue
    const numLectMarc = num(lm.NumLectMarc)
    if (numLectMarc == null) continue
    out.push({
      numBN,
      numLectura,
      numLectMarc,
      loteMarcadoLn: lnOf(catalog.lotes, "marcado", num(lm.Id_LtM)),
      loteMembranaLn: lnOf(catalog.lotes, "membrana", num(lm.Id_LtMm)),
      chips: chipsDeLm(catalog, numBN, numLectura, numLectMarc),
    })
  }
  return out.sort((a, b) => a.numLectMarc - b.numLectMarc)
}

function lecturasDeMuestra(catalog: TrazabilidadCatalogo, numBN: number): TrazabilidadLectura[] {
  const out: TrazabilidadLectura[] = []
  for (const l of catalog.lecturas) {
    if (num(l.NumBN_L) !== numBN) continue
    const numLectura = num(l.NumLectura)
    if (numLectura == null) continue
    out.push({
      numBN,
      numLectura,
      lms: lmsDeLectura(catalog, numBN, numLectura),
    })
  }
  return out.sort((a, b) => a.numLectura - b.numLectura)
}

function muestraNodo(catalog: TrazabilidadCatalogo, numBN: number): TrazabilidadMuestra {
  return { numBN, lecturas: lecturasDeMuestra(catalog, numBN) }
}

function muestrasDeLote(catalog: TrazabilidadCatalogo, lot: LoteCatalogo): number[] {
  const bns = new Set<number>()
  if (lot.tipo === "extraido") {
    for (const m of catalog.muestras) {
      if (num(m.Id_LtE) === lot.id) {
        const bn = num(m.NumBN)
        if (bn != null) bns.add(bn)
      }
    }
  } else if (lot.tipo === "marcado") {
    for (const lm of catalog.lms) {
      if (num(lm.Id_LtM) === lot.id) {
        const bn = num(lm.NumBN_LM)
        if (bn != null) bns.add(bn)
      }
    }
  } else if (lot.tipo === "membrana") {
    for (const lm of catalog.lms) {
      if (num(lm.Id_LtMm) === lot.id) {
        const bn = num(lm.NumBN_LM)
        if (bn != null) bns.add(bn)
      }
    }
  } else {
    const chipIds = new Set<number>()
    for (const d of catalog.dchips) {
      if (num(d.Id_LtC) === lot.id) {
        const id = num(d.NumChip_D)
        if (id != null) chipIds.add(id)
      }
    }
    for (const c of catalog.chips) {
      const chip = num(c.NumChip)
      if (chip != null && chipIds.has(chip)) {
        const bn = num(c.NumBN_C)
        if (bn != null) bns.add(bn)
      }
    }
  }
  return [...bns].sort((a, b) => a - b)
}

function chipsCatalogoDeLote(catalog: TrazabilidadCatalogo, lot: LoteCatalogo): TrazabilidadChip[] {
  if (lot.tipo !== "chip") return []
  const out: TrazabilidadChip[] = []
  for (const d of catalog.dchips) {
    if (num(d.Id_LtC) !== lot.id) continue
    const numChip = num(d.NumChip_D)
    if (numChip == null) continue
    out.push({
      numChip,
      nombre: d.Nombre_Chip != null ? String(d.Nombre_Chip) : null,
      fc: null,
      loteChipLn: lot.LN,
    })
  }
  return out.sort((a, b) => a.numChip - b.numChip)
}

function loteNodo(catalog: TrazabilidadCatalogo, lot: LoteCatalogo): TrazabilidadLoteNodo {
  return {
    tipo: lot.tipo,
    id: lot.id,
    LN: lot.LN,
    PN: lot.PN,
    muestras: muestrasDeLote(catalog, lot).map((bn) => muestraNodo(catalog, bn)),
    chipsCatalogo: chipsCatalogoDeLote(catalog, lot),
  }
}

function lotesMatchingCaja(catalog: TrazabilidadCatalogo, caja: EnvioCajaRow): LoteCatalogo[] {
  return catalog.lotes.filter((lot) => sameLn(lot.LN, caja.LN))
}

function enviosForLn(catalog: TrazabilidadCatalogo, ln: string): EnvioRow[] {
  const ids = new Set<number>()
  for (const caja of catalog.cajas) {
    if (sameLn(caja.LN, ln)) ids.add(caja.idEnvio)
  }
  const fromCajas = catalog.envios.filter((e) => ids.has(e.id))
  if (fromCajas.length > 0) return fromCajas
  const lot = catalog.lotes.find((l) => sameLn(l.LN, ln) && l.idEnvio != null)
  if (lot?.idEnvio != null) {
    const envio = catalog.envios.find((e) => e.id === lot.idEnvio)
    return envio ? [envio] : []
  }
  return []
}

function lotesDeEnvioCatalog(catalog: TrazabilidadCatalogo, envioId: number): LoteCatalogo[] {
  const lines = catalog.cajas.filter((c) => c.idEnvio === envioId)
  if (lines.length === 0) {
    return catalog.lotes.filter((l) => l.idEnvio === envioId)
  }
  const seen = new Set<string>()
  const out: LoteCatalogo[] = []
  for (const line of lines) {
    for (const lot of lotesMatchingCaja(catalog, line)) {
      const key = `${lot.tipo}-${lot.id}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push(lot)
    }
  }
  return out
}

/** Árbol Envío → cajas (BIO+LN) → lotes coincidentes → muestras → lecturas → chips. */
export function buildArbolEnvio(
  catalog: TrazabilidadCatalogo,
  envioId: number
): TrazabilidadEnvioArbol | null {
  const envio = catalog.envios.find((e) => e.id === envioId) ?? null
  if (!envio) return null
  const cajas = catalog.cajas.filter((c) => c.idEnvio === envioId)
  const lotes = lotesDeEnvioCatalog(catalog, envioId).sort(
    (a, b) => a.tipo.localeCompare(b.tipo) || a.LN.localeCompare(b.LN, undefined, { numeric: true })
  )
  return {
    envio,
    cajas,
    lotes: lotes.map((l) => loteNodo(catalog, l)),
    posiblesEnvios: [envio],
  }
}

/**
 * Camino de una muestra: lote de extracción → BN → lecturas → LM → chips,
 * con los envíos posibles de ese LN.
 */
export function buildArbolMuestra(
  catalog: TrazabilidadCatalogo,
  numBN: number
): TrazabilidadEnvioArbol | null {
  const muestra = catalog.muestras.find((m) => num(m.NumBN) === numBN)
  if (!muestra) return null
  const idLtE = num(muestra.Id_LtE)
  const loteExt = idLtE != null ? catalog.lotes.find((l) => l.tipo === "extraido" && l.id === idLtE) : null
  const posiblesEnvios = loteExt ? enviosForLn(catalog, loteExt.LN) : []
  const envio = posiblesEnvios[0] ?? null
  if (loteExt) {
    return {
      envio,
      cajas: catalog.cajas.filter(
        (c) => posiblesEnvios.some((e) => e.id === c.idEnvio) && sameLn(c.LN, loteExt.LN)
      ),
      lotes: [
        {
          ...loteNodo(catalog, loteExt),
          muestras: [muestraNodo(catalog, numBN)],
        },
      ],
      posiblesEnvios,
    }
  }
  return {
    envio: null,
    cajas: [],
    lotes: [
      {
        tipo: "extraido",
        id: 0,
        LN: "",
        PN: "",
        muestras: [muestraNodo(catalog, numBN)],
        chipsCatalogo: [],
      },
    ],
    posiblesEnvios: [],
  }
}

export function findEnviosForQuery(catalog: TrazabilidadCatalogo, query: string): number[] {
  const q = query.trim().toLowerCase()
  if (!q) return catalog.envios.map((e) => e.id)

  const asBn = Number(q)
  if (/^\d+$/.test(q) && Number.isFinite(asBn)) {
    const muestra = catalog.muestras.find((m) => num(m.NumBN) === asBn)
    if (muestra) {
      const idLtE = num(muestra.Id_LtE)
      const lote = idLtE != null ? catalog.lotes.find((l) => l.tipo === "extraido" && l.id === idLtE) : null
      if (lote) return enviosForLn(catalog, lote.LN).map((e) => e.id)
      return []
    }
  }

  const ids = new Set<number>()
  for (const e of catalog.envios) {
    if (e.Sales_Order.toLowerCase().includes(q) || String(e.id) === q) ids.add(e.id)
  }
  for (const caja of catalog.cajas) {
    if (
      caja.LN.toLowerCase().includes(q) ||
      caja.Codigo_BIO.toLowerCase().includes(q) ||
      caja.Nombre.toLowerCase().includes(q)
    ) {
      ids.add(caja.idEnvio)
    }
  }
  for (const lot of catalog.lotes) {
    if (!lot.LN.toLowerCase().includes(q)) continue
    for (const envio of enviosForLn(catalog, lot.LN)) ids.add(envio.id)
  }
  return [...ids]
}
