import type { supabase } from "./supabaseClient";

type SupabaseClient = typeof supabase;

export type CatalogDx = {
  Cod: number;
  Dx: string;
};

export type PreselectRow = {
  Petic_Preselect: number;
  Coment_Preselect: string | null;
  NumBN_Preselect: number | null;
  Fecha_Preselect: string | null;
  Dx_Preselect: number | null;
  DDx?: { Dx?: string | null } | null;
};

export type PreselectMuestraLink = {
  Petic_Preselect: number;
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

export function parsePeticInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const num = Number(trimmed);
  if (!Number.isFinite(num) || !Number.isInteger(num) || num <= 0) return null;
  return num;
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

export function buildPreselectHighlightPath(petic: number): string {
  return `/preselect?petic=${petic}`;
}

export function parsePreselectHighlightPetic(params: URLSearchParams): number | null {
  const raw = params.get("petic");
  if (!raw) return null;
  const petic = Number(raw);
  return Number.isFinite(petic) && petic > 0 ? petic : null;
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
  petic: number
): Promise<number> {
  const { data: preselectRow, error: preselectError } = await supabase
    .from("Preselect")
    .select("Petic_Preselect, NumBN_Preselect, Dx_Preselect")
    .eq("Petic_Preselect", petic)
    .maybeSingle();

  if (preselectError) throw preselectError;
  if (!preselectRow) throw new Error("No se encontró la petición en preselección");
  if (preselectRow.NumBN_Preselect != null) {
    throw new Error("Esta petición ya tiene un Nº Bionano asignado");
  }

  const { data: muestraConPetic, error: peticCheckError } = await supabase
    .from("Muestras")
    .select("NumBN, Petic")
    .eq("Petic", petic)
    .maybeSingle();

  if (peticCheckError) throw peticCheckError;
  if (muestraConPetic?.NumBN != null) {
    throw new Error(
      `La petición ${petic} ya existe en Muestras (Nº ${muestraConPetic.NumBN})`
    );
  }

  const numBN = await fetchNextNumBN(supabase);

  const muestraInsert: {
    NumBN: number;
    Petic: number;
    Estado_Muestra: null;
    Dx?: number;
  } = {
    NumBN: numBN,
    Petic: petic,
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
    .eq("Petic_Preselect", petic);

  if (linkError) {
    await supabase.from("Muestras").delete().eq("NumBN", numBN);
    throw linkError;
  }

  return numBN;
}
