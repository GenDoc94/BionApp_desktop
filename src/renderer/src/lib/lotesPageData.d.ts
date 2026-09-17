export declare const LOTE_TIPOS: readonly ["extraido", "marcado", "membrana"];
export type LoteTipo = (typeof LOTE_TIPOS)[number];
export declare const LOTE_ID_COL: Record<LoteTipo, string>;
export declare function parseLotExpParts(value: string | null | undefined): {
    d: number;
    m: number;
    y: number;
} | null;
/** Valor para `<input type="date">` (YYYY-MM-DD). */
export declare function lotExpToInputValue(exp: string | null | undefined): string;
/** Caducidad canónica DD/MM/AAAA a partir del calendario. */
export declare function lotExpFromInputValue(iso: string | null | undefined): string;
export type LoteRow = {
    id: number;
    PN: string;
    LN: string;
    Exp: string;
};
export type LoteUsoExtraido = {
    NumBN: number;
};
export type LoteUsoLm = {
    NumBN: number;
    NumLectura: number;
    NumLectMarc: number;
};
export type LotesHighlight = {
    tipo: LoteTipo;
    id?: number;
    ln?: string;
};
export declare function isLoteTipo(value: string | null | undefined): value is LoteTipo;
export declare function lotIdFromRow(row: Record<string, unknown>, tipo: LoteTipo): number | null;
export declare function toLoteRow(row: Record<string, unknown>, tipo: LoteTipo): LoteRow | null;
export declare function sortLots(lots: LoteRow[]): LoteRow[];
export declare function lotOptionLabel(lot: LoteRow, siblings: LoteRow[]): string;
export declare function findLotId(lots: LoteRow[], current: {
    id?: unknown;
    PN?: unknown;
    LN?: unknown;
    Exp?: unknown;
}): number | null;
/** LN visible: el del catálogo si la muestra ya no trae la columna denormalizada. */
export declare function lotLnForDisplay(lots: LoteRow[], current: {
    id?: unknown;
    PN?: unknown;
    LN?: unknown;
    Exp?: unknown;
}): string;
export declare function hydrateMuestrasFromLots(muestras: Array<Record<string, unknown>>, extraido: LoteRow[]): void;
export declare function hydrateLecturasMarcadoFromLots(rows: Array<Record<string, unknown>>, marcado: LoteRow[], membrana: LoteRow[]): void;
export declare function parseLotesHighlight(params: URLSearchParams): LotesHighlight | null;
export declare function buildLotesHighlightPath(highlight: LotesHighlight): string;
export declare function loteCardDomId(tipo: LoteTipo, id: number): string;
export declare function resolveHighlightedLotId(lots: LoteRow[], highlight: LotesHighlight | null): number | null;
export declare function groupUsosExtraido(rows: Array<{
    Id_LtE?: unknown;
    NumBN?: unknown;
}>): Map<number, LoteUsoExtraido[]>;
export declare function groupUsosLm(rows: Array<{
    lotId?: unknown;
    NumBN?: unknown;
    NumLectura?: unknown;
    NumLectMarc?: unknown;
}>): Map<number, LoteUsoLm[]>;
export declare function filterLots(lots: LoteRow[], usosExtraido: Map<number, LoteUsoExtraido[]>, usosLm: Map<number, LoteUsoLm[]>, query: string): LoteRow[];
export declare function lotMatchesSearchBlob(lot: LoteRow, query: string): boolean;
