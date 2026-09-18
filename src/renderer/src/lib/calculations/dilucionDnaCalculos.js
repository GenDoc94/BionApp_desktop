import { calcStatsLectura } from "./lecturaCalculos";
/** Dilución DNA — mismas fórmulas que la hoja «Cálculos DNA» del Excel del laboratorio */
export var DILUCION_VOL_TOTAL_UL = 19.5;
export var DILUCION_TARGET_NG = 750;
export var DILUCION_MIN_NG = 500;
export var DILUCION_MEDIA_IDEAL_MIN = 39;
export var DILUCION_MEDIA_IDEAL_MAX = 150;
export var DILUCION_MAX_MUESTRAS = 12;
export function calcDilucionDna(mediaNgPerUl, options) {
    var _a, _b, _c;
    var volTotalUl = (_a = options === null || options === void 0 ? void 0 : options.volTotalUl) !== null && _a !== void 0 ? _a : DILUCION_VOL_TOTAL_UL;
    var targetNg = (_b = options === null || options === void 0 ? void 0 : options.targetNg) !== null && _b !== void 0 ? _b : DILUCION_TARGET_NG;
    var minNg = (_c = options === null || options === void 0 ? void 0 : options.minNg) !== null && _c !== void 0 ? _c : DILUCION_MIN_NG;
    var media = mediaNgPerUl != null ? Number(mediaNgPerUl) : NaN;
    if (!Number.isFinite(media) || media <= 0) {
        return {
            volH2OUl: null,
            volDnaUl: null,
            ngEnMezclaDna: null,
            volumenDnaAlMaximo: false,
            mediaFueraRangoIdeal: false,
            bajoMinimoNg: false,
            error: "Media de DNA no válida",
        };
    }
    // Excel E6: IF((750/C6)>19.5, 19.5, 750/C6)
    var volDnaCrudo = targetNg / media;
    var volDnaUl = Math.min(volTotalUl, volDnaCrudo);
    var volumenDnaAlMaximo = volDnaUl >= volTotalUl - 1e-9;
    // Excel D6: IF(($F$2-E6)<0, 0, $F$2-E6)
    var volH2OUl = Math.max(0, volTotalUl - volDnaUl);
    // Excel H6: IF((E6=19.5), (19.5*C6), "") — en app siempre mostramos ng
    var ngEnMezclaDna = volumenDnaAlMaximo ? volTotalUl * media : targetNg;
    var mediaFueraRangoIdeal = media < DILUCION_MEDIA_IDEAL_MIN || media > DILUCION_MEDIA_IDEAL_MAX;
    var bajoMinimoNg = volumenDnaAlMaximo && ngEnMezclaDna < minNg;
    return {
        volH2OUl: volH2OUl,
        volDnaUl: volDnaUl,
        ngEnMezclaDna: ngEnMezclaDna,
        volumenDnaAlMaximo: volumenDnaAlMaximo,
        mediaFueraRangoIdeal: mediaFueraRangoIdeal,
        bajoMinimoNg: bajoMinimoNg,
        error: null,
    };
}
export function formatDilucionUl(value) {
    if (value === null || value === undefined || !Number.isFinite(value))
        return "—";
    return value.toFixed(1);
}
export function formatDilucionNg(value) {
    if (value === null || value === undefined || !Number.isFinite(value))
        return "—";
    return value.toFixed(1);
}
export function formatDilucionCv(value) {
    if (value === null || value === undefined || !Number.isFinite(value))
        return "—";
    return value.toFixed(2);
}
export function lecturaDilucionKey(numBN, numLectura) {
    return "".concat(numBN, "_").concat(numLectura);
}
/** Media ng/µL: columna Media_Lectura o, si falta, (I+C+D)/3 como en la pantalla principal */
export function effectiveMediaNgPerUlFromLectura(row) {
    var stored = row.Media_Lectura != null && row.Media_Lectura !== "" ? Number(row.Media_Lectura) : NaN;
    if (Number.isFinite(stored) && stored > 0)
        return stored;
    var media = calcStatsLectura(row.Izq, row.Cen, row.Dcha).media;
    if (media != null && media > 0)
        return media;
    return null;
}
export function effectiveCvFromLectura(row) {
    var stored = row.CV_Lectura != null && row.CV_Lectura !== "" ? Number(row.CV_Lectura) : NaN;
    if (Number.isFinite(stored))
        return stored;
    var cv = calcStatsLectura(row.Izq, row.Cen, row.Dcha).cv;
    return cv;
}
function tieneValorRelleno(value) {
    return value != null && value !== "";
}
var CAMPOS_MARCADO_PROGRESO = [
    "Comentario_Membrana",
    "Fecha_Lect_Marc",
    "Cargado_M",
    "Izq_M",
    "Dcha_M",
];
var CAMPOS_LM_PROGRESO = [
    "Cargado_LM",
    "Izq_LM",
    "Dcha_LM",
    "Media_LM",
];
function lecturasMarcadoDe(row) {
    var lms = row.Lecturas_Marcado;
    if (Array.isArray(lms))
        return lms.filter(function (r) { return r != null && typeof r === "object"; });
    if (lms != null && typeof lms === "object")
        return [lms];
    return [];
}
function lmConProgreso(lm) {
    return CAMPOS_LM_PROGRESO.some(function (k) { return tieneValorRelleno(lm[k]); });
}
function marcadoConProgreso(row) {
    if (CAMPOS_MARCADO_PROGRESO.some(function (k) { return tieneValorRelleno(row[k]); }))
        return true;
    return lecturasMarcadoDe(row).some(lmConProgreso);
}
/**
 * Candidata a dilución DNA: marcaje iniciado en Acciones (Marcado + ≥1 LM)
 * y aún sin rellenar cuantificación ni otros datos de laboratorio.
 */
export function lecturaListaParaDilucionMarcaje(marcado) {
    if (marcado == null)
        return false;
    var rows = Array.isArray(marcado) ? marcado : [marcado];
    var algunaLm = false;
    for (var i = 0; i < rows.length; i++) {
        var r = rows[i];
        if (r == null || typeof r !== "object")
            continue;
        var lms = lecturasMarcadoDe(r);
        if (lms.length === 0)
            continue;
        algunaLm = true;
        if (marcadoConProgreso(r))
            return false;
    }
    return algunaLm;
}
function claveLectura(numBN, numLectura) {
    var bn = Number(numBN);
    var lect = Number(numLectura);
    if (!Number.isFinite(bn) || !Number.isFinite(lect))
        return null;
    return bn + ":" + lect;
}
export function nestMarcadoEnLecturas(lecturas, marcados, lecturasMarcado) {
    var lmsPorLectura = new Map();
    for (var i = 0; i < lecturasMarcado.length; i++) {
        var lm = lecturasMarcado[i];
        var key = claveLectura(lm.NumBN_LM, lm.NumLectura_LM);
        if (!key)
            continue;
        var list = lmsPorLectura.get(key) || [];
        list.push(lm);
        lmsPorLectura.set(key, list);
    }
    var marcadoPorLectura = new Map();
    for (var j = 0; j < marcados.length; j++) {
        var row = marcados[j];
        var mKey = claveLectura(row.NumBN_M, row.NumLectura_M);
        if (!mKey)
            continue;
        marcadoPorLectura.set(mKey, Object.assign({}, row, { Lecturas_Marcado: lmsPorLectura.get(mKey) || [] }));
    }
    return lecturas.map(function (l) {
        var lKey = claveLectura(l.NumBN_L, l.NumLectura);
        return Object.assign({}, l, { Marcado: lKey ? (marcadoPorLectura.get(lKey) || null) : null });
    });
}
