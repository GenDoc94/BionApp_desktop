import type { supabase } from "./supabaseClient";

type SupabaseClient = typeof supabase;

export type CatalogDx = {
  Cod: number;
  Dx: string;
};

export type PreselectRow = {
  Petic_Preselect: string;
  Coment_Preselect: string | null;
  NumBN_Preselect: number | null;
  Fecha_Preselect: string | null;
  Dx_Preselect: number | null;
  DDx?: { Dx?: string | null } | null;
};

export type PreselectMuestraLink = {
  Petic_Preselect: string;
  Coment_Preselect: string | null;
  NumBN_Preselect: number;
};

export type PreselectLinksByNumBN = Record<number, PreselectMuestraLink>;

export function indexPreselectByNumBN(rows: PreselectMuestraLink[]): PreselectLinksByNumBN {
  const map: PreselectLinksByNumBN = {};
  for (const row of rows) {
    const numBN = Number(row.NumBN_Preselect);
    if (!Number.isFinite(numBN)) continue;
    map[numBN] = row;
  }
  return map;
}

export async function fetchPreselectLinksByNumBN(
  supabase: SupabaseClient
): Promise<PreselectLinksByNumBN> {
  const { data, error } = await supabase
    .from("Preselect")
    .select("Petic_Preselect, Coment_Preselect, NumBN_Preselect")
    .not("NumBN_Preselect", "is", null);

  if (error) throw error;
  return indexPreselectByNumBN((data || []) as PreselectMuestraLink[]);
}

export const PRESELECT_DUPLICATE_MESSAGE = "Petición ya incluida en lista de preselección";

const PETIC_MAX_LEN = 64;

export function normalizePetic(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  return s === "" ? null : s;
}

export function parsePeticInput(value: string): string | null {
  const trimmed = normalizePetic(value);
  if (!trimmed) return null;
  if (trimmed.length > PETIC_MAX_LEN) return null;
  if (/[\r\n\t]/.test(trimmed)) return null;
  return trimmed;
}

export function samePetic(a: unknown, b: unknown): boolean {
  const na = normalizePetic(a);
  const nb = normalizePetic(b);
  return na != null && na === nb;
}

export function formatPreselectFecha(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("es-ES");
}

export function labelDxPreselect(row: PreselectRow, dxList: CatalogDx[]): string {
  if (row.DDx?.Dx) return row.DDx.Dx;
  const cod = row.Dx_Preselect;
  if (cod == null) return "—";
  return dxList.find((d) => Number(d.Cod) === Number(cod))?.Dx ?? "—";
}

export function buildFechaPreselectNow(): string {
  return new Date().toISOString();
}

export function buildPreselectHighlightPath(petic: string | number): string {
  return `/preselect?petic=${encodeURIComponent(String(petic))}`;
}

export function parsePreselectHighlightPetic(params: URLSearchParams): string | null {
  return parsePeticInput(params.get("petic") ?? "");
}

export type PreselectSortDir = "asc" | "desc";
export type PreselectSortKey = "added" | "numBN";
export const PRESELECT_DX_FILTER_NONE = "none";

export function filterPreselectByDx(
  rows: PreselectRow[],
  dxFilter: string | null | undefined
): PreselectRow[] {
  const f = String(dxFilter ?? "").trim();
  if (!f) return rows;
  if (f === PRESELECT_DX_FILTER_NONE) {
    return rows.filter((row) => row.Dx_Preselect == null);
  }
  const cod = Number(f);
  if (!Number.isFinite(cod)) return rows;
  return rows.filter((row) => Number(row.Dx_Preselect) === cod);
}

function peticTiebreak(a: PreselectRow, b: PreselectRow): number {
  return String(a.Petic_Preselect).localeCompare(String(b.Petic_Preselect), undefined, {
    numeric: true,
  });
}

function applyDir(cmp: number, dir: PreselectSortDir): number {
  if (cmp === 0) return 0;
  return dir === "asc" ? cmp : -cmp;
}

export function sortPreselectRows(
  rows: PreselectRow[],
  key: PreselectSortKey,
  dir: PreselectSortDir
): PreselectRow[] {
  return [...rows].sort((a, b) => {
    if (key === "numBN") {
      const na = Number(a.NumBN_Preselect);
      const nb = Number(b.NumBN_Preselect);
      const aOk = Number.isFinite(na);
      const bOk = Number.isFinite(nb);
      if (!aOk && !bOk) return peticTiebreak(a, b);
      if (!aOk) return 1;
      if (!bOk) return -1;
      const cmp = na - nb;
      return cmp !== 0 ? applyDir(cmp, dir) : peticTiebreak(a, b);
    }

    const ta = a.Fecha_Preselect ? Date.parse(a.Fecha_Preselect) : NaN;
    const tb = b.Fecha_Preselect ? Date.parse(b.Fecha_Preselect) : NaN;
    const aOk = Number.isFinite(ta);
    const bOk = Number.isFinite(tb);
    if (!aOk && !bOk) return peticTiebreak(a, b);
    if (!aOk) return 1;
    if (!bOk) return -1;
    const cmp = ta - tb;
    return cmp !== 0 ? applyDir(cmp, dir) : peticTiebreak(a, b);
  });
}

export async function fetchNextNumBN(supabase: SupabaseClient): Promise<number> {
  const { data, error } = await supabase
    .from("Muestras")
    .select("NumBN")
    .order("NumBN", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.NumBN ? Number(data.NumBN) + 1 : 1;
}

export async function crearMuestraDesdePreselect(
  supabase: SupabaseClient,
  petic: string
): Promise<number> {
  const peticN = parsePeticInput(petic);
  if (!peticN) throw new Error("Nº de petición vacío");

  const { data: preselectRow, error: preselectError } = await supabase
    .from("Preselect")
    .select("Petic_Preselect, NumBN_Preselect, Dx_Preselect")
    .eq("Petic_Preselect", peticN)
    .maybeSingle();

  if (preselectError) throw preselectError;
  if (!preselectRow) throw new Error("No se encontró la petición en preselección");
  if (preselectRow.NumBN_Preselect != null) {
    throw new Error("Esta petición ya tiene un Nº Bionano asignado");
  }

  const { data: muestraConPetic, error: peticCheckError } = await supabase
    .from("Muestras")
    .select("NumBN, Petic")
    .eq("Petic", peticN)
    .maybeSingle();

  if (peticCheckError) throw peticCheckError;
  if (muestraConPetic?.NumBN != null) {
    throw new Error(
      `La petición ${peticN} ya existe en Muestras (Nº ${muestraConPetic.NumBN})`
    );
  }

  const numBN = await fetchNextNumBN(supabase);

  const muestraInsert: {
    NumBN: number;
    Petic: string;
    Estado_Muestra: null;
    Dx?: number;
  } = {
    NumBN: numBN,
    Petic: peticN,
    Estado_Muestra: null,
  };

  if (preselectRow.Dx_Preselect != null) {
    muestraInsert.Dx = Number(preselectRow.Dx_Preselect);
  }

  const { error: insertError } = await supabase.from("Muestras").insert([muestraInsert]);

  if (insertError) throw insertError;

  const { error: linkError } = await supabase
    .from("Preselect")
    .update({ NumBN_Preselect: numBN })
    .eq("Petic_Preselect", peticN);

  if (linkError) {
    await supabase.from("Muestras").delete().eq("NumBN", numBN);
    throw linkError;
  }

  return numBN;
}
