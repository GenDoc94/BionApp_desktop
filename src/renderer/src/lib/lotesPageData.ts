export const LOTE_TIPOS = ["extraido", "marcado", "membrana"] as const
export type LoteTipo = (typeof LOTE_TIPOS)[number]

export const LOTE_ID_COL: Record<LoteTipo, string> = {
  extraido: "Id_LtE",
  marcado: "Id_LtM",
  membrana: "Id_LtMm",
}

function pad2(n: number): string {
  return String(n).padStart(2, "0")
}

export function parseLotExpParts(
  value: string | null | undefined
): { d: number; m: number; y: number } | null {
  const raw = String(value ?? "").trim()
  if (!raw) return null
  const iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (iso) {
    const y = Number(iso[1])
    const m = Number(iso[2])
    const d = Number(iso[3])
    if (m < 1 || m > 12 || d < 1 || d > 31) return null
    return { d, m, y }
  }
  const parts = raw.replace(/-/g, "/").split("/").map((p) => p.trim())
  if (parts.length !== 3) return null
  const a = Number(parts[0])
  const b = Number(parts[1])
  const c = Number(parts[2])
  if (![a, b, c].every((n) => Number.isInteger(n))) return null
  let day: number
  let month: number
  let year: number
  if (a >= 1000 && a <= 9999) {
    year = a
    month = b
    day = c
  } else {
    year = c
    if (year < 1000 || year > 9999) return null
    if (a > 12 && b >= 1 && b <= 12) {
      day = a
      month = b
    } else if (b > 12 && a >= 1 && a <= 12) {
      day = b
      month = a
    } else {
      day = a
      month = b
    }
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  return { d: day, m: month, y: year }
}

/** Valor para `<input type="date">` (YYYY-MM-DD). */
export function lotExpToInputValue(exp: string | null | undefined): string {
  const p = parseLotExpParts(exp)
  if (!p) return ""
  return `${p.y}-${pad2(p.m)}-${pad2(p.d)}`
}

/** Caducidad canónica DD/MM/AAAA a partir del calendario. */
export function lotExpFromInputValue(iso: string | null | undefined): string {
  const p = parseLotExpParts(iso)
  if (!p) return String(iso ?? "").trim()
  return `${pad2(p.d)}/${pad2(p.m)}/${p.y}`
}

export type LoteRow = {
  id: number
  PN: string
  LN: string
  Exp: string
}

export type LoteUsoExtraido = { NumBN: number; Estado_Muestra: number | null }
export type LoteUsoLm = {
  NumBN: number
  NumLectura: number
  NumLectMarc: number
  mediaLm: number | null
}

export type LoteEstadoColor = "green" | "yellow" | "red" | "none"

export type LoteEstadoCounts = {
  green: number
  yellow: number
  red: number
  none: number
}

/** Umbral QC de lotes de marcado/membrana: media de lectura marcada. */
export const LOTE_LM_MEDIA_THRESHOLD = 3

export function emptyLoteEstadoCounts(): LoteEstadoCounts {
  return { green: 0, yellow: 0, red: 0, none: 0 }
}

export function parseEstadoMuestra(value: unknown): number | null {
  if (value == null || value === "") return null
  const n = Number(value)
  return n === 1 || n === 2 || n === 3 ? n : null
}

export function estadoMuestraColor(estado: unknown): LoteEstadoColor {
  const n = parseEstadoMuestra(estado)
  if (n === 1) return "red"
  if (n === 2) return "yellow"
  if (n === 3) return "green"
  return "none"
}

export function parseMediaLm(row: {
  Media_LM?: unknown
  Izq_LM?: unknown
  Dcha_LM?: unknown
  mediaLm?: unknown
}): number | null {
  if (row.mediaLm != null && row.mediaLm !== "") {
    const n = Number(row.mediaLm)
    if (Number.isFinite(n)) return n
  }
  if (row.Media_LM != null && row.Media_LM !== "") {
    const n = Number(row.Media_LM)
    if (Number.isFinite(n)) return n
  }
  const izq = Number(row.Izq_LM)
  const dcha = Number(row.Dcha_LM)
  if (!Number.isFinite(izq) || !Number.isFinite(dcha)) return null
  return (izq + dcha) / 2
}

/** Verde si la media no es inferior a 3; rojo si es < 3. Sin media: sin color. */
export function loteLmMediaColor(media: number | null | undefined): LoteEstadoColor {
  if (media == null || !Number.isFinite(media)) return "none"
  return media < LOTE_LM_MEDIA_THRESHOLD ? "red" : "green"
}

export function countLoteEstados(colors: LoteEstadoColor[]): LoteEstadoCounts {
  const counts = emptyLoteEstadoCounts()
  for (const color of colors) counts[color] += 1
  return counts
}

export function countEstadosExtraido(usos: LoteUsoExtraido[]): LoteEstadoCounts {
  return countLoteEstados(usos.map((u) => estadoMuestraColor(u.Estado_Muestra)))
}

export function countEstadosLm(usos: LoteUsoLm[]): LoteEstadoCounts {
  return countLoteEstados(usos.map((u) => loteLmMediaColor(u.mediaLm)))
}

export type LotesHighlight = {
  tipo: LoteTipo
  id?: number
  ln?: string
}

export function isLoteTipo(value: string | null | undefined): value is LoteTipo {
  return value === "extraido" || value === "marcado" || value === "membrana"
}

export function lotIdFromRow(
  row: Record<string, unknown>,
  tipo: LoteTipo
): number | null {
  const key = tipo === "extraido" ? "Id_LtE" : tipo === "marcado" ? "Id_LtM" : "Id_LtMm"
  const n = Number(row[key])
  return Number.isFinite(n) ? n : null
}

export function toLoteRow(row: Record<string, unknown>, tipo: LoteTipo): LoteRow | null {
  const id = lotIdFromRow(row, tipo)
  if (id == null) return null
  return {
    id,
    PN: String(row.PN ?? ""),
    LN: String(row.LN ?? ""),
    Exp: String(row.Exp ?? ""),
  }
}

export function sortLots(lots: LoteRow[]): LoteRow[] {
  return [...lots].sort((a, b) => {
    const ln = String(b.LN).localeCompare(String(a.LN), undefined, { numeric: true })
    if (ln !== 0) return ln
    const exp = String(a.Exp).localeCompare(String(b.Exp), undefined, { numeric: true })
    if (exp !== 0) return exp
    return String(a.PN).localeCompare(String(b.PN), undefined, { numeric: true })
  })
}

export function lotOptionLabel(lot: LoteRow, siblings: LoteRow[]): string {
  const ln = lot.LN.trim() || "—"
  const sameLn = siblings.filter((s) => s.LN === lot.LN)
  if (sameLn.length <= 1) return ln
  const parts = [ln]
  if (lot.Exp.trim()) parts.push(lot.Exp.trim())
  else if (lot.PN.trim()) parts.push(lot.PN.trim())
  return parts.join(" · ")
}

export function findLotId(
  lots: LoteRow[],
  current: { id?: unknown; PN?: unknown; LN?: unknown; Exp?: unknown }
): number | null {
  const id = Number(current.id)
  if (Number.isFinite(id) && lots.some((l) => l.id === id)) return id
  const pn = String(current.PN ?? "").trim()
  const ln = String(current.LN ?? "").trim()
  const exp = String(current.Exp ?? "").trim()
  if (!ln && !pn) return null
  const found = lots.find(
    (l) => l.PN.trim() === pn && l.LN.trim() === ln && l.Exp.trim() === exp
  )
  return found?.id ?? null
}

/** LN visible: el del catálogo si la muestra ya no trae la columna denormalizada. */
export function lotLnForDisplay(
  lots: LoteRow[],
  current: { id?: unknown; PN?: unknown; LN?: unknown; Exp?: unknown }
): string {
  const direct = String(current.LN ?? "").trim()
  if (direct) return direct
  const id = findLotId(lots, current)
  if (id == null) return ""
  return lots.find((l) => l.id === id)?.LN.trim() ?? ""
}

export function hydrateMuestrasFromLots(
  muestras: Array<Record<string, unknown>>,
  extraido: LoteRow[]
): void {
  const byId = new Map(extraido.map((l) => [l.id, l]))
  for (const row of muestras) {
    const id = Number(row.Id_LtE)
    const lot = Number.isFinite(id) ? byId.get(id) : undefined
    row.PN = lot?.PN ?? null
    row.LN = lot?.LN ?? null
    row.Exp = lot?.Exp ?? null
  }
}

export function hydrateLecturasMarcadoFromLots(
  rows: Array<Record<string, unknown>>,
  marcado: LoteRow[],
  membrana: LoteRow[]
): void {
  const mById = new Map(marcado.map((l) => [l.id, l]))
  const mmById = new Map(membrana.map((l) => [l.id, l]))
  for (const row of rows) {
    const idM = Number(row.Id_LtM)
    const lotM = Number.isFinite(idM) ? mById.get(idM) : undefined
    row.PN_LM = lotM?.PN ?? null
    row.LN_LM = lotM?.LN ?? null
    row.Exp_LM = lotM?.Exp ?? null
    const idMm = Number(row.Id_LtMm)
    const lotMm = Number.isFinite(idMm) ? mmById.get(idMm) : undefined
    row.PNM_LM = lotMm?.PN ?? null
    row.LNM_LM = lotMm?.LN ?? null
    row.ExpM_LM = lotMm?.Exp ?? null
  }
}

export function parseLotesHighlight(params: URLSearchParams): LotesHighlight | null {
  const tipoRaw = params.get("tipo")
  const tipo = isLoteTipo(tipoRaw) ? tipoRaw : "extraido"
  const idRaw = params.get("id")
  const ln = params.get("ln")?.trim() || undefined
  const id = idRaw != null && idRaw !== "" ? Number(idRaw) : NaN
  if (Number.isFinite(id)) return { tipo, id }
  if (ln) return { tipo, ln }
  if (isLoteTipo(tipoRaw)) return { tipo }
  return null
}

export function buildLotesHighlightPath(highlight: LotesHighlight): string {
  const params = new URLSearchParams()
  params.set("tipo", highlight.tipo)
  if (highlight.id != null && Number.isFinite(highlight.id)) {
    params.set("id", String(highlight.id))
  } else if (highlight.ln) {
    params.set("ln", highlight.ln)
  }
  params.set("tab", "lotes")
  return `/calidad?${params.toString()}`
}

export function loteCardDomId(tipo: LoteTipo, id: number): string {
  return `lote-${tipo}-${id}`
}

export function resolveHighlightedLotId(
  lots: LoteRow[],
  highlight: LotesHighlight | null
): number | null {
  if (!highlight) return null
  if (highlight.id != null && lots.some((l) => l.id === highlight.id)) return highlight.id
  if (highlight.ln) {
    const matches = lots.filter((l) => l.LN === highlight.ln)
    return matches[0]?.id ?? null
  }
  return null
}

export function groupUsosExtraido(
  rows: Array<{ Id_LtE?: unknown; NumBN?: unknown; Estado_Muestra?: unknown }>
): Map<number, LoteUsoExtraido[]> {
  const map = new Map<number, LoteUsoExtraido[]>()
  for (const row of rows) {
    const id = Number(row.Id_LtE)
    const numBN = Number(row.NumBN)
    if (!Number.isFinite(id) || !Number.isFinite(numBN)) continue
    const arr = map.get(id)
    const uso = { NumBN: numBN, Estado_Muestra: parseEstadoMuestra(row.Estado_Muestra) }
    if (arr) arr.push(uso)
    else map.set(id, [uso])
  }
  for (const arr of map.values()) arr.sort((a, b) => a.NumBN - b.NumBN)
  return map
}

export function groupUsosLm(
  rows: Array<{
    lotId?: unknown
    NumBN?: unknown
    NumLectura?: unknown
    NumLectMarc?: unknown
    Media_LM?: unknown
    Izq_LM?: unknown
    Dcha_LM?: unknown
    mediaLm?: unknown
  }>
): Map<number, LoteUsoLm[]> {
  const map = new Map<number, LoteUsoLm[]>()
  for (const row of rows) {
    const id = Number(row.lotId)
    const numBN = Number(row.NumBN)
    const numLectura = Number(row.NumLectura)
    const numLectMarc = Number(row.NumLectMarc)
    if (
      !Number.isFinite(id) ||
      !Number.isFinite(numBN) ||
      !Number.isFinite(numLectura) ||
      !Number.isFinite(numLectMarc)
    ) {
      continue
    }
    const uso = {
      NumBN: numBN,
      NumLectura: numLectura,
      NumLectMarc: numLectMarc,
      mediaLm: parseMediaLm(row),
    }
    const arr = map.get(id)
    if (arr) arr.push(uso)
    else map.set(id, [uso])
  }
  for (const arr of map.values()) {
    arr.sort(
      (a, b) =>
        a.NumBN - b.NumBN || a.NumLectura - b.NumLectura || a.NumLectMarc - b.NumLectMarc
    )
  }
  return map
}

export function filterLots(
  lots: LoteRow[],
  usosExtraido: Map<number, LoteUsoExtraido[]>,
  usosLm: Map<number, LoteUsoLm[]>,
  query: string
): LoteRow[] {
  const q = query.trim().toLowerCase()
  if (!q) return lots
  return lots.filter((lot) => {
    if (
      lot.LN.toLowerCase().includes(q) ||
      lot.PN.toLowerCase().includes(q) ||
      lot.Exp.toLowerCase().includes(q)
    ) {
      return true
    }
    const extra = usosExtraido.get(lot.id) || []
    if (extra.some((u) => String(u.NumBN).includes(q))) return true
    const lm = usosLm.get(lot.id) || []
    return lm.some(
      (u) =>
        String(u.NumBN).includes(q) ||
        String(u.NumLectura).includes(q) ||
        String(u.NumLectMarc).includes(q)
    )
  })
}

export function lotMatchesSearchBlob(lot: LoteRow, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return (
    lot.LN.toLowerCase().includes(q) ||
    lot.PN.toLowerCase().includes(q) ||
    lot.Exp.toLowerCase().includes(q)
  )
}
