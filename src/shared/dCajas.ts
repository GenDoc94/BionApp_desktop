/** Catálogo de cajas BIO (como DMuestra / DDx). Tipo filtra los LN de Lotes. */

export const CAJA_TIPOS = ["extraido", "marcado", "chip"] as const
export type CajaTipo = (typeof CAJA_TIPOS)[number]

export type CajaLotTipo = "extraido" | "marcado" | "membrana" | "chip"

export type DCajaSeed = {
  Codigo_BIO: string
  Nombre: string
  Tipo: CajaTipo
}

/** Kits Bionano de partida; se insertan si DCajas está vacía. */
export const DEFAULT_DCJAS: readonly DCajaSeed[] = [
  {
    Codigo_BIO: "BIO-80117",
    Nombre: "Bionano Prep DLS-G2 Labeling Kit (24 Reactions)",
    Tipo: "marcado",
  },
  {
    Codigo_BIO: "BIO-80045",
    Nombre: "Bionano Prep DLS-G2 Labeling Kit (12 Reactions)",
    Tipo: "marcado",
  },
  {
    Codigo_BIO: "BIO-80118",
    Nombre: "Bionano Prep SP-G2 Blood & Cell Isolation Kit, 24 Rxn",
    Tipo: "extraido",
  },
  {
    Codigo_BIO: "BIO-80066",
    Nombre: "Saphyr Chip G3.3 4-Chip Pack",
    Tipo: "chip",
  },
]

export function parseCajaTipo(value: unknown): CajaTipo | null {
  const s = String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
  if (s === "extraido" || s === "extraccion") return "extraido"
  if (s === "marcado" || s === "marcaje" || s === "labeling") return "marcado"
  if (s === "chip" || s === "chips") return "chip"
  return null
}

/** Marcaje → Lotes_Marcado; extracción → extraído; chips → chips. */
export function lotTiposForCajaTipo(tipo: CajaTipo): CajaLotTipo[] {
  if (tipo === "marcado") return ["marcado"]
  if (tipo === "chip") return ["chip"]
  return ["extraido"]
}
