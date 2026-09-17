type MuestraRow = Record<string, unknown> & {
    NumBN: number;
    lecturas?: unknown[];
};
/** Carga todas las muestras con lecturas/marcado/chips y catálogos de lote. */
export declare function fetchMuestrasCompletasFromSupabase(): Promise<MuestraRow[]>;
export declare function formatMuestrasFetchError(err: unknown): string;
export {};
