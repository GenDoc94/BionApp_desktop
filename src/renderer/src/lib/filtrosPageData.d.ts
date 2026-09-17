export type FiltroRow = {
    NumFiltro: number;
    FechaColoc: string | null;
    FechaRetir: string | null;
};
export declare function todayIsoDate(now?: Date): string;
export declare function parseIsoDate(value: unknown): string | null;
export declare function formatIsoDateDisplay(value: unknown): string;
export declare function daysBetweenIso(from: unknown, to: unknown): number | null;
export declare function sortFiltros(rows: FiltroRow[]): FiltroRow[];
export declare function nextNumFiltro(rows: FiltroRow[]): number;
export declare function openFiltro(rows: FiltroRow[]): FiltroRow | null;
export type FiltroChangePlan = {
    ok: true;
    close: FiltroRow | null;
    insert: FiltroRow;
} | {
    ok: false;
    error: "invalidDate" | "beforeCurrent";
};
export declare function planFilterChange(rows: FiltroRow[], colocRaw: unknown): FiltroChangePlan;
export type FiltroStats = {
    total: number;
    changes: number;
    avgDays: number | null;
    currentDays: number | null;
};
export declare function filtroStats(rows: FiltroRow[], today?: string): FiltroStats;
export declare function toFiltroRow(row: Record<string, unknown>): FiltroRow | null;
