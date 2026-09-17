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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "../../lib/supabaseClient";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "../ui/table";
import { calcDilucionDna, DILUCION_MAX_MUESTRAS, DILUCION_MIN_NG, DILUCION_TARGET_NG, DILUCION_VOL_TOTAL_UL, formatDilucionCv, formatDilucionNg, formatDilucionUl, effectiveCvFromLectura, effectiveMediaNgPerUlFromLectura, lecturaDilucionKey, lecturaTieneMarcadoParaDilucion, } from "../../lib/calculations/dilucionDnaCalculos";
var LECTURA_DILUCION_SELECT = "\n  NumBN_L,\n  NumLectura,\n  Media_Lectura,\n  CV_Lectura,\n  Izq,\n  Cen,\n  Dcha,\n  Muestras!inner(Estado_Muestra),\n  Marcado(\n    NumBN_M,\n    NumLectura_M,\n    Fecha_Marcado,\n    Fecha_Lect_Marc,\n    Lecturas_Marcado(NumLectMarc)\n  )\n";
/** PostgREST devuelve como máximo 1000 filas por petición; paginamos para no perder BN altos (p. ej. 235). */
function fetchAllLecturasEstado2Paginated() {
    return __awaiter(this, void 0, void 0, function () {
        var pageSize, all, from, _a, data, error, chunk;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    pageSize = 1000;
                    all = [];
                    from = 0;
                    _b.label = 1;
                case 1: return [4 /*yield*/, supabase
                        .from("Lectura")
                        .select(LECTURA_DILUCION_SELECT)
                        .eq("Muestras.Estado_Muestra", 2)
                        .order("NumBN_L", { ascending: true })
                        .order("NumLectura", { ascending: true })
                        .range(from, from + pageSize - 1)];
                case 2:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error)
                        throw error;
                    chunk = data !== null && data !== void 0 ? data : [];
                    all.push.apply(all, chunk);
                    if (chunk.length < pageSize)
                        return [3 /*break*/, 4];
                    _b.label = 3;
                case 3:
                    from += pageSize;
                    return [3 /*break*/, 1];
                case 4: return [2 /*return*/, all];
            }
        });
    });
}
function buildCandidatasFromLecturas(lecturas) {
    var candidatas = [];
    for (var _i = 0, lecturas_1 = lecturas; _i < lecturas_1.length; _i++) {
        var l = lecturas_1[_i];
        if (lecturaTieneMarcadoParaDilucion(l.Marcado))
            continue;
        var numBN = Number(l.NumBN_L);
        var numLectura = Number(l.NumLectura);
        if (!Number.isFinite(numBN) || !Number.isFinite(numLectura))
            continue;
        var mediaNgPerUl = effectiveMediaNgPerUlFromLectura(l);
        if (mediaNgPerUl == null)
            continue;
        candidatas.push({
            key: lecturaDilucionKey(numBN, numLectura),
            numBN: numBN,
            numLectura: numLectura,
            mediaNgPerUl: mediaNgPerUl,
            cv: effectiveCvFromLectura(l),
        });
    }
    return candidatas;
}
/** BN estado 2, lectura sin Marcado y con media de DNA (Media_Lectura o I/C/D). */
function fetchLecturasDilucionCandidatasFromRows(lecturas) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, buildCandidatasFromLecturas(lecturas)];
        });
    });
}
function labelMuestra(row, t) {
    return t("dilution.sampleLabel", { numBN: row.numBN, numLectura: row.numLectura });
}
export default function DilucionDnaTab() {
    var _this = this;
    var t = useTranslation().t;
    var _a = useState(true), loading = _a[0], setLoading = _a[1];
    var _b = useState([]), candidatas = _b[0], setCandidatas = _b[1];
    var _c = useState([]), selectedKeys = _c[0], setSelectedKeys = _c[1];
    var _d = useState(""), pickKey = _d[0], setPickKey = _d[1];
    var reload = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var lecturas, list_1, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, fetchAllLecturasEstado2Paginated()];
                case 2:
                    lecturas = _a.sent();
                    return [4 /*yield*/, fetchLecturasDilucionCandidatasFromRows(lecturas)];
                case 3:
                    list_1 = _a.sent();
                    setCandidatas(list_1);
                    setSelectedKeys(function (prev) {
                        return prev.filter(function (k) { return list_1.some(function (c) { return c.key === k; }); }).slice(0, DILUCION_MAX_MUESTRAS);
                    });
                    return [3 /*break*/, 6];
                case 4:
                    err_1 = _a.sent();
                    console.error(err_1);
                    toast.error(t("dilution.toast.loadError"));
                    return [3 /*break*/, 6];
                case 5:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); }, [t]);
    useEffect(function () {
        reload();
    }, [reload]);
    var candidatasByKey = useMemo(function () {
        var m = new Map();
        for (var _i = 0, candidatas_1 = candidatas; _i < candidatas_1.length; _i++) {
            var c = candidatas_1[_i];
            m.set(c.key, c);
        }
        return m;
    }, [candidatas]);
    var disponibles = useMemo(function () { return candidatas.filter(function (c) { return !selectedKeys.includes(c.key); }); }, [candidatas, selectedKeys]);
    var filas = useMemo(function () {
        return selectedKeys
            .map(function (key) { return candidatasByKey.get(key); })
            .filter(function (c) { return c != null; })
            .map(function (c) { return (__assign(__assign({}, c), { resultado: calcDilucionDna(c.mediaNgPerUl) })); });
    }, [selectedKeys, candidatasByKey]);
    var handleAdd = function () {
        if (!pickKey) {
            toast.message(t("dilution.toast.select"));
            return;
        }
        if (selectedKeys.includes(pickKey))
            return;
        if (selectedKeys.length >= DILUCION_MAX_MUESTRAS) {
            toast.error(t("dilution.toast.max", { n: DILUCION_MAX_MUESTRAS }));
            return;
        }
        setSelectedKeys(function (prev) { return __spreadArray(__spreadArray([], prev, true), [pickKey], false); });
        setPickKey("");
    };
    var handleRemove = function (key) {
        setSelectedKeys(function (prev) { return prev.filter(function (k) { return k !== key; }); });
    };
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "bionapp-panel p-4 space-y-3", children: [_jsxs("div", { children: [_jsx("div", { className: "font-semibold", children: t("dilution.title") }), _jsx("p", { className: "text-xs text-slate-500 mt-1", children: t("dilution.help", {
                                    vol: DILUCION_VOL_TOTAL_UL,
                                    ng: DILUCION_TARGET_NG,
                                    minNg: DILUCION_MIN_NG,
                                }) })] }), _jsxs("div", { className: "flex flex-wrap gap-2 text-xs", children: [_jsx(Badge, { variant: "outline", children: t("dilution.badge.totalVol", { vol: DILUCION_VOL_TOTAL_UL }) }), _jsx(Badge, { variant: "outline", children: t("dilution.badge.targetDna", { ng: DILUCION_TARGET_NG }) }), _jsx(Badge, { variant: "outline", children: t("dilution.badge.maxSamples", { n: DILUCION_MAX_MUESTRAS }) }), !loading ? (_jsx(Badge, { variant: "secondary", children: t("dilution.badge.candidates", { n: candidatas.length }) })) : null] })] }), _jsxs("div", { className: "bionapp-panel p-4", children: [_jsx("div", { className: "text-sm font-medium mb-2", children: t("dilution.addSample") }), loading ? (_jsxs("div", { className: "flex items-center gap-2 text-sm text-slate-500", children: [_jsx(Loader2, { className: "h-4 w-4 animate-spin" }), t("dilution.loading")] })) : disponibles.length === 0 && selectedKeys.length === 0 ? (_jsx("p", { className: "text-sm text-slate-500", children: t("dilution.empty") })) : (_jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsxs("select", { value: pickKey, onChange: function (e) { return setPickKey(e.target.value); }, disabled: disponibles.length === 0 || selectedKeys.length >= DILUCION_MAX_MUESTRAS, className: "h-9 flex-1 min-w-[12rem] max-w-xl text-sm border border-input rounded-md px-2 bg-background", children: [_jsx("option", { value: "", children: disponibles.length === 0
                                            ? t("dilution.allAdded")
                                            : t("dilution.selectReading") }), disponibles.map(function (c) { return (_jsx("option", { value: c.key, children: t("dilution.option", {
                                            label: labelMuestra(c, t),
                                            media: c.mediaNgPerUl.toFixed(2),
                                        }) }, c.key)); })] }), _jsxs(Button, { type: "button", size: "sm", variant: "secondary", onClick: handleAdd, disabled: !pickKey || selectedKeys.length >= DILUCION_MAX_MUESTRAS || disponibles.length === 0, children: [_jsx(Plus, { className: "h-4 w-4 mr-1" }), t("dilution.add")] }), _jsx(Button, { type: "button", size: "sm", variant: "outline", onClick: function () { return reload(); }, children: t("dilution.refresh") })] })), selectedKeys.length > 0 ? (_jsx("div", { className: "flex flex-wrap gap-2 mt-3", children: selectedKeys.map(function (key) {
                            var c = candidatasByKey.get(key);
                            if (!c)
                                return null;
                            return (_jsxs(Badge, { variant: "default", className: "gap-1 pr-1", children: [_jsx("span", { className: "text-xs", children: labelMuestra(c, t) }), _jsx("button", { type: "button", className: "rounded hover:bg-white/20 p-0.5", onClick: function () { return handleRemove(key); }, title: t("dilution.remove"), children: _jsx(X, { className: "h-3 w-3" }) })] }, key));
                        }) })) : null] }), filas.length > 0 ? (_jsxs("div", { className: "bionapp-panel p-4", children: [_jsx("div", { className: "font-semibold mb-3", children: t("dilution.volumes") }), _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { className: "w-16", children: t("dilution.col.cv") }), _jsx(TableHead, { children: t("dilution.col.sample") }), _jsx(TableHead, { className: "text-right", children: t("dilution.col.mean") }), _jsx(TableHead, { className: "text-right", children: t("dilution.col.water") }), _jsx(TableHead, { className: "text-right", children: t("dilution.col.dna") }), _jsx(TableHead, { className: "text-right", children: t("dilution.col.ngMix") }), _jsx(TableHead, { children: t("dilution.col.notes") })] }) }), _jsx(TableBody, { children: filas.map(function (f) {
                                    var r = f.resultado;
                                    var notas = [];
                                    if (r.error)
                                        notas.push(t("dilution.err.invalidMean"));
                                    if (r.mediaFueraRangoIdeal)
                                        notas.push(t("dilution.note.outOfRange"));
                                    if (r.bajoMinimoNg)
                                        notas.push(t("dilution.note.belowMin", { minNg: DILUCION_MIN_NG }));
                                    if (r.volumenDnaAlMaximo && !r.bajoMinimoNg && r.ngEnMezclaDna != null) {
                                        notas.push(t("dilution.note.maxDna"));
                                    }
                                    return (_jsxs(TableRow, { children: [_jsx(TableCell, { children: formatDilucionCv(f.cv) }), _jsx(TableCell, { className: "font-medium", children: labelMuestra(f, t) }), _jsx(TableCell, { className: "text-right", children: f.mediaNgPerUl.toFixed(2) }), _jsx(TableCell, { className: "text-right font-medium", children: formatDilucionUl(r.volH2OUl) }), _jsx(TableCell, { className: "text-right font-medium", children: formatDilucionUl(r.volDnaUl) }), _jsx(TableCell, { className: "text-right", children: r.volumenDnaAlMaximo ? formatDilucionNg(r.ngEnMezclaDna) : t("common.empty") }), _jsx(TableCell, { className: "text-xs bionapp-text-warn", children: notas.length ? notas.join(" · ") : t("common.empty") })] }, f.key));
                                }) })] })] })) : null] }));
}
