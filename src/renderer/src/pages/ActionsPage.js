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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import SubpageShell from "../components/SubpageShell";
import { Badge } from "../components/ui/badge";
import { CircleDot, ClipboardList, Cpu, Edit, Eye, Highlighter, Loader2, Pickaxe, Printer, Save, Send, Trash, TriangleAlert, X } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../authContext";
import { toast } from "sonner";
import { cn } from "../components/ui/utils";
import i18n from "../i18n";
import { calcStatsLectura, calcStatsMarcado, formatCalcStat } from "../lib/calculations/lecturaCalculos";
import { chipRepetirActivo, evaluarMarcarLectura, MARCAR_MAX_MEDIA_LM, MARCAR_MIN_CHIPS_FALLO, MARCAR_THRESHOLD_MEDIA, mediaDeMarcadoLM, mediaLecturaExtraidaEfectiva, } from "../lib/marcarCriterios";
import { CHIP_FC_SLOTS, fcLibresParaChip, formatFcLibresLabel, } from "../lib/chipDisponibilidad";
import { buildChipPanels } from "../lib/chipPageData";
import { findLotId, lotLnForDisplay, lotOptionLabel, sortLots, toLoteRow, } from "../lib/lotesPageData";
import { todayIsoDate } from "../lib/filtrosPageData";
var HACER_SELECT_CLASS = "h-8 text-xs border border-input rounded-md px-2 bg-background min-w-[140px] max-w-[220px]";
var MIN_MEDIA_LM_PTE_CHIP = MARCAR_MAX_MEDIA_LM;
function nextNumLecturaForBn(existing, numBN) {
    var max = 0;
    for (var _i = 0, existing_1 = existing; _i < existing_1.length; _i++) {
        var row = existing_1[_i];
        if (Number(row.NumBN_L) !== numBN)
            continue;
        var n = Number(row.NumLectura);
        if (Number.isFinite(n) && n > max)
            max = n;
    }
    return max + 1;
}
function marcarRowKey(numBN, numLectura) {
    return "".concat(Number(numBN), "_").concat(Number(numLectura));
}
function pteChipRowKey(numBN) {
    return String(Number(numBN));
}
function pteChipLmKey(numBN, numLectura, numLectMarc) {
    return "".concat(Number(numBN), "_").concat(Number(numLectura), "_").concat(Number(numLectMarc));
}
function flattenSelectedPteChipItems(rows, selected) {
    var _a, _b, _c, _d;
    var items = [];
    for (var _i = 0, rows_1 = rows; _i < rows_1.length; _i++) {
        var row = rows_1[_i];
        var numBN = Number(row.NumBN);
        if (!selected.has(pteChipRowKey(numBN)))
            continue;
        for (var _e = 0, _f = (_a = row.pteChipItems) !== null && _a !== void 0 ? _a : []; _e < _f.length; _e++) {
            var it = _f[_e];
            items.push({
                NumBN: numBN,
                NumLectura: Number(it.NumLectura),
                NumLectMarc: Number(it.NumLectMarc),
                Media_LM: (_b = it.Media_LM) !== null && _b !== void 0 ? _b : null,
                Fecha_Lect_Marc: (_c = it.Fecha_Lect_Marc) !== null && _c !== void 0 ? _c : null,
                sinChipPte: Boolean(it.sinChipPte),
                repetirDetalle: (_d = it.repetirDetalle) !== null && _d !== void 0 ? _d : [],
            });
        }
    }
    return items;
}
function autoFillFcAssignments(items, libres) {
    var next = {};
    items.forEach(function (item, i) {
        var fc = libres[i];
        if (fc == null)
            return;
        next[pteChipLmKey(item.NumBN, item.NumLectura, item.NumLectMarc)] = fc;
    });
    return next;
}
function nextNumLectMarcFor(existing, numBN, numLectura) {
    var max = 0;
    for (var _i = 0, existing_2 = existing; _i < existing_2.length; _i++) {
        var row = existing_2[_i];
        if (Number(row.NumBN_LM) !== numBN || Number(row.NumLectura_LM) !== numLectura)
            continue;
        var n = Number(row.NumLectMarc);
        if (Number.isFinite(n) && n > max)
            max = n;
    }
    return max + 1;
}
function lecturaKey(numBN, numLectura) {
    return "".concat(numBN, "_").concat(numLectura);
}
function lmChipKey(numBN, numLectura, numLectMarc) {
    return "".concat(numBN, "_").concat(numLectura, "_").concat(numLectMarc);
}
function tableRowKey(mode, muestra) {
    var _a, _b, _c, _d;
    var numBN = (_a = muestra.NumBN) !== null && _a !== void 0 ? _a : "na";
    if (mode === "leer-marcado") {
        return "".concat(mode, "-").concat(numBN, "-").concat((_b = muestra.NumLectura) !== null && _b !== void 0 ? _b : "na", "-").concat((_c = muestra.NumLectMarc) !== null && _c !== void 0 ? _c : "na");
    }
    if (mode === "tirar" || mode === "marcar" || mode === "leer-extraido") {
        return "".concat(mode, "-").concat(numBN, "-").concat((_d = muestra.NumLectura) !== null && _d !== void 0 ? _d : "na");
    }
    if (mode === "pte-chip") {
        return "pte-chip-".concat(numBN);
    }
    return "hacer-".concat(numBN);
}
function formatDateEs(value) {
    if (!value)
        return "—";
    var d = new Date(value);
    if (Number.isNaN(d.getTime()))
        return "—";
    return d.toLocaleDateString("es-ES");
}
/** Media de lectura marcada: usa Media_LM si viene en la fila; si no, (Izq_LM + Dcha_LM) / 2 como en la app principal. */
function displayCell(value) {
    if (value === 0 || value === "0")
        return "0";
    if (value === null || value === undefined || value === "")
        return "—";
    return String(value);
}
function displayNumLectura(value) {
    if (value === 0 || value === "0")
        return "0";
    if (value === null || value === undefined || value === "")
        return "—";
    var n = Number(value);
    return Number.isFinite(n) ? n.toFixed(2) : String(value);
}
function parseFloatOrNull(value) {
    if (value === null || value === undefined || value === "")
        return null;
    var n = parseFloat(String(value));
    return Number.isFinite(n) ? n : null;
}
/** Semáforo Izq/Cen/Dcha en edición Leer Extraído (styles/app.css) */
function lecturaCuantificacionBgClass(value) {
    var n = parseFloatOrNull(value);
    if (n === null)
        return "";
    if (n > 100)
        return "lectura-cuant-alto";
    if (n < 40)
        return "lectura-cuant-bajo";
    return "lectura-cuant-ok";
}
/** Semáforo Izq_LM/Dcha_LM en Leer Marcado: verde 4–16, rojo < 4, amarillo > 16 */
function marcadoCuantificacionBgClass(value) {
    var n = parseFloatOrNull(value);
    if (n === null)
        return "";
    if (n < 4)
        return "lectura-cuant-bajo";
    if (n > 16)
        return "lectura-cuant-alto";
    return "lectura-cuant-ok";
}
function HeadingStatusDot(_a) {
    var _b = _a.color, color = _b === void 0 ? "var(--bion-warn-fill)" : _b, children = _a.children, props = __rest(_a, ["color", "children"]);
    return (_jsxs("span", __assign({ className: "inline-flex" }, props, { children: [_jsx(CircleDot, { className: "h-4 w-4 shrink-0", color: color, strokeWidth: 2, "aria-hidden": true }), children] })));
}
function HeadingMeanSymbol(_a) {
    var children = _a.children, props = __rest(_a, ["children"]);
    return (_jsxs("span", __assign({}, props, { children: ["x\u0304", children] })));
}
function AccionEstadoMediaHeading(_a) {
    var i18nKey = _a.i18nKey, cmp = _a.cmp, threshold = _a.threshold;
    var t = useTranslation().t;
    return (_jsx("span", { className: "inline-flex items-center gap-1.5", children: _jsx(Trans, { i18nKey: i18nKey, values: { cmp: cmp, threshold: threshold }, components: {
                status: (_jsx(HeadingStatusDot, { title: t("app.state.yellow"), "aria-label": t("app.state.yellow") })),
                mean: (_jsx(HeadingMeanSymbol, { title: t("actions.extractedMeanLabel"), "aria-label": t("actions.extractedMeanLabel") })),
            } }) }));
}
function HeadingRepeatChipIcon(_a) {
    var children = _a.children, props = __rest(_a, ["children"]);
    return (_jsxs("span", __assign({ className: "inline-flex" }, props, { children: [_jsx(TriangleAlert, { className: "h-4 w-4 shrink-0", color: "var(--bion-warn-fill)", strokeWidth: 2.25, "aria-hidden": true }), children] })));
}
function AccionPreparacionHeading() {
    var t = useTranslation().t;
    return (_jsx("span", { className: "inline-flex items-center gap-1.5", children: _jsx(Trans, { i18nKey: "actions.hacerHeading", components: {
                status: (_jsx(HeadingStatusDot, { color: "var(--bion-neutral-muted)", title: t("app.state.undefined"), "aria-label": t("app.state.undefined") })),
            } }) }));
}
function AccionLeerMarcadoHeading() {
    var t = useTranslation().t;
    return (_jsx("span", { className: "inline-flex items-center gap-1.5 flex-wrap", children: _jsx(Trans, { i18nKey: "actions.leerMarcadoHeading", components: {
                status: (_jsx(HeadingStatusDot, { title: t("app.state.yellow"), "aria-label": t("app.state.yellow") })),
            } }) }));
}
function AccionPteChipHeading(_a) {
    var minMedia = _a.minMedia;
    var t = useTranslation().t;
    return (_jsx("span", { className: "inline-flex items-center gap-1.5 flex-wrap", children: _jsx(Trans, { i18nKey: "actions.pteChipHeading", values: { minMedia: minMedia }, components: {
                status: (_jsx(HeadingStatusDot, { title: t("app.state.yellow"), "aria-label": t("app.state.yellow") })),
                mean: (_jsx(HeadingMeanSymbol, { title: t("actions.labeledMeanLabel"), "aria-label": t("actions.labeledMeanLabel") })),
                repeat: (_jsx(HeadingRepeatChipIcon, { title: t("app.chips.repeatOn"), "aria-label": t("app.chips.repeatOn") })),
            } }) }));
}
function formatDateForInput(value) {
    if (!value)
        return "";
    var d = new Date(value);
    if (Number.isNaN(d.getTime()))
        return String(value).slice(0, 10);
    return "".concat(d.getFullYear(), "-").concat(String(d.getMonth() + 1).padStart(2, "0"), "-").concat(String(d.getDate()).padStart(2, "0"));
}
function normalizeLeerExtraidoRow(raw) {
    var _a, _b, _c, _d;
    return {
        NumBN: Number(raw.NumBN),
        NumLectura: Number(raw.NumLectura),
        Medusa: (_a = pickRowField(raw, "Medusa")) !== null && _a !== void 0 ? _a : null,
        Visco_grado: (_b = pickRowField(raw, "Visco_grado")) !== null && _b !== void 0 ? _b : null,
        Izq: pickRowField(raw, "Izq"),
        Cen: pickRowField(raw, "Cen"),
        Dcha: pickRowField(raw, "Dcha"),
        Media_Lectura: pickRowField(raw, "Media_Lectura") != null
            ? Number(pickRowField(raw, "Media_Lectura"))
            : null,
        CV_Lectura: pickRowField(raw, "CV_Lectura") != null ? Number(pickRowField(raw, "CV_Lectura")) : null,
        Fecha_lectura: (_c = pickRowField(raw, "Fecha_lectura")) !== null && _c !== void 0 ? _c : null,
        Coment_Lectura: (_d = pickRowField(raw, "Coment_Lectura")) !== null && _d !== void 0 ? _d : null,
    };
}
function fetchLeerExtraidoRows() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, muestrasData, muestrasError, numBNs, _b, lecturasData, lecturasError, muestraByNumBN, _i, _c, m;
        var _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0: return [4 /*yield*/, supabase
                        .from("Muestras")
                        .select("NumBN, Medusa, Visco_grado, Estado_Muestra")
                        .eq("Estado_Muestra", 2)
                        .order("NumBN", { ascending: true })];
                case 1:
                    _a = _f.sent(), muestrasData = _a.data, muestrasError = _a.error;
                    if (muestrasError)
                        throw muestrasError;
                    numBNs = (muestrasData || []).map(function (m) { return m.NumBN; }).filter(function (n) { return n != null; });
                    if (numBNs.length === 0)
                        return [2 /*return*/, []];
                    return [4 /*yield*/, supabase
                            .from("Lectura")
                            .select("NumBN_L, NumLectura, Izq, Cen, Dcha, Media_Lectura, CV_Lectura, Fecha_lectura, Coment_Lectura")
                            .in("NumBN_L", numBNs)
                            .is("Izq", null)
                            .is("Cen", null)
                            .is("Dcha", null)
                            .order("NumBN_L", { ascending: true })
                            .order("NumLectura", { ascending: true })];
                case 2:
                    _b = _f.sent(), lecturasData = _b.data, lecturasError = _b.error;
                    if (lecturasError)
                        throw lecturasError;
                    muestraByNumBN = new Map();
                    for (_i = 0, _c = muestrasData || []; _i < _c.length; _i++) {
                        m = _c[_i];
                        if ((m === null || m === void 0 ? void 0 : m.NumBN) != null) {
                            muestraByNumBN.set(Number(m.NumBN), {
                                Medusa: (_d = m.Medusa) !== null && _d !== void 0 ? _d : null,
                                Visco_grado: (_e = m.Visco_grado) !== null && _e !== void 0 ? _e : null,
                            });
                        }
                    }
                    return [2 /*return*/, (lecturasData || []).map(function (l) {
                            var _a, _b;
                            var numBN = Number(l.NumBN_L);
                            var ms = muestraByNumBN.get(numBN);
                            return normalizeLeerExtraidoRow({
                                NumBN: numBN,
                                NumLectura: l.NumLectura,
                                Medusa: (_a = ms === null || ms === void 0 ? void 0 : ms.Medusa) !== null && _a !== void 0 ? _a : null,
                                Visco_grado: (_b = ms === null || ms === void 0 ? void 0 : ms.Visco_grado) !== null && _b !== void 0 ? _b : null,
                                Izq: l.Izq,
                                Cen: l.Cen,
                                Dcha: l.Dcha,
                                Media_Lectura: l.Media_Lectura,
                                CV_Lectura: l.CV_Lectura,
                                Fecha_lectura: l.Fecha_lectura,
                                Coment_Lectura: l.Coment_Lectura,
                            });
                        })];
            }
        });
    });
}
function normalizeLeerMarcadoRow(raw) {
    return {
        NumBN: Number(raw.NumBN),
        NumLectura: Number(raw.NumLectura),
        NumLectMarc: Number(raw.NumLectMarc),
        Media_Lectura: pickRowField(raw, "Media_Lectura") != null
            ? Number(pickRowField(raw, "Media_Lectura"))
            : null,
        CV_Lectura: pickRowField(raw, "CV_Lectura") != null ? Number(pickRowField(raw, "CV_Lectura")) : null,
        Izq_LM: pickRowField(raw, "Izq_LM"),
        Dcha_LM: pickRowField(raw, "Dcha_LM"),
        Media_LM: pickRowField(raw, "Media_LM") != null ? Number(pickRowField(raw, "Media_LM")) : null,
        CV_LM: pickRowField(raw, "CV_LM") != null ? Number(pickRowField(raw, "CV_LM")) : null,
    };
}
/** Estado 2, lectura marcada creada (Lecturas_Marcado) sin cuantificar I/D. */
function fetchLeerMarcadoRows() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, muestrasData, muestrasError, numBNs, _b, lmData, lmError, _c, lecturasData, lecturasError, lecturaByKey, _i, _d, l;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, supabase
                        .from("Muestras")
                        .select("NumBN")
                        .eq("Estado_Muestra", 2)
                        .order("NumBN", { ascending: true })];
                case 1:
                    _a = _e.sent(), muestrasData = _a.data, muestrasError = _a.error;
                    if (muestrasError)
                        throw muestrasError;
                    numBNs = (muestrasData || []).map(function (m) { return m.NumBN; }).filter(function (n) { return n != null; });
                    if (numBNs.length === 0)
                        return [2 /*return*/, []];
                    return [4 /*yield*/, supabase
                            .from("Lecturas_Marcado")
                            .select("NumBN_LM, NumLectura_LM, NumLectMarc, Izq_LM, Dcha_LM, Media_LM, CV_LM")
                            .in("NumBN_LM", numBNs)
                            .is("Media_LM", null)
                            .is("Izq_LM", null)
                            .is("Dcha_LM", null)
                            .order("NumBN_LM", { ascending: true })
                            .order("NumLectura_LM", { ascending: true })
                            .order("NumLectMarc", { ascending: true })];
                case 2:
                    _b = _e.sent(), lmData = _b.data, lmError = _b.error;
                    if (lmError)
                        throw lmError;
                    if (!(lmData === null || lmData === void 0 ? void 0 : lmData.length))
                        return [2 /*return*/, []];
                    return [4 /*yield*/, supabase
                            .from("Lectura")
                            .select("NumBN_L, NumLectura, Media_Lectura, CV_Lectura")
                            .in("NumBN_L", numBNs)];
                case 3:
                    _c = _e.sent(), lecturasData = _c.data, lecturasError = _c.error;
                    if (lecturasError)
                        throw lecturasError;
                    lecturaByKey = new Map();
                    for (_i = 0, _d = lecturasData || []; _i < _d.length; _i++) {
                        l = _d[_i];
                        lecturaByKey.set(lecturaKey(Number(l.NumBN_L), Number(l.NumLectura)), {
                            Media_Lectura: l.Media_Lectura != null ? Number(l.Media_Lectura) : null,
                            CV_Lectura: l.CV_Lectura != null ? Number(l.CV_Lectura) : null,
                        });
                    }
                    return [2 /*return*/, lmData.map(function (lm) {
                            var _a, _b;
                            var numBN = Number(lm.NumBN_LM);
                            var numLectura = Number(lm.NumLectura_LM);
                            var lect = lecturaByKey.get(lecturaKey(numBN, numLectura));
                            return normalizeLeerMarcadoRow({
                                NumBN: numBN,
                                NumLectura: numLectura,
                                NumLectMarc: lm.NumLectMarc,
                                Media_Lectura: (_a = lect === null || lect === void 0 ? void 0 : lect.Media_Lectura) !== null && _a !== void 0 ? _a : null,
                                CV_Lectura: (_b = lect === null || lect === void 0 ? void 0 : lect.CV_Lectura) !== null && _b !== void 0 ? _b : null,
                                Izq_LM: lm.Izq_LM,
                                Dcha_LM: lm.Dcha_LM,
                                Media_LM: lm.Media_LM,
                                CV_LM: lm.CV_LM,
                            });
                        })];
            }
        });
    });
}
/** Valor para impresión: vacío real (sin guiones) para escribir a mano encima. */
function printCell(value) {
    if (value === 0 || value === "0")
        return "0";
    if (value === null || value === undefined || value === "")
        return "";
    return String(value);
}
function printLabelTipoMuestra(row, tipos) {
    var _a, _b, _c;
    if ((_a = row.DMuestra) === null || _a === void 0 ? void 0 : _a.TipoMuestra)
        return row.DMuestra.TipoMuestra;
    var cod = row.Muestra;
    if (cod == null)
        return "";
    return (_c = (_b = tipos.find(function (t) { return Number(t.Cod) === Number(cod); })) === null || _b === void 0 ? void 0 : _b.TipoMuestra) !== null && _c !== void 0 ? _c : "";
}
function printLabelDx(row, dxList) {
    var _a, _b, _c;
    if ((_a = row.DDx) === null || _a === void 0 ? void 0 : _a.Dx)
        return row.DDx.Dx;
    var cod = row.Dx;
    if (cod == null)
        return "";
    return (_c = (_b = dxList.find(function (d) { return Number(d.Cod) === Number(cod); })) === null || _b === void 0 ? void 0 : _b.Dx) !== null && _c !== void 0 ? _c : "";
}
function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}
function formatThreshold(n) {
    var s = String(n);
    return i18n.language.startsWith("en") ? s : s.replace(".", ",");
}
function printHacerMuestrasTable(rows, tipos, dxList, lots, includeLn) {
    if (!rows.length) {
        toast.error(i18n.t("actions.print.empty"));
        return;
    }
    var headers = __spreadArray([
        "NumBN",
        "Petic",
        "Posic",
        "Proces",
        i18n.t("actions.col.sampleType"),
        i18n.t("actions.col.diagnosis"),
        "Pellet",
        "Medusa"
    ], (includeLn ? [i18n.t("actions.col.lnExtracted")] : []), true);
    var headHtml = headers.map(function (h) { return "<th>".concat(escapeHtml(h), "</th>"); }).join("");
    var bodyHtml = rows
        .map(function (row) {
        var cells = __spreadArray([
            printCell(row.NumBN),
            printCell(row.Petic),
            printCell(row.Posic),
            printCell(row.Proces),
            printLabelTipoMuestra(row, tipos),
            printLabelDx(row, dxList),
            printCell(row.Pellet),
            printCell(row.Medusa)
        ], (includeLn
            ? [printCell(lotLnForDisplay(lots, { id: row.Id_LtE, LN: row.LN }))]
            : []), true);
        return "<tr>".concat(cells.map(function (c) { return "<td>".concat(escapeHtml(c), "</td>"); }).join(""), "</tr>");
    })
        .join("");
    var fecha = new Date().toLocaleString(i18n.language.startsWith("en") ? "en-GB" : "es-ES");
    var html = "<!DOCTYPE html>\n<html lang=\"".concat(i18n.language.startsWith("en") ? "en" : "es", "\">\n<head>\n  <meta charset=\"UTF-8\" />\n  <title>").concat(escapeHtml(i18n.t("actions.print.docTitle")), "</title>\n  <style>\n    * { box-sizing: border-box; }\n    body {\n      font-family: Arial, Helvetica, sans-serif;\n      margin: 0;\n      padding: 16px 28px;\n      color: #000;\n    }\n    h1 { font-size: 16px; margin: 0 0 4px; font-weight: 700; }\n    p.meta { font-size: 11px; margin: 0 0 12px; color: #333; }\n    table.muestras { width: 100%; border-collapse: collapse; table-layout: fixed; }\n    table.muestras th,\n    table.muestras td {\n      border: 1.5px solid #000;\n      padding: 10px 8px;\n      font-size: 11px;\n      vertical-align: middle;\n      word-wrap: break-word;\n      min-height: 32px;\n      height: 32px;\n    }\n    table.muestras th { background: #eee; font-weight: 700; text-align: left; }\n    table.muestras td { background: #fff; }\n    .wb-section { margin-top: 28px; }\n    table.wb-wash { border-collapse: collapse; width: auto; }\n    table.wb-wash td { padding: 0; vertical-align: middle; background: #fff; }\n    table.wb-wash .wb-label {\n      border: 1.5px solid #000;\n      font-weight: 700;\n      font-size: 14px;\n      text-align: center;\n      width: 52px;\n      min-width: 52px;\n      height: 48px;\n    }\n    table.wb-wash .wb-box {\n      border: 2.5px solid #000;\n      width: 108px;\n      min-width: 108px;\n      height: 48px;\n      min-height: 48px;\n    }\n    @media print {\n      body { padding: 10px 18px; }\n      @page { margin: 14mm 22mm; size: landscape; }\n    }\n  </style>\n</head>\n<body>\n  <h1>").concat(escapeHtml(i18n.t("actions.print.heading")), "</h1>\n  <p class=\"meta\">").concat(escapeHtml(i18n.t("actions.print.meta", { fecha: fecha, count: rows.length })), "</p>\n  <table class=\"muestras\">\n    <thead><tr>").concat(headHtml, "</tr></thead>\n    <tbody>").concat(bodyHtml, "</tbody>\n  </table>\n  <div class=\"wb-section\">\n    <table class=\"wb-wash\" aria-label=\"").concat(escapeHtml(i18n.t("actions.print.wbAria")), "\">\n      <tbody>\n        <tr>\n          <td class=\"wb-label\">WB1</td>\n          <td class=\"wb-box\"></td>\n        </tr>\n        <tr>\n          <td class=\"wb-label\">WB2</td>\n          <td class=\"wb-box\"></td>\n          <td class=\"wb-box\"></td>\n        </tr>\n      </tbody>\n    </table>\n  </div>\n</body>\n</html>");
    openPrintDialog(html);
}
/** Abre el diálogo de impresión sin depender de ventanas emergentes vacías. */
function openPrintDialog(html) {
    var _a;
    var iframe = document.createElement("iframe");
    iframe.setAttribute("title", i18n.t("actions.print.iframeTitle"));
    iframe.style.cssText =
        "position:fixed;left:0;top:0;width:0;height:0;border:0;opacity:0;pointer-events:none;";
    var cleaned = false;
    var printStarted = false;
    var cleanup = function () {
        if (cleaned)
            return;
        cleaned = true;
        iframe.remove();
    };
    var triggerPrint = function () {
        var _a;
        if (printStarted)
            return;
        var win = iframe.contentWindow;
        if (!win) {
            cleanup();
            toast.error(i18n.t("actions.print.prepareError"));
            return;
        }
        var doc = win.document;
        if (!((_a = doc.body) === null || _a === void 0 ? void 0 : _a.querySelector("table"))) {
            return;
        }
        printStarted = true;
        try {
            win.focus();
            win.print();
        }
        catch (err) {
            console.error(err);
            toast.error(i18n.t("actions.print.dialogError"));
            cleanup();
            return;
        }
        win.addEventListener("afterprint", cleanup, { once: true });
        setTimeout(cleanup, 60000);
    };
    iframe.onload = function () {
        setTimeout(triggerPrint, 150);
    };
    document.body.appendChild(iframe);
    var doc = (_a = iframe.contentWindow) === null || _a === void 0 ? void 0 : _a.document;
    if (!doc) {
        cleanup();
        toast.error(i18n.t("actions.print.prepareError"));
        return;
    }
    doc.open();
    doc.write(html);
    doc.close();
    // Si onload no dispara (p. ej. contenido desde document.write), forzar impresión.
    setTimeout(triggerPrint, 400);
}
function pickRowField(row, field) {
    if (row[field] !== undefined && row[field] !== null)
        return row[field];
    var lower = field.toLowerCase();
    if (row[lower] !== undefined && row[lower] !== null)
        return row[lower];
    return undefined;
}
function parseCod(value) {
    if (value === null || value === undefined || value === "")
        return null;
    var n = Number(value);
    return Number.isFinite(n) ? n : null;
}
function normalizeHacerRow(raw) {
    var _a, _b, _c, _d, _e;
    var numBN = Number(raw.NumBN);
    var dm = raw.DMuestra;
    var dx = raw.DDx;
    return {
        NumBN: Number.isFinite(numBN) ? numBN : Number(raw.NumBN),
        Petic: pickRowField(raw, "Petic"),
        Posic: (_a = pickRowField(raw, "Posic")) !== null && _a !== void 0 ? _a : null,
        Proces: (_b = pickRowField(raw, "Proces")) !== null && _b !== void 0 ? _b : null,
        Muestra: parseCod(pickRowField(raw, "Muestra")),
        Dx: parseCod(pickRowField(raw, "Dx")),
        DMuestra: dm !== null && dm !== void 0 ? dm : null,
        DDx: dx !== null && dx !== void 0 ? dx : null,
        Pellet: (_c = pickRowField(raw, "Pellet")) !== null && _c !== void 0 ? _c : null,
        Medusa: (_d = pickRowField(raw, "Medusa")) !== null && _d !== void 0 ? _d : null,
        Id_LtE: parseCod(pickRowField(raw, "Id_LtE")),
        LN: (_e = pickRowField(raw, "LN")) !== null && _e !== void 0 ? _e : null,
    };
}
function labelTipoMuestra(row, tipos) {
    var _a, _b, _c;
    if ((_a = row.DMuestra) === null || _a === void 0 ? void 0 : _a.TipoMuestra)
        return row.DMuestra.TipoMuestra;
    var cod = row.Muestra;
    if (cod == null)
        return "—";
    return (_c = (_b = tipos.find(function (t) { return Number(t.Cod) === Number(cod); })) === null || _b === void 0 ? void 0 : _b.TipoMuestra) !== null && _c !== void 0 ? _c : "—";
}
function labelDx(row, dxList) {
    var _a, _b, _c;
    if ((_a = row.DDx) === null || _a === void 0 ? void 0 : _a.Dx)
        return row.DDx.Dx;
    var cod = row.Dx;
    if (cod == null)
        return "—";
    return (_c = (_b = dxList.find(function (d) { return Number(d.Cod) === Number(cod); })) === null || _b === void 0 ? void 0 : _b.Dx) !== null && _c !== void 0 ? _c : "—";
}
function parseTextOrNull(value) {
    if (value === null || value === undefined)
        return null;
    var s = String(value).trim();
    return s === "" ? null : s;
}
/** Misma lógica que App.tsx al guardar Muestras (texto, catálogos y lote extraído). */
function buildHacerUpdatePayload(row) {
    var medusaRaw = pickRowField(row, "Medusa");
    var lotId = parseCod(pickRowField(row, "Id_LtE"));
    return {
        Petic: parseTextOrNull(pickRowField(row, "Petic")),
        Posic: parseTextOrNull(pickRowField(row, "Posic")),
        Proces: parseTextOrNull(pickRowField(row, "Proces")),
        Muestra: parseCod(pickRowField(row, "Muestra")),
        Dx: parseCod(pickRowField(row, "Dx")),
        Pellet: parseTextOrNull(pickRowField(row, "Pellet")),
        Medusa: medusaRaw === null || medusaRaw === undefined
            ? null
            : String(medusaRaw).trim() === ""
                ? null
                : String(medusaRaw),
        Id_LtE: lotId,
    };
}
function buildLeerMuestraUpdatePayload(row) {
    var viscoRaw = row.Visco_grado;
    var visco_grado = null;
    if (viscoRaw !== null && viscoRaw !== undefined && String(viscoRaw).trim() !== "") {
        var n = Number(viscoRaw);
        if (Number.isFinite(n))
            visco_grado = Math.trunc(n);
    }
    return {
        Medusa: parseTextOrNull(row.Medusa),
        Visco_grado: visco_grado,
    };
}
function buildLeerLecturaUpdatePayload(row) {
    var fecha = row.Fecha_lectura;
    return {
        Izq: parseFloatOrNull(row.Izq),
        Cen: parseFloatOrNull(row.Cen),
        Dcha: parseFloatOrNull(row.Dcha),
        Fecha_lectura: fecha != null && String(fecha).trim() !== "" ? String(fecha).trim() : null,
        Coment_Lectura: parseTextOrNull(row.Coment_Lectura),
    };
}
function buildLeerMarcadoUpdatePayload(row) {
    return {
        Izq_LM: parseFloatOrNull(row.Izq_LM),
        Dcha_LM: parseFloatOrNull(row.Dcha_LM),
    };
}
function fetchHacerCatalogs() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, _b, tiposData, tiposError, _c, dxData, dxError;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, Promise.all([
                        supabase
                            .from("DMuestra")
                            .select("Cod, TipoMuestra")
                            .order("TipoMuestra", { ascending: true }),
                        supabase.from("DDx").select("Cod, Dx").order("Dx", { ascending: true }),
                    ])];
                case 1:
                    _a = _d.sent(), _b = _a[0], tiposData = _b.data, tiposError = _b.error, _c = _a[1], dxData = _c.data, dxError = _c.error;
                    if (tiposError)
                        throw tiposError;
                    if (dxError)
                        throw dxError;
                    return [2 /*return*/, {
                            tipos: (tiposData !== null && tiposData !== void 0 ? tiposData : []),
                            dx: (dxData !== null && dxData !== void 0 ? dxData : []),
                        }];
            }
        });
    });
}
function fetchLotesCatalog(tipo) {
    return __awaiter(this, void 0, void 0, function () {
        var table, _a, data, error;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    table = tipo === "extraido" ? "Lotes_Extraido" : tipo === "marcado" ? "Lotes_Marcado" : "Lotes_Membrana";
                    return [4 /*yield*/, supabase.from(table).select("*")];
                case 1:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error)
                        throw error;
                    return [2 /*return*/, sortLots((data || [])
                            .map(function (row) { return toLoteRow(row, tipo); })
                            .filter(function (row) { return row != null; }))];
            }
        });
    });
}
function fetchHacerMuestras() {
    return __awaiter(this, void 0, void 0, function () {
        var _a, data, error;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, supabase
                        .from("Muestras")
                        .select("\n      NumBN, Petic, Posic, Proces, Muestra, Dx, Pellet, Medusa, Id_LtE,\n      DMuestra ( TipoMuestra ),\n      DDx ( Dx )\n    ")
                        .is("Estado_Muestra", null)
                        .order("NumBN", { ascending: true })];
                case 1:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error)
                        throw error;
                    return [2 /*return*/, (data || []).map(function (row) { return normalizeHacerRow(row); })];
            }
        });
    });
}
function ActionsPage() {
    var _this = this;
    var t = useTranslation().t;
    var user = useAuth().user;
    var _a = useState([]), muestras = _a[0], setMuestras = _a[1];
    var _b = useState(null), mode = _b[0], setMode = _b[1];
    var _c = useState(false), loading = _c[0], setLoading = _c[1];
    var _d = useState(false), isAdmin = _d[0], setIsAdmin = _d[1];
    var _e = useState(false), hacerEditMode = _e[0], setHacerEditMode = _e[1];
    var _f = useState([]), editedMuestras = _f[0], setEditedMuestras = _f[1];
    var _g = useState(false), savingHacer = _g[0], setSavingHacer = _g[1];
    var _h = useState(false), leerEditMode = _h[0], setLeerEditMode = _h[1];
    var _j = useState([]), editedLeerMuestras = _j[0], setEditedLeerMuestras = _j[1];
    var _k = useState(false), savingLeer = _k[0], setSavingLeer = _k[1];
    var _l = useState(false), leerMarcadoEditMode = _l[0], setLeerMarcadoEditMode = _l[1];
    var _m = useState([]), editedLeerMarcadoRows = _m[0], setEditedLeerMarcadoRows = _m[1];
    var _o = useState(false), savingLeerMarcado = _o[0], setSavingLeerMarcado = _o[1];
    var _p = useState([]), tiposMuestra = _p[0], setTiposMuestra = _p[1];
    var _q = useState([]), dxs = _q[0], setDxs = _q[1];
    var _r = useState([]), lotesExtraido = _r[0], setLotesExtraido = _r[1];
    var _s = useState(""), bulkLotId = _s[0], setBulkLotId = _s[1];
    var _t = useState(""), bulkFechaLectura = _t[0], setBulkFechaLectura = _t[1];
    var _u = useState([]), lotesMarcado = _u[0], setLotesMarcado = _u[1];
    var _v = useState([]), lotesMembrana = _v[0], setLotesMembrana = _v[1];
    var _w = useState(function () { return new Set(); }), marcarSelected = _w[0], setMarcarSelected = _w[1];
    var _x = useState(false), marcarConfirmOpen = _x[0], setMarcarConfirmOpen = _x[1];
    var _y = useState(""), marcarLotMId = _y[0], setMarcarLotMId = _y[1];
    var _z = useState(""), marcarLotMmId = _z[0], setMarcarLotMmId = _z[1];
    var _0 = useState(false), savingMarcar = _0[0], setSavingMarcar = _0[1];
    var _1 = useState(function () { return new Set(); }), pteChipSelected = _1[0], setPteChipSelected = _1[1];
    var _2 = useState(false), pteChipConfirmOpen = _2[0], setPteChipConfirmOpen = _2[1];
    var _3 = useState([]), pteChipCatalog = _3[0], setPteChipCatalog = _3[1];
    var _4 = useState([]), pteChipAsignaciones = _4[0], setPteChipAsignaciones = _4[1];
    var _5 = useState(""), pteChipNumChip = _5[0], setPteChipNumChip = _5[1];
    var _6 = useState({}), pteChipFcByItem = _6[0], setPteChipFcByItem = _6[1];
    var _7 = useState(false), savingPteChip = _7[0], setSavingPteChip = _7[1];
    useEffect(function () {
        var cancelled = false;
        function loadRole() {
            return __awaiter(this, void 0, void 0, function () {
                var _a, profile, error;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (!(user === null || user === void 0 ? void 0 : user.email)) {
                                if (!cancelled)
                                    setIsAdmin(false);
                                return [2 /*return*/];
                            }
                            return [4 /*yield*/, supabase
                                    .from("profiles")
                                    .select("role")
                                    .ilike("username", user.email)
                                    .maybeSingle()];
                        case 1:
                            _a = _b.sent(), profile = _a.data, error = _a.error;
                            if (cancelled)
                                return [2 /*return*/];
                            if (error) {
                                console.error("Error fetching profile:", error);
                                setIsAdmin(false);
                                return [2 /*return*/];
                            }
                            setIsAdmin((profile === null || profile === void 0 ? void 0 : profile.role) === "admin");
                            return [2 /*return*/];
                    }
                });
            });
        }
        loadRole();
        return function () {
            cancelled = true;
        };
    }, [user === null || user === void 0 ? void 0 : user.email]);
    var exitHacerEditMode = function () {
        setHacerEditMode(false);
        setEditedMuestras([]);
    };
    var exitLeerEditMode = function () {
        setLeerEditMode(false);
        setEditedLeerMuestras([]);
    };
    var exitLeerMarcadoEditMode = function () {
        setLeerMarcadoEditMode(false);
        setEditedLeerMarcadoRows([]);
    };
    var handleLeerEditStart = function () {
        setEditedLeerMuestras(muestras.map(function (row) { return normalizeLeerExtraidoRow(row); }));
        setBulkFechaLectura(todayIsoDate());
        setLeerEditMode(true);
    };
    var handleLeerEditCancel = function () {
        exitLeerEditMode();
    };
    var handleLeerFieldChange = function (numBN, numLectura, field, value) {
        var targetBn = Number(numBN);
        var targetLectura = Number(numLectura);
        var muestraFields = ["Medusa", "Visco_grado"];
        setEditedLeerMuestras(function (prev) {
            return prev.map(function (row) {
                var _a, _b;
                if (muestraFields.includes(field)) {
                    if (Number(row.NumBN) !== targetBn)
                        return row;
                    return __assign(__assign({}, row), (_a = {}, _a[field] = value, _a));
                }
                if (Number(row.NumBN) !== targetBn || Number(row.NumLectura) !== targetLectura) {
                    return row;
                }
                return __assign(__assign({}, row), (_b = {}, _b[field] = value, _b));
            });
        });
    };
    var applyFechaLecturaToEdited = function (iso) {
        setEditedLeerMuestras(function (prev) { return prev.map(function (row) { return (__assign(__assign({}, row), { Fecha_lectura: iso })); }); });
    };
    var handleApplyFechaLecturaAll = function () {
        var iso = bulkFechaLectura.trim();
        if (!iso) {
            toast.error(t("actions.toast.applyDateNeed"));
            return;
        }
        applyFechaLecturaToEdited(iso);
        toast.success(t("actions.toast.applyDate", { count: editedLeerMuestras.length }));
    };
    var handleFechaLecturaHoyAll = function () {
        var iso = todayIsoDate();
        setBulkFechaLectura(iso);
        applyFechaLecturaToEdited(iso);
        toast.success(t("actions.toast.applyDateToday", { count: editedLeerMuestras.length }));
    };
    var handleLeerSave = function () { return __awaiter(_this, void 0, void 0, function () {
        var muestraByBn, _i, editedLeerMuestras_1, row, muestraResults, lecturaResults, failedMuestras, failedLecturas, refreshed, totalFailed, err_1;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!editedLeerMuestras.length)
                        return [2 /*return*/];
                    setSavingLeer(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, 6, 7]);
                    muestraByBn = new Map();
                    for (_i = 0, editedLeerMuestras_1 = editedLeerMuestras; _i < editedLeerMuestras_1.length; _i++) {
                        row = editedLeerMuestras_1[_i];
                        muestraByBn.set(Number(row.NumBN), row);
                    }
                    return [4 /*yield*/, Promise.all(__spreadArray([], muestraByBn.entries(), true).map(function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
                            var payload, _c, data, error;
                            var numBN = _b[0], row = _b[1];
                            return __generator(this, function (_d) {
                                switch (_d.label) {
                                    case 0:
                                        payload = buildLeerMuestraUpdatePayload(row);
                                        return [4 /*yield*/, supabase
                                                .from("Muestras")
                                                .update(payload)
                                                .eq("NumBN", numBN)
                                                .select("NumBN, Medusa, Visco_grado")
                                                .maybeSingle()];
                                    case 1:
                                        _c = _d.sent(), data = _c.data, error = _c.error;
                                        if (error)
                                            return [2 /*return*/, { numBN: numBN, error: error }];
                                        if (!data) {
                                            return [2 /*return*/, {
                                                    numBN: numBN,
                                                    error: new Error(t("actions.err.sampleNotFoundUpdate", { numBN: numBN })),
                                                }];
                                        }
                                        return [2 /*return*/, { numBN: numBN, error: null }];
                                }
                            });
                        }); }))];
                case 2:
                    muestraResults = _a.sent();
                    return [4 /*yield*/, Promise.all(editedLeerMuestras.map(function (row) { return __awaiter(_this, void 0, void 0, function () {
                            var numBN, numLectura, payload, _a, data, error;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        numBN = Number(row.NumBN);
                                        numLectura = Number(row.NumLectura);
                                        payload = buildLeerLecturaUpdatePayload(row);
                                        return [4 /*yield*/, supabase
                                                .from("Lectura")
                                                .update(payload)
                                                .eq("NumBN_L", numBN)
                                                .eq("NumLectura", numLectura)
                                                .select("NumBN_L, NumLectura, Izq, Cen, Dcha, Media_Lectura, CV_Lectura, Fecha_lectura, Coment_Lectura")
                                                .maybeSingle()];
                                    case 1:
                                        _a = _b.sent(), data = _a.data, error = _a.error;
                                        if (error)
                                            return [2 /*return*/, { numBN: numBN, numLectura: numLectura, error: error }];
                                        if (!data) {
                                            return [2 /*return*/, {
                                                    numBN: numBN,
                                                    numLectura: numLectura,
                                                    error: new Error(t("actions.err.readingNotFoundUpdate", { numBN: numBN, numLectura: numLectura })),
                                                }];
                                        }
                                        return [2 /*return*/, { numBN: numBN, numLectura: numLectura, error: null }];
                                }
                            });
                        }); }))];
                case 3:
                    lecturaResults = _a.sent();
                    failedMuestras = muestraResults.filter(function (r) { return r.error; });
                    failedLecturas = lecturaResults.filter(function (r) { return r.error; });
                    return [4 /*yield*/, fetchLeerExtraidoRows()];
                case 4:
                    refreshed = _a.sent();
                    setMuestras(refreshed);
                    totalFailed = failedMuestras.length + failedLecturas.length;
                    if (totalFailed > 0) {
                        console.error("Errores al guardar leer extraído:", {
                            muestras: failedMuestras,
                            lecturas: failedLecturas,
                        });
                        toast.error(t("actions.toast.saveSomeFailed", { count: totalFailed }));
                    }
                    else {
                        toast.success(t("actions.toast.extractedSaved", { count: editedLeerMuestras.length }));
                    }
                    exitLeerEditMode();
                    return [3 /*break*/, 7];
                case 5:
                    err_1 = _a.sent();
                    console.error(err_1);
                    toast.error(t("actions.toast.saveError"));
                    return [3 /*break*/, 7];
                case 6:
                    setSavingLeer(false);
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    }); };
    var handleLeerMarcadoEditStart = function () {
        setEditedLeerMarcadoRows(muestras.map(function (row) { return normalizeLeerMarcadoRow(row); }));
        setLeerMarcadoEditMode(true);
    };
    var handleLeerMarcadoEditCancel = function () {
        exitLeerMarcadoEditMode();
    };
    var handleLeerMarcadoFieldChange = function (numBN, numLectura, numLectMarc, field, value) {
        var targetBn = Number(numBN);
        var targetLectura = Number(numLectura);
        var targetLm = Number(numLectMarc);
        setEditedLeerMarcadoRows(function (prev) {
            return prev.map(function (row) {
                var _a;
                if (Number(row.NumBN) !== targetBn ||
                    Number(row.NumLectura) !== targetLectura ||
                    Number(row.NumLectMarc) !== targetLm) {
                    return row;
                }
                return __assign(__assign({}, row), (_a = {}, _a[field] = value, _a));
            });
        });
    };
    var handleLeerMarcadoSave = function () { return __awaiter(_this, void 0, void 0, function () {
        var results, failed, refreshed, err_2;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!editedLeerMarcadoRows.length)
                        return [2 /*return*/];
                    setSavingLeerMarcado(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, Promise.all(editedLeerMarcadoRows.map(function (row) { return __awaiter(_this, void 0, void 0, function () {
                            var numBN, numLectura, numLectMarc, payload, _a, data, error;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        numBN = Number(row.NumBN);
                                        numLectura = Number(row.NumLectura);
                                        numLectMarc = Number(row.NumLectMarc);
                                        payload = buildLeerMarcadoUpdatePayload(row);
                                        return [4 /*yield*/, supabase
                                                .from("Lecturas_Marcado")
                                                .update(payload)
                                                .eq("NumBN_LM", numBN)
                                                .eq("NumLectura_LM", numLectura)
                                                .eq("NumLectMarc", numLectMarc)
                                                .select("NumBN_LM, NumLectura_LM, NumLectMarc, Izq_LM, Dcha_LM, Media_LM, CV_LM")
                                                .maybeSingle()];
                                    case 1:
                                        _a = _b.sent(), data = _a.data, error = _a.error;
                                        if (error)
                                            return [2 /*return*/, { numBN: numBN, numLectura: numLectura, numLectMarc: numLectMarc, error: error }];
                                        if (!data) {
                                            return [2 /*return*/, {
                                                    numBN: numBN,
                                                    numLectura: numLectura,
                                                    numLectMarc: numLectMarc,
                                                    error: new Error(t("actions.err.lmNotFoundUpdate", { numBN: numBN, numLectura: numLectura, numLectMarc: numLectMarc })),
                                                }];
                                        }
                                        return [2 /*return*/, { numBN: numBN, numLectura: numLectura, numLectMarc: numLectMarc, error: null }];
                                }
                            });
                        }); }))];
                case 2:
                    results = _a.sent();
                    failed = results.filter(function (r) { return r.error; });
                    return [4 /*yield*/, fetchLeerMarcadoRows()];
                case 3:
                    refreshed = _a.sent();
                    setMuestras(refreshed);
                    if (failed.length > 0) {
                        console.error("Errores al guardar leer marcado:", failed);
                        toast.error(t("actions.toast.saveSomeFailed", { count: failed.length }));
                    }
                    else {
                        toast.success(t("actions.toast.lmSaved", { count: editedLeerMarcadoRows.length }));
                    }
                    exitLeerMarcadoEditMode();
                    return [3 /*break*/, 6];
                case 4:
                    err_2 = _a.sent();
                    console.error(err_2);
                    toast.error(t("actions.toast.saveError"));
                    return [3 /*break*/, 6];
                case 5:
                    setSavingLeerMarcado(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var handleHacerEditStart = function () { return __awaiter(_this, void 0, void 0, function () {
        var _a, catalogs, lots, err_3;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 3, , 4]);
                    if (!(tiposMuestra.length === 0 || dxs.length === 0 || lotesExtraido.length === 0)) return [3 /*break*/, 2];
                    return [4 /*yield*/, Promise.all([
                            fetchHacerCatalogs(),
                            fetchLotesCatalog("extraido"),
                        ])];
                case 1:
                    _a = _b.sent(), catalogs = _a[0], lots = _a[1];
                    setTiposMuestra(catalogs.tipos);
                    setDxs(catalogs.dx);
                    setLotesExtraido(lots);
                    _b.label = 2;
                case 2: return [3 /*break*/, 4];
                case 3:
                    err_3 = _b.sent();
                    console.error(err_3);
                    toast.error(t("actions.toast.catalogsError"));
                    return [2 /*return*/];
                case 4:
                    setEditedMuestras(muestras.map(function (row) { return normalizeHacerRow(row); }));
                    setHacerEditMode(true);
                    return [2 /*return*/];
            }
        });
    }); };
    var handleHacerEditCancel = function () {
        exitHacerEditMode();
    };
    var handleHacerPrint = function () {
        var rows = (hacerEditMode ? editedMuestras : muestras).map(function (row) {
            return normalizeHacerRow(row);
        });
        printHacerMuestrasTable(rows, tiposMuestra, dxs, lotesExtraido, hacerEditMode);
    };
    var applyLotToHacerRow = function (row, lot) {
        var _a, _b;
        return (__assign(__assign({}, row), { Id_LtE: (_a = lot === null || lot === void 0 ? void 0 : lot.id) !== null && _a !== void 0 ? _a : null, LN: (_b = lot === null || lot === void 0 ? void 0 : lot.LN) !== null && _b !== void 0 ? _b : null }));
    };
    var handleHacerFieldChange = function (numBN, field, value) {
        var targetBn = Number(numBN);
        setEditedMuestras(function (prev) {
            return prev.map(function (row) {
                var _a;
                var _b;
                if (Number(row.NumBN) !== targetBn)
                    return row;
                var next = __assign(__assign({}, row), (_a = {}, _a[field] = value, _a));
                if (field === "Muestra") {
                    var cod_1 = parseCod(value);
                    var tipo = tiposMuestra.find(function (t) { return Number(t.Cod) === Number(cod_1); });
                    next.Muestra = cod_1;
                    next.DMuestra = tipo ? { TipoMuestra: tipo.TipoMuestra } : null;
                }
                if (field === "Dx") {
                    var cod_2 = parseCod(value);
                    var dx = dxs.find(function (d) { return Number(d.Cod) === Number(cod_2); });
                    next.Dx = cod_2;
                    next.DDx = dx ? { Dx: dx.Dx } : null;
                }
                if (field === "Id_LtE") {
                    var lotId_1 = parseCod(value);
                    var lot = lotId_1 == null ? null : (_b = lotesExtraido.find(function (l) { return l.id === lotId_1; })) !== null && _b !== void 0 ? _b : null;
                    return applyLotToHacerRow(next, lot);
                }
                return next;
            });
        });
    };
    var handleApplyLnAll = function () { return __awaiter(_this, void 0, void 0, function () {
        var lot, results, failed, refreshed, err_4;
        var _this = this;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    lot = (_a = lotesExtraido.find(function (l) { return l.id === Number(bulkLotId); })) !== null && _a !== void 0 ? _a : null;
                    if (!lot) {
                        toast.error(t("actions.toast.applyLnNeed"));
                        return [2 /*return*/];
                    }
                    if (hacerEditMode) {
                        setEditedMuestras(function (prev) { return prev.map(function (row) { return applyLotToHacerRow(row, lot); }); });
                        toast.success(t("actions.toast.applyLn", { count: editedMuestras.length }));
                        return [2 /*return*/];
                    }
                    if (!muestras.length)
                        return [2 /*return*/];
                    setSavingHacer(true);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, Promise.all(muestras.map(function (row) { return __awaiter(_this, void 0, void 0, function () {
                            var numBN, error;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        numBN = Number(row.NumBN);
                                        return [4 /*yield*/, supabase
                                                .from("Muestras")
                                                .update({ Id_LtE: lot.id })
                                                .eq("NumBN", numBN)];
                                    case 1:
                                        error = (_a.sent()).error;
                                        return [2 /*return*/, { numBN: numBN, error: error }];
                                }
                            });
                        }); }))];
                case 2:
                    results = _b.sent();
                    failed = results.filter(function (r) { return r.error; });
                    return [4 /*yield*/, fetchHacerMuestras()];
                case 3:
                    refreshed = _b.sent();
                    setMuestras(refreshed);
                    if (failed.length > 0) {
                        console.error("Errores al aplicar LN:", failed);
                        toast.error(t("actions.toast.hacerPartial", {
                            failed: failed.length,
                            total: muestras.length,
                        }));
                    }
                    else {
                        toast.success(t("actions.toast.applyLn", { count: muestras.length }));
                    }
                    return [3 /*break*/, 6];
                case 4:
                    err_4 = _b.sent();
                    console.error(err_4);
                    toast.error(t("actions.toast.applyLnError"));
                    return [3 /*break*/, 6];
                case 5:
                    setSavingHacer(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var handleMandarALeer = function () { return __awaiter(_this, void 0, void 0, function () {
        var numBNs, _a, lecturasData_1, lecturasError, results, failed, refreshed, err_5;
        var _this = this;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!muestras.length || hacerEditMode)
                        return [2 /*return*/];
                    setSavingHacer(true);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 5, 6, 7]);
                    numBNs = muestras
                        .map(function (row) { return Number(row.NumBN); })
                        .filter(function (n) { return Number.isFinite(n); });
                    return [4 /*yield*/, supabase
                            .from("Lectura")
                            .select("NumBN_L, NumLectura")
                            .in("NumBN_L", numBNs)];
                case 2:
                    _a = _b.sent(), lecturasData_1 = _a.data, lecturasError = _a.error;
                    if (lecturasError)
                        throw lecturasError;
                    return [4 /*yield*/, Promise.all(numBNs.map(function (numBN) { return __awaiter(_this, void 0, void 0, function () {
                            var nextLectura, lecturaError, estadoError;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        nextLectura = nextNumLecturaForBn(lecturasData_1 || [], numBN);
                                        return [4 /*yield*/, supabase.from("Lectura").insert([
                                                {
                                                    NumBN_L: numBN,
                                                    NumLectura: nextLectura,
                                                },
                                            ])];
                                    case 1:
                                        lecturaError = (_a.sent()).error;
                                        if (lecturaError)
                                            return [2 /*return*/, { numBN: numBN, error: lecturaError }];
                                        return [4 /*yield*/, supabase
                                                .from("Muestras")
                                                .update({ Estado_Muestra: 2 })
                                                .eq("NumBN", numBN)
                                                .is("Estado_Muestra", null)];
                                    case 2:
                                        estadoError = (_a.sent()).error;
                                        return [2 /*return*/, { numBN: numBN, error: estadoError }];
                                }
                            });
                        }); }))];
                case 3:
                    results = _b.sent();
                    failed = results.filter(function (r) { return r.error; });
                    if (failed.length > 0) {
                        console.error("Errores al mandar a leer:", failed);
                        toast.error(t("actions.toast.hacerPartial", {
                            failed: failed.length,
                            total: muestras.length,
                        }));
                    }
                    else {
                        toast.success(t("actions.toast.sendToRead", { count: muestras.length }));
                    }
                    return [4 /*yield*/, fetchHacerMuestras()];
                case 4:
                    refreshed = _b.sent();
                    setMuestras(refreshed);
                    return [3 /*break*/, 7];
                case 5:
                    err_5 = _b.sent();
                    console.error(err_5);
                    toast.error(t("actions.toast.sendToReadError"));
                    return [3 /*break*/, 7];
                case 6:
                    setSavingHacer(false);
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    }); };
    var toggleMarcarRow = function (key, checked) {
        setMarcarSelected(function (prev) {
            var next = new Set(prev);
            if (checked)
                next.add(key);
            else
                next.delete(key);
            return next;
        });
    };
    var marcarRowKeys = mode === "marcar" ? muestras.map(function (row) { return marcarRowKey(row.NumBN, row.NumLectura); }) : [];
    var allMarcarSelected = marcarRowKeys.length > 0 && marcarRowKeys.every(function (key) { return marcarSelected.has(key); });
    var toggleMarcarAll = function (checked) {
        setMarcarSelected(checked ? new Set(marcarRowKeys) : new Set());
    };
    var pteChipRowKeys = mode === "pte-chip" ? muestras.map(function (row) { return pteChipRowKey(row.NumBN); }) : [];
    var allPteChipSelected = pteChipRowKeys.length > 0 && pteChipRowKeys.every(function (key) { return pteChipSelected.has(key); });
    var selectedPteChipItems = flattenSelectedPteChipItems(muestras, pteChipSelected);
    var pteChipPanels = useMemo(function () {
        return buildChipPanels(pteChipCatalog, pteChipAsignaciones.flatMap(function (row) {
            var _a;
            var fc = Number(row.FC);
            var numChip = Number(row.NumChip);
            if (row.FC == null || row.FC === "" || !Number.isFinite(fc) || !Number.isFinite(numChip)) {
                return [];
            }
            return [
                {
                    NumChip: numChip,
                    NumBN_C: Number(row.NumBN_C),
                    NumLectura_C: Number(row.NumLectura_C),
                    NumLectMarc_C: Number(row.NumLectMarc_C),
                    FC: fc,
                    Repetir_Chip: (_a = row.Repetir_Chip) !== null && _a !== void 0 ? _a : null,
                },
            ];
        }));
    }, [pteChipCatalog, pteChipAsignaciones]);
    var pteChipPanelsWithFree = pteChipPanels.filter(function (panel) { return fcLibresParaChip(Number(panel.chip.NumChip_D), pteChipAsignaciones).length > 0; });
    var togglePteChipRow = function (key, checked) {
        setPteChipSelected(function (prev) {
            var next = new Set(prev);
            if (checked)
                next.add(key);
            else
                next.delete(key);
            return next;
        });
    };
    var togglePteChipAll = function (checked) {
        setPteChipSelected(checked ? new Set(pteChipRowKeys) : new Set());
    };
    var applyPteChipChoice = function (numChip, items) {
        if (items === void 0) { items = selectedPteChipItems; }
        var libres = fcLibresParaChip(numChip, pteChipAsignaciones);
        if (libres.length < items.length) {
            toast.error(t("actions.toast.pteChipNotEnough", { free: libres.length, count: items.length }));
        }
        setPteChipNumChip(String(numChip));
        setPteChipFcByItem(autoFillFcAssignments(items, libres));
    };
    var handleOpenPteChipLoad = function () {
        var items = flattenSelectedPteChipItems(muestras, pteChipSelected);
        if (!items.length) {
            toast.error(t("actions.toast.marcarNeedSelection"));
            return;
        }
        if (pteChipCatalog.length === 0) {
            toast.error(t("actions.toast.pteChipNoChips"));
            return;
        }
        setPteChipConfirmOpen(true);
        var enough = pteChipCatalog.filter(function (chip) {
            return fcLibresParaChip(Number(chip.NumChip_D), pteChipAsignaciones).length >= items.length;
        });
        if (enough.length === 1) {
            applyPteChipChoice(Number(enough[0].NumChip_D), items);
        }
        else {
            setPteChipNumChip("");
            setPteChipFcByItem({});
        }
    };
    var handleCreatePteChip = function () { return __awaiter(_this, void 0, void 0, function () {
        var items, numChip, chip, libres, usedInBatch, _loop_1, _i, items_1, item, state_1, results, _a, items_2, item, key, fc, error, failed, err_6;
        var _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    items = flattenSelectedPteChipItems(muestras, pteChipSelected);
                    if (!items.length) {
                        toast.error(t("actions.toast.marcarNeedSelection"));
                        return [2 /*return*/];
                    }
                    numChip = Number(pteChipNumChip);
                    chip = (_b = pteChipCatalog.find(function (c) { return Number(c.NumChip_D) === numChip; })) !== null && _b !== void 0 ? _b : null;
                    if (!chip) {
                        toast.error(t("actions.toast.pteChipNeedChip"));
                        return [2 /*return*/];
                    }
                    libres = fcLibresParaChip(numChip, pteChipAsignaciones);
                    usedInBatch = new Set();
                    _loop_1 = function (item) {
                        var key = pteChipLmKey(item.NumBN, item.NumLectura, item.NumLectMarc);
                        var fc = pteChipFcByItem[key];
                        if (fc == null) {
                            toast.error(t("actions.toast.pteChipNeedFc"));
                            return { value: void 0 };
                        }
                        if (!libres.includes(fc) || usedInBatch.has(fc)) {
                            toast.error(t("actions.toast.pteChipFcTaken", { fc: fc }));
                            return { value: void 0 };
                        }
                        usedInBatch.add(fc);
                        var yaAsignado = pteChipAsignaciones.some(function (row) {
                            return Number(row.NumBN_C) === item.NumBN &&
                                Number(row.NumLectura_C) === item.NumLectura &&
                                Number(row.NumLectMarc_C) === item.NumLectMarc &&
                                Number(row.NumChip) === numChip;
                        });
                        if (yaAsignado) {
                            toast.error(t("actions.toast.pteChipAlready", {
                                numBN: item.NumBN,
                                numLectura: item.NumLectura,
                                numLectMarc: item.NumLectMarc,
                                numChip: numChip,
                            }));
                            return { value: void 0 };
                        }
                    };
                    for (_i = 0, items_1 = items; _i < items_1.length; _i++) {
                        item = items_1[_i];
                        state_1 = _loop_1(item);
                        if (typeof state_1 === "object")
                            return [2 /*return*/, state_1.value];
                    }
                    setSavingPteChip(true);
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 7, , 8]);
                    results = [];
                    _a = 0, items_2 = items;
                    _d.label = 2;
                case 2:
                    if (!(_a < items_2.length)) return [3 /*break*/, 5];
                    item = items_2[_a];
                    key = pteChipLmKey(item.NumBN, item.NumLectura, item.NumLectMarc);
                    fc = pteChipFcByItem[key];
                    return [4 /*yield*/, supabase.from("Chips").insert([
                            {
                                NumBN_C: item.NumBN,
                                NumLectura_C: item.NumLectura,
                                NumLectMarc_C: item.NumLectMarc,
                                NumChip: chip.NumChip_D,
                                Chip_Nombre: (_c = chip.Nombre_Chip) !== null && _c !== void 0 ? _c : null,
                                FC: fc,
                                Coment_Chip: null,
                                Repetir_Chip: null,
                            },
                        ])];
                case 3:
                    error = (_d.sent()).error;
                    results.push({ numBN: item.NumBN, error: error });
                    _d.label = 4;
                case 4:
                    _a++;
                    return [3 /*break*/, 2];
                case 5:
                    failed = results.filter(function (r) { return r.error; });
                    if (failed.length > 0) {
                        console.error("Errores al cargar a chip:", failed);
                        toast.error(t("actions.toast.hacerPartial", {
                            failed: failed.length,
                            total: items.length,
                        }));
                    }
                    else {
                        toast.success(t("actions.toast.pteChipLoaded", {
                            count: items.length,
                            numChip: chip.NumChip_D,
                        }));
                    }
                    setPteChipConfirmOpen(false);
                    setPteChipSelected(new Set());
                    setPteChipNumChip("");
                    setPteChipFcByItem({});
                    setSavingPteChip(false);
                    return [4 /*yield*/, handleActionClick("pte-chip")];
                case 6:
                    _d.sent();
                    return [3 /*break*/, 8];
                case 7:
                    err_6 = _d.sent();
                    console.error(err_6);
                    toast.error(t("actions.toast.pteChipLoadError"));
                    setSavingPteChip(false);
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    }); };
    var handleOpenMarcarCreate = function () {
        if (marcarSelected.size === 0) {
            toast.error(t("actions.toast.marcarNeedSelection"));
            return;
        }
        setMarcarConfirmOpen(true);
    };
    var handleCreateMarcarLm = function () { return __awaiter(_this, void 0, void 0, function () {
        var selectedRows, lotM, lotMm, _a, existingLm, existingError, knownLm, results, _i, selectedRows_1, row, numBN, numLectura, marcadoError, nextLm, lmError, failed, err_7;
        var _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    selectedRows = muestras.filter(function (row) {
                        return marcarSelected.has(marcarRowKey(row.NumBN, row.NumLectura));
                    });
                    if (!selectedRows.length) {
                        toast.error(t("actions.toast.marcarNeedSelection"));
                        return [2 /*return*/];
                    }
                    lotM = (_b = lotesMarcado.find(function (l) { return l.id === Number(marcarLotMId); })) !== null && _b !== void 0 ? _b : null;
                    lotMm = (_c = lotesMembrana.find(function (l) { return l.id === Number(marcarLotMmId); })) !== null && _c !== void 0 ? _c : null;
                    if (!lotM || !lotMm) {
                        toast.error(t("actions.toast.marcarNeedLots"));
                        return [2 /*return*/];
                    }
                    setSavingMarcar(true);
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 9, 10, 11]);
                    return [4 /*yield*/, supabase
                            .from("Lecturas_Marcado")
                            .select("NumBN_LM, NumLectura_LM, NumLectMarc")
                            .in("NumBN_LM", selectedRows.map(function (row) { return Number(row.NumBN); }))];
                case 2:
                    _a = _d.sent(), existingLm = _a.data, existingError = _a.error;
                    if (existingError)
                        throw existingError;
                    knownLm = __spreadArray([], (existingLm || []), true);
                    results = [];
                    _i = 0, selectedRows_1 = selectedRows;
                    _d.label = 3;
                case 3:
                    if (!(_i < selectedRows_1.length)) return [3 /*break*/, 7];
                    row = selectedRows_1[_i];
                    numBN = Number(row.NumBN);
                    numLectura = Number(row.NumLectura);
                    return [4 /*yield*/, supabase.from("Marcado").upsert([
                            {
                                NumBN_M: numBN,
                                NumLectura_M: numLectura,
                            },
                        ])];
                case 4:
                    marcadoError = (_d.sent()).error;
                    if (marcadoError) {
                        results.push({ numBN: numBN, numLectura: numLectura, error: marcadoError });
                        return [3 /*break*/, 6];
                    }
                    nextLm = nextNumLectMarcFor(knownLm, numBN, numLectura);
                    return [4 /*yield*/, supabase.from("Lecturas_Marcado").insert([
                            {
                                NumBN_LM: numBN,
                                NumLectura_LM: numLectura,
                                NumLectMarc: nextLm,
                                Id_LtM: lotM.id,
                                Id_LtMm: lotMm.id,
                            },
                        ])];
                case 5:
                    lmError = (_d.sent()).error;
                    if (!lmError) {
                        knownLm.push({
                            NumBN_LM: numBN,
                            NumLectura_LM: numLectura,
                            NumLectMarc: nextLm,
                        });
                    }
                    results.push({ numBN: numBN, numLectura: numLectura, error: lmError });
                    _d.label = 6;
                case 6:
                    _i++;
                    return [3 /*break*/, 3];
                case 7:
                    failed = results.filter(function (r) { return r.error; });
                    if (failed.length > 0) {
                        console.error("Errores al crear lecturas marcadas:", failed);
                        toast.error(t("actions.toast.hacerPartial", {
                            failed: failed.length,
                            total: selectedRows.length,
                        }));
                    }
                    else {
                        toast.success(t("actions.toast.marcarCreated", { count: selectedRows.length }));
                    }
                    setMarcarConfirmOpen(false);
                    setMarcarSelected(new Set());
                    setMarcarLotMId("");
                    setMarcarLotMmId("");
                    return [4 /*yield*/, handleActionClick("marcar")];
                case 8:
                    _d.sent();
                    return [3 /*break*/, 11];
                case 9:
                    err_7 = _d.sent();
                    console.error(err_7);
                    toast.error(t("actions.toast.marcarCreateError"));
                    return [3 /*break*/, 11];
                case 10:
                    setSavingMarcar(false);
                    return [7 /*endfinally*/];
                case 11: return [2 /*return*/];
            }
        });
    }); };
    var handleHacerSave = function () { return __awaiter(_this, void 0, void 0, function () {
        var results, failed, refreshed, err_8;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!editedMuestras.length)
                        return [2 /*return*/];
                    setSavingHacer(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, Promise.all(editedMuestras.map(function (row) { return __awaiter(_this, void 0, void 0, function () {
                            var numBN, payload, _a, data, error;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        numBN = Number(row.NumBN);
                                        payload = buildHacerUpdatePayload(row);
                                        return [4 /*yield*/, supabase
                                                .from("Muestras")
                                                .update(payload)
                                                .eq("NumBN", numBN)
                                                .select("NumBN, Muestra, Dx, Medusa, Id_LtE")
                                                .maybeSingle()];
                                    case 1:
                                        _a = _b.sent(), data = _a.data, error = _a.error;
                                        if (error)
                                            return [2 /*return*/, { numBN: numBN, error: error }];
                                        if (!data) {
                                            return [2 /*return*/, {
                                                    numBN: numBN,
                                                    error: new Error(t("actions.err.sampleNotFoundUpdate", { numBN: numBN })),
                                                }];
                                        }
                                        return [2 /*return*/, { numBN: numBN, error: null, data: data }];
                                }
                            });
                        }); }))];
                case 2:
                    results = _a.sent();
                    failed = results.filter(function (r) { return r.error; });
                    return [4 /*yield*/, fetchHacerMuestras()];
                case 3:
                    refreshed = _a.sent();
                    setMuestras(refreshed);
                    if (failed.length > 0) {
                        console.error("Errores al guardar muestras:", failed);
                        toast.error(t("actions.toast.hacerPartial", {
                            failed: failed.length,
                            total: editedMuestras.length,
                        }));
                    }
                    else {
                        toast.success(t("actions.toast.hacerSaved", { count: editedMuestras.length }));
                    }
                    exitHacerEditMode();
                    return [3 /*break*/, 6];
                case 4:
                    err_8 = _a.sent();
                    console.error(err_8);
                    toast.error(t("actions.toast.saveError"));
                    return [3 /*break*/, 6];
                case 5:
                    setSavingHacer(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var acciones = [
        { label: t("actions.hacer"), key: "hacer", icon: Pickaxe },
        { label: t("actions.leerExtraido"), key: "leer-extraido", icon: Eye },
        { label: t("actions.tirar"), key: "tirar", icon: Trash },
        { label: t("actions.marcar"), key: "marcar", icon: Highlighter },
        { label: t("actions.leerMarcado"), key: "leer-marcado", icon: Eye },
        { label: t("actions.pteChip"), key: "pte-chip", icon: Cpu },
    ];
    var handleActionClick = function (key) { return __awaiter(_this, void 0, void 0, function () {
        var rows, _a, catalogs, lots, fetchedRows, error_1, rows, error_2, cutoff, _b, muestrasData, muestrasError, numBNs, _c, lecturasData, lecturasError, muestraByNumBN_1, _i, _d, m, rows, _e, muestrasData, muestrasError, numBNs, _f, _g, lecturasData, lecturasError, _h, lmData, lmError, _j, chipsData, chipsError, lotsM, lotsMm, lmByLectura, _k, _l, lm, k, arr, chipsByLm, _m, _o, chip, k, arr, muestraByNumBN, _p, _q, m, rows, _r, _s, l, mediaEfectiva, k, lmRows, sortedLm, latestLm, chipsUltimaLm, evaluacion, rows, error_3, minMedia_1, _t, muestrasData, muestrasError, numBNs, muestraByNumBN, _u, _v, m, _w, _x, lmData, lmError, _y, chipsData, chipsError, _z, catalogData, catalogError, chipsByLm_1, _0, _1, ch, lk, arr, pendientesLM, byNumBN, _2, pendientesLM_1, lm, numBN, nl, nm, med, fecha, lmKey, chipsEstaLm, sinChipPte, repetirDetalle, entry, ms, _3, _4, entry, grouped, err_9;
        var _5, _6, _7, _8, _9, _10, _11, _12, _13, _14, _15, _16, _17, _18, _19, _20;
        return __generator(this, function (_21) {
            switch (_21.label) {
                case 0:
                    setLoading(true);
                    setMarcarSelected(new Set());
                    setMarcarConfirmOpen(false);
                    setMarcarLotMId("");
                    setMarcarLotMmId("");
                    setPteChipSelected(new Set());
                    setPteChipConfirmOpen(false);
                    setPteChipNumChip("");
                    setPteChipFcByItem({});
                    exitHacerEditMode();
                    exitLeerEditMode();
                    exitLeerMarcadoEditMode();
                    _21.label = 1;
                case 1:
                    _21.trys.push([1, 26, 27, 28]);
                    if (!(key === "hacer")) return [3 /*break*/, 6];
                    rows = void 0;
                    _21.label = 2;
                case 2:
                    _21.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, Promise.all([
                            fetchHacerCatalogs(),
                            fetchLotesCatalog("extraido"),
                            fetchHacerMuestras(),
                        ])];
                case 3:
                    _a = _21.sent(), catalogs = _a[0], lots = _a[1], fetchedRows = _a[2];
                    setTiposMuestra(catalogs.tipos);
                    setDxs(catalogs.dx);
                    setLotesExtraido(lots);
                    setBulkLotId("");
                    rows = fetchedRows;
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _21.sent();
                    console.error("Error fetching muestras:", error_1);
                    toast.error(t("actions.toast.loadSamples"));
                    return [2 /*return*/];
                case 5:
                    setMode("hacer");
                    setMuestras(rows);
                    return [2 /*return*/];
                case 6:
                    if (!(key === "leer-extraido")) return [3 /*break*/, 11];
                    rows = void 0;
                    _21.label = 7;
                case 7:
                    _21.trys.push([7, 9, , 10]);
                    return [4 /*yield*/, fetchLeerExtraidoRows()];
                case 8:
                    rows = _21.sent();
                    return [3 /*break*/, 10];
                case 9:
                    error_2 = _21.sent();
                    console.error("Error fetching leer extraído:", error_2);
                    toast.error(t("actions.toast.loadReadings"));
                    return [2 /*return*/];
                case 10:
                    setMode("leer-extraido");
                    setMuestras(rows);
                    return [2 /*return*/];
                case 11:
                    if (!(key === "tirar")) return [3 /*break*/, 14];
                    cutoff = MARCAR_THRESHOLD_MEDIA;
                    return [4 /*yield*/, supabase
                            .from("Muestras")
                            .select("NumBN, Petic, Posic, Proces, Pellet, Estado_Muestra")
                            .eq("Estado_Muestra", 2)
                            .order("NumBN", { ascending: true })];
                case 12:
                    _b = _21.sent(), muestrasData = _b.data, muestrasError = _b.error;
                    if (muestrasError) {
                        console.error("Error fetching muestras:", muestrasError);
                        toast.error(t("actions.toast.loadSamples"));
                        return [2 /*return*/];
                    }
                    numBNs = (muestrasData || []).map(function (m) { return m.NumBN; }).filter(function (n) { return n != null; });
                    if (numBNs.length === 0) {
                        setMode("tirar");
                        setMuestras([]);
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, supabase
                            .from("Lectura")
                            .select("NumBN_L, NumLectura, Media_Lectura, Coment_Lectura, Fecha_lectura")
                            .in("NumBN_L", numBNs)
                            .lt("Media_Lectura", cutoff)
                            .order("NumBN_L", { ascending: true })
                            .order("NumLectura", { ascending: true })];
                case 13:
                    _c = _21.sent(), lecturasData = _c.data, lecturasError = _c.error;
                    if (lecturasError) {
                        console.error("Error fetching lecturas:", lecturasError);
                        toast.error(t("actions.toast.loadReadings"));
                        return [2 /*return*/];
                    }
                    muestraByNumBN_1 = new Map();
                    for (_i = 0, _d = muestrasData || []; _i < _d.length; _i++) {
                        m = _d[_i];
                        if ((m === null || m === void 0 ? void 0 : m.NumBN) != null)
                            muestraByNumBN_1.set(m.NumBN, m);
                    }
                    rows = (lecturasData || []).map(function (l) {
                        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
                        var m = muestraByNumBN_1.get(l.NumBN_L);
                        return {
                            NumBN: (_a = m === null || m === void 0 ? void 0 : m.NumBN) !== null && _a !== void 0 ? _a : l.NumBN_L,
                            Petic: (_b = m === null || m === void 0 ? void 0 : m.Petic) !== null && _b !== void 0 ? _b : null,
                            Posic: (_c = m === null || m === void 0 ? void 0 : m.Posic) !== null && _c !== void 0 ? _c : null,
                            Proces: (_d = m === null || m === void 0 ? void 0 : m.Proces) !== null && _d !== void 0 ? _d : null,
                            Pellet: (_e = m === null || m === void 0 ? void 0 : m.Pellet) !== null && _e !== void 0 ? _e : null,
                            NumLectura: (_f = l === null || l === void 0 ? void 0 : l.NumLectura) !== null && _f !== void 0 ? _f : null,
                            Fecha_lectura: (_g = l === null || l === void 0 ? void 0 : l.Fecha_lectura) !== null && _g !== void 0 ? _g : null,
                            Media_Lectura: (_h = l === null || l === void 0 ? void 0 : l.Media_Lectura) !== null && _h !== void 0 ? _h : null,
                            Coment_Lectura: (_j = l === null || l === void 0 ? void 0 : l.Coment_Lectura) !== null && _j !== void 0 ? _j : null,
                        };
                    });
                    setMode("tirar");
                    setMuestras(rows);
                    return [2 /*return*/];
                case 14:
                    if (!(key === "marcar")) return [3 /*break*/, 17];
                    return [4 /*yield*/, supabase
                            .from("Muestras")
                            .select("NumBN, Petic, Posic, Proces, Pellet, Estado_Muestra")
                            .eq("Estado_Muestra", 2)
                            .order("NumBN", { ascending: true })];
                case 15:
                    _e = _21.sent(), muestrasData = _e.data, muestrasError = _e.error;
                    if (muestrasError) {
                        console.error("Error fetching muestras:", muestrasError);
                        toast.error(t("actions.toast.loadSamples"));
                        return [2 /*return*/];
                    }
                    numBNs = (muestrasData || []).map(function (m) { return m.NumBN; }).filter(function (n) { return n != null; });
                    if (numBNs.length === 0) {
                        setMode("marcar");
                        setMuestras([]);
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, Promise.all([
                            supabase
                                .from("Lectura")
                                .select("NumBN_L, NumLectura, Media_Lectura, Izq, Cen, Dcha, Coment_Lectura, Fecha_lectura")
                                .in("NumBN_L", numBNs)
                                .order("NumBN_L", { ascending: true })
                                .order("NumLectura", { ascending: true }),
                            supabase.from("Lecturas_Marcado").select("*").in("NumBN_LM", numBNs),
                            supabase
                                .from("Chips")
                                .select("NumBN_C, NumLectura_C, NumLectMarc_C, NumChip, Repetir_Chip")
                                .in("NumBN_C", numBNs),
                            fetchLotesCatalog("marcado"),
                            fetchLotesCatalog("membrana"),
                        ])];
                case 16:
                    _f = _21.sent(), _g = _f[0], lecturasData = _g.data, lecturasError = _g.error, _h = _f[1], lmData = _h.data, lmError = _h.error, _j = _f[2], chipsData = _j.data, chipsError = _j.error, lotsM = _f[3], lotsMm = _f[4];
                    if (lecturasError) {
                        console.error("Error fetching lecturas:", lecturasError);
                        toast.error(t("actions.toast.loadReadings"));
                        return [2 /*return*/];
                    }
                    if (lmError) {
                        console.error("Error fetching lecturas marcado:", lmError);
                        toast.error(t("actions.toast.loadLm"));
                        return [2 /*return*/];
                    }
                    if (chipsError) {
                        console.error("Error fetching chips:", chipsError);
                        toast.error(t("actions.toast.loadChips"));
                        return [2 /*return*/];
                    }
                    lmByLectura = new Map();
                    for (_k = 0, _l = lmData || []; _k < _l.length; _k++) {
                        lm = _l[_k];
                        k = lecturaKey(Number(lm.NumBN_LM), Number(lm.NumLectura_LM));
                        arr = lmByLectura.get(k);
                        if (arr)
                            arr.push(lm);
                        else
                            lmByLectura.set(k, [lm]);
                    }
                    chipsByLm = new Map();
                    for (_m = 0, _o = chipsData || []; _m < _o.length; _m++) {
                        chip = _o[_m];
                        k = lmChipKey(Number(chip.NumBN_C), Number(chip.NumLectura_C), Number(chip.NumLectMarc_C));
                        arr = chipsByLm.get(k);
                        if (arr)
                            arr.push(chip);
                        else
                            chipsByLm.set(k, [chip]);
                    }
                    muestraByNumBN = new Map();
                    for (_p = 0, _q = muestrasData || []; _p < _q.length; _p++) {
                        m = _q[_p];
                        if ((m === null || m === void 0 ? void 0 : m.NumBN) != null)
                            muestraByNumBN.set(m.NumBN, m);
                    }
                    rows = [];
                    for (_r = 0, _s = lecturasData || []; _r < _s.length; _r++) {
                        l = _s[_r];
                        mediaEfectiva = mediaLecturaExtraidaEfectiva(l);
                        k = lecturaKey(Number(l.NumBN_L), Number(l.NumLectura));
                        lmRows = (_5 = lmByLectura.get(k)) !== null && _5 !== void 0 ? _5 : [];
                        sortedLm = __spreadArray([], lmRows, true).sort(function (a, b) { var _a, _b; return Number((_a = a.NumLectMarc) !== null && _a !== void 0 ? _a : 0) - Number((_b = b.NumLectMarc) !== null && _b !== void 0 ? _b : 0); });
                        latestLm = sortedLm.at(-1);
                        chipsUltimaLm = latestLm
                            ? (_6 = chipsByLm.get(lmChipKey(Number(l.NumBN_L), Number(l.NumLectura), Number(latestLm.NumLectMarc)))) !== null && _6 !== void 0 ? _6 : []
                            : [];
                        evaluacion = evaluarMarcarLectura({
                            mediaLectura: mediaEfectiva,
                            lmRows: lmRows,
                            chipsUltimaLm: chipsUltimaLm,
                        });
                        if (!evaluacion)
                            continue;
                        rows.push({
                            NumBN: l.NumBN_L,
                            Petic: (_8 = (_7 = muestraByNumBN.get(l.NumBN_L)) === null || _7 === void 0 ? void 0 : _7.Petic) !== null && _8 !== void 0 ? _8 : null,
                            Posic: (_10 = (_9 = muestraByNumBN.get(l.NumBN_L)) === null || _9 === void 0 ? void 0 : _9.Posic) !== null && _10 !== void 0 ? _10 : null,
                            Proces: (_12 = (_11 = muestraByNumBN.get(l.NumBN_L)) === null || _11 === void 0 ? void 0 : _11.Proces) !== null && _12 !== void 0 ? _12 : null,
                            Pellet: (_14 = (_13 = muestraByNumBN.get(l.NumBN_L)) === null || _13 === void 0 ? void 0 : _13.Pellet) !== null && _14 !== void 0 ? _14 : null,
                            NumLectura: l.NumLectura,
                            Media_Lectura: mediaEfectiva,
                            Coment_Lectura: l.Coment_Lectura,
                            marcarVariant: evaluacion.variant,
                            marcarMotivo: evaluacion.motivo,
                            lmCount: evaluacion.lmCount,
                        });
                    }
                    setLotesMarcado(lotsM);
                    setLotesMembrana(lotsMm);
                    setMode("marcar");
                    setMuestras(rows);
                    return [2 /*return*/];
                case 17:
                    if (!(key === "leer-marcado")) return [3 /*break*/, 22];
                    rows = void 0;
                    _21.label = 18;
                case 18:
                    _21.trys.push([18, 20, , 21]);
                    return [4 /*yield*/, fetchLeerMarcadoRows()];
                case 19:
                    rows = _21.sent();
                    return [3 /*break*/, 21];
                case 20:
                    error_3 = _21.sent();
                    console.error("Error fetching leer marcado:", error_3);
                    toast.error(t("actions.toast.loadLeerMarcado"));
                    return [2 /*return*/];
                case 21:
                    setMode("leer-marcado");
                    setMuestras(rows);
                    return [2 /*return*/];
                case 22:
                    if (!(key === "pte-chip")) return [3 /*break*/, 25];
                    minMedia_1 = MIN_MEDIA_LM_PTE_CHIP;
                    return [4 /*yield*/, supabase
                            .from("Muestras")
                            .select("NumBN, Petic, Posic, Proces, Pellet, Estado_Muestra")
                            .eq("Estado_Muestra", 2)
                            .order("NumBN", { ascending: true })];
                case 23:
                    _t = _21.sent(), muestrasData = _t.data, muestrasError = _t.error;
                    if (muestrasError) {
                        console.error("Error fetching muestras:", muestrasError);
                        toast.error(t("actions.toast.loadSamples"));
                        return [2 /*return*/];
                    }
                    numBNs = (muestrasData || []).map(function (m) { return m.NumBN; }).filter(function (n) { return n != null; });
                    if (numBNs.length === 0) {
                        setMode("pte-chip");
                        setMuestras([]);
                        return [2 /*return*/];
                    }
                    muestraByNumBN = new Map();
                    for (_u = 0, _v = muestrasData || []; _u < _v.length; _u++) {
                        m = _v[_u];
                        if ((m === null || m === void 0 ? void 0 : m.NumBN) != null)
                            muestraByNumBN.set(m.NumBN, m);
                    }
                    return [4 /*yield*/, Promise.all([
                            supabase
                                .from("Lecturas_Marcado")
                                .select("NumBN_LM, NumLectura_LM, NumLectMarc, Izq_LM, Dcha_LM, Media_LM, Fecha_Lect_Marc")
                                .in("NumBN_LM", numBNs),
                            supabase
                                .from("Chips")
                                .select("NumBN_C, NumLectura_C, NumLectMarc_C, NumChip, FC, Chip_Nombre, Repetir_Chip"),
                            supabase
                                .from("DChips")
                                .select("NumChip_D, Nombre_Chip")
                                .order("NumChip_D", { ascending: true }),
                        ])];
                case 24:
                    _w = _21.sent(), _x = _w[0], lmData = _x.data, lmError = _x.error, _y = _w[1], chipsData = _y.data, chipsError = _y.error, _z = _w[2], catalogData = _z.data, catalogError = _z.error;
                    if (lmError) {
                        console.error("Error fetching lecturas marcado:", lmError);
                        toast.error(t("actions.toast.loadLm"));
                        return [2 /*return*/];
                    }
                    if (chipsError) {
                        console.error("Error fetching chips:", chipsError);
                        toast.error(t("actions.toast.loadChips"));
                        return [2 /*return*/];
                    }
                    if (catalogError) {
                        console.error("Error fetching catálogo de chips:", catalogError);
                        toast.error(t("actions.toast.loadChips"));
                        return [2 /*return*/];
                    }
                    setPteChipCatalog((catalogData || []));
                    setPteChipAsignaciones((chipsData || []));
                    chipsByLm_1 = new Map();
                    for (_0 = 0, _1 = chipsData || []; _0 < _1.length; _0++) {
                        ch = _1[_0];
                        if ((ch === null || ch === void 0 ? void 0 : ch.NumBN_C) == null || (ch === null || ch === void 0 ? void 0 : ch.NumLectura_C) == null || (ch === null || ch === void 0 ? void 0 : ch.NumLectMarc_C) == null)
                            continue;
                        lk = lmChipKey(Number(ch.NumBN_C), Number(ch.NumLectura_C), Number(ch.NumLectMarc_C));
                        arr = chipsByLm_1.get(lk);
                        if (arr)
                            arr.push(ch);
                        else
                            chipsByLm_1.set(lk, [ch]);
                    }
                    pendientesLM = (lmData || []).filter(function (lm) {
                        var _a;
                        var med = mediaDeMarcadoLM(lm);
                        var k = lmChipKey(Number(lm.NumBN_LM), Number(lm.NumLectura_LM), Number(lm.NumLectMarc));
                        var lista = (_a = chipsByLm_1.get(k)) !== null && _a !== void 0 ? _a : [];
                        var sinChipPte = med != null && med >= minMedia_1 && lista.length === 0;
                        var tieneRepetir = lista.some(chipRepetirActivo);
                        return sinChipPte || tieneRepetir;
                    });
                    if (pendientesLM.length === 0) {
                        setMode("pte-chip");
                        setMuestras([]);
                        return [2 /*return*/];
                    }
                    byNumBN = new Map();
                    for (_2 = 0, pendientesLM_1 = pendientesLM; _2 < pendientesLM_1.length; _2++) {
                        lm = pendientesLM_1[_2];
                        numBN = Number(lm.NumBN_LM);
                        nl = Number(lm.NumLectura_LM);
                        nm = Number(lm.NumLectMarc);
                        med = mediaDeMarcadoLM(lm);
                        fecha = (_15 = lm.Fecha_Lect_Marc) !== null && _15 !== void 0 ? _15 : null;
                        lmKey = lmChipKey(numBN, nl, nm);
                        chipsEstaLm = (_16 = chipsByLm_1.get(lmKey)) !== null && _16 !== void 0 ? _16 : [];
                        sinChipPte = typeof med === "number" &&
                            Number.isFinite(med) &&
                            med >= minMedia_1 &&
                            chipsEstaLm.length === 0;
                        repetirDetalle = chipsEstaLm
                            .filter(chipRepetirActivo)
                            .map(function (ch) {
                            var _a;
                            return ({
                                NumChip: Number(ch.NumChip),
                                FC: ch.FC != null && ch.FC !== "" ? Number(ch.FC) : null,
                                Chip_Nombre: (_a = ch.Chip_Nombre) !== null && _a !== void 0 ? _a : null,
                            });
                        });
                        entry = byNumBN.get(numBN);
                        if (!entry) {
                            ms = muestraByNumBN.get(numBN);
                            entry = {
                                NumBN: numBN,
                                Petic: (_17 = ms === null || ms === void 0 ? void 0 : ms.Petic) !== null && _17 !== void 0 ? _17 : null,
                                Posic: (_18 = ms === null || ms === void 0 ? void 0 : ms.Posic) !== null && _18 !== void 0 ? _18 : null,
                                Proces: (_19 = ms === null || ms === void 0 ? void 0 : ms.Proces) !== null && _19 !== void 0 ? _19 : null,
                                Pellet: (_20 = ms === null || ms === void 0 ? void 0 : ms.Pellet) !== null && _20 !== void 0 ? _20 : null,
                                pteChipItems: [],
                            };
                            byNumBN.set(numBN, entry);
                        }
                        entry.pteChipItems.push({
                            NumLectura: nl,
                            NumLectMarc: nm,
                            Media_LM: typeof med === "number" && Number.isFinite(med) ? med : null,
                            Fecha_Lect_Marc: fecha,
                            sinChipPte: sinChipPte,
                            repetirDetalle: repetirDetalle,
                        });
                    }
                    for (_3 = 0, _4 = byNumBN.values(); _3 < _4.length; _3++) {
                        entry = _4[_3];
                        entry.pteChipItems.sort(function (a, b) {
                            return a.NumLectura !== b.NumLectura
                                ? a.NumLectura - b.NumLectura
                                : a.NumLectMarc - b.NumLectMarc;
                        });
                    }
                    grouped = __spreadArray([], byNumBN.values(), true).sort(function (a, b) { return a.NumBN - b.NumBN; });
                    setMode("pte-chip");
                    setMuestras(grouped);
                    return [2 /*return*/];
                case 25:
                    toast.message(t("actions.toast.notImplemented"));
                    return [3 /*break*/, 28];
                case 26:
                    err_9 = _21.sent();
                    console.error(err_9);
                    toast.error(t("actions.toast.loadData"));
                    return [3 /*break*/, 28];
                case 27:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 28: return [2 /*return*/];
            }
        });
    }); };
    return (_jsxs(SubpageShell, { title: t("actions.title"), icon: ClipboardList, maxWidthClass: "max-w-[1200px]", children: [_jsx("div", { className: "bionapp-panel p-4", children: _jsx("div", { className: "flex flex-wrap gap-2", children: acciones.map(function (accion) {
                        var AccionIcon = accion.icon;
                        return (_jsxs(Button, { size: "sm", className: "gap-2 bionapp-btn-green shrink-0", onClick: function () { return handleActionClick(accion.key); }, disabled: loading ||
                                savingHacer ||
                                savingLeer ||
                                savingLeerMarcado ||
                                savingMarcar ||
                                savingPteChip ||
                                hacerEditMode ||
                                leerEditMode ||
                                leerMarcadoEditMode, children: [_jsx(AccionIcon, { className: "h-4 w-4" }), accion.label] }, accion.key));
                    }) }) }), loading ? (_jsxs("div", { className: "mt-6 bionapp-panel p-6 flex items-center justify-center gap-2 text-sm text-muted-foreground", children: [_jsx(Loader2, { className: "h-5 w-5 animate-spin" }), t("common.loading")] })) : mode ? (_jsxs("div", { className: "mt-6 bionapp-panel p-4", children: [_jsx("h2", { className: "text-base font-semibold mb-2 text-foreground", children: mode === "leer-extraido" ? (t("actions.leerExtraidoHeading")) : mode === "leer-marcado" ? (_jsx(AccionLeerMarcadoHeading, {})) : mode === "tirar" ? (_jsx(AccionEstadoMediaHeading, { i18nKey: "actions.tirarHeading", cmp: "<", threshold: formatThreshold(MARCAR_THRESHOLD_MEDIA) })) : mode === "marcar" ? (_jsx(AccionEstadoMediaHeading, { i18nKey: "actions.marcarHeading", cmp: ">", threshold: formatThreshold(MARCAR_THRESHOLD_MEDIA) })) : mode === "pte-chip" ? (_jsx(AccionPteChipHeading, { minMedia: formatThreshold(MIN_MEDIA_LM_PTE_CHIP) })) : (_jsx(AccionPreparacionHeading, {})) }), muestras.length === 0 ? (_jsx("p", { className: "text-sm text-muted-foreground py-8 text-center", children: t("actions.emptyResults") })) : (_jsxs(_Fragment, { children: [mode === "marcar" && (_jsxs("div", { className: "text-xs text-muted-foreground mb-4 space-y-1", children: [_jsxs("p", { children: [_jsx("span", { className: "bionapp-swatch-warn mr-1" }), " ", t("actions.marcarHelp.amber")] }), _jsx("p", { children: t("actions.marcarHelp.normal", {
                                            threshold: formatThreshold(MARCAR_THRESHOLD_MEDIA),
                                        }) })] })), mode === "marcar" && (_jsxs("div", { className: "flex flex-col gap-3 mb-4", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsxs(Button, { size: "sm", className: "gap-2 bionapp-btn-green", onClick: handleOpenMarcarCreate, disabled: loading || savingMarcar || marcarSelected.size === 0, children: [_jsx(Highlighter, { className: "h-4 w-4" }), t("actions.marcarCreate")] }), _jsx("span", { className: "text-xs text-muted-foreground", children: t("actions.marcarSelected", { count: marcarSelected.size }) })] }), marcarConfirmOpen ? (_jsxs("div", { className: "bionapp-panel p-4 border border-slate-200 dark:border-slate-800", children: [_jsx("p", { className: "text-sm text-muted-foreground mb-3", children: t("actions.marcarCreateHint", { count: marcarSelected.size }) }), _jsxs("div", { className: "flex flex-wrap items-end gap-2", children: [_jsxs("label", { className: "min-w-[180px]", children: [_jsx("span", { className: "block text-xs text-muted-foreground mb-1", children: t("actions.col.lnMarcado") }), _jsxs("select", { value: marcarLotMId, onChange: function (e) { return setMarcarLotMId(e.target.value); }, className: HACER_SELECT_CLASS, disabled: savingMarcar, children: [_jsx("option", { value: "", children: t("common.selectPlaceholder") }), lotesMarcado.map(function (lot) { return (_jsx("option", { value: lot.id, children: lotOptionLabel(lot, lotesMarcado) }, lot.id)); })] })] }), _jsxs("label", { className: "min-w-[180px]", children: [_jsx("span", { className: "block text-xs text-muted-foreground mb-1", children: t("actions.col.lnMembrana") }), _jsxs("select", { value: marcarLotMmId, onChange: function (e) { return setMarcarLotMmId(e.target.value); }, className: HACER_SELECT_CLASS, disabled: savingMarcar, children: [_jsx("option", { value: "", children: t("common.selectPlaceholder") }), lotesMembrana.map(function (lot) { return (_jsx("option", { value: lot.id, children: lotOptionLabel(lot, lotesMembrana) }, lot.id)); })] })] }), _jsxs(Button, { size: "sm", className: "h-8 gap-2 bionapp-btn-green", onClick: function () { return void handleCreateMarcarLm(); }, disabled: savingMarcar || !marcarLotMId || !marcarLotMmId, children: [savingMarcar ? (_jsx(Loader2, { className: "h-4 w-4 animate-spin" })) : (_jsx(Highlighter, { className: "h-4 w-4" })), t("actions.marcarCreateConfirm")] }), _jsxs(Button, { size: "sm", variant: "outline", className: "h-8 gap-2", onClick: function () { return setMarcarConfirmOpen(false); }, disabled: savingMarcar, children: [_jsx(X, { className: "h-4 w-4" }), t("actions.cancel")] })] })] })) : null] })), mode === "pte-chip" && (_jsxs("div", { className: "flex flex-col gap-3 mb-4", children: [_jsx("p", { className: "text-xs text-muted-foreground", children: t("actions.pteChipHelp") }), _jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsxs(Button, { size: "sm", className: "gap-2 bionapp-btn-green", onClick: handleOpenPteChipLoad, disabled: loading || savingPteChip || pteChipSelected.size === 0, children: [_jsx(Cpu, { className: "h-4 w-4" }), t("actions.pteChipLoad")] }), _jsx("span", { className: "text-xs text-muted-foreground", children: t("actions.marcarSelected", { count: pteChipSelected.size }) })] }), pteChipConfirmOpen ? (_jsxs("div", { className: "bionapp-panel p-4 border border-slate-200 dark:border-slate-800", children: [_jsx("p", { className: "text-sm text-muted-foreground mb-3", children: t("actions.pteChipLoadHint", { count: selectedPteChipItems.length }) }), selectedPteChipItems.length > 0 ? (_jsx("ul", { className: "mb-3 space-y-1.5", children: selectedPteChipItems.map(function (item) {
                                                    var itemKey = pteChipLmKey(item.NumBN, item.NumLectura, item.NumLectMarc);
                                                    var numChip = Number(pteChipNumChip);
                                                    var libres = Number.isFinite(numChip) && numChip > 0
                                                        ? fcLibresParaChip(numChip, pteChipAsignaciones)
                                                        : [];
                                                    var taken = new Set(Object.entries(pteChipFcByItem)
                                                        .filter(function (_a) {
                                                        var k = _a[0];
                                                        return k !== itemKey;
                                                    })
                                                        .map(function (_a) {
                                                        var fc = _a[1];
                                                        return fc;
                                                    }));
                                                    var current = pteChipFcByItem[itemKey];
                                                    var options = CHIP_FC_SLOTS.filter(function (fc) { return libres.includes(fc) && (!taken.has(fc) || fc === current); });
                                                    return (_jsxs("li", { className: "flex flex-wrap items-center gap-2 text-xs", children: [_jsx("span", { className: "min-w-[220px]", children: t("actions.pteChipQueueItem", {
                                                                    numBN: item.NumBN,
                                                                    numLectura: item.NumLectura,
                                                                    numLectMarc: item.NumLectMarc,
                                                                }) }), _jsxs("label", { className: "inline-flex items-center gap-1", children: [_jsx("span", { className: "text-muted-foreground", children: t("actions.col.fc") }), _jsxs("select", { value: current !== null && current !== void 0 ? current : "", onChange: function (e) {
                                                                            var raw = e.target.value;
                                                                            setPteChipFcByItem(function (prev) {
                                                                                var next = __assign({}, prev);
                                                                                if (raw === "")
                                                                                    delete next[itemKey];
                                                                                else
                                                                                    next[itemKey] = Number(raw);
                                                                                return next;
                                                                            });
                                                                        }, className: HACER_SELECT_CLASS, disabled: savingPteChip || !pteChipNumChip, children: [_jsx("option", { value: "", children: t("common.selectPlaceholder") }), options.map(function (fc) { return (_jsx("option", { value: fc, children: t("chips.fc.slot", { n: fc }) }, fc)); })] })] })] }, itemKey));
                                                }) })) : null, pteChipPanelsWithFree.length === 0 ? (_jsx("p", { className: "text-sm text-muted-foreground mb-3", children: t("actions.toast.pteChipNoFree") })) : (_jsx("div", { className: "bionapp-chip-grid max-h-[380px] overflow-y-auto mb-3", children: pteChipPanelsWithFree.map(function (_a) {
                                                    var chip = _a.chip, flowcells = _a.flowcells;
                                                    var numChip = Number(chip.NumChip_D);
                                                    var selected = String(numChip) === pteChipNumChip;
                                                    var libres = fcLibresParaChip(numChip, pteChipAsignaciones);
                                                    return (_jsxs("button", { type: "button", className: cn("bionapp-chip-card bionapp-chip-card--pick", selected && "bionapp-chip-card--selected"), onClick: function () { return applyPteChipChoice(numChip); }, disabled: savingPteChip, children: [_jsxs("header", { className: "bionapp-chip-card__header", children: [_jsxs("div", { className: "bionapp-chip-card__title min-w-0", children: [_jsxs(Badge, { variant: "outline", className: "shrink-0", children: ["#", chip.NumChip_D] }), _jsx("span", { className: "text-sm font-medium truncate", title: chip.Nombre_Chip || "", children: chip.Nombre_Chip || t("common.empty") })] }), _jsx("span", { className: "text-xs text-muted-foreground shrink-0", children: formatFcLibresLabel(libres) })] }), _jsx("div", { className: "bionapp-chip-fc-grid", children: flowcells.map(function (row, idx) {
                                                                    var _a;
                                                                    var fcNumber = idx + 1;
                                                                    var previewBn = selected
                                                                        ? (_a = selectedPteChipItems.find(function (it) {
                                                                            return pteChipFcByItem[pteChipLmKey(it.NumBN, it.NumLectura, it.NumLectMarc)] === fcNumber;
                                                                        })) === null || _a === void 0 ? void 0 : _a.NumBN
                                                                        : undefined;
                                                                    if (row != null && row.NumBN_C != null) {
                                                                        return (_jsxs("div", { className: "bionapp-chip-fc bionapp-chip-fc--ocupada", children: [_jsx("span", { className: "bionapp-chip-fc__label", children: t("chips.fc.slot", { n: fcNumber }) }), _jsx("span", { className: "bionapp-chip-fc__muestra", children: row.NumBN_C })] }, fcNumber));
                                                                    }
                                                                    if (previewBn != null) {
                                                                        return (_jsxs("div", { className: "bionapp-chip-fc bionapp-chip-fc--preview", children: [_jsx("span", { className: "bionapp-chip-fc__label", children: t("chips.fc.slot", { n: fcNumber }) }), _jsx("span", { className: "bionapp-chip-fc__muestra", children: previewBn })] }, fcNumber));
                                                                    }
                                                                    return (_jsxs("div", { className: "bionapp-chip-fc", children: [_jsx("span", { className: "bionapp-chip-fc__label", children: t("chips.fc.slot", { n: fcNumber }) }), _jsx("span", { className: "bionapp-chip-fc__vacio", children: t("common.empty") })] }, fcNumber));
                                                                }) })] }, numChip));
                                                }) })), _jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsxs(Button, { size: "sm", className: "h-8 gap-2 bionapp-btn-green", onClick: function () { return void handleCreatePteChip(); }, disabled: savingPteChip ||
                                                            !pteChipNumChip ||
                                                            selectedPteChipItems.some(function (item) {
                                                                return pteChipFcByItem[pteChipLmKey(item.NumBN, item.NumLectura, item.NumLectMarc)] == null;
                                                            }), children: [savingPteChip ? (_jsx(Loader2, { className: "h-4 w-4 animate-spin" })) : (_jsx(Cpu, { className: "h-4 w-4" })), t("actions.pteChipLoadConfirm")] }), _jsxs(Button, { size: "sm", variant: "outline", className: "h-8 gap-2", onClick: function () { return setPteChipConfirmOpen(false); }, disabled: savingPteChip, children: [_jsx(X, { className: "h-4 w-4" }), t("actions.cancel")] })] })] })) : null] })), mode === "hacer" && (_jsxs("div", { className: "flex flex-col gap-3 mb-4", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsxs(Button, { size: "sm", variant: "outline", className: "gap-2", onClick: handleHacerPrint, disabled: loading || savingHacer || muestras.length === 0, children: [_jsx(Printer, { className: "h-4 w-4" }), t("common.print")] }), isAdmin &&
                                                (!hacerEditMode ? (_jsxs(Button, { size: "sm", className: "gap-2", onClick: handleHacerEditStart, disabled: loading || savingHacer, children: [_jsx(Edit, { className: "h-4 w-4" }), t("actions.edit")] })) : (_jsxs(_Fragment, { children: [_jsxs(Button, { size: "sm", className: "gap-2 bionapp-btn-green", onClick: handleHacerSave, disabled: savingHacer, children: [savingHacer ? (_jsx(Loader2, { className: "h-4 w-4 animate-spin" })) : (_jsx(Save, { className: "h-4 w-4" })), savingHacer ? t("actions.saving") : t("actions.saveAll")] }), _jsxs(Button, { size: "sm", variant: "outline", className: "gap-2", onClick: handleHacerEditCancel, disabled: savingHacer, children: [_jsx(X, { className: "h-4 w-4" }), t("actions.cancel")] })] }))), isAdmin && (_jsxs(Button, { size: "sm", className: "gap-2 bionapp-btn-green", onClick: function () { return void handleMandarALeer(); }, disabled: loading || savingHacer || hacerEditMode || muestras.length === 0, children: [savingHacer && !hacerEditMode ? (_jsx(Loader2, { className: "h-4 w-4 animate-spin" })) : (_jsx(Send, { className: "h-4 w-4" })), t("actions.sendToRead")] })), hacerEditMode && (_jsx("span", { className: "text-xs text-muted-foreground", children: t("actions.hacerEditing", { count: editedMuestras.length }) }))] }), isAdmin && hacerEditMode && (_jsxs("div", { className: "flex flex-wrap items-end gap-2", children: [_jsxs("label", { className: "min-w-[180px]", children: [_jsx("span", { className: "block text-xs text-muted-foreground mb-1", children: t("actions.col.lnExtracted") }), _jsxs("select", { value: bulkLotId, onChange: function (e) { return setBulkLotId(e.target.value); }, className: HACER_SELECT_CLASS, disabled: loading || savingHacer, children: [_jsx("option", { value: "", children: t("common.selectPlaceholder") }), lotesExtraido.map(function (lot) { return (_jsx("option", { value: lot.id, children: lotOptionLabel(lot, lotesExtraido) }, lot.id)); })] })] }), _jsx(Button, { size: "sm", variant: "outline", className: "h-8", onClick: function () { return void handleApplyLnAll(); }, disabled: loading || savingHacer || !bulkLotId, children: t("actions.applyLnAll") })] }))] })), mode === "leer-marcado" && (_jsxs("div", { className: "flex flex-wrap items-center gap-2 mb-4", children: [isAdmin &&
                                        (!leerMarcadoEditMode ? (_jsxs(Button, { size: "sm", className: "gap-2 bionapp-btn-green", onClick: handleLeerMarcadoEditStart, disabled: loading || savingLeerMarcado, children: [_jsx(Edit, { className: "h-4 w-4" }), t("actions.edit")] })) : (_jsxs(_Fragment, { children: [_jsxs(Button, { size: "sm", className: "gap-2 bionapp-btn-green", onClick: handleLeerMarcadoSave, disabled: savingLeerMarcado, children: [savingLeerMarcado ? (_jsx(Loader2, { className: "h-4 w-4 animate-spin" })) : (_jsx(Save, { className: "h-4 w-4" })), savingLeerMarcado ? t("actions.saving") : t("actions.saveAll")] }), _jsxs(Button, { size: "sm", variant: "outline", className: "gap-2", onClick: handleLeerMarcadoEditCancel, disabled: savingLeerMarcado, children: [_jsx(X, { className: "h-4 w-4" }), t("actions.cancel")] })] }))), leerMarcadoEditMode && (_jsx("span", { className: "text-xs text-muted-foreground", children: t("actions.leerMarcadoEditing", { count: editedLeerMarcadoRows.length }) }))] })), mode === "leer-extraido" && (_jsxs("div", { className: "flex flex-col gap-3 mb-4", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [isAdmin &&
                                                (!leerEditMode ? (_jsxs(Button, { size: "sm", className: "gap-2 bionapp-btn-green", onClick: handleLeerEditStart, disabled: loading || savingLeer, children: [_jsx(Edit, { className: "h-4 w-4" }), t("actions.edit")] })) : (_jsxs(_Fragment, { children: [_jsxs(Button, { size: "sm", className: "gap-2 bionapp-btn-green", onClick: handleLeerSave, disabled: savingLeer, children: [savingLeer ? (_jsx(Loader2, { className: "h-4 w-4 animate-spin" })) : (_jsx(Save, { className: "h-4 w-4" })), savingLeer ? t("actions.saving") : t("actions.saveAll")] }), _jsxs(Button, { size: "sm", variant: "outline", className: "gap-2", onClick: handleLeerEditCancel, disabled: savingLeer, children: [_jsx(X, { className: "h-4 w-4" }), t("actions.cancel")] })] }))), leerEditMode && (_jsx("span", { className: "text-xs text-muted-foreground", children: t("actions.leerExtraidoEditing", { count: editedLeerMuestras.length }) }))] }), isAdmin && leerEditMode && (_jsxs("div", { className: "flex flex-wrap items-end gap-2", children: [_jsxs("label", { className: "min-w-[180px]", children: [_jsx("span", { className: "block text-xs text-muted-foreground mb-1", children: t("actions.col.readingDate") }), _jsx(Input, { type: "date", value: bulkFechaLectura, onChange: function (e) { return setBulkFechaLectura(e.target.value); }, className: "h-8 text-sm min-w-[160px]", disabled: savingLeer })] }), _jsx(Button, { size: "sm", variant: "outline", className: "h-8", onClick: handleFechaLecturaHoyAll, disabled: savingLeer, children: t("actions.today") }), _jsx(Button, { size: "sm", variant: "outline", className: "h-8", onClick: handleApplyFechaLecturaAll, disabled: savingLeer || !bulkFechaLectura, children: t("actions.applyLnAll") })] }))] })), _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsx(TableRow, { children: mode === "leer-extraido" ? (_jsxs(_Fragment, { children: [_jsx(TableHead, { children: "NumBN" }), _jsx(TableHead, { children: "Medusa" }), _jsx(TableHead, { children: t("actions.col.viscosityGrade") }), _jsx(TableHead, { children: t("actions.col.readingNo") }), _jsx(TableHead, { children: t("app.quant.left") }), _jsx(TableHead, { children: t("app.quant.center") }), _jsx(TableHead, { children: t("app.quant.right") }), _jsx(TableHead, { children: "Media_Lectura" }), _jsx(TableHead, { children: "CV_Lectura" }), _jsx(TableHead, { children: t("actions.col.readingDate") }), _jsx(TableHead, { children: "Coment_Lectura" })] })) : mode === "leer-marcado" ? (_jsxs(_Fragment, { children: [_jsx(TableHead, { children: "NumBN" }), _jsx(TableHead, { children: t("actions.col.readingNo") }), _jsx(TableHead, { children: t("actions.col.lmNo") }), _jsx(TableHead, { children: t("actions.col.extractedMean") }), _jsx(TableHead, { children: t("actions.col.extractedCv") }), _jsxs(TableHead, { children: [t("app.quant.left"), "_LM"] }), _jsxs(TableHead, { children: [t("app.quant.right"), "_LM"] }), _jsx(TableHead, { children: "Media_LM" }), _jsx(TableHead, { children: "CV_LM" })] })) : (_jsxs(_Fragment, { children: [mode === "marcar" ? (_jsx(TableHead, { className: "w-10", children: _jsx("input", { type: "checkbox", className: "h-3.5 w-3.5 shrink-0 accent-slate-900 dark:accent-slate-100", checked: allMarcarSelected, onChange: function (e) { return toggleMarcarAll(e.target.checked); }, "aria-label": t("actions.col.select") }) })) : mode === "pte-chip" ? (_jsx(TableHead, { className: "w-10", children: _jsx("input", { type: "checkbox", className: "h-3.5 w-3.5 shrink-0 accent-slate-900 dark:accent-slate-100", checked: allPteChipSelected, onChange: function (e) { return togglePteChipAll(e.target.checked); }, "aria-label": t("actions.col.select") }) })) : null, _jsx(TableHead, { children: "NumBN" }), _jsx(TableHead, { children: "Petic" }), _jsx(TableHead, { children: "Posic" }), _jsx(TableHead, { children: "Proces" }), mode === "hacer" && (_jsxs(_Fragment, { children: [_jsx(TableHead, { children: t("actions.col.sampleType") }), _jsx(TableHead, { children: t("actions.col.diagnosis") })] })), _jsx(TableHead, { children: "Pellet" }), mode === "hacer" && (_jsxs(_Fragment, { children: [_jsx(TableHead, { children: "Medusa" }), hacerEditMode ? (_jsx(TableHead, { children: t("actions.col.lnExtracted") })) : null] })), (mode === "tirar" || mode === "marcar") && (_jsxs(_Fragment, { children: [_jsx(TableHead, { children: t("actions.col.readingNo") }), _jsx(TableHead, { children: t("actions.col.mean") }), _jsx(TableHead, { children: "Coment_Lectura" })] })), mode === "marcar" && _jsx(TableHead, { children: t("actions.col.type") }), mode === "pte-chip" && (_jsx(TableHead, { className: "min-w-[320px]", children: t("actions.col.pendingChip") }))] })) }) }), _jsx(TableBody, { children: (mode === "leer-extraido" && leerEditMode
                                            ? editedLeerMuestras
                                            : mode === "leer-marcado" && leerMarcadoEditMode
                                                ? editedLeerMarcadoRows
                                                : mode === "hacer" && hacerEditMode
                                                    ? editedMuestras
                                                    : muestras).map(function (muestra) {
                                            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2, _3, _4, _5, _6, _7, _8, _9;
                                            if (mode === "leer-marcado") {
                                                var row_1 = muestra;
                                                var marcadoPreview = leerMarcadoEditMode
                                                    ? calcStatsMarcado(row_1.Izq_LM, row_1.Dcha_LM)
                                                    : null;
                                                var mediaLmPreview = leerMarcadoEditMode
                                                    ? (marcadoPreview === null || marcadoPreview === void 0 ? void 0 : marcadoPreview.media) != null
                                                        ? formatCalcStat(marcadoPreview.media)
                                                        : "—"
                                                    : displayNumLectura(row_1.Media_LM);
                                                var cvLmPreview = leerMarcadoEditMode
                                                    ? (marcadoPreview === null || marcadoPreview === void 0 ? void 0 : marcadoPreview.cv) != null
                                                        ? formatCalcStat(marcadoPreview.cv)
                                                        : "—"
                                                    : displayNumLectura(row_1.CV_LM);
                                                var statsPreviewTitle = leerMarcadoEditMode
                                                    ? t("actions.preview.lm")
                                                    : undefined;
                                                return (_jsxs(TableRow, { children: [_jsx(TableCell, { children: (_a = row_1.NumBN) !== null && _a !== void 0 ? _a : "—" }), _jsx(TableCell, { children: (_b = row_1.NumLectura) !== null && _b !== void 0 ? _b : "—" }), _jsx(TableCell, { children: (_c = row_1.NumLectMarc) !== null && _c !== void 0 ? _c : "—" }), _jsx(TableCell, { children: displayNumLectura(row_1.Media_Lectura) }), _jsx(TableCell, { children: displayNumLectura(row_1.CV_Lectura) }), leerMarcadoEditMode ? (_jsxs(_Fragment, { children: [_jsx(TableCell, { children: _jsx(Input, { value: (_d = row_1.Izq_LM) !== null && _d !== void 0 ? _d : "", onChange: function (e) {
                                                                            return handleLeerMarcadoFieldChange(Number(row_1.NumBN), Number(row_1.NumLectura), Number(row_1.NumLectMarc), "Izq_LM", e.target.value);
                                                                        }, className: cn("h-8 text-xs min-w-[64px]", marcadoCuantificacionBgClass(row_1.Izq_LM)), inputMode: "decimal" }) }), _jsx(TableCell, { children: _jsx(Input, { value: (_e = row_1.Dcha_LM) !== null && _e !== void 0 ? _e : "", onChange: function (e) {
                                                                            return handleLeerMarcadoFieldChange(Number(row_1.NumBN), Number(row_1.NumLectura), Number(row_1.NumLectMarc), "Dcha_LM", e.target.value);
                                                                        }, className: cn("h-8 text-xs min-w-[64px]", marcadoCuantificacionBgClass(row_1.Dcha_LM)), inputMode: "decimal" }) }), _jsx(TableCell, { className: cn("text-muted-foreground", (marcadoPreview === null || marcadoPreview === void 0 ? void 0 : marcadoPreview.media) != null && "font-medium"), title: statsPreviewTitle, children: mediaLmPreview }), _jsx(TableCell, { className: cn("text-muted-foreground", (marcadoPreview === null || marcadoPreview === void 0 ? void 0 : marcadoPreview.cv) != null && "font-medium"), title: statsPreviewTitle, children: cvLmPreview })] })) : (_jsxs(_Fragment, { children: [_jsx(TableCell, { children: displayCell(row_1.Izq_LM) }), _jsx(TableCell, { children: displayCell(row_1.Dcha_LM) }), _jsx(TableCell, { children: displayNumLectura(row_1.Media_LM) }), _jsx(TableCell, { children: displayNumLectura(row_1.CV_LM) })] }))] }, tableRowKey(mode, row_1)));
                                            }
                                            if (mode === "leer-extraido") {
                                                var row_2 = muestra;
                                                var lecturaPreview = leerEditMode
                                                    ? calcStatsLectura(row_2.Izq, row_2.Cen, row_2.Dcha)
                                                    : null;
                                                var mediaPreview = leerEditMode
                                                    ? (lecturaPreview === null || lecturaPreview === void 0 ? void 0 : lecturaPreview.media) != null
                                                        ? formatCalcStat(lecturaPreview.media)
                                                        : "—"
                                                    : displayNumLectura(row_2.Media_Lectura);
                                                var cvPreview = leerEditMode
                                                    ? (lecturaPreview === null || lecturaPreview === void 0 ? void 0 : lecturaPreview.cv) != null
                                                        ? formatCalcStat(lecturaPreview.cv)
                                                        : "—"
                                                    : displayNumLectura(row_2.CV_Lectura);
                                                var statsPreviewTitle = leerEditMode
                                                    ? t("actions.preview.extracted")
                                                    : undefined;
                                                return (_jsxs(TableRow, { children: [_jsx(TableCell, { children: (_f = row_2.NumBN) !== null && _f !== void 0 ? _f : "—" }), leerEditMode ? (_jsxs(_Fragment, { children: [_jsx(TableCell, { children: _jsx(Input, { value: (_g = row_2.Medusa) !== null && _g !== void 0 ? _g : "", onChange: function (e) {
                                                                            return handleLeerFieldChange(Number(row_2.NumBN), Number(row_2.NumLectura), "Medusa", e.target.value);
                                                                        }, className: "h-8 text-xs min-w-[100px]" }) }), _jsx(TableCell, { children: _jsx(Input, { value: (_h = row_2.Visco_grado) !== null && _h !== void 0 ? _h : "", onChange: function (e) {
                                                                            return handleLeerFieldChange(Number(row_2.NumBN), Number(row_2.NumLectura), "Visco_grado", e.target.value);
                                                                        }, className: "h-8 text-xs min-w-[72px]", inputMode: "numeric" }) }), _jsx(TableCell, { children: (_j = row_2.NumLectura) !== null && _j !== void 0 ? _j : "—" }), _jsx(TableCell, { children: _jsx(Input, { value: (_k = row_2.Izq) !== null && _k !== void 0 ? _k : "", onChange: function (e) {
                                                                            return handleLeerFieldChange(Number(row_2.NumBN), Number(row_2.NumLectura), "Izq", e.target.value);
                                                                        }, className: cn("h-8 text-xs min-w-[64px]", lecturaCuantificacionBgClass(row_2.Izq)), inputMode: "decimal" }) }), _jsx(TableCell, { children: _jsx(Input, { value: (_l = row_2.Cen) !== null && _l !== void 0 ? _l : "", onChange: function (e) {
                                                                            return handleLeerFieldChange(Number(row_2.NumBN), Number(row_2.NumLectura), "Cen", e.target.value);
                                                                        }, className: cn("h-8 text-xs min-w-[64px]", lecturaCuantificacionBgClass(row_2.Cen)), inputMode: "decimal" }) }), _jsx(TableCell, { children: _jsx(Input, { value: (_m = row_2.Dcha) !== null && _m !== void 0 ? _m : "", onChange: function (e) {
                                                                            return handleLeerFieldChange(Number(row_2.NumBN), Number(row_2.NumLectura), "Dcha", e.target.value);
                                                                        }, className: cn("h-8 text-xs min-w-[64px]", lecturaCuantificacionBgClass(row_2.Dcha)), inputMode: "decimal" }) }), _jsx(TableCell, { className: cn(leerEditMode && "text-muted-foreground", (lecturaPreview === null || lecturaPreview === void 0 ? void 0 : lecturaPreview.media) != null && "font-medium"), title: statsPreviewTitle, children: mediaPreview }), _jsx(TableCell, { className: cn(leerEditMode && "text-muted-foreground", (lecturaPreview === null || lecturaPreview === void 0 ? void 0 : lecturaPreview.cv) != null && "font-medium"), title: statsPreviewTitle, children: cvPreview }), _jsx(TableCell, { children: _jsx(Input, { type: "date", value: formatDateForInput(row_2.Fecha_lectura), onChange: function (e) {
                                                                            return handleLeerFieldChange(Number(row_2.NumBN), Number(row_2.NumLectura), "Fecha_lectura", e.target.value || null);
                                                                        }, className: "h-8 text-xs min-w-[130px]" }) }), _jsx(TableCell, { children: _jsx(Input, { value: (_o = row_2.Coment_Lectura) !== null && _o !== void 0 ? _o : "", onChange: function (e) {
                                                                            return handleLeerFieldChange(Number(row_2.NumBN), Number(row_2.NumLectura), "Coment_Lectura", e.target.value);
                                                                        }, className: "h-8 text-xs min-w-[160px]" }) })] })) : (_jsxs(_Fragment, { children: [_jsx(TableCell, { children: displayCell(row_2.Medusa) }), _jsx(TableCell, { children: displayCell(row_2.Visco_grado) }), _jsx(TableCell, { children: (_p = row_2.NumLectura) !== null && _p !== void 0 ? _p : "—" }), _jsx(TableCell, { children: displayCell(row_2.Izq) }), _jsx(TableCell, { children: displayCell(row_2.Cen) }), _jsx(TableCell, { children: displayCell(row_2.Dcha) }), _jsx(TableCell, { children: displayNumLectura(row_2.Media_Lectura) }), _jsx(TableCell, { children: displayNumLectura(row_2.CV_Lectura) }), _jsx(TableCell, { children: formatDateEs(row_2.Fecha_lectura) }), _jsx(TableCell, { className: "max-w-[520px] whitespace-pre-wrap break-words", children: (_q = row_2.Coment_Lectura) !== null && _q !== void 0 ? _q : "—" })] }))] }, tableRowKey(mode, row_2)));
                                            }
                                            var pteChipHayRepetir = mode === "pte-chip" &&
                                                ((_r = muestra.pteChipItems) !== null && _r !== void 0 ? _r : []).some(function (it) { var _a, _b; return ((_b = (_a = it.repetirDetalle) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0) > 0; });
                                            var pteChipRowClass = pteChipHayRepetir ? "bionapp-row-warn" : "";
                                            var pteChipCellClass = pteChipHayRepetir ? "bionapp-row-warn" : "";
                                            return (_jsxs(TableRow, { className: cn(mode === "marcar" &&
                                                    muestra.marcarVariant === "ambar" &&
                                                    "bionapp-row-warn", pteChipRowClass), children: [mode === "marcar" ? (_jsx(TableCell, { className: pteChipCellClass, children: _jsx("input", { type: "checkbox", className: "h-3.5 w-3.5 shrink-0 accent-slate-900 dark:accent-slate-100", checked: marcarSelected.has(marcarRowKey(muestra.NumBN, muestra.NumLectura)), onChange: function (e) {
                                                                return toggleMarcarRow(marcarRowKey(muestra.NumBN, muestra.NumLectura), e.target.checked);
                                                            }, "aria-label": t("actions.col.select") }) })) : mode === "pte-chip" ? (_jsx(TableCell, { className: pteChipCellClass, children: _jsx("input", { type: "checkbox", className: "h-3.5 w-3.5 shrink-0 accent-slate-900 dark:accent-slate-100", checked: pteChipSelected.has(pteChipRowKey(muestra.NumBN)), onChange: function (e) {
                                                                return togglePteChipRow(pteChipRowKey(muestra.NumBN), e.target.checked);
                                                            }, "aria-label": t("actions.col.select") }) })) : null, _jsx(TableCell, { className: pteChipCellClass, children: (_s = muestra.NumBN) !== null && _s !== void 0 ? _s : "—" }), mode === "hacer" && hacerEditMode ? (_jsxs(_Fragment, { children: [_jsx(TableCell, { children: _jsx(Input, { value: (_t = muestra.Petic) !== null && _t !== void 0 ? _t : "", onChange: function (e) {
                                                                        return handleHacerFieldChange(Number(muestra.NumBN), "Petic", e.target.value);
                                                                    }, className: "h-8 text-xs min-w-[80px]" }) }), _jsx(TableCell, { children: _jsx(Input, { value: (_u = muestra.Posic) !== null && _u !== void 0 ? _u : "", onChange: function (e) {
                                                                        return handleHacerFieldChange(Number(muestra.NumBN), "Posic", e.target.value);
                                                                    }, className: "h-8 text-xs min-w-[80px]" }) }), _jsx(TableCell, { children: _jsx(Input, { value: (_v = muestra.Proces) !== null && _v !== void 0 ? _v : "", onChange: function (e) {
                                                                        return handleHacerFieldChange(Number(muestra.NumBN), "Proces", e.target.value);
                                                                    }, className: "h-8 text-xs min-w-[80px]" }) }), _jsx(TableCell, { children: _jsxs("select", { value: (_w = muestra.Muestra) !== null && _w !== void 0 ? _w : "", onChange: function (e) {
                                                                        return handleHacerFieldChange(Number(muestra.NumBN), "Muestra", e.target.value === "" ? null : parseInt(e.target.value, 10));
                                                                    }, className: HACER_SELECT_CLASS, children: [_jsx("option", { value: "", children: t("common.selectPlaceholder") }), tiposMuestra.map(function (tipo) { return (_jsx("option", { value: tipo.Cod, children: tipo.TipoMuestra }, tipo.Cod)); })] }) }), _jsx(TableCell, { children: _jsxs("select", { value: (_x = muestra.Dx) !== null && _x !== void 0 ? _x : "", onChange: function (e) {
                                                                        return handleHacerFieldChange(Number(muestra.NumBN), "Dx", e.target.value === "" ? null : parseInt(e.target.value, 10));
                                                                    }, className: HACER_SELECT_CLASS, children: [_jsx("option", { value: "", children: t("common.selectPlaceholder") }), dxs.map(function (d) { return (_jsx("option", { value: d.Cod, children: d.Dx }, d.Cod)); })] }) }), _jsx(TableCell, { children: _jsx(Input, { value: (_y = muestra.Pellet) !== null && _y !== void 0 ? _y : "", onChange: function (e) {
                                                                        return handleHacerFieldChange(Number(muestra.NumBN), "Pellet", e.target.value);
                                                                    }, className: "h-8 text-xs min-w-[80px]" }) }), _jsx(TableCell, { children: _jsx(Input, { value: (_z = muestra.Medusa) !== null && _z !== void 0 ? _z : "", onChange: function (e) {
                                                                        return handleHacerFieldChange(Number(muestra.NumBN), "Medusa", e.target.value);
                                                                    }, className: "h-8 text-xs min-w-[100px]" }) }), _jsx(TableCell, { children: _jsxs("select", { value: (_0 = findLotId(lotesExtraido, { id: muestra.Id_LtE, LN: muestra.LN })) !== null && _0 !== void 0 ? _0 : "", onChange: function (e) {
                                                                        return handleHacerFieldChange(Number(muestra.NumBN), "Id_LtE", e.target.value === "" ? null : Number(e.target.value));
                                                                    }, className: HACER_SELECT_CLASS, children: [_jsx("option", { value: "", children: t("common.selectPlaceholder") }), lotesExtraido.map(function (lot) { return (_jsx("option", { value: lot.id, children: lotOptionLabel(lot, lotesExtraido) }, lot.id)); })] }) })] })) : (_jsxs(_Fragment, { children: [_jsx(TableCell, { className: pteChipCellClass, children: mode === "hacer" ? displayCell(muestra.Petic) : (_1 = muestra.Petic) !== null && _1 !== void 0 ? _1 : "—" }), _jsx(TableCell, { className: pteChipCellClass, children: mode === "hacer" ? displayCell(muestra.Posic) : (_2 = muestra.Posic) !== null && _2 !== void 0 ? _2 : "—" }), _jsx(TableCell, { className: pteChipCellClass, children: mode === "hacer" ? displayCell(muestra.Proces) : (_3 = muestra.Proces) !== null && _3 !== void 0 ? _3 : "—" }), mode === "hacer" && (_jsxs(_Fragment, { children: [_jsx(TableCell, { className: pteChipCellClass, children: labelTipoMuestra(muestra, tiposMuestra) }), _jsx(TableCell, { className: pteChipCellClass, children: labelDx(muestra, dxs) })] })), _jsx(TableCell, { className: pteChipCellClass, children: mode === "hacer" ? displayCell(muestra.Pellet) : (_4 = muestra.Pellet) !== null && _4 !== void 0 ? _4 : "—" }), mode === "hacer" && (_jsx(TableCell, { className: pteChipCellClass, children: displayCell(muestra.Medusa) }))] })), (mode === "tirar" || mode === "marcar") && (_jsxs(_Fragment, { children: [_jsx(TableCell, { children: (_5 = muestra.NumLectura) !== null && _5 !== void 0 ? _5 : "—" }), _jsx(TableCell, { children: typeof muestra.Media_Lectura === "number"
                                                                    ? muestra.Media_Lectura.toFixed(2)
                                                                    : (_6 = muestra.Media_Lectura) !== null && _6 !== void 0 ? _6 : "—" }), _jsx(TableCell, { className: "max-w-[520px] whitespace-pre-wrap break-words", children: (_7 = muestra.Coment_Lectura) !== null && _7 !== void 0 ? _7 : "—" })] })), mode === "marcar" && (_jsx(TableCell, { className: "text-xs whitespace-nowrap", children: muestra.marcarVariant === "ambar" || muestra.marcarVariant === "normal" ? (muestra.marcarMotivo === "chip-fallo"
                                                            ? t("actions.marcarHelp.typeRelabel", {
                                                                lmCount: (_8 = muestra.lmCount) !== null && _8 !== void 0 ? _8 : 0,
                                                                minChips: MARCAR_MIN_CHIPS_FALLO,
                                                            })
                                                            : t("actions.marcarHelp.typeNone")) : (t("common.empty")) })), mode === "pte-chip" && (_jsx(TableCell, { className: cn("text-xs align-top whitespace-normal", pteChipCellClass), children: _jsx("ul", { className: "list-disc pl-4 space-y-1", children: ((_9 = muestra.pteChipItems) !== null && _9 !== void 0 ? _9 : []).map(function (it) {
                                                                var _a, _b;
                                                                var hayRepetir = ((_b = (_a = it.repetirDetalle) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0) > 0;
                                                                var textoRepetir = hayRepetir
                                                                    ? it.repetirDetalle
                                                                        .map(function (d) {
                                                                        return t("actions.pteChipChipDetail", {
                                                                            numChip: d.NumChip,
                                                                            fc: d.FC != null ? d.FC : t("common.empty"),
                                                                            name: d.Chip_Nombre || t("common.empty"),
                                                                        });
                                                                    })
                                                                        .join("; ")
                                                                    : "";
                                                                return (_jsx("li", { className: cn(hayRepetir && "font-medium bionapp-text-warn-emphasis"), children: _jsxs("span", { children: [t("actions.pteChipItem", {
                                                                                numLectura: it.NumLectura,
                                                                                numLectMarc: it.NumLectMarc,
                                                                                media: typeof it.Media_LM === "number"
                                                                                    ? it.Media_LM.toFixed(2)
                                                                                    : t("common.empty"),
                                                                                fecha: formatDateEs(it.Fecha_Lect_Marc),
                                                                            }), it.sinChipPte ? t("actions.pteChipAssignPending") : "", hayRepetir
                                                                                ? t("actions.pteChipRepeat", { detalle: textoRepetir })
                                                                                : ""] }) }, lmChipKey(muestra.NumBN, it.NumLectura, it.NumLectMarc)));
                                                            }) }) }))] }, tableRowKey(mode, muestra)));
                                        }) })] })] }))] })) : null] }));
}
export default ActionsPage;
