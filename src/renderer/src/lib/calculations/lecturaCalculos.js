/** Cálculos en cliente — mismas fórmulas que los triggers de Supabase */
export function parseNumForCalc(value) {
    if (value === null || value === undefined || value === "")
        return null;
    var n = parseFloat(String(value));
    return Number.isFinite(n) ? n : null;
}
/** Trigger actualizar_media_lectura: (Izq + Cen + Dcha) / 3, SD y CV derivados */
export function calcStatsLectura(izq, cen, dcha) {
    var i = parseNumForCalc(izq);
    var c = parseNumForCalc(cen);
    var d = parseNumForCalc(dcha);
    if (i === null || c === null || d === null) {
        return { media: null, sd: null, cv: null };
    }
    var media = (i + c + d) / 3;
    var sd = Math.sqrt((Math.pow((i - media), 2) + Math.pow((c - media), 2) + Math.pow((d - media), 2)) / 3);
    var cv = media === 0 ? null : sd / media;
    return { media: media, sd: sd, cv: cv };
}
/** Trigger actualizar_media_lm: (Izq_LM + Dcha_LM) / 2, SD_LM y CV_LM derivados */
export function calcStatsMarcado(izqLm, dchaLm) {
    var i = parseNumForCalc(izqLm);
    var d = parseNumForCalc(dchaLm);
    if (i === null || d === null) {
        return { media: null, sd: null, cv: null };
    }
    var media = (i + d) / 2;
    var sd = Math.sqrt((Math.pow((i - media), 2) + Math.pow((d - media), 2)) / 2);
    var cv = media === 0 ? null : sd / media;
    return { media: media, sd: sd, cv: cv };
}
export function formatCalcStat(value, decimals) {
    if (decimals === void 0) { decimals = 2; }
    if (value === null || value === undefined || !Number.isFinite(value))
        return "—";
    return value.toFixed(decimals);
}
/** Rangos inclusivos del cajetín de media (muestra): extraído 45–90, marcado 4–16. */
export var MEDIA_EXTRAIDO_OK_MIN = 45;
export var MEDIA_EXTRAIDO_OK_MAX = 90;
export var MEDIA_MARCADO_OK_MIN = 4;
export var MEDIA_MARCADO_OK_MAX = 16;
/** Verde / rojo / amarillo reutilizan `lectura-cuant-ok|bajo|alto` de Acciones. */
export function cuantificacionSemaforoClass(value, minOk, maxOk) {
    var n = parseNumForCalc(value);
    if (n === null)
        return "";
    if (n < minOk)
        return "lectura-cuant-bajo";
    if (n > maxOk)
        return "lectura-cuant-alto";
    return "lectura-cuant-ok";
}
export function mediaExtraidoSemaforoClass(value) {
    return cuantificacionSemaforoClass(value, MEDIA_EXTRAIDO_OK_MIN, MEDIA_EXTRAIDO_OK_MAX);
}
export function mediaMarcadoSemaforoClass(value) {
    return cuantificacionSemaforoClass(value, MEDIA_MARCADO_OK_MIN, MEDIA_MARCADO_OK_MAX);
}
