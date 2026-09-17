var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { calcStatsLectura } from "./calculations/lecturaCalculos";
export var MARCAR_THRESHOLD_MEDIA = 25.65;
/** Máximo de lecturas de marcado (LM) distintas por lectura extraída; con 2 ya no hay ADN para un tercero. */
export var MARCAR_MAX_LM_ROWS = 2;
export var MARCAR_MAX_MEDIA_LM = 2;
export var MARCAR_MIN_CHIPS_FALLO = 2;
export function chipRepetirActivo(ch) {
    return ch != null && ch.Repetir_Chip != null && Number(ch.Repetir_Chip) === 1;
}
/** Media ng/µL: Media_Lectura en BD o (Izq + Cen + Dcha) / 3 si falta. */
export function mediaLecturaExtraidaEfectiva(row) {
    var stored = row.Media_Lectura != null && row.Media_Lectura !== "" ? Number(row.Media_Lectura) : NaN;
    if (Number.isFinite(stored))
        return stored;
    var media = calcStatsLectura(row.Izq, row.Cen, row.Dcha).media;
    return media;
}
/** Media de lectura marcada: Media_LM o (Izq_LM + Dcha_LM) / 2. */
export function mediaDeMarcadoLM(lm) {
    if (lm == null)
        return null;
    if (typeof lm.Media_LM === "number" && Number.isFinite(lm.Media_LM))
        return lm.Media_LM;
    var izq = lm.Izq_LM != null ? Number(lm.Izq_LM) : NaN;
    var dcha = lm.Dcha_LM != null ? Number(lm.Dcha_LM) : NaN;
    if (!Number.isFinite(izq) || !Number.isFinite(dcha))
        return null;
    return (izq + dcha) / 2;
}
function sortLmRows(lmRows) {
    return __spreadArray([], lmRows, true).sort(function (a, b) { var _a, _b; return Number((_a = a.NumLectMarc) !== null && _a !== void 0 ? _a : 0) - Number((_b = b.NumLectMarc) !== null && _b !== void 0 ? _b : 0); });
}
/** Al menos 2 chips marcados con Repetir_Chip en la LM (icono !). */
export function tieneDosChipsFallidos(chips) {
    var fallidos = chips.filter(chipRepetirActivo);
    return fallidos.length >= MARCAR_MIN_CHIPS_FALLO;
}
export function labelMarcarTipo(evaluacion) {
    switch (evaluacion.motivo) {
        case "sin-marcado":
            return "Sin marcado";
        case "chip-fallo":
            return "Volver a marcar (".concat(evaluacion.lmCount, " LM, \u2265").concat(MARCAR_MIN_CHIPS_FALLO, " chips con !)");
        default:
            return "—";
    }
}
/**
 * Decide si una lectura extraída debe aparecer en «Marcar».
 * El marcado se juzga por filas LM (no solo la tabla Marcado).
 *
 * - Normal: sin ninguna LM en esa lectura extraída (p. ej. 2.ª lectura sin marcar).
 * - Ámbar: 1 LM y ≥2 chips con Repetir_Chip.
 * - Excluida: ya hay 2 LM en esa lectura extraída, o no cumple chips fallidos.
 */
export function evaluarMarcarLectura(input) {
    var _a;
    var mediaLectura = input.mediaLectura != null && Number.isFinite(Number(input.mediaLectura))
        ? Number(input.mediaLectura)
        : null;
    if (mediaLectura == null || mediaLectura <= MARCAR_THRESHOLD_MEDIA)
        return null;
    var lmRows = sortLmRows(input.lmRows);
    var n = lmRows.length;
    if (n === 0) {
        return { variant: "normal", lmCount: 0, motivo: "sin-marcado" };
    }
    if (n >= MARCAR_MAX_LM_ROWS)
        return null;
    var latest = lmRows[n - 1];
    var latestMedia = mediaDeMarcadoLM(latest);
    if (latestMedia == null)
        return null;
    if (tieneDosChipsFallidos((_a = input.chipsUltimaLm) !== null && _a !== void 0 ? _a : [])) {
        return { variant: "ambar", lmCount: n, motivo: "chip-fallo" };
    }
    return null;
}
