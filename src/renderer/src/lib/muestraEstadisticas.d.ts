export type MuestraEstadoRow = {
    Fecha?: string | null;
    Estado_Muestra?: number | null;
    Muestra?: number | null;
    Dx?: number | null;
};
export type AgrupacionTemporal = "mes" | "trimestre" | "ano";
export type MuestraPeriodoEstadistica = {
    period: string;
    label: string;
    completas: number;
    enProceso: number;
    fallidas: number;
    total: number;
};
export type MuestraEstadisticasResumen = {
    completas: number;
    enProceso: number;
    fallidas: number;
    sinFecha: number;
    sinEstado: number;
    totalConEstado: number;
};
export declare function parseFechaExtraccion(fecha: string | null | undefined): Date | null;
export declare function agrupacionLabel(agrupacion: AgrupacionTemporal): string;
export declare function formatPorcentaje(value: number, total: number, decimals?: number): string;
export declare function buildEstadisticas(rows: MuestraEstadoRow[], agrupacion?: AgrupacionTemporal): {
    porPeriodo: MuestraPeriodoEstadistica[];
    resumen: MuestraEstadisticasResumen;
};
export declare function exportEstadisticasCsv(porPeriodo: MuestraPeriodoEstadistica[], agrupacion: AgrupacionTemporal): string;
export declare function downloadEstadisticasCsv(porPeriodo: MuestraPeriodoEstadistica[], agrupacion: AgrupacionTemporal): void;
/** @deprecated Usar buildEstadisticas */
export declare function buildEstadisticasPorMes(rows: MuestraEstadoRow[]): {
    porMes: MuestraPeriodoEstadistica[];
    resumen: MuestraEstadisticasResumen;
};
