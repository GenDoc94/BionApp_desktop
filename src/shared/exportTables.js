/** Tablas de dominio exportables (sin secretos: meta, password hashes). */
export var EXPORT_TABLES = [
    'DMuestra',
    'DDx',
    'DChips',
    'Tags',
    'Lotes_Extraido',
    'Lotes_Marcado',
    'Lotes_Membrana',
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
export function stamp() {
    var d = new Date();
    var p = function (n) { return String(n).padStart(2, '0'); };
    return "".concat(d.getFullYear()).concat(p(d.getMonth() + 1)).concat(p(d.getDate()), "_").concat(p(d.getHours())).concat(p(d.getMinutes()));
}
