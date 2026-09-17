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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { supabase } from "./supabaseClient";
import { hydrateLecturasMarcadoFromLots, hydrateMuestrasFromLots, toLoteRow, } from "./lotesPageData";
function groupBy(rows, keyFn) {
    var map = new Map();
    for (var _i = 0, rows_1 = rows; _i < rows_1.length; _i++) {
        var row = rows_1[_i];
        var key = keyFn(row);
        var arr = map.get(key);
        if (arr)
            arr.push(row);
        else
            map.set(key, [row]);
    }
    return map;
}
function assembleMuestra(muestra, lecturasData, marcadosData, lmData, chipsData) {
    var numBN = muestra.NumBN;
    var marcadoByLectura = new Map();
    for (var _i = 0, _a = marcadosData; _i < _a.length; _i++) {
        var marcado = _a[_i];
        marcadoByLectura.set(marcado.NumLectura_M, marcado);
    }
    var lmByLectura = new Map();
    for (var _b = 0, _c = lmData; _b < _c.length; _b++) {
        var lm = _c[_b];
        var lecturaKey = lm.NumLectura_LM;
        var arr = lmByLectura.get(lecturaKey);
        if (arr)
            arr.push(lm);
        else
            lmByLectura.set(lecturaKey, [lm]);
    }
    var chipsByLm = new Map();
    for (var _d = 0, _e = chipsData; _d < _e.length; _d++) {
        var chip = _e[_d];
        var lmKey = "".concat(chip.NumLectura_C, "_").concat(chip.NumLectMarc_C);
        var arr = chipsByLm.get(lmKey);
        if (arr)
            arr.push(chip);
        else
            chipsByLm.set(lmKey, [chip]);
    }
    var lecturasConMarcado = lecturasData.map(function (lectura) {
        var marcadoData = marcadoByLectura.get(lectura.NumLectura);
        if (!marcadoData) {
            return __assign(__assign({}, lectura), { marcado: null });
        }
        var lecturasMarcado = (lmByLectura.get(lectura.NumLectura) || []).map(function (lm) { return (__assign(__assign({}, lm), { chips: chipsByLm.get("".concat(lm.NumLectura_LM, "_").concat(lm.NumLectMarc)) || [] })); });
        return __assign(__assign({}, lectura), { marcado: __assign(__assign({}, marcadoData), { lecturasMarcado: lecturasMarcado }) });
    });
    return __assign(__assign({}, muestra), { NumBN: numBN, lecturas: lecturasConMarcado });
}
/** Carga todas las muestras con lecturas/marcado/chips y catálogos de lote. */
export function fetchMuestrasCompletasFromSupabase() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, _b, muestrasData, muestrasError, _c, allLecturas, lecturasError, _d, allMarcados, marcadosError, _e, allLm, lmError, _f, allChips, chipsError, _g, lotesEData, lotesEError, _h, lotesMData, lotesMError, _j, lotesMmData, lotesMmError, catalogRows, lecturasByBn, marcadosByBn, lmByBn, chipsByBn;
        return __generator(this, function (_k) {
            switch (_k.label) {
                case 0: return [4 /*yield*/, Promise.all([
                        supabase
                            .from("Muestras")
                            .select("\n        *,\n        DDx ( Dx ),\n        DMuestra ( TipoMuestra )\n        ")
                            .order("NumBN", { ascending: true }),
                        supabase.from("Lectura").select("*").order("NumBN_L", { ascending: true }).order("NumLectura", { ascending: true }),
                        supabase.from("Marcado").select("*"),
                        supabase
                            .from("Lecturas_Marcado")
                            .select("*")
                            .order("NumBN_LM", { ascending: true })
                            .order("NumLectMarc", { ascending: true }),
                        supabase.from("Chips").select("*").order("NumBN_C", { ascending: true }).order("NumChip", { ascending: true }),
                        supabase.from("Lotes_Extraido").select("*"),
                        supabase.from("Lotes_Marcado").select("*"),
                        supabase.from("Lotes_Membrana").select("*"),
                    ])];
                case 1:
                    _a = _k.sent(), _b = _a[0], muestrasData = _b.data, muestrasError = _b.error, _c = _a[1], allLecturas = _c.data, lecturasError = _c.error, _d = _a[2], allMarcados = _d.data, marcadosError = _d.error, _e = _a[3], allLm = _e.data, lmError = _e.error, _f = _a[4], allChips = _f.data, chipsError = _f.error, _g = _a[5], lotesEData = _g.data, lotesEError = _g.error, _h = _a[6], lotesMData = _h.data, lotesMError = _h.error, _j = _a[7], lotesMmData = _j.data, lotesMmError = _j.error;
                    if (muestrasError)
                        throw muestrasError;
                    if (lecturasError)
                        throw lecturasError;
                    if (marcadosError)
                        throw marcadosError;
                    if (lmError)
                        throw lmError;
                    if (chipsError)
                        throw chipsError;
                    if (lotesEError)
                        throw lotesEError;
                    if (lotesMError)
                        throw lotesMError;
                    if (lotesMmError)
                        throw lotesMmError;
                    catalogRows = function (data, tipo) {
                        return (data || [])
                            .map(function (row) { return toLoteRow(row, tipo); })
                            .filter(function (row) { return row != null; });
                    };
                    hydrateMuestrasFromLots((muestrasData || []), catalogRows(lotesEData, "extraido"));
                    hydrateLecturasMarcadoFromLots((allLm || []), catalogRows(lotesMData, "marcado"), catalogRows(lotesMmData, "membrana"));
                    lecturasByBn = groupBy(allLecturas || [], function (r) { return r.NumBN_L; });
                    marcadosByBn = groupBy(allMarcados || [], function (r) { return r.NumBN_M; });
                    lmByBn = groupBy(allLm || [], function (r) { return r.NumBN_LM; });
                    chipsByBn = groupBy(allChips || [], function (r) { return r.NumBN_C; });
                    return [2 /*return*/, (muestrasData || []).map(function (muestra) {
                            var numBN = muestra.NumBN;
                            return assembleMuestra(muestra, lecturasByBn.get(numBN) || [], marcadosByBn.get(numBN) || [], lmByBn.get(numBN) || [], chipsByBn.get(numBN) || []);
                        })];
            }
        });
    });
}
export function formatMuestrasFetchError(err) {
    var _a, _b, _c, _d;
    var msg = String((_d = (_c = (_b = (_a = err === null || err === void 0 ? void 0 : err.message) !== null && _a !== void 0 ? _a : err === null || err === void 0 ? void 0 : err.details) !== null && _b !== void 0 ? _b : err === null || err === void 0 ? void 0 : err.hint) !== null && _c !== void 0 ? _c : err) !== null && _d !== void 0 ? _d : "Error desconocido");
    if (/failed to fetch|network|proxy|timeout|aborted/i.test(msg)) {
        return "No se pudieron cargar las muestras. Suele deberse a un fallo de red o del proxy (VPN, antivirus, empresa). Comprueba la conexión y pulsa Reintentar.";
    }
    return "No se pudieron cargar las muestras: ".concat(msg);
}
