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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
export function indexPreselectByNumBN(rows) {
    var map = {};
    for (var _i = 0, rows_1 = rows; _i < rows_1.length; _i++) {
        var row = rows_1[_i];
        var numBN = Number(row.NumBN_Preselect);
        if (!Number.isFinite(numBN))
            continue;
        map[numBN] = row;
    }
    return map;
}
export function fetchPreselectLinksByNumBN(supabase) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, data, error;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, supabase
                        .from("Preselect")
                        .select("Petic_Preselect, Coment_Preselect, NumBN_Preselect")
                        .not("NumBN_Preselect", "is", null)];
                case 1:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error)
                        throw error;
                    return [2 /*return*/, indexPreselectByNumBN((data || []))];
            }
        });
    });
}
export var PRESELECT_DUPLICATE_MESSAGE = "Petición ya incluida en lista de preselección";
var PETIC_MAX_LEN = 64;
export function normalizePetic(value) {
    if (value == null)
        return null;
    var s = String(value).trim();
    return s === "" ? null : s;
}
export function parsePeticInput(value) {
    var trimmed = normalizePetic(value);
    if (!trimmed)
        return null;
    if (trimmed.length > PETIC_MAX_LEN)
        return null;
    if (/[\r\n\t]/.test(trimmed))
        return null;
    return trimmed;
}
export function samePetic(a, b) {
    var na = normalizePetic(a);
    var nb = normalizePetic(b);
    return na != null && na === nb;
}
export function formatPreselectFecha(value) {
    if (!value)
        return "—";
    var d = new Date(value);
    if (Number.isNaN(d.getTime()))
        return value;
    return d.toLocaleString("es-ES");
}
export function labelDxPreselect(row, dxList) {
    var _a, _b, _c;
    if ((_a = row.DDx) === null || _a === void 0 ? void 0 : _a.Dx)
        return row.DDx.Dx;
    var cod = row.Dx_Preselect;
    if (cod == null)
        return "—";
    return (_c = (_b = dxList.find(function (d) { return Number(d.Cod) === Number(cod); })) === null || _b === void 0 ? void 0 : _b.Dx) !== null && _c !== void 0 ? _c : "—";
}
export function buildFechaPreselectNow() {
    return new Date().toISOString();
}
export function buildPreselectHighlightPath(petic) {
    return "/preselect?petic=".concat(encodeURIComponent(String(petic)));
}
export function parsePreselectHighlightPetic(params) {
    var _a;
    return parsePeticInput((_a = params.get("petic")) !== null && _a !== void 0 ? _a : "");
}
export var PRESELECT_DX_FILTER_NONE = "none";
export function filterPreselectByDx(rows, dxFilter) {
    var f = String(dxFilter !== null && dxFilter !== void 0 ? dxFilter : "").trim();
    if (!f)
        return rows;
    if (f === PRESELECT_DX_FILTER_NONE) {
        return rows.filter(function (row) { return row.Dx_Preselect == null; });
    }
    var cod = Number(f);
    if (!Number.isFinite(cod))
        return rows;
    return rows.filter(function (row) { return Number(row.Dx_Preselect) === cod; });
}
function peticTiebreak(a, b) {
    return String(a.Petic_Preselect).localeCompare(String(b.Petic_Preselect), undefined, {
        numeric: true,
    });
}
function applyDir(cmp, dir) {
    if (cmp === 0)
        return 0;
    return dir === "asc" ? cmp : -cmp;
}
export function sortPreselectRows(rows, key, dir) {
    return __spreadArray([], rows, true).sort(function (a, b) {
        if (key === "numBN") {
            var na = Number(a.NumBN_Preselect);
            var nb = Number(b.NumBN_Preselect);
            var aOk_1 = Number.isFinite(na);
            var bOk_1 = Number.isFinite(nb);
            if (!aOk_1 && !bOk_1)
                return peticTiebreak(a, b);
            if (!aOk_1)
                return 1;
            if (!bOk_1)
                return -1;
            var cmp_1 = na - nb;
            return cmp_1 !== 0 ? applyDir(cmp_1, dir) : peticTiebreak(a, b);
        }
        var ta = a.Fecha_Preselect ? Date.parse(a.Fecha_Preselect) : NaN;
        var tb = b.Fecha_Preselect ? Date.parse(b.Fecha_Preselect) : NaN;
        var aOk = Number.isFinite(ta);
        var bOk = Number.isFinite(tb);
        if (!aOk && !bOk)
            return peticTiebreak(a, b);
        if (!aOk)
            return 1;
        if (!bOk)
            return -1;
        var cmp = ta - tb;
        return cmp !== 0 ? applyDir(cmp, dir) : peticTiebreak(a, b);
    });
}
export function fetchNextNumBN(supabase) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, data, error;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, supabase
                        .from("Muestras")
                        .select("NumBN")
                        .order("NumBN", { ascending: false })
                        .limit(1)
                        .maybeSingle()];
                case 1:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error)
                        throw error;
                    return [2 /*return*/, (data === null || data === void 0 ? void 0 : data.NumBN) ? Number(data.NumBN) + 1 : 1];
            }
        });
    });
}
export function crearMuestraDesdePreselect(supabase, petic) {
    return __awaiter(this, void 0, void 0, function () {
        var peticN, _a, preselectRow, preselectError, _b, muestraConPetic, peticCheckError, numBN, muestraInsert, insertError, linkError;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    peticN = parsePeticInput(petic);
                    if (!peticN)
                        throw new Error("Nº de petición vacío");
                    return [4 /*yield*/, supabase
                            .from("Preselect")
                            .select("Petic_Preselect, NumBN_Preselect, Dx_Preselect")
                            .eq("Petic_Preselect", peticN)
                            .maybeSingle()];
                case 1:
                    _a = _c.sent(), preselectRow = _a.data, preselectError = _a.error;
                    if (preselectError)
                        throw preselectError;
                    if (!preselectRow)
                        throw new Error("No se encontró la petición en preselección");
                    if (preselectRow.NumBN_Preselect != null) {
                        throw new Error("Esta petición ya tiene un Nº Bionano asignado");
                    }
                    return [4 /*yield*/, supabase
                            .from("Muestras")
                            .select("NumBN, Petic")
                            .eq("Petic", peticN)
                            .maybeSingle()];
                case 2:
                    _b = _c.sent(), muestraConPetic = _b.data, peticCheckError = _b.error;
                    if (peticCheckError)
                        throw peticCheckError;
                    if ((muestraConPetic === null || muestraConPetic === void 0 ? void 0 : muestraConPetic.NumBN) != null) {
                        throw new Error("La petici\u00F3n ".concat(peticN, " ya existe en Muestras (N\u00BA ").concat(muestraConPetic.NumBN, ")"));
                    }
                    return [4 /*yield*/, fetchNextNumBN(supabase)];
                case 3:
                    numBN = _c.sent();
                    muestraInsert = {
                        NumBN: numBN,
                        Petic: peticN,
                        Estado_Muestra: null,
                    };
                    if (preselectRow.Dx_Preselect != null) {
                        muestraInsert.Dx = Number(preselectRow.Dx_Preselect);
                    }
                    return [4 /*yield*/, supabase.from("Muestras").insert([muestraInsert])];
                case 4:
                    insertError = (_c.sent()).error;
                    if (insertError)
                        throw insertError;
                    return [4 /*yield*/, supabase
                            .from("Preselect")
                            .update({ NumBN_Preselect: numBN })
                            .eq("Petic_Preselect", peticN)];
                case 5:
                    linkError = (_c.sent()).error;
                    if (!linkError) return [3 /*break*/, 7];
                    return [4 /*yield*/, supabase.from("Muestras").delete().eq("NumBN", numBN)];
                case 6:
                    _c.sent();
                    throw linkError;
                case 7: return [2 /*return*/, numBN];
            }
        });
    });
}
