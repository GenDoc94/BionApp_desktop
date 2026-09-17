var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
export function todayIsoDate(now) {
    if (now === void 0) { now = new Date(); }
    var y = now.getFullYear();
    var m = String(now.getMonth() + 1).padStart(2, "0");
    var d = String(now.getDate()).padStart(2, "0");
    return "".concat(y, "-").concat(m, "-").concat(d);
}
export function parseIsoDate(value) {
    var raw = String(value !== null && value !== void 0 ? value : "").trim();
    if (!raw)
        return null;
    var iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso)
        return "".concat(iso[1], "-").concat(iso[2], "-").concat(iso[3]);
    var dmy = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (dmy) {
        var d = Number(dmy[1]);
        var m = Number(dmy[2]);
        var y = Number(dmy[3]);
        if (m < 1 || m > 12 || d < 1 || d > 31)
            return null;
        return "".concat(y, "-").concat(String(m).padStart(2, "0"), "-").concat(String(d).padStart(2, "0"));
    }
    return null;
}
export function formatIsoDateDisplay(value) {
    var iso = parseIsoDate(value);
    if (!iso)
        return "—";
    var _a = iso.split("-"), y = _a[0], m = _a[1], d = _a[2];
    return "".concat(d, "/").concat(m, "/").concat(y);
}
function utcDay(iso) {
    var parsed = parseIsoDate(iso);
    if (!parsed)
        return null;
    var _a = parsed.split("-").map(Number), y = _a[0], m = _a[1], d = _a[2];
    return Date.UTC(y, m - 1, d);
}
export function daysBetweenIso(from, to) {
    var a = utcDay(String(from !== null && from !== void 0 ? from : ""));
    var b = utcDay(String(to !== null && to !== void 0 ? to : ""));
    if (a == null || b == null)
        return null;
    return Math.round((b - a) / 86400000);
}
export function sortFiltros(rows) {
    return __spreadArray([], rows, true).sort(function (a, b) { return a.NumFiltro - b.NumFiltro; });
}
export function nextNumFiltro(rows) {
    return rows.reduce(function (max, row) { return Math.max(max, Number(row.NumFiltro) || 0); }, 0) + 1;
}
export function openFiltro(rows) {
    var _a;
    var open = sortFiltros(rows).filter(function (row) { return !parseIsoDate(row.FechaRetir); });
    return (_a = open.at(-1)) !== null && _a !== void 0 ? _a : null;
}
export function planFilterChange(rows, colocRaw) {
    var coloc = parseIsoDate(colocRaw);
    if (!coloc)
        return { ok: false, error: "invalidDate" };
    var current = openFiltro(rows);
    if (current === null || current === void 0 ? void 0 : current.FechaColoc) {
        var delta = daysBetweenIso(current.FechaColoc, coloc);
        if (delta != null && delta < 0)
            return { ok: false, error: "beforeCurrent" };
    }
    var close = current == null
        ? null
        : __assign(__assign({}, current), { FechaRetir: coloc });
    return {
        ok: true,
        close: close,
        insert: {
            NumFiltro: nextNumFiltro(rows),
            FechaColoc: coloc,
            FechaRetir: null,
        },
    };
}
export function filtroStats(rows, today) {
    if (today === void 0) { today = todayIsoDate(); }
    var sorted = sortFiltros(rows);
    var completedDays = sorted
        .map(function (row) {
        return parseIsoDate(row.FechaColoc) && parseIsoDate(row.FechaRetir)
            ? daysBetweenIso(row.FechaColoc, row.FechaRetir)
            : null;
    })
        .filter(function (n) { return n != null && n >= 0; });
    var avgDays = completedDays.length === 0
        ? null
        : completedDays.reduce(function (sum, n) { return sum + n; }, 0) / completedDays.length;
    var current = openFiltro(sorted);
    var currentDays = (current === null || current === void 0 ? void 0 : current.FechaColoc) && !parseIsoDate(current.FechaRetir)
        ? daysBetweenIso(current.FechaColoc, today)
        : null;
    return {
        total: sorted.length,
        changes: completedDays.length,
        avgDays: avgDays,
        currentDays: currentDays,
    };
}
export function toFiltroRow(row) {
    var num = Number(row.NumFiltro);
    if (!Number.isFinite(num))
        return null;
    return {
        NumFiltro: num,
        FechaColoc: parseIsoDate(row.FechaColoc),
        FechaRetir: parseIsoDate(row.FechaRetir),
    };
}
