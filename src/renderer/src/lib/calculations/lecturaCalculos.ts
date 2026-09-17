/** Cálculos en cliente — mismas fórmulas que los triggers de Supabase */

export function parseNumForCalc(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = parseFloat(String(value));
  return Number.isFinite(n) ? n : null;
}

export type LecturaTresStats = {
  media: number | null;
  sd: number | null;
  cv: number | null;
};

/** Trigger actualizar_media_lectura: (Izq + Cen + Dcha) / 3, SD y CV derivados */
export function calcStatsLectura(izq: unknown, cen: unknown, dcha: unknown): LecturaTresStats {
  const i = parseNumForCalc(izq);
  const c = parseNumForCalc(cen);
  const d = parseNumForCalc(dcha);
  if (i === null || c === null || d === null) {
    return { media: null, sd: null, cv: null };
  }
  const media = (i + c + d) / 3;
  const sd = Math.sqrt(((i - media) ** 2 + (c - media) ** 2 + (d - media) ** 2) / 3);
  const cv = media === 0 ? null : sd / media;
  return { media, sd, cv };
}

export type MarcadoDosStats = {
  media: number | null;
  sd: number | null;
  cv: number | null;
};

/** Trigger actualizar_media_lm: (Izq_LM + Dcha_LM) / 2, SD_LM y CV_LM derivados */
export function calcStatsMarcado(izqLm: unknown, dchaLm: unknown): MarcadoDosStats {
  const i = parseNumForCalc(izqLm);
  const d = parseNumForCalc(dchaLm);
  if (i === null || d === null) {
    return { media: null, sd: null, cv: null };
  }
  const media = (i + d) / 2;
  const sd = Math.sqrt(((i - media) ** 2 + (d - media) ** 2) / 2);
  const cv = media === 0 ? null : sd / media;
  return { media, sd, cv };
}

export function formatCalcStat(value: number | null | undefined, decimals = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return value.toFixed(decimals);
}

/** Rangos inclusivos del cajetín de media (muestra): extraído 45–90, marcado 4–16. */
export const MEDIA_EXTRAIDO_OK_MIN = 45;
export const MEDIA_EXTRAIDO_OK_MAX = 90;
export const MEDIA_MARCADO_OK_MIN = 4;
export const MEDIA_MARCADO_OK_MAX = 16;

/** Verde / rojo / amarillo reutilizan `lectura-cuant-ok|bajo|alto` de Acciones. */
export function cuantificacionSemaforoClass(
  value: unknown,
  minOk: number,
  maxOk: number
): string {
  const n = parseNumForCalc(value);
  if (n === null) return "";
  if (n < minOk) return "lectura-cuant-bajo";
  if (n > maxOk) return "lectura-cuant-alto";
  return "lectura-cuant-ok";
}

export function mediaExtraidoSemaforoClass(value: unknown): string {
  return cuantificacionSemaforoClass(value, MEDIA_EXTRAIDO_OK_MIN, MEDIA_EXTRAIDO_OK_MAX);
}

export function mediaMarcadoSemaforoClass(value: unknown): string {
  return cuantificacionSemaforoClass(value, MEDIA_MARCADO_OK_MIN, MEDIA_MARCADO_OK_MAX);
}
