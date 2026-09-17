/** Cálculos en cliente — mismas fórmulas que los triggers de Supabase */
export declare function parseNumForCalc(value: unknown): number | null;
export type LecturaTresStats = {
    media: number | null;
    sd: number | null;
    cv: number | null;
};
/** Trigger actualizar_media_lectura: (Izq + Cen + Dcha) / 3, SD y CV derivados */
export declare function calcStatsLectura(izq: unknown, cen: unknown, dcha: unknown): LecturaTresStats;
export type MarcadoDosStats = {
    media: number | null;
    sd: number | null;
    cv: number | null;
};
/** Trigger actualizar_media_lm: (Izq_LM + Dcha_LM) / 2, SD_LM y CV_LM derivados */
export declare function calcStatsMarcado(izqLm: unknown, dchaLm: unknown): MarcadoDosStats;
export declare function formatCalcStat(value: number | null | undefined, decimals?: number): string;
/** Rangos inclusivos del cajetín de media (muestra): extraído 45–90, marcado 4–16. */
export declare const MEDIA_EXTRAIDO_OK_MIN = 45;
export declare const MEDIA_EXTRAIDO_OK_MAX = 90;
export declare const MEDIA_MARCADO_OK_MIN = 4;
export declare const MEDIA_MARCADO_OK_MAX = 16;
/** Verde / rojo / amarillo reutilizan `lectura-cuant-ok|bajo|alto` de Acciones. */
export declare function cuantificacionSemaforoClass(value: unknown, minOk: number, maxOk: number): string;
export declare function mediaExtraidoSemaforoClass(value: unknown): string;
export declare function mediaMarcadoSemaforoClass(value: unknown): string;
