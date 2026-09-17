export declare const CHIP_FC_SLOTS: readonly [1, 2, 3];
export type ChipAsignacionRow = {
    NumChip?: number | string | null;
    Chip_Nombre?: string | null;
    FC?: number | string | null;
    NumBN_C?: number | string | null;
    NumLectura_C?: number | string | null;
    NumLectMarc_C?: number | string | null;
};
export declare function collectChipAsignacionesFromMuestras(muestras: unknown[]): ChipAsignacionRow[];
/** FC ocupados por NumChip (cada hueco 1–3 solo puede usarse una vez por chip). */
export declare function buildOcupacionFcPorChip(asignaciones: ChipAsignacionRow[]): Map<number, Set<number>>;
export declare function fcLibresParaChip(numChip: number, asignaciones: ChipAsignacionRow[], excluir?: ChipAsignacionRow): number[];
export declare function chipTieneHuecoDisponible(numChip: number, asignaciones: ChipAsignacionRow[]): boolean;
export declare function formatFcLibresLabel(libres: number[]): string;
export declare function fcYaOcupado(numChip: number, fc: number, asignaciones: ChipAsignacionRow[], excluir?: ChipAsignacionRow): boolean;
