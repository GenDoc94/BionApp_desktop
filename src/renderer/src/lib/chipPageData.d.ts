export type ChipAsignacion = {
    NumChip: number;
    NumBN_C: number;
    NumLectura_C: number;
    NumLectMarc_C: number;
    FC: number;
    Repetir_Chip?: number | null;
};
export type ChipCatalogo = {
    NumChip_D: number;
    Nombre_Chip?: string | null;
};
export type ChipPanelData = {
    chip: ChipCatalogo;
    flowcells: Array<ChipAsignacion | null>;
};
export declare function groupAsignacionesPorChip(asignaciones: ChipAsignacion[]): Map<number, Map<number, ChipAsignacion>>;
export declare function buildChipPanels(chips: ChipCatalogo[], asignaciones: ChipAsignacion[]): ChipPanelData[];
export declare function chipPanelMatchesQuery(panel: ChipPanelData, query: string): boolean;
export declare function filterChipPanels(panels: ChipPanelData[], query: string): ChipPanelData[];
