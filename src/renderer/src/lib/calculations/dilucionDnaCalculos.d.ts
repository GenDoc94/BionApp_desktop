/** Dilución DNA — mismas fórmulas que la hoja «Cálculos DNA» del Excel del laboratorio */
export declare const DILUCION_VOL_TOTAL_UL = 19.5;
export declare const DILUCION_TARGET_NG = 750;
export declare const DILUCION_MIN_NG = 500;
export declare const DILUCION_MEDIA_IDEAL_MIN = 39;
export declare const DILUCION_MEDIA_IDEAL_MAX = 150;
export declare const DILUCION_MAX_MUESTRAS = 12;
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
export declare function calcDilucionDna(mediaNgPerUl: number | null | undefined, options?: {
    volTotalUl?: number;
    targetNg?: number;
    minNg?: number;
}): DilucionDnaResultado;
export declare function formatDilucionUl(value: number | null | undefined): string;
export declare function formatDilucionNg(value: number | null | undefined): string;
export declare function formatDilucionCv(value: number | null | undefined): string;
export declare function lecturaDilucionKey(numBN: number, numLectura: number): string;
/** Media ng/µL: columna Media_Lectura o, si falta, (I+C+D)/3 como en la pantalla principal */
export declare function effectiveMediaNgPerUlFromLectura(row: {
    Media_Lectura?: unknown;
    Izq?: unknown;
    Cen?: unknown;
    Dcha?: unknown;
}): number | null;
export declare function effectiveCvFromLectura(row: {
    CV_Lectura?: unknown;
    Izq?: unknown;
    Cen?: unknown;
    Dcha?: unknown;
}): number | null;
/**
 * Marcaje “real” (hay LM o datos en Marcado). Una fila vacía en Marcado (solo BN+L)
 * no cuenta — p. ej. BN 235 con upsert sin rellenar.
 */
export declare function lecturaTieneMarcadoParaDilucion(marcado: unknown): boolean;
