import type { supabase } from "./supabaseClient";
type SupabaseClient = typeof supabase;
export type CatalogDx = {
    Cod: number;
    Dx: string;
};
export type PreselectRow = {
    Petic_Preselect: string;
    Coment_Preselect: string | null;
    NumBN_Preselect: number | null;
    Fecha_Preselect: string | null;
    Dx_Preselect: number | null;
    DDx?: {
        Dx?: string | null;
    } | null;
};
export type PreselectMuestraLink = {
    Petic_Preselect: string;
    Coment_Preselect: string | null;
    NumBN_Preselect: number;
};
export type PreselectLinksByNumBN = Record<number, PreselectMuestraLink>;
export declare function indexPreselectByNumBN(rows: PreselectMuestraLink[]): PreselectLinksByNumBN;
export declare function fetchPreselectLinksByNumBN(supabase: SupabaseClient): Promise<PreselectLinksByNumBN>;
export declare const PRESELECT_DUPLICATE_MESSAGE = "Petici\u00F3n ya incluida en lista de preselecci\u00F3n";
export declare function normalizePetic(value: unknown): string | null;
export declare function parsePeticInput(value: string): string | null;
export declare function samePetic(a: unknown, b: unknown): boolean;
export declare function formatPreselectFecha(value: string | null | undefined): string;
export declare function labelDxPreselect(row: PreselectRow, dxList: CatalogDx[]): string;
export declare function buildFechaPreselectNow(): string;
export declare function buildPreselectHighlightPath(petic: string | number): string;
export declare function parsePreselectHighlightPetic(params: URLSearchParams): string | null;
export type PreselectSortDir = "asc" | "desc";
export type PreselectSortKey = "added" | "numBN";
export declare const PRESELECT_DX_FILTER_NONE = "none";
export declare function filterPreselectByDx(rows: PreselectRow[], dxFilter: string | null | undefined): PreselectRow[];
export declare function sortPreselectRows(rows: PreselectRow[], key: PreselectSortKey, dir: PreselectSortDir): PreselectRow[];
export declare function fetchNextNumBN(supabase: SupabaseClient): Promise<number>;
export declare function crearMuestraDesdePreselect(supabase: SupabaseClient, petic: string): Promise<number>;
export {};
