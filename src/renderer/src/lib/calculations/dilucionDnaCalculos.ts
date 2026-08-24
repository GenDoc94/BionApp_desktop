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

  // Excel H6: IF((E6=19.5), (19.5*C6), "")
  const ngEnMezclaDna = volumenDnaAlMaximo ? volTotalUl * media : volDnaUl * media;

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

const CAMPOS_MARCADO_CON_DATOS = [
  "Fecha_Marcado",
  "PN_Membrana",
  "LN_Membrana",
  "Exp_Membrana",
  "Comentario_Membrana",
  "Fecha_Lect_Marc",
  "Cargado_M",
  "Izq_M",
  "Dcha_M",
  "PN_M",
  "LN_M",
  "Exp_M",
] as const;

function filaMarcadoConDatos(row: Record<string, unknown>): boolean {
  const lms = row.Lecturas_Marcado;
  if (Array.isArray(lms) && lms.length > 0) return true;

  return CAMPOS_MARCADO_CON_DATOS.some((k) => {
    const v = row[k];
    return v != null && v !== "";
  });
}

/**
 * Marcaje “real” (hay LM o datos en Marcado). Una fila vacía en Marcado (solo BN+L)
 * no cuenta — p. ej. BN 235 con upsert sin rellenar.
 */
export function lecturaTieneMarcadoParaDilucion(marcado: unknown): boolean {
  if (marcado == null) return false;
  const rows = Array.isArray(marcado) ? marcado : [marcado];
  return rows.some(
    (r) => r != null && typeof r === "object" && filaMarcadoConDatos(r as Record<string, unknown>)
  );
}
