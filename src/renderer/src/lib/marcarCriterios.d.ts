export declare const MARCAR_THRESHOLD_MEDIA = 25.65;
/** Máximo de lecturas de marcado (LM) distintas por lectura extraída; con 2 ya no hay ADN para un tercero. */
export declare const MARCAR_MAX_LM_ROWS = 2;
export declare const MARCAR_MAX_MEDIA_LM = 2;
export declare const MARCAR_MIN_CHIPS_FALLO = 2;
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
export declare function chipRepetirActivo(ch: ChipMarcadoRow | null | undefined): boolean;
/** Media ng/µL: Media_Lectura en BD o (Izq + Cen + Dcha) / 3 si falta. */
export declare function mediaLecturaExtraidaEfectiva(row: LecturaExtraidaRow): number | null;
/** Media de lectura marcada: Media_LM o (Izq_LM + Dcha_LM) / 2. */
export declare function mediaDeMarcadoLM(lm: LmMarcadoRow | null | undefined): number | null;
/** Al menos 2 chips marcados con Repetir_Chip en la LM (icono !). */
export declare function tieneDosChipsFallidos(chips: ChipMarcadoRow[]): boolean;
export declare function labelMarcarTipo(evaluacion: MarcarEvaluacion): string;
/**
 * Decide si una lectura extraída debe aparecer en «Marcar».
 * El marcado se juzga por filas LM (no solo la tabla Marcado).
 *
 * - Normal: sin ninguna LM en esa lectura extraída (p. ej. 2.ª lectura sin marcar).
 * - Ámbar: 1 LM y ≥2 chips con Repetir_Chip.
 * - Excluida: ya hay 2 LM en esa lectura extraída, o no cumple chips fallidos.
 */
export declare function evaluarMarcarLectura(input: {
    mediaLectura: number | null | undefined;
    lmRows: LmMarcadoRow[];
    chipsUltimaLm?: ChipMarcadoRow[];
}): MarcarEvaluacion | null;
