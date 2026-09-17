import i18n from "../i18n";
export var CHIP_FC_SLOTS = [1, 2, 3];
function parseFc(value) {
    if (value == null || value === "")
        return null;
    var n = Number(value);
    if (!Number.isFinite(n))
        return null;
    return CHIP_FC_SLOTS.includes(n) ? n : null;
}
function parseNumChip(value) {
    if (value == null || value === "")
        return null;
    var n = Number(value);
    return Number.isFinite(n) ? n : null;
}
function sameChipRow(a, b) {
    return (Number(a.NumBN_C) === Number(b.NumBN_C) &&
        Number(a.NumLectura_C) === Number(b.NumLectura_C) &&
        Number(a.NumLectMarc_C) === Number(b.NumLectMarc_C) &&
        Number(a.NumChip) === Number(b.NumChip));
}
export function collectChipAsignacionesFromMuestras(muestras) {
    var _a;
    var rows = [];
    for (var _i = 0, muestras_1 = muestras; _i < muestras_1.length; _i++) {
        var muestra = muestras_1[_i];
        var m = muestra;
        for (var _b = 0, _c = m.lecturas || []; _b < _c.length; _b++) {
            var lectura = _c[_b];
            var lect = lectura;
            for (var _d = 0, _e = ((_a = lect.marcado) === null || _a === void 0 ? void 0 : _a.lecturasMarcado) || []; _d < _e.length; _d++) {
                var lm = _e[_d];
                var lectMarc = lm;
                for (var _f = 0, _g = lectMarc.chips || []; _f < _g.length; _f++) {
                    var chip = _g[_f];
                    rows.push(chip);
                }
            }
        }
    }
    return rows;
}
/** FC ocupados por NumChip (cada hueco 1–3 solo puede usarse una vez por chip). */
export function buildOcupacionFcPorChip(asignaciones) {
    var map = new Map();
    for (var _i = 0, asignaciones_1 = asignaciones; _i < asignaciones_1.length; _i++) {
        var row = asignaciones_1[_i];
        var numChip = parseNumChip(row.NumChip);
        var fc = parseFc(row.FC);
        if (numChip == null || fc == null)
            continue;
        if (!map.has(numChip))
            map.set(numChip, new Set());
        map.get(numChip).add(fc);
    }
    return map;
}
export function fcLibresParaChip(numChip, asignaciones, excluir) {
    var used = new Set();
    for (var _i = 0, asignaciones_2 = asignaciones; _i < asignaciones_2.length; _i++) {
        var row = asignaciones_2[_i];
        if (excluir && sameChipRow(row, excluir))
            continue;
        if (parseNumChip(row.NumChip) !== numChip)
            continue;
        var fc = parseFc(row.FC);
        if (fc != null)
            used.add(fc);
    }
    return CHIP_FC_SLOTS.filter(function (fc) { return !used.has(fc); });
}
export function chipTieneHuecoDisponible(numChip, asignaciones) {
    return fcLibresParaChip(numChip, asignaciones).length > 0;
}
export function formatFcLibresLabel(libres) {
    if (libres.length === CHIP_FC_SLOTS.length)
        return i18n.t("chips.fc.allFree");
    if (libres.length === 0)
        return i18n.t("chips.fc.noneFree");
    return i18n.t("chips.fc.someFree", { slots: libres.join(", ") });
}
export function fcYaOcupado(numChip, fc, asignaciones, excluir) {
    return !fcLibresParaChip(numChip, asignaciones, excluir).includes(fc);
}
