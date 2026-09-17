var NAV_STORAGE_KEY = "bionapp:muestraNavegacion";
export function saveMuestraNavegacion(target) {
    try {
        window.sessionStorage.setItem(NAV_STORAGE_KEY, JSON.stringify(target));
    }
    catch (_a) {
        // sessionStorage no disponible
    }
}
export function readMuestraNavegacion() {
    try {
        var raw = window.sessionStorage.getItem(NAV_STORAGE_KEY);
        if (!raw)
            return null;
        var parsed = JSON.parse(raw);
        var numBN = Number(parsed === null || parsed === void 0 ? void 0 : parsed.numBN);
        if (!Number.isFinite(numBN))
            return null;
        return {
            numBN: numBN,
            numLectura: parsed.numLectura != null ? Number(parsed.numLectura) : null,
            numLectMarc: parsed.numLectMarc != null ? Number(parsed.numLectMarc) : null,
        };
    }
    catch (_a) {
        return null;
    }
}
export function clearMuestraNavegacion() {
    try {
        window.sessionStorage.removeItem(NAV_STORAGE_KEY);
    }
    catch (_a) {
        // ignorar
    }
}
export function readAndClearMuestraNavegacion() {
    var target = readMuestraNavegacion();
    if (target)
        clearMuestraNavegacion();
    return target;
}
export function parseMuestraNavegacionFromSearchParams(params) {
    var _a, _b, _c;
    var bn = (_a = params.get("bn")) !== null && _a !== void 0 ? _a : params.get("numBN");
    if (!bn)
        return null;
    var numBN = Number(bn);
    if (!Number.isFinite(numBN))
        return null;
    var lecturaRaw = (_b = params.get("lectura")) !== null && _b !== void 0 ? _b : params.get("numLectura");
    var lmRaw = (_c = params.get("lm")) !== null && _c !== void 0 ? _c : params.get("numLectMarc");
    return {
        numBN: numBN,
        numLectura: lecturaRaw != null && lecturaRaw !== "" ? Number(lecturaRaw) : null,
        numLectMarc: lmRaw != null && lmRaw !== "" ? Number(lmRaw) : null,
    };
}
export function buildMuestraAppPath(target) {
    var params = new URLSearchParams();
    params.set("bn", String(target.numBN));
    if (target.numLectura != null && Number.isFinite(Number(target.numLectura))) {
        params.set("lectura", String(target.numLectura));
    }
    if (target.numLectMarc != null && Number.isFinite(Number(target.numLectMarc))) {
        params.set("lm", String(target.numLectMarc));
    }
    return "/?".concat(params.toString());
}
export function applyMuestraNavegacion(muestras, target) {
    var _a, _b, _c;
    var muestraIndex = muestras.findIndex(function (m) { return Number(m.NumBN) === Number(target.numBN); });
    if (muestraIndex === -1)
        return null;
    var lecturas = ((_a = muestras[muestraIndex]) === null || _a === void 0 ? void 0 : _a.lecturas) || [];
    var lecturaIndex = 0;
    if (target.numLectura != null && Number.isFinite(Number(target.numLectura))) {
        var idx = lecturas.findIndex(function (l) { return Number(l.NumLectura) === Number(target.numLectura); });
        if (idx !== -1)
            lecturaIndex = idx;
    }
    var lms = ((_c = (_b = lecturas[lecturaIndex]) === null || _b === void 0 ? void 0 : _b.marcado) === null || _c === void 0 ? void 0 : _c.lecturasMarcado) || [];
    var lectMarcIndex = 0;
    if (target.numLectMarc != null && Number.isFinite(Number(target.numLectMarc))) {
        var idx = lms.findIndex(function (lm) { return Number(lm.NumLectMarc) === Number(target.numLectMarc); });
        if (idx !== -1)
            lectMarcIndex = idx;
    }
    return { muestraIndex: muestraIndex, lecturaIndex: lecturaIndex, lectMarcIndex: lectMarcIndex };
}
