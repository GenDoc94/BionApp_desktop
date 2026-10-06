/** Tablas de dominio exportables (sin secretos: meta, password hashes). */
export const EXPORT_TABLES = [
    'DMuestra',
    'DDx',
    'DCajas',
    'DChips',
    'Tags',
    'Lotes_Extraido',
    'Lotes_Marcado',
    'Lotes_Membrana',
    'Lotes_Chips',
    'Envios',
    'Envio_Cajas',
    'Stock',
    'Filtros',
    'Muestras',
    'Lectura',
    'Marcado',
    'Lecturas_Marcado',
    'Chips',
    'Preselect',
    'Muestra_Tags',
    'profiles'
];
export const EXPORT_TABLE_GROUPS = [
    { id: 'catalog', tables: ['DMuestra', 'DDx', 'DCajas', 'DChips', 'Tags'] },
    { id: 'lots', tables: ['Lotes_Extraido', 'Lotes_Marcado', 'Lotes_Membrana', 'Lotes_Chips'] },
    { id: 'shipments', tables: ['Envios', 'Envio_Cajas', 'Stock'] },
    {
        id: 'samples',
        tables: [
            'Filtros',
            'Muestras',
            'Lectura',
            'Marcado',
            'Lecturas_Marcado',
            'Chips',
            'Preselect',
            'Muestra_Tags'
        ]
    },
    { id: 'users', tables: ['profiles'] }
];
var EXPORT_TABLE_SET = new Set(EXPORT_TABLES);
export function isExportTable(name) {
    return typeof name === 'string' && EXPORT_TABLE_SET.has(name);
}
export function sanitizeExportTables(input) {
    if (input == null)
        return EXPORT_TABLES.slice();
    if (!Array.isArray(input))
        return EXPORT_TABLES.slice();
    var wanted = new Set(input.filter(isExportTable));
    if (wanted.size === 0)
        return [];
    return EXPORT_TABLES.filter(function (table) { return wanted.has(table); });
}
export function areAllExportTables(tables) {
    if (tables.length !== EXPORT_TABLES.length)
        return false;
    var set = new Set(tables);
    return EXPORT_TABLES.every(function (table) { return set.has(table); });
}
export function exportOutputKind(format, tables) {
    if (format === 'sqlite')
        return 'sqlite';
    if (tables.length === 1)
        return format;
    return 'zip';
}
export function defaultExportFileName(format, tables, ts) {
    var kind = exportOutputKind(format, tables);
    if (kind === 'sqlite')
        return { name: "BionApp_".concat(ts, ".sqlite"), extensions: ['sqlite'] };
    if (kind === 'xlsx')
        return { name: "BionApp_".concat(tables[0], "_").concat(ts, ".xlsx"), extensions: ['xlsx'] };
    if (kind === 'json')
        return { name: "BionApp_".concat(tables[0], "_").concat(ts, ".json"), extensions: ['json'] };
    return {
        name: format === 'xlsx' ? "BionApp_excel_".concat(ts, ".zip") : "BionApp_json_".concat(ts, ".zip"),
        extensions: ['zip']
    };
}
export function stamp() {
    var d = new Date();
    var p = function (n) { return String(n).padStart(2, '0'); };
    return "".concat(d.getFullYear()).concat(p(d.getMonth() + 1)).concat(p(d.getDate()), "_").concat(p(d.getHours())).concat(p(d.getMinutes()));
}
