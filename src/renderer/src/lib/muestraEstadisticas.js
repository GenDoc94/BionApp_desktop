var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import i18n from "../i18n";
var MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
export function parseFechaExtraccion(fecha) {
    var raw = (fecha !== null && fecha !== void 0 ? fecha : "").trim();
    if (!raw)
        return null;
    var iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) {
        var d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
        return Number.isNaN(d.getTime()) ? null : d;
    }
    var dmy = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
    if (dmy) {
        var d = new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
        return Number.isNaN(d.getTime()) ? null : d;
    }
    var parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}
function periodKeyFromDate(date, agrupacion) {
    var year = date.getFullYear();
    if (agrupacion === "ano")
        return String(year);
    var month = date.getMonth() + 1;
    if (agrupacion === "trimestre") {
        var quarter = Math.floor((month - 1) / 3) + 1;
        return "".concat(year, "-Q").concat(quarter);
    }
    return "".concat(year, "-").concat(String(month).padStart(2, "0"));
}
function periodLabel(period, agrupacion) {
    if (agrupacion === "ano")
        return period;
    if (agrupacion === "trimestre") {
        var match = period.match(/^(\d{4})-Q([1-4])$/);
        if (!match)
            return period;
        return i18n.t("stats.period.quarter", { q: match[2], year: match[1] });
    }
    var _a = period.split("-"), year = _a[0], month = _a[1];
    var idx = Number(month) - 1;
    if (!year || idx < 0 || idx > 11)
        return period;
    return "".concat(i18n.t("stats.months.".concat(MESES[idx])), " ").concat(year);
}
export function agrupacionLabel(agrupacion) {
    if (agrupacion === "ano")
        return i18n.t("stats.group.year");
    if (agrupacion === "trimestre")
        return i18n.t("stats.group.quarter");
    return i18n.t("stats.group.month");
}
export function formatPorcentaje(value, total, decimals) {
    if (decimals === void 0) { decimals = 1; }
    if (!total || total <= 0)
        return "—";
    return "".concat(((value / total) * 100).toFixed(decimals), "%");
}
export function buildEstadisticas(rows, agrupacion) {
    var _a;
    if (agrupacion === void 0) { agrupacion = "mes"; }
    var resumen = {
        completas: 0,
        enProceso: 0,
        fallidas: 0,
        sinFecha: 0,
        sinEstado: 0,
        totalConEstado: 0,
    };
    var map = new Map();
    for (var _i = 0, rows_1 = rows; _i < rows_1.length; _i++) {
        var row = rows_1[_i];
        var estado = row.Estado_Muestra == null ? null : Number(row.Estado_Muestra);
        if (estado !== 1 && estado !== 2 && estado !== 3) {
            resumen.sinEstado += 1;
            continue;
        }
        resumen.totalConEstado += 1;
        if (estado === 3)
            resumen.completas += 1;
        if (estado === 2)
            resumen.enProceso += 1;
        if (estado === 1)
            resumen.fallidas += 1;
        var date = parseFechaExtraccion(row.Fecha);
        if (!date) {
            resumen.sinFecha += 1;
            continue;
        }
        var key = periodKeyFromDate(date, agrupacion);
        var bucket = (_a = map.get(key)) !== null && _a !== void 0 ? _a : { completas: 0, enProceso: 0, fallidas: 0 };
        if (estado === 3)
            bucket.completas += 1;
        if (estado === 2)
            bucket.enProceso += 1;
        if (estado === 1)
            bucket.fallidas += 1;
        map.set(key, bucket);
    }
    var porPeriodo = __spreadArray([], map.entries(), true).sort(function (_a, _b) {
        var a = _a[0];
        var b = _b[0];
        return a.localeCompare(b);
    })
        .map(function (_a) {
        var period = _a[0], counts = _a[1];
        return ({
            period: period,
            label: periodLabel(period, agrupacion),
            completas: counts.completas,
            enProceso: counts.enProceso,
            fallidas: counts.fallidas,
            total: counts.completas + counts.enProceso + counts.fallidas,
        });
    });
    return { porPeriodo: porPeriodo, resumen: resumen };
}
export function exportEstadisticasCsv(porPeriodo, agrupacion) {
    void agrupacion;
    var lines = __spreadArray([
        [
            i18n.t("stats.csv.period"),
            i18n.t("stats.csv.failed"),
            i18n.t("stats.csv.inProgress"),
            i18n.t("stats.csv.completed"),
            i18n.t("stats.csv.total"),
            i18n.t("stats.csv.pctFailed"),
            i18n.t("stats.csv.pctInProgress"),
            i18n.t("stats.csv.pctCompleted"),
        ].join(",")
    ], porPeriodo.map(function (p) {
        return [
            csvCell(p.label),
            p.fallidas,
            p.enProceso,
            p.completas,
            p.total,
            formatPorcentaje(p.fallidas, p.total),
            formatPorcentaje(p.enProceso, p.total),
            formatPorcentaje(p.completas, p.total),
        ].join(",");
    }), true);
    return lines.join("\n");
}
function csvCell(value) {
    if (/[",\n]/.test(value))
        return "\"".concat(value.replace(/"/g, '""'), "\"");
    return value;
}
export function downloadEstadisticasCsv(porPeriodo, agrupacion) {
    var csv = exportEstadisticasCsv(porPeriodo, agrupacion);
    var blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "bionapp-estadisticas-".concat(agrupacion, ".csv");
    anchor.click();
    URL.revokeObjectURL(url);
}
/** @deprecated Usar buildEstadisticas */
export function buildEstadisticasPorMes(rows) {
    var _a = buildEstadisticas(rows, "mes"), porPeriodo = _a.porPeriodo, resumen = _a.resumen;
    return { porMes: porPeriodo, resumen: resumen };
}
