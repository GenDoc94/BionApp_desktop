import type { ExportFormat } from './types';
/** Tablas de dominio exportables (sin secretos: meta, password hashes). */
export declare const EXPORT_TABLES: readonly ["DMuestra", "DDx", "DCajas", "DChips", "Tags", "Lotes_Extraido", "Lotes_Marcado", "Lotes_Membrana", "Lotes_Chips", "Envios", "Envio_Cajas", "Stock", "Filtros", "Muestras", "Lectura", "Marcado", "Lecturas_Marcado", "Chips", "Preselect", "Muestra_Tags", "profiles"];
export type ExportTableName = (typeof EXPORT_TABLES)[number];
export type ExportTableGroupId = 'catalog' | 'lots' | 'shipments' | 'samples' | 'users';
export type ExportTableGroup = {
    id: ExportTableGroupId;
    tables: readonly ExportTableName[];
};
export declare const EXPORT_TABLE_GROUPS: readonly ExportTableGroup[];
export type TableDump = Record<string, Record<string, unknown>[]>;
export type ExportOutputKind = 'zip' | 'xlsx' | 'json' | 'sqlite';
export declare function isExportTable(name: unknown): name is ExportTableName;
export declare function sanitizeExportTables(input: unknown): ExportTableName[];
export declare function areAllExportTables(tables: readonly string[]): boolean;
export declare function exportOutputKind(format: ExportFormat, tables: readonly string[]): ExportOutputKind;
export declare function defaultExportFileName(format: ExportFormat, tables: readonly string[], ts: string): {
    name: string;
    extensions: string[];
};
export declare function stamp(): string;
