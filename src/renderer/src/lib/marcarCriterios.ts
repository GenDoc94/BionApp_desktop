import { calcStatsLectura } from "./calculations/lecturaCalculos";

export const MARCAR_THRESHOLD_MEDIA = 25.65;
/** Máximo de lecturas de marcado (LM) distintas por lectura extraída; con 2 ya no hay ADN para un tercero. */
export const MARCAR_MAX_LM_ROWS = 2;
export const MARCAR_MAX_MEDIA_LM = 2;
export const MARCAR_MIN_CHIPS_FALLO = 2;

export type ChipMarcadoRow = {
  NumChip?: number | null;
  Repetir_Chip?: number | null;
};

export type LmMarcadoRow = {
  NumLectMarc?: number | null;
  Media_LM?: number | null;
  Izq_LM?: number | string | null;
  Dcha_LM?: number | string | null;
};

export type LecturaExtraidaRow = {
  Media_Lectura?: unknown;
  Izq?: unknown;
  Cen?: unknown;
  Dcha?: unknown;
};

export type MarcarMotivo = "sin-marcado" | "chip-fallo";

export type MarcarEvaluacion = {
  variant: "normal" | "ambar";
  lmCount: number;
  motivo: MarcarMotivo;
};

export function chipRepetirActivo(ch: ChipMarcadoRow | null | undefined): boolean {
  return ch != null && ch.Repetir_Chip != null && Number(ch.Repetir_Chip) === 1;
}

/** Media ng/µL: Media_Lectura en BD o (Izq + Cen + Dcha) / 3 si falta. */
export function mediaLecturaExtraidaEfectiva(row: LecturaExtraidaRow): number | null {
  const stored =
    row.Media_Lectura != null && row.Media_Lectura !== "" ? Number(row.Media_Lectura) : NaN;
  if (Number.isFinite(stored)) return stored;
  const { media } = calcStatsLectura(row.Izq, row.Cen, row.Dcha);
  return media;
}

/** Media de lectura marcada: Media_LM o (Izq_LM + Dcha_LM) / 2. */
export function mediaDeMarcadoLM(lm: LmMarcadoRow | null | undefined): number | null {
  if (lm == null) return null;
  if (typeof lm.Media_LM === "number" && Number.isFinite(lm.Media_LM)) return lm.Media_LM;
  const izq = lm.Izq_LM != null ? Number(lm.Izq_LM) : NaN;
  const dcha = lm.Dcha_LM != null ? Number(lm.Dcha_LM) : NaN;
  if (!Number.isFinite(izq) || !Number.isFinite(dcha)) return null;
  return (izq + dcha) / 2;
}

function sortLmRows(lmRows: LmMarcadoRow[]): LmMarcadoRow[] {
  return [...lmRows].sort(
    (a, b) => Number(a.NumLectMarc ?? 0) - Number(b.NumLectMarc ?? 0)
  );
}

/** Al menos 2 chips marcados con Repetir_Chip en la LM (icono !). */
export function tieneDosChipsFallidos(chips: ChipMarcadoRow[]): boolean {
  const fallidos = chips.filter(chipRepetirActivo);
  return fallidos.length >= MARCAR_MIN_CHIPS_FALLO;
}

export function labelMarcarTipo(evaluacion: MarcarEvaluacion): string {
  switch (evaluacion.motivo) {
    case "sin-marcado":
      return "Sin marcado";
    case "chip-fallo":
      return `Volver a marcar (${evaluacion.lmCount} LM, ≥${MARCAR_MIN_CHIPS_FALLO} chips con !)`;
    default:
      return "—";
  }
}

/**
 * Decide si una lectura extraída debe aparecer en «Marcar».
 * El marcado se juzga por filas LM (no solo la tabla Marcado).
 *
 * - Normal: sin ninguna LM en esa lectura extraída (p. ej. 2.ª lectura sin marcar).
 * - Ámbar: 1 LM y ≥2 chips con Repetir_Chip.
 * - Excluida: ya hay 2 LM en esa lectura extraída, o no cumple chips fallidos.
 */
export function evaluarMarcarLectura(input: {
  mediaLectura: number | null | undefined;
  lmRows: LmMarcadoRow[];
  chipsUltimaLm?: ChipMarcadoRow[];
}): MarcarEvaluacion | null {
  const mediaLectura =
    input.mediaLectura != null && Number.isFinite(Number(input.mediaLectura))
      ? Number(input.mediaLectura)
      : null;

  if (mediaLectura == null || mediaLectura <= MARCAR_THRESHOLD_MEDIA) return null;

  const lmRows = sortLmRows(input.lmRows);
  const n = lmRows.length;

  if (n === 0) {
    return { variant: "normal", lmCount: 0, motivo: "sin-marcado" };
  }

  if (n >= MARCAR_MAX_LM_ROWS) return null;

  const latest = lmRows[n - 1];
  const latestMedia = mediaDeMarcadoLM(latest);

  if (latestMedia == null) return null;

  if (tieneDosChipsFallidos(input.chipsUltimaLm ?? [])) {
    return { variant: "ambar", lmCount: n, motivo: "chip-fallo" };
  }

  return null;
}
