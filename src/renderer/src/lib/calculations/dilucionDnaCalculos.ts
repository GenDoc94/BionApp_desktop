import { calcStatsLectura } from "./lecturaCalculos";

/** Dilución DNA — mismas fórmulas que la hoja «Cálculos DNA» del Excel del laboratorio */

export const DILUCION_VOL_TOTAL_UL = 19.5;
export const DILUCION_TARGET_NG = 750;
export const DILUCION_MIN_NG = 500;
export const DILUCION_MEDIA_IDEAL_MIN = 39;
export const DILUCION_MEDIA_IDEAL_MAX = 150;
export const DILUCION_MAX_MUESTRAS = 12;

export type DilucionDnaResultado = {
  volH2OUl: number | null;
  volDnaUl: number | null;
  /** ng totales en el volumen de DNA usado (columna H del Excel cuando aplica) */
  ngEnMezclaDna: number | null;
  /** true si el volumen de DNA quedó limitado a 19,5 µL */
  volumenDnaAlMaximo: boolean;
  mediaFueraRangoIdeal: boolean;
  bajoMinimoNg: boolean;
  error: string | null;
};

export function calcDilucionDna(
  mediaNgPerUl: number | null | undefined,
  options?: {
    volTotalUl?: number;
    targetNg?: number;
    minNg?: number;
  }
): DilucionDnaResultado {
  const volTotalUl = options?.volTotalUl ?? DILUCION_VOL_TOTAL_UL;
  const targetNg = options?.targetNg ?? DILUCION_TARGET_NG;
  const minNg = options?.minNg ?? DILUCION_MIN_NG;

  const media = mediaNgPerUl != null ? Number(mediaNgPerUl) : NaN;
  if (!Number.isFinite(media) || media <= 0) {
    return {
      volH2OUl: null,
      volDnaUl: null,
      ngEnMezclaDna: null,
      volumenDnaAlMaximo: false,
      mediaFueraRangoIdeal: false,
      bajoMinimoNg: false,
      error: "Media de DNA no válida",
    };
  }

  // Excel E6: IF((750/C6)>19.5, 19.5, 750/C6)
  const volDnaCrudo = targetNg / media;
  const volDnaUl = Math.min(volTotalUl, volDnaCrudo);
  const volumenDnaAlMaximo = volDnaUl >= volTotalUl - 1e-9;

  // Excel D6: IF(($F$2-E6)<0, 0, $F$2-E6)
  const volH2OUl = Math.max(0, volTotalUl - volDnaUl);

  // Excel H6: IF((E6=19.5), (19.5*C6), "") — en app siempre mostramos ng:
  // 750 si cabe el objetivo; 19,5 × media si el DNA va al máximo (queda por debajo).
  const ngEnMezclaDna = volumenDnaAlMaximo ? volTotalUl * media : targetNg;

  const mediaFueraRangoIdeal =
    media < DILUCION_MEDIA_IDEAL_MIN || media > DILUCION_MEDIA_IDEAL_MAX;
  const bajoMinimoNg = volumenDnaAlMaximo && ngEnMezclaDna < minNg;

  return {
    volH2OUl,
    volDnaUl,
    ngEnMezclaDna,
    volumenDnaAlMaximo,
    mediaFueraRangoIdeal,
    bajoMinimoNg,
    error: null,
  };
}

export function formatDilucionUl(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return value.toFixed(1);
}

export function formatDilucionNg(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return value.toFixed(1);
}

export function formatDilucionCv(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return value.toFixed(2);
}

export function lecturaDilucionKey(numBN: number, numLectura: number): string {
  return `${numBN}_${numLectura}`;
}

/** Media ng/µL: columna Media_Lectura o, si falta, (I+C+D)/3 como en la pantalla principal */
export function effectiveMediaNgPerUlFromLectura(row: {
  Media_Lectura?: unknown;
  Izq?: unknown;
  Cen?: unknown;
  Dcha?: unknown;
}): number | null {
  const stored = row.Media_Lectura != null && row.Media_Lectura !== "" ? Number(row.Media_Lectura) : NaN;
  if (Number.isFinite(stored) && stored > 0) return stored;

  const { media } = calcStatsLectura(row.Izq, row.Cen, row.Dcha);
  if (media != null && media > 0) return media;
  return null;
}

export function effectiveCvFromLectura(row: {
  CV_Lectura?: unknown;
  Izq?: unknown;
  Cen?: unknown;
  Dcha?: unknown;
}): number | null {
  const stored = row.CV_Lectura != null && row.CV_Lectura !== "" ? Number(row.CV_Lectura) : NaN;
  if (Number.isFinite(stored)) return stored;
  const { cv } = calcStatsLectura(row.Izq, row.Cen, row.Dcha);
  return cv;
}

function tieneValorRelleno(value: unknown): boolean {
  return value != null && value !== "";
}

/** Campos de Marcado que indican que el laboratorio ya avanzó (no el alta en Acciones). */
const CAMPOS_MARCADO_PROGRESO = [
  "Comentario_Membrana",
  "Fecha_Lect_Marc",
  "Cargado_M",
  "Izq_M",
  "Dcha_M",
] as const;

/** Cuantificación de lo marcado. LN y fecha de Datos del marcado pueden existir al crear. */
const CAMPOS_LM_PROGRESO = [
  "Cargado_LM",
  "Izq_LM",
  "Dcha_LM",
  "Media_LM",
] as const;

function lecturasMarcadoDe(row: Record<string, unknown>): Record<string, unknown>[] {
  const lms = row.Lecturas_Marcado;
  if (Array.isArray(lms)) {
    return lms.filter((r): r is Record<string, unknown> => r != null && typeof r === "object");
  }
  if (lms != null && typeof lms === "object") return [lms as Record<string, unknown>];
  return [];
}

function lmConProgreso(lm: Record<string, unknown>): boolean {
  return CAMPOS_LM_PROGRESO.some((k) => tieneValorRelleno(lm[k]));
}

function marcadoConProgreso(row: Record<string, unknown>): boolean {
  if (CAMPOS_MARCADO_PROGRESO.some((k) => tieneValorRelleno(row[k]))) return true;
  return lecturasMarcadoDe(row).some(lmConProgreso);
}

/**
 * Candidata a dilución DNA: marcaje iniciado en Acciones (Marcado + ≥1 LM)
 * y aún sin rellenar cuantificación ni otros datos de laboratorio.
 * Fecha_Marcado y LN no cuentan como “más relleno”.
 */
export function lecturaListaParaDilucionMarcaje(marcado: unknown): boolean {
  if (marcado == null) return false;
  const rows = Array.isArray(marcado) ? marcado : [marcado];
  let algunaLm = false;
  for (const r of rows) {
    if (r == null || typeof r !== "object") continue;
    const row = r as Record<string, unknown>;
    const lms = lecturasMarcadoDe(row);
    if (lms.length === 0) continue;
    algunaLm = true;
    if (marcadoConProgreso(row)) return false;
  }
  return algunaLm;
}

function claveLectura(numBN: unknown, numLectura: unknown): string | null {
  const bn = Number(numBN);
  const lect = Number(numLectura);
  if (!Number.isFinite(bn) || !Number.isFinite(lect)) return null;
  return `${bn}:${lect}`;
}

/** Une Marcado + Lecturas_Marcado a cada Lectura (el SQLite de escritorio no hace embeds PostgREST). */
export function nestMarcadoEnLecturas(
  lecturas: Record<string, unknown>[],
  marcados: Record<string, unknown>[],
  lecturasMarcado: Record<string, unknown>[]
): Record<string, unknown>[] {
  const lmsPorLectura = new Map<string, Record<string, unknown>[]>();
  for (const lm of lecturasMarcado) {
    const key = claveLectura(lm.NumBN_LM, lm.NumLectura_LM);
    if (!key) continue;
    const list = lmsPorLectura.get(key) ?? [];
    list.push(lm);
    lmsPorLectura.set(key, list);
  }

  const marcadoPorLectura = new Map<string, Record<string, unknown>>();
  for (const row of marcados) {
    const key = claveLectura(row.NumBN_M, row.NumLectura_M);
    if (!key) continue;
    marcadoPorLectura.set(key, {
      ...row,
      Lecturas_Marcado: lmsPorLectura.get(key) ?? [],
    });
  }

  return lecturas.map((l) => {
    const key = claveLectura(l.NumBN_L, l.NumLectura);
    return {
      ...l,
      Marcado: key ? marcadoPorLectura.get(key) ?? null : null,
    };
  });
}
