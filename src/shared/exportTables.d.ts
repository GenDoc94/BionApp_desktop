/** Tablas de dominio exportables (sin secretos: meta, password hashes). */
export declare const EXPORT_TABLES: readonly ["DMuestra", "DDx", "DChips", "Tags", "Lotes_Extraido", "Lotes_Marcado", "Lotes_Membrana", "Filtros", "Muestras", "Lectura", "Marcado", "Lecturas_Marcado", "Chips", "Preselect", "Muestra_Tags", "profiles"];
export type TableDump = Record<string, Record<string, unknown>[]>;
export declare function stamp(): string;
