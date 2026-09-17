var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
export var LOTE_TIPOS = ["extraido", "marcado", "membrana"];
export var LOTE_ID_COL = {
    extraido: "Id_LtE",
    marcado: "Id_LtM",
    membrana: "Id_LtMm",
};
function pad2(n) {
    return String(n).padStart(2, "0");
}
export function parseLotExpParts(value) {
    var raw = String(value !== null && value !== void 0 ? value : "").trim();
    if (!raw)
        return null;
    var iso = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (iso) {
        var y = Number(iso[1]);
        var m = Number(iso[2]);
        var d = Number(iso[3]);
        if (m < 1 || m > 12 || d < 1 || d > 31)
            return null;
        return { d: d, m: m, y: y };
    }
    var parts = raw.replace(/-/g, "/").split("/").map(function (p) { return p.trim(); });
    if (parts.length !== 3)
        return null;
    var a = Number(parts[0]);
    var b = Number(parts[1]);
    var c = Number(parts[2]);
    if (![a, b, c].every(function (n) { return Number.isInteger(n); }))
        return null;
    var day;
    var month;
    var year;
    if (a >= 1000 && a <= 9999) {
        year = a;
        month = b;
        day = c;
    }
    else {
        year = c;
        if (year < 1000 || year > 9999)
            return null;
        if (a > 12 && b >= 1 && b <= 12) {
            day = a;
            month = b;
        }
        else if (b > 12 && a >= 1 && a <= 12) {
            day = b;
            month = a;
        }
        else {
            day = a;
            month = b;
        }
    }
    if (month < 1 || month > 12 || day < 1 || day > 31)
        return null;
    return { d: day, m: month, y: year };
}
/** Valor para `<input type="date">` (YYYY-MM-DD). */
export function lotExpToInputValue(exp) {
    var p = parseLotExpParts(exp);
    if (!p)
        return "";
    return "".concat(p.y, "-").concat(pad2(p.m), "-").concat(pad2(p.d));
}
/** Caducidad canónica DD/MM/AAAA a partir del calendario. */
export function lotExpFromInputValue(iso) {
    var p = parseLotExpParts(iso);
    if (!p)
        return String(iso !== null && iso !== void 0 ? iso : "").trim();
    return "".concat(pad2(p.d), "/").concat(pad2(p.m), "/").concat(p.y);
}
export function isLoteTipo(value) {
    return value === "extraido" || value === "marcado" || value === "membrana";
}
export function lotIdFromRow(row, tipo) {
    var key = tipo === "extraido" ? "Id_LtE" : tipo === "marcado" ? "Id_LtM" : "Id_LtMm";
    var n = Number(row[key]);
    return Number.isFinite(n) ? n : null;
}
export function toLoteRow(row, tipo) {
    var _a, _b, _c;
    var id = lotIdFromRow(row, tipo);
    if (id == null)
        return null;
    return {
        id: id,
        PN: String((_a = row.PN) !== null && _a !== void 0 ? _a : ""),
        LN: String((_b = row.LN) !== null && _b !== void 0 ? _b : ""),
        Exp: String((_c = row.Exp) !== null && _c !== void 0 ? _c : ""),
    };
}
export function sortLots(lots) {
    return __spreadArray([], lots, true).sort(function (a, b) {
        var ln = String(b.LN).localeCompare(String(a.LN), undefined, { numeric: true });
        if (ln !== 0)
            return ln;
        var exp = String(a.Exp).localeCompare(String(b.Exp), undefined, { numeric: true });
        if (exp !== 0)
            return exp;
        return String(a.PN).localeCompare(String(b.PN), undefined, { numeric: true });
    });
}
export function lotOptionLabel(lot, siblings) {
    var ln = lot.LN.trim() || "—";
    var sameLn = siblings.filter(function (s) { return s.LN === lot.LN; });
    if (sameLn.length <= 1)
        return ln;
    var parts = [ln];
    if (lot.Exp.trim())
        parts.push(lot.Exp.trim());
    else if (lot.PN.trim())
        parts.push(lot.PN.trim());
    return parts.join(" · ");
}
export function findLotId(lots, current) {
    var _a, _b, _c, _d;
    var id = Number(current.id);
    if (Number.isFinite(id) && lots.some(function (l) { return l.id === id; }))
        return id;
    var pn = String((_a = current.PN) !== null && _a !== void 0 ? _a : "").trim();
    var ln = String((_b = current.LN) !== null && _b !== void 0 ? _b : "").trim();
    var exp = String((_c = current.Exp) !== null && _c !== void 0 ? _c : "").trim();
    if (!ln && !pn)
        return null;
    var found = lots.find(function (l) { return l.PN.trim() === pn && l.LN.trim() === ln && l.Exp.trim() === exp; });
    return (_d = found === null || found === void 0 ? void 0 : found.id) !== null && _d !== void 0 ? _d : null;
}
/** LN visible: el del catálogo si la muestra ya no trae la columna denormalizada. */
export function lotLnForDisplay(lots, current) {
    var _a, _b, _c;
    var direct = String((_a = current.LN) !== null && _a !== void 0 ? _a : "").trim();
    if (direct)
        return direct;
    var id = findLotId(lots, current);
    if (id == null)
        return "";
    return (_c = (_b = lots.find(function (l) { return l.id === id; })) === null || _b === void 0 ? void 0 : _b.LN.trim()) !== null && _c !== void 0 ? _c : "";
}
export function hydrateMuestrasFromLots(muestras, extraido) {
    var _a, _b, _c;
    var byId = new Map(extraido.map(function (l) { return [l.id, l]; }));
    for (var _i = 0, muestras_1 = muestras; _i < muestras_1.length; _i++) {
        var row = muestras_1[_i];
        var id = Number(row.Id_LtE);
        var lot = Number.isFinite(id) ? byId.get(id) : undefined;
        row.PN = (_a = lot === null || lot === void 0 ? void 0 : lot.PN) !== null && _a !== void 0 ? _a : null;
        row.LN = (_b = lot === null || lot === void 0 ? void 0 : lot.LN) !== null && _b !== void 0 ? _b : null;
        row.Exp = (_c = lot === null || lot === void 0 ? void 0 : lot.Exp) !== null && _c !== void 0 ? _c : null;
    }
}
export function hydrateLecturasMarcadoFromLots(rows, marcado, membrana) {
    var _a, _b, _c, _d, _e, _f;
    var mById = new Map(marcado.map(function (l) { return [l.id, l]; }));
    var mmById = new Map(membrana.map(function (l) { return [l.id, l]; }));
    for (var _i = 0, rows_1 = rows; _i < rows_1.length; _i++) {
        var row = rows_1[_i];
        var idM = Number(row.Id_LtM);
        var lotM = Number.isFinite(idM) ? mById.get(idM) : undefined;
        row.PN_LM = (_a = lotM === null || lotM === void 0 ? void 0 : lotM.PN) !== null && _a !== void 0 ? _a : null;
        row.LN_LM = (_b = lotM === null || lotM === void 0 ? void 0 : lotM.LN) !== null && _b !== void 0 ? _b : null;
        row.Exp_LM = (_c = lotM === null || lotM === void 0 ? void 0 : lotM.Exp) !== null && _c !== void 0 ? _c : null;
        var idMm = Number(row.Id_LtMm);
        var lotMm = Number.isFinite(idMm) ? mmById.get(idMm) : undefined;
        row.PNM_LM = (_d = lotMm === null || lotMm === void 0 ? void 0 : lotMm.PN) !== null && _d !== void 0 ? _d : null;
        row.LNM_LM = (_e = lotMm === null || lotMm === void 0 ? void 0 : lotMm.LN) !== null && _e !== void 0 ? _e : null;
        row.ExpM_LM = (_f = lotMm === null || lotMm === void 0 ? void 0 : lotMm.Exp) !== null && _f !== void 0 ? _f : null;
    }
}
export function parseLotesHighlight(params) {
    var _a;
    var tipoRaw = params.get("tipo");
    var tipo = isLoteTipo(tipoRaw) ? tipoRaw : "extraido";
    var idRaw = params.get("id");
    var ln = ((_a = params.get("ln")) === null || _a === void 0 ? void 0 : _a.trim()) || undefined;
    var id = idRaw != null && idRaw !== "" ? Number(idRaw) : NaN;
    if (Number.isFinite(id))
        return { tipo: tipo, id: id };
    if (ln)
        return { tipo: tipo, ln: ln };
    if (isLoteTipo(tipoRaw))
        return { tipo: tipo };
    return null;
}
export function buildLotesHighlightPath(highlight) {
    var params = new URLSearchParams();
    params.set("tipo", highlight.tipo);
    if (highlight.id != null && Number.isFinite(highlight.id)) {
        params.set("id", String(highlight.id));
    }
    else if (highlight.ln) {
        params.set("ln", highlight.ln);
    }
    params.set("tab", "lotes");
    return "/calidad?".concat(params.toString());
}
export function loteCardDomId(tipo, id) {
    return "lote-".concat(tipo, "-").concat(id);
}
export function resolveHighlightedLotId(lots, highlight) {
    var _a, _b;
    if (!highlight)
        return null;
    if (highlight.id != null && lots.some(function (l) { return l.id === highlight.id; }))
        return highlight.id;
    if (highlight.ln) {
        var matches = lots.filter(function (l) { return l.LN === highlight.ln; });
        return (_b = (_a = matches[0]) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : null;
    }
    return null;
}
export function groupUsosExtraido(rows) {
    var map = new Map();
    for (var _i = 0, rows_2 = rows; _i < rows_2.length; _i++) {
        var row = rows_2[_i];
        var id = Number(row.Id_LtE);
        var numBN = Number(row.NumBN);
        if (!Number.isFinite(id) || !Number.isFinite(numBN))
            continue;
        var arr = map.get(id);
        var uso = { NumBN: numBN };
        if (arr)
            arr.push(uso);
        else
            map.set(id, [uso]);
    }
    for (var _a = 0, _b = map.values(); _a < _b.length; _a++) {
        var arr = _b[_a];
        arr.sort(function (a, b) { return a.NumBN - b.NumBN; });
    }
    return map;
}
export function groupUsosLm(rows) {
    var map = new Map();
    for (var _i = 0, rows_3 = rows; _i < rows_3.length; _i++) {
        var row = rows_3[_i];
        var id = Number(row.lotId);
        var numBN = Number(row.NumBN);
        var numLectura = Number(row.NumLectura);
        var numLectMarc = Number(row.NumLectMarc);
        if (!Number.isFinite(id) ||
            !Number.isFinite(numBN) ||
            !Number.isFinite(numLectura) ||
            !Number.isFinite(numLectMarc)) {
            continue;
        }
        var uso = { NumBN: numBN, NumLectura: numLectura, NumLectMarc: numLectMarc };
        var arr = map.get(id);
        if (arr)
            arr.push(uso);
        else
            map.set(id, [uso]);
    }
    for (var _a = 0, _b = map.values(); _a < _b.length; _a++) {
        var arr = _b[_a];
        arr.sort(function (a, b) {
            return a.NumBN - b.NumBN || a.NumLectura - b.NumLectura || a.NumLectMarc - b.NumLectMarc;
        });
    }
    return map;
}
export function filterLots(lots, usosExtraido, usosLm, query) {
    var q = query.trim().toLowerCase();
    if (!q)
        return lots;
    return lots.filter(function (lot) {
        if (lot.LN.toLowerCase().includes(q) ||
            lot.PN.toLowerCase().includes(q) ||
            lot.Exp.toLowerCase().includes(q)) {
            return true;
        }
        var extra = usosExtraido.get(lot.id) || [];
        if (extra.some(function (u) { return String(u.NumBN).includes(q); }))
            return true;
        var lm = usosLm.get(lot.id) || [];
        return lm.some(function (u) {
            return String(u.NumBN).includes(q) ||
                String(u.NumLectura).includes(q) ||
                String(u.NumLectMarc).includes(q);
        });
    });
}
export function lotMatchesSearchBlob(lot, query) {
    var q = query.trim().toLowerCase();
    if (!q)
        return true;
    return (lot.LN.toLowerCase().includes(q) ||
        lot.PN.toLowerCase().includes(q) ||
        lot.Exp.toLowerCase().includes(q));
}
