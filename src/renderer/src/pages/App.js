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
// @ts-nocheck
import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { chipTieneHuecoDisponible, collectChipAsignacionesFromMuestras, fcLibresParaChip, fcYaOcupado, } from "../lib/chipDisponibilidad";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Edit, Save, X, Plus, Minus, Cpu, ClipboardList, LogOut, CircleDot, Loader2, ArrowDownToLine, Calculator, CircleEllipsis, TriangleAlert, RefreshCw, MessageSquare, Pickaxe, Tag, ChevronDown, BadgeCheck, User, ShieldCheck } from "lucide-react";
import { Toaster, toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SETUP_PENDING_CATALOGS, SETUP_PENDING_SAMPLE, getSetupPhase, isSetupPendingSample, setSetupPhase, } from "../lib/setupInicial";
import { useTranslation } from "react-i18next";
import { useAuth } from "../authContext";
import { supabase } from "../lib/supabaseClient";
import { fetchMuestrasCompletasFromSupabase, formatMuestrasFetchError, } from "../lib/muestrasFetch";
import { calcStatsLectura, calcStatsMarcado, formatCalcStat, mediaExtraidoSemaforoClass, mediaMarcadoSemaforoClass, } from "../lib/calculations/lecturaCalculos";
import { withNetworkRetry } from "../lib/fetchWithRetry";
import { applyMuestraNavegacion, parseMuestraNavegacionFromSearchParams, readAndClearMuestraNavegacion, } from "../lib/navegacionMuestra";
import { fetchPreselectLinksByNumBN, buildPreselectHighlightPath } from "../lib/preselectData";
import { buildLotesHighlightPath, sortLots, toLoteRow, } from "../lib/lotesPageData";
import LoteLnField from "../components/LoteLnField";
import AppFooter from "../components/AppFooter";
/** Repetir_Chip = 1 en fila Chips: ese chip cargado para esa FC/LM ha fallado */
function repetirChipActivado(v) {
    return v != null && Number(v) === 1;
}
function patchChipRepetirEnMuestra(prev, lectIdx, lmIdx, chipIdx, nuevo) {
    if (!(prev === null || prev === void 0 ? void 0 : prev.lecturas))
        return prev;
    var lecturas = prev.lecturas.map(function (lec, li) {
        var _a;
        if (li !== lectIdx)
            return lec;
        if (!((_a = lec.marcado) === null || _a === void 0 ? void 0 : _a.lecturasMarcado))
            return lec;
        var lms = lec.marcado.lecturasMarcado.map(function (row, lj) {
            if (lj !== lmIdx)
                return row;
            var chips = (row.chips || []).map(function (c, ci) {
                return ci === chipIdx ? __assign(__assign({}, c), { Repetir_Chip: nuevo }) : c;
            });
            return __assign(__assign({}, row), { chips: chips });
        });
        return __assign(__assign({}, lec), { marcado: __assign(__assign({}, lec.marcado), { lecturasMarcado: lms }) });
    });
    return __assign(__assign({}, prev), { lecturas: lecturas });
}
function patchMuestrasRepetirChip(prev, muestraIdx, lectIdx, lmIdx, chipIdx, nuevo) {
    return prev.map(function (m, mi) {
        return mi === muestraIdx ? patchChipRepetirEnMuestra(m, lectIdx, lmIdx, chipIdx, nuevo) : m;
    });
}
function displayValue(value, emptyFallback) {
    if (emptyFallback === void 0) { emptyFallback = "—"; }
    // Queremos distinguir 0 de vacío/null.
    if (value === 0)
        return "0";
    if (value === "0")
        return "0";
    if (value === null || value === undefined || value === "")
        return emptyFallback;
    return String(value);
}
var LAST_MUESTRA_NUMBN_KEY = "bionapp:lastMuestraNumBN";
function readLastMuestraNumBN() {
    try {
        var value = window.sessionStorage.getItem(LAST_MUESTRA_NUMBN_KEY);
        var parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }
    catch (_a) {
        return null;
    }
}
function saveLastMuestraNumBN(numBN) {
    var parsed = Number(numBN);
    if (!Number.isFinite(parsed))
        return;
    try {
        window.sessionStorage.setItem(LAST_MUESTRA_NUMBN_KEY, String(parsed));
    }
    catch (_a) {
        // Si el navegador bloquea sessionStorage, la navegación sigue funcionando.
    }
}
function App() {
    var _this = this;
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
    var _m = useState([]), muestras = _m[0], setMuestras = _m[1];
    var _o = useState(0), currentMuestraIndex = _o[0], setCurrentMuestraIndex = _o[1];
    var _p = useState(0), currentLecturaIndex = _p[0], setCurrentLecturaIndex = _p[1];
    var _q = useState(0), currentLectMarcIndex = _q[0], setCurrentLectMarcIndex = _q[1];
    var _r = useState(true), loading = _r[0], setLoading = _r[1];
    var _s = useState(null), muestrasFetchError = _s[0], setMuestrasFetchError = _s[1];
    var _t = useState(false), creatingPrimeraMuestra = _t[0], setCreatingPrimeraMuestra = _t[1];
    var _u = useState(""), newChipNumber = _u[0], setNewChipNumber = _u[1];
    var _v = useState(false), editMode = _v[0], setEditMode = _v[1];
    var _w = useState({}), editedData = _w[0], setEditedData = _w[1];
    var _x = useState(""), buscarNumMuestra = _x[0], setBuscarNumMuestra = _x[1];
    var _y = useState(false), filtroPanelOpen = _y[0], setFiltroPanelOpen = _y[1];
    var _z = useState("peticion"), filtroModo = _z[0], setFiltroModo = _z[1];
    var _0 = useState(""), filtroPetic = _0[0], setFiltroPetic = _0[1];
    var _1 = useState([]), filtroTagsSeleccionados = _1[0], setFiltroTagsSeleccionados = _1[1];
    var _2 = useState({}), tagsByNumBN = _2[0], setTagsByNumBN = _2[1];
    var _3 = useState(null), filtroActivo = _3[0], setFiltroActivo = _3[1];
    var _4 = useState([]), tiposMuestra = _4[0], setTiposMuestra = _4[1];
    var _5 = useState([]), dxs = _5[0], setDxs = _5[1];
    var _6 = useState([]), dChips = _6[0], setDChips = _6[1];
    var _7 = useState([]), lotesExtraido = _7[0], setLotesExtraido = _7[1];
    var _8 = useState([]), lotesMarcado = _8[0], setLotesMarcado = _8[1];
    var _9 = useState([]), lotesMembrana = _9[0], setLotesMembrana = _9[1];
    var _10 = useState({}), preselectByNumBN = _10[0], setPreselectByNumBN = _10[1];
    var _11 = useState([]), tagsCatalog = _11[0], setTagsCatalog = _11[1];
    var _12 = useState([]), muestraTags = _12[0], setMuestraTags = _12[1];
    var _13 = useState(false), loadingTags = _13[0], setLoadingTags = _13[1];
    var MAX_TAGS_PER_MUESTRA = 8;
    var fetchMuestrasSeqRef = useRef(0);
    var filtroBtnRef = useRef(null);
    var _14 = useState({ top: 0, left: 0 }), filtroPanelPos = _14[0], setFiltroPanelPos = _14[1];
    // Estado visual de la muestra (1=rojo, 2=amarillo, 3=verde, null=gris)
    var _15 = useState(null), estadoMuestra = _15[0], setEstadoMuestra = _15[1];
    var user = useAuth().user;
    var t = useTranslation().t;
    var _16 = useState(null), userRole = _16[0], setUserRole = _16[1];
    var navigate = useNavigate();
    var _17 = useSearchParams(), searchParams = _17[0], setSearchParams = _17[1];
    var pendingDeepLinkRef = useRef(true);
    useEffect(function () {
        var fetchUserRole = function () { return __awaiter(_this, void 0, void 0, function () {
            var _a, profile, error;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!user)
                            return [2 /*return*/];
                        return [4 /*yield*/, supabase
                                .from("profiles")
                                .select("role")
                                .ilike("username", user.email)
                                .maybeSingle()];
                    case 1:
                        _a = _c.sent(), profile = _a.data, error = _a.error;
                        if (error) {
                            console.error("Error fetching profile:", error);
                            return [2 /*return*/];
                        }
                        setUserRole((_b = profile === null || profile === void 0 ? void 0 : profile.role) !== null && _b !== void 0 ? _b : "Sin asignar");
                        return [2 /*return*/];
                }
            });
        }); };
        fetchUserRole();
    }, [user]);
    useEffect(function () {
        var _a, _b;
        if (muestras.length > 0) {
            var estado = (_b = (_a = muestras[currentMuestraIndex]) === null || _a === void 0 ? void 0 : _a.Estado_Muestra) !== null && _b !== void 0 ? _b : null;
            setEstadoMuestra(estado);
        }
    }, [currentMuestraIndex, muestras]);
    useEffect(function () {
        var _a;
        var numBN = (_a = muestras[currentMuestraIndex]) === null || _a === void 0 ? void 0 : _a.NumBN;
        if (numBN != null) {
            saveLastMuestraNumBN(numBN);
        }
    }, [currentMuestraIndex, muestras]);
    var navegacionIndices = useMemo(function () {
        var _a;
        if (!((_a = filtroActivo === null || filtroActivo === void 0 ? void 0 : filtroActivo.indices) === null || _a === void 0 ? void 0 : _a.length)) {
            return muestras.map(function (_, i) { return i; });
        }
        return filtroActivo.indices.filter(function (i) { return i >= 0 && i < muestras.length; });
    }, [filtroActivo, muestras.length]);
    var posicionNavegacion = useMemo(function () {
        var pos = navegacionIndices.indexOf(currentMuestraIndex);
        return pos >= 0 ? pos : 0;
    }, [navegacionIndices, currentMuestraIndex]);
    var muestrasParaChipOcupacion = useMemo(function () {
        if (!editMode || !(editedData === null || editedData === void 0 ? void 0 : editedData.NumBN))
            return muestras;
        return muestras.map(function (m, i) { return (i === currentMuestraIndex ? editedData : m); });
    }, [muestras, editedData, editMode, currentMuestraIndex]);
    var asignacionesChip = useMemo(function () { return collectChipAsignacionesFromMuestras(muestrasParaChipOcupacion); }, [muestrasParaChipOcupacion]);
    useEffect(function () {
        if (!filtroActivo || !muestras.length || !navegacionIndices.length)
            return;
        if (!navegacionIndices.includes(currentMuestraIndex)) {
            setCurrentMuestraIndex(navegacionIndices[0]);
            setCurrentLecturaIndex(0);
            setCurrentLectMarcIndex(0);
        }
    }, [filtroActivo, navegacionIndices, currentMuestraIndex, muestras.length]);
    var syncFiltroPanelPosition = function () {
        var el = filtroBtnRef.current;
        if (!el)
            return;
        var rect = el.getBoundingClientRect();
        setFiltroPanelPos({
            top: Math.round(rect.bottom + 4),
            left: Math.round(rect.left),
        });
    };
    useEffect(function () {
        if (!filtroPanelOpen)
            return;
        syncFiltroPanelPosition();
        var onLayout = function () { return syncFiltroPanelPosition(); };
        window.addEventListener("resize", onLayout);
        window.addEventListener("scroll", onLayout, true);
        return function () {
            window.removeEventListener("resize", onLayout);
            window.removeEventListener("scroll", onLayout, true);
        };
    }, [filtroPanelOpen]);
    useEffect(function () {
        if (!filtroPanelOpen)
            return;
        var onPointerDown = function (e) {
            var _a;
            var target = e.target;
            if ((_a = filtroBtnRef.current) === null || _a === void 0 ? void 0 : _a.contains(target))
                return;
            var panel = document.getElementById("bionapp-filtro-panel");
            if (panel === null || panel === void 0 ? void 0 : panel.contains(target))
                return;
            setFiltroPanelOpen(false);
        };
        var onKeyDown = function (e) {
            if (e.key === "Escape")
                setFiltroPanelOpen(false);
        };
        document.addEventListener("pointerdown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);
        return function () {
            document.removeEventListener("pointerdown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [filtroPanelOpen]);
    var toggleFiltroPanel = function () {
        if (!filtroPanelOpen)
            syncFiltroPanelPosition();
        setFiltroPanelOpen(function (open) { return !open; });
    };
    var formatDateForInput = function (dateString) {
        if (!dateString)
            return "";
        var date = new Date(dateString);
        return "".concat(date.getFullYear(), "-").concat(String(date.getMonth() + 1).padStart(2, "0"), "-").concat(String(date.getDate()).padStart(2, "0"));
    };
    var formatDateDisplay = function (dateString) {
        if (!dateString)
            return "—";
        return new Date(dateString).toLocaleDateString("es-ES");
    };
    var loadCatalogs = function () { return __awaiter(_this, void 0, void 0, function () {
        var _a, _b, chipsData, chipsError, _c, tiposData, tiposError, _d, dxData, dxError, _e, lotesEData, lotesEError, _f, lotesMData, lotesMError, _g, lotesMmData, lotesMmError, err_1;
        return __generator(this, function (_h) {
            switch (_h.label) {
                case 0:
                    _h.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, Promise.all([
                            supabase
                                .from("DChips")
                                .select("NumChip_D, Nombre_Chip")
                                .order("NumChip_D", { ascending: true }),
                            supabase
                                .from("DMuestra")
                                .select("Cod, TipoMuestra")
                                .order("TipoMuestra", { ascending: true }),
                            supabase.from("DDx").select("Cod, Dx").order("Dx", { ascending: true }),
                            supabase.from("Lotes_Extraido").select("*"),
                            supabase.from("Lotes_Marcado").select("*"),
                            supabase.from("Lotes_Membrana").select("*"),
                        ])];
                case 1:
                    _a = _h.sent(), _b = _a[0], chipsData = _b.data, chipsError = _b.error, _c = _a[1], tiposData = _c.data, tiposError = _c.error, _d = _a[2], dxData = _d.data, dxError = _d.error, _e = _a[3], lotesEData = _e.data, lotesEError = _e.error, _f = _a[4], lotesMData = _f.data, lotesMError = _f.error, _g = _a[5], lotesMmData = _g.data, lotesMmError = _g.error;
                    if (chipsError)
                        throw chipsError;
                    if (tiposError)
                        throw tiposError;
                    if (dxError)
                        throw dxError;
                    if (lotesEError)
                        throw lotesEError;
                    if (lotesMError)
                        throw lotesMError;
                    if (lotesMmError)
                        throw lotesMmError;
                    setDChips(chipsData !== null && chipsData !== void 0 ? chipsData : []);
                    setTiposMuestra(tiposData !== null && tiposData !== void 0 ? tiposData : []);
                    setDxs(dxData !== null && dxData !== void 0 ? dxData : []);
                    setLotesExtraido(sortLots((lotesEData || [])
                        .map(function (row) { return toLoteRow(row, "extraido"); })
                        .filter(function (r) { return r != null; })));
                    setLotesMarcado(sortLots((lotesMData || [])
                        .map(function (row) { return toLoteRow(row, "marcado"); })
                        .filter(function (r) { return r != null; })));
                    setLotesMembrana(sortLots((lotesMmData || [])
                        .map(function (row) { return toLoteRow(row, "membrana"); })
                        .filter(function (r) { return r != null; })));
                    return [3 /*break*/, 3];
                case 2:
                    err_1 = _h.sent();
                    console.error("Error al cargar catálogos:", err_1);
                    toast.error(t("app.toast.catalogsLoadError"));
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    useEffect(function () {
        void Promise.all([loadCatalogs(), fetchMuestrasCompleto({ restoreLastMuestra: true })]);
    }, []);
    useEffect(function () {
        if (loading || !muestras.length)
            return;
        if (getSetupPhase() !== SETUP_PENDING_SAMPLE)
            return;
        var idx = muestras.findIndex(function (m) { return Number(m.NumBN) === 1; });
        if (idx === -1)
            return;
        setCurrentMuestraIndex(idx);
        var muestra = muestras[idx];
        if (!muestra.Muestra || !muestra.Dx) {
            setEditedData(JSON.parse(JSON.stringify(muestra)));
            setEditMode(true);
        }
        else {
            setSetupPhase(null);
        }
    }, [loading, muestras]);
    useEffect(function () {
        var cancelled = false;
        function loadTagsCatalog() {
            return __awaiter(this, void 0, void 0, function () {
                var _a, data, error, e_1;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _b.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, supabase
                                    .from("Tags")
                                    .select("Tag_Number, Tag_Name, Tag_Color")
                                    .order("Tag_Number", { ascending: true })];
                        case 1:
                            _a = _b.sent(), data = _a.data, error = _a.error;
                            if (error)
                                throw error;
                            if (!cancelled)
                                setTagsCatalog((data || []));
                            return [3 /*break*/, 3];
                        case 2:
                            e_1 = _b.sent();
                            console.warn("No se pudieron cargar Tags:", e_1);
                            if (!cancelled)
                                setTagsCatalog([]);
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        }
        loadTagsCatalog();
        return function () {
            cancelled = true;
        };
    }, []);
    useEffect(function () {
        var cancelled = false;
        function loadTagsByNumBN() {
            return __awaiter(this, void 0, void 0, function () {
                var _a, data, error, map, _i, _b, row, bn, tn, e_2;
                return __generator(this, function (_c) {
                    switch (_c.label) {
                        case 0:
                            _c.trys.push([0, 2, , 3]);
                            return [4 /*yield*/, supabase
                                    .from("Muestra_Tags")
                                    .select("NumBN_Tag, Tag_Number")];
                        case 1:
                            _a = _c.sent(), data = _a.data, error = _a.error;
                            if (error)
                                throw error;
                            map = {};
                            for (_i = 0, _b = data || []; _i < _b.length; _i++) {
                                row = _b[_i];
                                bn = Number(row.NumBN_Tag);
                                tn = Number(row.Tag_Number);
                                if (!Number.isFinite(bn) || !Number.isFinite(tn))
                                    continue;
                                if (!map[bn])
                                    map[bn] = [];
                                map[bn].push(tn);
                            }
                            if (!cancelled)
                                setTagsByNumBN(map);
                            return [3 /*break*/, 3];
                        case 2:
                            e_2 = _c.sent();
                            console.warn("No se pudieron cargar asignaciones de etiquetas:", e_2);
                            if (!cancelled)
                                setTagsByNumBN({});
                            return [3 /*break*/, 3];
                        case 3: return [2 /*return*/];
                    }
                });
            });
        }
        loadTagsByNumBN();
        return function () {
            cancelled = true;
        };
    }, []);
    var currentMuestraNumBN = ((_a = muestras[currentMuestraIndex]) === null || _a === void 0 ? void 0 : _a.NumBN) != null
        ? Number(muestras[currentMuestraIndex].NumBN)
        : null;
    useEffect(function () {
        var cancelled = false;
        function loadMuestraTags(numBN) {
            return __awaiter(this, void 0, void 0, function () {
                var _a, data, error, rows, e_3;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (!numBN) {
                                setMuestraTags([]);
                                return [2 /*return*/];
                            }
                            setLoadingTags(true);
                            _b.label = 1;
                        case 1:
                            _b.trys.push([1, 3, 4, 5]);
                            return [4 /*yield*/, supabase
                                    .from("Muestra_Tags")
                                    .select("Tag_Number, Tags ( Tag_Name, Tag_Color )")
                                    .eq("NumBN_Tag", numBN)
                                    .order("Tag_Number", { ascending: true })];
                        case 2:
                            _a = _b.sent(), data = _a.data, error = _a.error;
                            if (error)
                                throw error;
                            rows = (data || []).map(function (r) {
                                var _a, _b, _c, _d;
                                return ({
                                    Tag_Number: Number(r.Tag_Number),
                                    Tag_Name: (_b = (_a = r.Tags) === null || _a === void 0 ? void 0 : _a.Tag_Name) !== null && _b !== void 0 ? _b : "",
                                    Tag_Color: (_d = (_c = r.Tags) === null || _c === void 0 ? void 0 : _c.Tag_Color) !== null && _d !== void 0 ? _d : "#64748b",
                                });
                            });
                            if (!cancelled)
                                setMuestraTags(rows);
                            return [3 /*break*/, 5];
                        case 3:
                            e_3 = _b.sent();
                            console.warn("No se pudieron cargar tags de muestra:", e_3);
                            if (!cancelled)
                                setMuestraTags([]);
                            return [3 /*break*/, 5];
                        case 4:
                            if (!cancelled)
                                setLoadingTags(false);
                            return [7 /*endfinally*/];
                        case 5: return [2 /*return*/];
                    }
                });
            });
        }
        loadMuestraTags(currentMuestraNumBN);
        return function () {
            cancelled = true;
        };
    }, [currentMuestraNumBN]);
    // ----------------- Fetch Muestras -----------------
    var fetchMuestrasCompleto = function (options) { return __awaiter(_this, void 0, void 0, function () {
        var fetchId, restoreLastMuestra, prevNumBN, prevLectura, prevLectMarc, muestrasCompletas, links, preselectErr_1, appliedDeepLink, urlTarget, storageTarget, deepTarget, indices, lastNumBN_1, lastIndex, stayIndex, lecturas, lms, err_2;
        var _a, _b, _c, _d, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    fetchId = ++fetchMuestrasSeqRef.current;
                    restoreLastMuestra = (_a = options === null || options === void 0 ? void 0 : options.restoreLastMuestra) !== null && _a !== void 0 ? _a : false;
                    prevNumBN = (_b = muestras[currentMuestraIndex]) === null || _b === void 0 ? void 0 : _b.NumBN;
                    prevLectura = currentLecturaIndex;
                    prevLectMarc = currentLectMarcIndex;
                    setLoading(true);
                    setMuestrasFetchError(null);
                    _f.label = 1;
                case 1:
                    _f.trys.push([1, 7, 8, 9]);
                    return [4 /*yield*/, withNetworkRetry(function () { return fetchMuestrasCompletasFromSupabase(); })];
                case 2:
                    muestrasCompletas = _f.sent();
                    if (fetchId !== fetchMuestrasSeqRef.current)
                        return [2 /*return*/, []];
                    setMuestras(muestrasCompletas);
                    setMuestrasFetchError(null);
                    _f.label = 3;
                case 3:
                    _f.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, fetchPreselectLinksByNumBN(supabase)];
                case 4:
                    links = _f.sent();
                    if (fetchId === fetchMuestrasSeqRef.current) {
                        setPreselectByNumBN(links);
                    }
                    return [3 /*break*/, 6];
                case 5:
                    preselectErr_1 = _f.sent();
                    console.error("Error al cargar enlaces de preselección:", preselectErr_1);
                    return [3 /*break*/, 6];
                case 6:
                    appliedDeepLink = false;
                    if (pendingDeepLinkRef.current) {
                        urlTarget = parseMuestraNavegacionFromSearchParams(searchParams);
                        storageTarget = readAndClearMuestraNavegacion();
                        deepTarget = urlTarget !== null && urlTarget !== void 0 ? urlTarget : storageTarget;
                        if (deepTarget) {
                            indices = applyMuestraNavegacion(muestrasCompletas, deepTarget);
                            if (indices) {
                                setCurrentMuestraIndex(indices.muestraIndex);
                                setCurrentLecturaIndex(indices.lecturaIndex);
                                setCurrentLectMarcIndex(indices.lectMarcIndex);
                                saveLastMuestraNumBN(deepTarget.numBN);
                                appliedDeepLink = true;
                                if (urlTarget)
                                    setSearchParams({}, { replace: true });
                            }
                            else {
                                toast.error(t("app.toast.sampleNotFoundNum", { numBN: deepTarget.numBN }));
                            }
                        }
                        pendingDeepLinkRef.current = false;
                    }
                    if (!appliedDeepLink && restoreLastMuestra) {
                        lastNumBN_1 = readLastMuestraNumBN();
                        lastIndex = muestrasCompletas.findIndex(function (m) { return Number(m.NumBN) === lastNumBN_1; });
                        if (lastIndex !== -1) {
                            setCurrentMuestraIndex(lastIndex);
                            setCurrentLecturaIndex(0);
                            setCurrentLectMarcIndex(0);
                        }
                    }
                    else if (!appliedDeepLink && prevNumBN != null) {
                        stayIndex = muestrasCompletas.findIndex(function (m) { return Number(m.NumBN) === Number(prevNumBN); });
                        if (stayIndex !== -1) {
                            setCurrentMuestraIndex(stayIndex);
                            lecturas = ((_c = muestrasCompletas[stayIndex]) === null || _c === void 0 ? void 0 : _c.lecturas) || [];
                            setCurrentLecturaIndex(Math.min(prevLectura, Math.max(lecturas.length - 1, 0)));
                            lms = ((_e = (_d = lecturas[Math.min(prevLectura, Math.max(lecturas.length - 1, 0))]) === null || _d === void 0 ? void 0 : _d.marcado) === null || _e === void 0 ? void 0 : _e.lecturasMarcado) || [];
                            setCurrentLectMarcIndex(Math.min(prevLectMarc, Math.max(lms.length - 1, 0)));
                        }
                    }
                    return [2 /*return*/, muestrasCompletas];
                case 7:
                    err_2 = _f.sent();
                    if (fetchId !== fetchMuestrasSeqRef.current)
                        return [2 /*return*/, []];
                    console.error(err_2);
                    setMuestrasFetchError(formatMuestrasFetchError(err_2));
                    toast.error(t("app.toast.samplesLoadError"));
                    return [2 /*return*/, []];
                case 8:
                    if (fetchId === fetchMuestrasSeqRef.current) {
                        setLoading(false);
                    }
                    return [7 /*endfinally*/];
                case 9: return [2 /*return*/];
            }
        });
    }); };
    // ----------------- Cerrar sesión -----------------
    var handleLogout = function () { return __awaiter(_this, void 0, void 0, function () {
        var error, err_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, supabase.auth.signOut()];
                case 1:
                    error = (_a.sent()).error;
                    if (error)
                        throw error;
                    toast.success(t("app.toast.logoutOk"));
                    return [3 /*break*/, 3];
                case 2:
                    err_3 = _a.sent();
                    console.error("Error cerrando sesión:", err_3);
                    toast.error(t("app.toast.logoutError"));
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    // ----------------- Navegación -----------------
    var irAMuestraEnNavegacion = function (pos) {
        var idx = navegacionIndices[pos];
        if (idx == null)
            return;
        setCurrentMuestraIndex(idx);
        setCurrentLecturaIndex(0);
        setCurrentLectMarcIndex(0);
    };
    var handlePrevMuestra = function () {
        var pos = navegacionIndices.indexOf(currentMuestraIndex);
        if (pos <= 0)
            return;
        irAMuestraEnNavegacion(pos - 1);
    };
    var handleNextMuestra = function () {
        var pos = navegacionIndices.indexOf(currentMuestraIndex);
        if (pos < 0 || pos >= navegacionIndices.length - 1)
            return;
        irAMuestraEnNavegacion(pos + 1);
    };
    var handleFirstMuestra = function () {
        if (!navegacionIndices.length)
            return;
        irAMuestraEnNavegacion(0);
    };
    var handleLastMuestra = function () {
        if (!navegacionIndices.length)
            return;
        irAMuestraEnNavegacion(navegacionIndices.length - 1);
    };
    var handlePrevLectura = function () { setCurrentLecturaIndex(Math.max(currentLecturaIndex - 1, 0)); setCurrentLectMarcIndex(0); };
    var handleNextLectura = function () { var _a; setCurrentLecturaIndex(Math.min(currentLecturaIndex + 1, (((_a = muestras[currentMuestraIndex].lecturas) === null || _a === void 0 ? void 0 : _a.length) || 1) - 1)); setCurrentLectMarcIndex(0); };
    var handlePrevLectMarc = function () { setCurrentLectMarcIndex(Math.max(currentLectMarcIndex - 1, 0)); };
    var handleNextLectMarc = function () { var _a, _b, _c, _d; setCurrentLectMarcIndex(Math.min(currentLectMarcIndex + 1, (((_d = (_c = (_b = (_a = muestras[currentMuestraIndex].lecturas) === null || _a === void 0 ? void 0 : _a[currentLecturaIndex]) === null || _b === void 0 ? void 0 : _b.marcado) === null || _c === void 0 ? void 0 : _c.lecturasMarcado) === null || _d === void 0 ? void 0 : _d.length) || 1) - 1)); };
    var navigateFromBase = function (path) {
        var _a;
        saveLastMuestraNumBN((_a = muestras[currentMuestraIndex]) === null || _a === void 0 ? void 0 : _a.NumBN);
        navigate(path);
    };
    var applyExtractionLot = function (lot) {
        setEditedData(function (prev) {
            var _a, _b, _c, _d;
            return (__assign(__assign({}, prev), { Id_LtE: (_a = lot === null || lot === void 0 ? void 0 : lot.id) !== null && _a !== void 0 ? _a : null, PN: (_b = lot === null || lot === void 0 ? void 0 : lot.PN) !== null && _b !== void 0 ? _b : null, LN: (_c = lot === null || lot === void 0 ? void 0 : lot.LN) !== null && _c !== void 0 ? _c : null, Exp: (_d = lot === null || lot === void 0 ? void 0 : lot.Exp) !== null && _d !== void 0 ? _d : null }));
        });
    };
    var applyLmLotFields = function (lectIdx, lmIdx, patch) {
        setEditedData(function (prev) {
            var _a, _b;
            var lecturas = (prev === null || prev === void 0 ? void 0 : prev.lecturas) ? __spreadArray([], prev.lecturas, true) : [];
            var lect = lecturas[lectIdx];
            if (!((_b = (_a = lect === null || lect === void 0 ? void 0 : lect.marcado) === null || _a === void 0 ? void 0 : _a.lecturasMarcado) === null || _b === void 0 ? void 0 : _b[lmIdx]))
                return prev;
            var lms = __spreadArray([], lect.marcado.lecturasMarcado, true);
            lms[lmIdx] = __assign(__assign({}, lms[lmIdx]), patch);
            lecturas[lectIdx] = __assign(__assign({}, lect), { marcado: __assign(__assign({}, lect.marcado), { lecturasMarcado: lms }) });
            return __assign(__assign({}, prev), { lecturas: lecturas });
        });
    };
    var goToLot = function (tipo, id, ln) {
        var numId = Number(id);
        var lnText = String(ln !== null && ln !== void 0 ? ln : "").trim();
        navigateFromBase(buildLotesHighlightPath({
            tipo: tipo,
            id: Number.isFinite(numId) ? numId : undefined,
            ln: Number.isFinite(numId) ? undefined : lnText || undefined,
        }));
    };
    // ----------------- Edit Mode -----------------
    var toggleEditMode = function () {
        if (!editMode)
            setEditedData(JSON.parse(JSON.stringify(muestras[currentMuestraIndex])));
        setEditMode(!editMode);
    };
    var handleChange = function (path, value) {
        setEditedData(function (prev) {
            var newData = JSON.parse(JSON.stringify(prev));
            var keys = path.split(".");
            var current = newData;
            for (var i = 0; i < keys.length - 1; i++)
                current = current[keys[i]];
            current[keys[keys.length - 1]] = value;
            return newData;
        });
    };
    // ----------------- Guardar cambios -----------------
    var handleSave = function () { return __awaiter(_this, void 0, void 0, function () {
        var NumBN, muestraUpdate, _i, _a, lectura, _b, _c, lm, _d, _e, chip, fc, _f, _g, lectura, strOrNull, _h, _j, lm, _k, _l, chip, err_4;
        var _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x;
        return __generator(this, function (_y) {
            switch (_y.label) {
                case 0:
                    if (isSetupPendingSample() && (!editedData.Muestra || !editedData.Dx)) {
                        toast.error(t("app.toast.selectTypeDxSave"));
                        return [2 /*return*/];
                    }
                    _y.label = 1;
                case 1:
                    _y.trys.push([1, 14, , 15]);
                    NumBN = editedData.NumBN, muestraUpdate = __rest(editedData, ["NumBN"]);
                    for (_i = 0, _a = editedData.lecturas || []; _i < _a.length; _i++) {
                        lectura = _a[_i];
                        for (_b = 0, _c = ((_m = lectura.marcado) === null || _m === void 0 ? void 0 : _m.lecturasMarcado) || []; _b < _c.length; _b++) {
                            lm = _c[_b];
                            for (_d = 0, _e = lm.chips || []; _d < _e.length; _d++) {
                                chip = _e[_d];
                                fc = chip.FC != null && chip.FC !== "" ? Number(chip.FC) : null;
                                if (fc == null)
                                    continue;
                                if (fcYaOcupado(Number(chip.NumChip), fc, asignacionesChip, {
                                    NumBN_C: (_o = chip.NumBN_C) !== null && _o !== void 0 ? _o : lm.NumBN_LM,
                                    NumLectura_C: (_p = chip.NumLectura_C) !== null && _p !== void 0 ? _p : lm.NumLectura_LM,
                                    NumLectMarc_C: (_q = chip.NumLectMarc_C) !== null && _q !== void 0 ? _q : lm.NumLectMarc,
                                    NumChip: chip.NumChip,
                                    FC: chip.FC,
                                })) {
                                    toast.error(t("app.toast.fcTaken", { fc: fc, numChip: chip.NumChip }));
                                    return [2 /*return*/];
                                }
                            }
                        }
                    }
                    // Actualizar muestra principal
                    return [4 /*yield*/, supabase.from("Muestras").update({
                            Petic: muestraUpdate.Petic == null || String(muestraUpdate.Petic).trim() === ""
                                ? null
                                : String(muestraUpdate.Petic).trim(),
                            Muestra: muestraUpdate.Muestra,
                            Posic: muestraUpdate.Posic,
                            Dx: muestraUpdate.Dx,
                            Proces: muestraUpdate.Proces,
                            Coment_Muestra: muestraUpdate.Coment_Muestra,
                            Fecha: muestraUpdate.Fecha,
                            Id_LtE: (_r = muestraUpdate.Id_LtE) !== null && _r !== void 0 ? _r : null,
                            Coment_Extracc: muestraUpdate.Coment_Extracc,
                            Visco_grado: muestraUpdate.Visco_grado,
                            Pellet: muestraUpdate.Pellet,
                            Medusa: muestraUpdate.Medusa,
                            Estado_Muestra: (_s = muestraUpdate.Estado_Muestra) !== null && _s !== void 0 ? _s : null,
                        }).eq("NumBN", NumBN)];
                case 2:
                    // Actualizar muestra principal
                    _y.sent();
                    _f = 0, _g = editedData.lecturas || [];
                    _y.label = 3;
                case 3:
                    if (!(_f < _g.length)) return [3 /*break*/, 12];
                    lectura = _g[_f];
                    return [4 /*yield*/, supabase.from("Lectura").update({
                            Fecha_lectura: lectura.Fecha_lectura,
                            Izq: lectura.Izq ? parseFloat(lectura.Izq) : null,
                            Cen: lectura.Cen ? parseFloat(lectura.Cen) : null,
                            Dcha: lectura.Dcha ? parseFloat(lectura.Dcha) : null,
                            Coment_Lectura: lectura.Coment_Lectura,
                        }).eq("NumBN_L", lectura.NumBN_L).eq("NumLectura", lectura.NumLectura)];
                case 4:
                    _y.sent();
                    if (!lectura.marcado) return [3 /*break*/, 11];
                    strOrNull = function (v) {
                        return v === "" || v === undefined || v === null ? null : String(v);
                    };
                    _h = 0, _j = lectura.marcado.lecturasMarcado || [];
                    _y.label = 5;
                case 5:
                    if (!(_h < _j.length)) return [3 /*break*/, 11];
                    lm = _j[_h];
                    return [4 /*yield*/, supabase.from("Lecturas_Marcado").update({
                            Fecha_Lect_Marc: strOrNull(lm.Fecha_Lect_Marc),
                            Izq_LM: lm.Izq_LM ? parseFloat(lm.Izq_LM) : null,
                            Dcha_LM: lm.Dcha_LM ? parseFloat(lm.Dcha_LM) : null,
                            Id_LtM: (_t = lm.Id_LtM) !== null && _t !== void 0 ? _t : null,
                            Id_LtMm: (_u = lm.Id_LtMm) !== null && _u !== void 0 ? _u : null,
                            Comentario_LMarcado: lm.Comentario_LMarcado === "" ||
                                lm.Comentario_LMarcado === undefined ||
                                lm.Comentario_LMarcado === null
                                ? null
                                : String(lm.Comentario_LMarcado),
                        }).eq("NumBN_LM", lm.NumBN_LM)
                            .eq("NumLectura_LM", lm.NumLectura_LM)
                            .eq("NumLectMarc", lm.NumLectMarc)];
                case 6:
                    _y.sent();
                    _k = 0, _l = lm.chips || [];
                    _y.label = 7;
                case 7:
                    if (!(_k < _l.length)) return [3 /*break*/, 10];
                    chip = _l[_k];
                    return [4 /*yield*/, supabase.from("Chips").upsert({
                            NumBN_C: (_v = chip.NumBN_C) !== null && _v !== void 0 ? _v : lm.NumBN_LM,
                            NumLectura_C: (_w = chip.NumLectura_C) !== null && _w !== void 0 ? _w : lm.NumLectura_LM,
                            NumLectMarc_C: (_x = chip.NumLectMarc_C) !== null && _x !== void 0 ? _x : lm.NumLectMarc,
                            NumChip: parseInt(chip.NumChip, 10),
                            Chip_Nombre: chip.Chip_Nombre,
                            FC: chip.FC ? parseInt(chip.FC, 10) : null,
                            Coment_Chip: chip.Coment_Chip === "" ||
                                chip.Coment_Chip === undefined ||
                                chip.Coment_Chip === null
                                ? null
                                : String(chip.Coment_Chip),
                            Repetir_Chip: repetirChipActivado(chip.Repetir_Chip) ? 1 : null,
                        })];
                case 8:
                    _y.sent();
                    _y.label = 9;
                case 9:
                    _k++;
                    return [3 /*break*/, 7];
                case 10:
                    _h++;
                    return [3 /*break*/, 5];
                case 11:
                    _f++;
                    return [3 /*break*/, 3];
                case 12:
                    toast.success(t("app.toast.saveOk"));
                    if (isSetupPendingSample()) {
                        setSetupPhase(null);
                    }
                    setEditMode(false);
                    return [4 /*yield*/, Promise.all([fetchMuestrasCompleto(), loadCatalogs()])];
                case 13:
                    _y.sent();
                    return [3 /*break*/, 15];
                case 14:
                    err_4 = _y.sent();
                    console.error(err_4);
                    toast.error(t("app.toast.saveError"));
                    return [3 /*break*/, 15];
                case 15: return [2 /*return*/];
            }
        });
    }); };
    var handleDiscard = function () {
        var _a, _b;
        if (isSetupPendingSample() && (!editedData.Muestra || !editedData.Dx)) {
            toast.error(t("app.toast.selectTypeDxContinue"));
            return;
        }
        setEstadoMuestra((_b = (_a = muestras[currentMuestraIndex]) === null || _a === void 0 ? void 0 : _a.Estado_Muestra) !== null && _b !== void 0 ? _b : null);
        setEditMode(false);
        setEditedData({});
    };
    // ------------ Buscar -------------------
    var handleBuscar = function () {
        var numBuscar = parseInt(buscarNumMuestra, 10);
        if (isNaN(numBuscar))
            return toast.error(t("app.toast.invalidNumber"));
        var indice = muestras.findIndex(function (m) { return m.NumBN === numBuscar; });
        if (indice !== -1) {
            if (filtroActivo && !filtroActivo.indices.includes(indice)) {
                toast.error(t("app.toast.notInFilter"));
                return;
            }
            setCurrentMuestraIndex(indice);
            setCurrentLecturaIndex(0);
            setCurrentLectMarcIndex(0);
            setBuscarNumMuestra("");
        }
        else {
            toast.error(t("app.toast.sampleNotFound"));
        }
    };
    function peticMatchesQuery(petic, query) {
        if (petic == null || query.trim() === "")
            return false;
        var q = query.trim();
        var pStr = String(petic).trim();
        if (pStr === q)
            return true;
        var qNum = Number(q);
        var pNum = Number(petic);
        return Number.isFinite(qNum) && Number.isFinite(pNum) && qNum === pNum;
    }
    var aplicarFiltro = function (indices, tipo, etiqueta) {
        if (!indices.length)
            return;
        setFiltroActivo({ tipo: tipo, etiqueta: etiqueta, indices: indices });
        setCurrentMuestraIndex(indices[0]);
        setCurrentLecturaIndex(0);
        setCurrentLectMarcIndex(0);
        setFiltroPanelOpen(false);
        toast.success(t("app.toast.filterOn", { etiqueta: etiqueta, count: indices.length }));
    };
    var quitarFiltro = function () {
        setFiltroActivo(null);
        toast.success(t("app.toast.filterOff"));
    };
    var handleBuscarPetic = function () {
        var q = filtroPetic.trim();
        if (!q) {
            toast.error(t("app.toast.enterRequest"));
            return;
        }
        var indices = muestras
            .map(function (m, idx) { return ({ idx: idx, petic: m.Petic }); })
            .filter(function (_a) {
            var petic = _a.petic;
            return peticMatchesQuery(petic, q);
        })
            .map(function (_a) {
            var idx = _a.idx;
            return idx;
        });
        if (indices.length === 0) {
            toast.error(t("app.toast.noSamplesForRequest", { q: q }));
            return;
        }
        aplicarFiltro(indices, "peticion", t("app.filters.requestLabel", { q: q }));
    };
    var filtrarPorEstadoMuestra = function (estado, tipo, etiqueta) {
        var indices = muestras
            .map(function (m, idx) { return ({
            idx: idx,
            estado: m.Estado_Muestra,
        }); })
            .filter(function (_a) {
            var e = _a.estado;
            return Number(e) === estado;
        })
            .map(function (_a) {
            var idx = _a.idx;
            return idx;
        });
        if (indices.length === 0) {
            toast.error(t("app.toast.noSamplesStatus", { etiqueta: etiqueta }));
            return;
        }
        aplicarFiltro(indices, tipo, etiqueta);
    };
    var handleFiltrarCompletadas = function () {
        return filtrarPorEstadoMuestra(3, "completadas", t("app.status.completed"));
    };
    var handleFiltrarPendientes = function () {
        return filtrarPorEstadoMuestra(2, "pendientes", t("app.status.pending"));
    };
    var handleFiltrarFallidas = function () {
        return filtrarPorEstadoMuestra(1, "fallidas", t("app.status.failed"));
    };
    var toggleFiltroTag = function (tagNumber) {
        var n = Number(tagNumber);
        setFiltroTagsSeleccionados(function (prev) {
            return prev.includes(n) ? prev.filter(function (x) { return x !== n; }) : __spreadArray(__spreadArray([], prev, true), [n], false).sort(function (a, b) { return a - b; });
        });
    };
    var handleFiltrarPorEtiquetas = function () {
        if (!filtroTagsSeleccionados.length) {
            toast.error(t("app.toast.selectTag"));
            return;
        }
        var selected = new Set(filtroTagsSeleccionados.map(Number));
        var indices = muestras
            .map(function (m, idx) { return ({
            idx: idx,
            numBN: m.NumBN != null ? Number(m.NumBN) : NaN,
        }); })
            .filter(function (_a) {
            var numBN = _a.numBN;
            if (!Number.isFinite(numBN))
                return false;
            var tags = tagsByNumBN[numBN] || [];
            return tags.some(function (t) { return selected.has(Number(t)); });
        })
            .map(function (_a) {
            var idx = _a.idx;
            return idx;
        });
        if (!indices.length) {
            toast.error(t("app.toast.noSamplesForTags"));
            return;
        }
        var names = filtroTagsSeleccionados
            .map(function (tn) { var _a; return (_a = tagsCatalog.find(function (t) { return Number(t.Tag_Number) === Number(tn); })) === null || _a === void 0 ? void 0 : _a.Tag_Name; })
            .filter(Boolean)
            .join(", ");
        aplicarFiltro(indices, "etiquetas", t("app.filters.tagsLabel", { names: names }));
    };
    var handleAddPrimeraMuestra = function () { return __awaiter(_this, void 0, void 0, function () {
        var _a, existing, fetchError, insertError, err_5;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    setCreatingPrimeraMuestra(true);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 6, 7, 8]);
                    return [4 /*yield*/, supabase
                            .from("Muestras")
                            .select("NumBN")
                            .eq("NumBN", 1)];
                case 2:
                    _a = _b.sent(), existing = _a.data, fetchError = _a.error;
                    if (fetchError)
                        throw fetchError;
                    if (!(existing === null || existing === void 0 ? void 0 : existing.length)) return [3 /*break*/, 4];
                    toast.error(t("app.toast.sample1Exists"));
                    return [4 /*yield*/, fetchMuestrasCompleto()];
                case 3:
                    _b.sent();
                    return [2 /*return*/];
                case 4: return [4 /*yield*/, supabase
                        .from("Muestras")
                        .insert([{ NumBN: 1, Estado_Muestra: null }])];
                case 5:
                    insertError = (_b.sent()).error;
                    if (insertError)
                        throw insertError;
                    toast.success(t("app.toast.sample1Created"));
                    setSetupPhase(SETUP_PENDING_CATALOGS);
                    navigate("/options?setup=inicial");
                    return [3 /*break*/, 8];
                case 6:
                    err_5 = _b.sent();
                    console.error("Error al crear la primera muestra:", err_5);
                    toast.error(t("app.toast.firstSampleError"));
                    return [3 /*break*/, 8];
                case 7:
                    setCreatingPrimeraMuestra(false);
                    return [7 /*endfinally*/];
                case 8: return [2 /*return*/];
            }
        });
    }); };
    // ----------------- Agregar Muestra -----------------
    var handleAddMuestra = function () { return __awaiter(_this, void 0, void 0, function () {
        var _a, lastMuestra, lastError, numBN_1, confirmMessage, _b, existing, fetchError, insertError, err_6;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 5, , 6]);
                    return [4 /*yield*/, supabase
                            .from("Muestras")
                            .select("NumBN")
                            .order("NumBN", { ascending: false })
                            .limit(1)
                            .maybeSingle()];
                case 1:
                    _a = _c.sent(), lastMuestra = _a.data, lastError = _a.error;
                    if (lastError)
                        throw lastError;
                    numBN_1 = (lastMuestra === null || lastMuestra === void 0 ? void 0 : lastMuestra.NumBN) ? Number(lastMuestra.NumBN) + 1 : 1;
                    confirmMessage = t("app.confirm.addSample", { numBN: numBN_1 });
                    if (!window.confirm(confirmMessage)) {
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, supabase
                            .from("Muestras")
                            .select("NumBN")
                            .eq("NumBN", numBN_1)];
                case 2:
                    _b = _c.sent(), existing = _b.data, fetchError = _b.error;
                    if (fetchError)
                        throw fetchError;
                    if (existing && existing.length > 0) {
                        toast.error(t("app.toast.sampleExists"));
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, supabase
                            .from("Muestras")
                            .insert([{ NumBN: numBN_1, Estado_Muestra: null }])];
                case 3:
                    insertError = (_c.sent()).error;
                    if (insertError)
                        throw insertError;
                    toast.success(t("app.toast.sampleCreated"));
                    // 🔄 Recargar muestras
                    return [4 /*yield*/, fetchMuestrasCompleto()];
                case 4:
                    // 🔄 Recargar muestras
                    _c.sent();
                    // ⏩ Ir automáticamente a la nueva muestra y activar modo edición
                    setTimeout(function () {
                        setMuestras(function (prev) {
                            var index = prev.findIndex(function (m) { return Number(m.NumBN) === numBN_1; });
                            if (index !== -1) {
                                setCurrentMuestraIndex(index);
                                setEditedData(JSON.parse(JSON.stringify(prev[index])));
                                setEditMode(true);
                            }
                            return prev;
                        });
                    }, 300);
                    return [3 /*break*/, 6];
                case 5:
                    err_6 = _c.sent();
                    console.error("Error al crear la muestra:", err_6);
                    toast.error(t("app.toast.sampleCreateError"));
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var handleDeleteMuestra = function () { return __awaiter(_this, void 0, void 0, function () {
        var muestraParaEliminar, numBN, tablesToDelete, _i, tablesToDelete_1, relation, error, deleteMuestraError, previousIndex, err_7;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    muestraParaEliminar = editMode ? editedData : muestras[currentMuestraIndex];
                    numBN = Number(muestraParaEliminar === null || muestraParaEliminar === void 0 ? void 0 : muestraParaEliminar.NumBN);
                    if (!numBN) {
                        toast.error(t("app.toast.noSampleToDelete"));
                        return [2 /*return*/];
                    }
                    if (!window.confirm(t("app.confirm.deleteSample", { numBN: numBN }))) {
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 8, , 9]);
                    tablesToDelete = [
                        { table: "Chips", column: "NumBN_C" },
                        { table: "Lecturas_Marcado", column: "NumBN_LM" },
                        { table: "Marcado", column: "NumBN_M" },
                        { table: "Lectura", column: "NumBN_L" },
                    ];
                    _i = 0, tablesToDelete_1 = tablesToDelete;
                    _a.label = 2;
                case 2:
                    if (!(_i < tablesToDelete_1.length)) return [3 /*break*/, 5];
                    relation = tablesToDelete_1[_i];
                    return [4 /*yield*/, supabase
                            .from(relation.table)
                            .delete()
                            .eq(relation.column, numBN)];
                case 3:
                    error = (_a.sent()).error;
                    if (error)
                        throw error;
                    _a.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5: return [4 /*yield*/, supabase
                        .from("Muestras")
                        .delete()
                        .eq("NumBN", numBN)];
                case 6:
                    deleteMuestraError = (_a.sent()).error;
                    if (deleteMuestraError)
                        throw deleteMuestraError;
                    toast.success(t("app.toast.sampleDeleted", { numBN: numBN }));
                    setEditMode(false);
                    setEditedData({});
                    setCurrentLecturaIndex(0);
                    setCurrentLectMarcIndex(0);
                    previousIndex = Math.max(currentMuestraIndex - 1, 0);
                    setCurrentMuestraIndex(previousIndex);
                    return [4 /*yield*/, fetchMuestrasCompleto()];
                case 7:
                    _a.sent();
                    return [3 /*break*/, 9];
                case 8:
                    err_7 = _a.sent();
                    console.error("Error al eliminar la muestra:", err_7);
                    toast.error(t("app.toast.sampleDeleteError"));
                    return [3 /*break*/, 9];
                case 9: return [2 /*return*/];
            }
        });
    }); };
    var handleDeleteLectura = function () { return __awaiter(_this, void 0, void 0, function () {
        var lectura, numBN, numLectura, errorChips, errorLectMarc, errorMarcado, errorLectura, err_8;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    lectura = muestraActual.lecturas[currentLecturaIndex];
                    numBN = lectura.NumBN_L;
                    numLectura = lectura.NumLectura;
                    if (!window.confirm(t("app.confirm.deleteReading", { numLectura: numLectura, numBN: numBN }))) {
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 7, , 8]);
                    return [4 /*yield*/, supabase
                            .from("Chips")
                            .delete()
                            .eq("NumBN_C", numBN)
                            .eq("NumLectura_C", numLectura)];
                case 2:
                    errorChips = (_a.sent()).error;
                    if (errorChips)
                        throw errorChips;
                    return [4 /*yield*/, supabase
                            .from("Lecturas_Marcado")
                            .delete()
                            .eq("NumBN_LM", numBN)
                            .eq("NumLectura_LM", numLectura)];
                case 3:
                    errorLectMarc = (_a.sent()).error;
                    if (errorLectMarc)
                        throw errorLectMarc;
                    return [4 /*yield*/, supabase
                            .from("Marcado")
                            .delete()
                            .eq("NumBN_M", numBN)
                            .eq("NumLectura_M", numLectura)];
                case 4:
                    errorMarcado = (_a.sent()).error;
                    if (errorMarcado)
                        throw errorMarcado;
                    return [4 /*yield*/, supabase
                            .from("Lectura")
                            .delete()
                            .eq("NumBN_L", numBN)
                            .eq("NumLectura", numLectura)];
                case 5:
                    errorLectura = (_a.sent()).error;
                    if (errorLectura)
                        throw errorLectura;
                    toast.success(t("app.toast.readingDeleted", { numLectura: numLectura }));
                    setEditMode(false);
                    setEditedData({});
                    setCurrentLecturaIndex(Math.max(0, currentLecturaIndex - 1));
                    setCurrentLectMarcIndex(0);
                    return [4 /*yield*/, fetchMuestrasCompleto()];
                case 6:
                    _a.sent();
                    return [3 /*break*/, 8];
                case 7:
                    err_8 = _a.sent();
                    console.error("Error al eliminar la lectura:", err_8);
                    toast.error(t("app.toast.readingDeleteError"));
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    }); };
    var handleDeleteLecturaMarcada = function () { return __awaiter(_this, void 0, void 0, function () {
        var lectura, lectMarc, numBN, numLectura, numLectMarc, errorChips, errorLectMarc, err_9;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    lectura = muestraActual.lecturas[currentLecturaIndex];
                    lectMarc = lectura.marcado.lecturasMarcado[currentLectMarcIndex];
                    numBN = lectMarc.NumBN_LM;
                    numLectura = lectMarc.NumLectura_LM;
                    numLectMarc = lectMarc.NumLectMarc;
                    if (!window.confirm(t("app.confirm.deleteLm", { numLectMarc: numLectMarc, numLectura: numLectura, numBN: numBN }))) {
                        return [2 /*return*/];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    return [4 /*yield*/, supabase
                            .from("Chips")
                            .delete()
                            .eq("NumBN_C", numBN)
                            .eq("NumLectura_C", numLectura)
                            .eq("NumLectMarc_C", numLectMarc)];
                case 2:
                    errorChips = (_a.sent()).error;
                    if (errorChips)
                        throw errorChips;
                    return [4 /*yield*/, supabase
                            .from("Lecturas_Marcado")
                            .delete()
                            .eq("NumBN_LM", numBN)
                            .eq("NumLectura_LM", numLectura)
                            .eq("NumLectMarc", numLectMarc)];
                case 3:
                    errorLectMarc = (_a.sent()).error;
                    if (errorLectMarc)
                        throw errorLectMarc;
                    toast.success(t("app.toast.lmDeleted", { numLectMarc: numLectMarc }));
                    setEditMode(false);
                    setEditedData({});
                    setCurrentLectMarcIndex(Math.max(0, currentLectMarcIndex - 1));
                    return [4 /*yield*/, fetchMuestrasCompleto()];
                case 4:
                    _a.sent();
                    return [3 /*break*/, 6];
                case 5:
                    err_9 = _a.sent();
                    console.error("Error al eliminar la lectura marcada:", err_9);
                    toast.error(t("app.toast.lmDeleteError"));
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var handleCopyFromPrevious = function () {
        if (currentMuestraIndex <= 0) {
            toast.error(t("app.toast.noPreviousSample"));
            return;
        }
        var previousMuestra = muestras[currentMuestraIndex - 1];
        if (!previousMuestra) {
            toast.error(t("app.toast.previousNotFound"));
            return;
        }
        setEditedData(function (prev) {
            var _a;
            return (__assign(__assign({}, prev), { Fecha: previousMuestra.Fecha, Id_LtE: (_a = previousMuestra.Id_LtE) !== null && _a !== void 0 ? _a : null, PN: previousMuestra.PN, LN: previousMuestra.LN, Exp: previousMuestra.Exp }));
        });
        toast.success(t("app.toast.copiedPrevious"));
    };
    var handleCopyMarcadoFromPreviousMuestra = function () {
        var _a, _b, _c, _d;
        if (currentMuestraIndex <= 0) {
            toast.error(t("app.toast.noPreviousSample"));
            return;
        }
        var prevLectura = (_b = (_a = muestras[currentMuestraIndex - 1]) === null || _a === void 0 ? void 0 : _a.lecturas) === null || _b === void 0 ? void 0 : _b[currentLecturaIndex];
        var prevLm = (_d = (_c = prevLectura === null || prevLectura === void 0 ? void 0 : prevLectura.marcado) === null || _c === void 0 ? void 0 : _c.lecturasMarcado) === null || _d === void 0 ? void 0 : _d[currentLectMarcIndex];
        if (!prevLm) {
            toast.error(t("app.toast.previousNoLm"));
            return;
        }
        var lectIdx = currentLecturaIndex;
        var lmIdx = currentLectMarcIndex;
        setEditedData(function (prev) {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
            var lecturas = (prev === null || prev === void 0 ? void 0 : prev.lecturas) ? __spreadArray([], prev.lecturas, true) : [];
            var lect = lecturas[lectIdx];
            if (!((_b = (_a = lect === null || lect === void 0 ? void 0 : lect.marcado) === null || _a === void 0 ? void 0 : _a.lecturasMarcado) === null || _b === void 0 ? void 0 : _b[lmIdx]))
                return prev;
            var lms = __spreadArray([], lect.marcado.lecturasMarcado, true);
            lms[lmIdx] = __assign(__assign({}, lms[lmIdx]), { Fecha_Lect_Marc: (_c = prevLm.Fecha_Lect_Marc) !== null && _c !== void 0 ? _c : null, Id_LtM: (_d = prevLm.Id_LtM) !== null && _d !== void 0 ? _d : null, PN_LM: (_e = prevLm.PN_LM) !== null && _e !== void 0 ? _e : null, LN_LM: (_f = prevLm.LN_LM) !== null && _f !== void 0 ? _f : null, Exp_LM: (_g = prevLm.Exp_LM) !== null && _g !== void 0 ? _g : null, Id_LtMm: (_h = prevLm.Id_LtMm) !== null && _h !== void 0 ? _h : null, PNM_LM: (_j = prevLm.PNM_LM) !== null && _j !== void 0 ? _j : null, LNM_LM: (_k = prevLm.LNM_LM) !== null && _k !== void 0 ? _k : null, ExpM_LM: (_l = prevLm.ExpM_LM) !== null && _l !== void 0 ? _l : null });
            lecturas[lectIdx] = __assign(__assign({}, lect), { marcado: __assign(__assign({}, lect.marcado), { lecturasMarcado: lms }) });
            return __assign(__assign({}, prev), { lecturas: lecturas });
        });
        toast.success(t("app.toast.labeledCopied"));
    };
    /** Muestras en Preparación (Estado_Muestra NULL) pasan a pendiente (2) al empezar lecturas. */
    var promoteEstadoMuestraSiNull = function (numBN, estadoActual) { return __awaiter(_this, void 0, void 0, function () {
        var error;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (estadoActual != null)
                        return [2 /*return*/];
                    return [4 /*yield*/, supabase
                            .from("Muestras")
                            .update({ Estado_Muestra: 2 })
                            .eq("NumBN", numBN)];
                case 1:
                    error = (_a.sent()).error;
                    if (error)
                        throw error;
                    setEstadoMuestra(2);
                    return [2 /*return*/];
            }
        });
    }); };
    // ----------------- Agregar primera Lectura -----------------
    var handleAddLectura = function () { return __awaiter(_this, void 0, void 0, function () {
        var error, err_10;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!muestraActual)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, supabase.from("Lectura").insert([
                            {
                                NumBN_L: muestraActual.NumBN, // Igual que NumBN de la muestra
                                NumLectura: 1 // Siempre 1 al crear la primera lectura
                            }
                        ])];
                case 2:
                    error = (_a.sent()).error;
                    if (error)
                        throw error;
                    return [4 /*yield*/, promoteEstadoMuestraSiNull(muestraActual.NumBN, muestraActual.Estado_Muestra)];
                case 3:
                    _a.sent();
                    toast.success(t("app.toast.readingAdded"));
                    fetchMuestrasCompleto(); // Refresca los datos para que aparezca la nueva lectura
                    setCurrentLecturaIndex(0); // Va automáticamente a la primera lectura
                    return [3 /*break*/, 5];
                case 4:
                    err_10 = _a.sent();
                    console.error("Error al crear la lectura:", err_10);
                    toast.error(t("app.toast.readingCreateError"));
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    // ----------------- Agregar Lectura Nueva ------------
    var handleAddLecturaNueva = function () { return __awaiter(_this, void 0, void 0, function () {
        var error, err_11;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!muestraActual)
                        return [2 /*return*/];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    return [4 /*yield*/, supabase.from("Lectura").insert([
                            {
                                NumBN_L: muestraActual.NumBN,
                                NumLectura: muestraActual.lecturas ? muestraActual.lecturas.length + 1 : 1,
                            }
                        ])];
                case 2:
                    error = (_a.sent()).error;
                    if (error)
                        throw error;
                    return [4 /*yield*/, promoteEstadoMuestraSiNull(muestraActual.NumBN, muestraActual.Estado_Muestra)];
                case 3:
                    _a.sent();
                    toast.success(t("app.toast.readingAdded"));
                    return [4 /*yield*/, fetchMuestrasCompleto()];
                case 4:
                    _a.sent(); // refresca los datos
                    // actualizar currentLecturaIndex al último elemento
                    setCurrentLecturaIndex(muestraActual.lecturas ? muestraActual.lecturas.length : 0);
                    return [3 /*break*/, 6];
                case 5:
                    err_11 = _a.sent();
                    console.error("Error al crear la lectura:", err_11);
                    toast.error(t("app.toast.readingCreateError"));
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    // ----------------- Agregar primer Marcado y primera Lectura Marcado ------
    var handleAddLecturaMarcado = function () { return __awaiter(_this, void 0, void 0, function () {
        var _a, marcadoData, errorMarcado, marcado, errorLectMarc, err_12;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!lecturaActual)
                        return [2 /*return*/];
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 5, , 6]);
                    return [4 /*yield*/, supabase
                            .from("Marcado")
                            .upsert([
                            {
                                NumBN_M: lecturaActual.NumBN_L,
                                NumLectura_M: lecturaActual.NumLectura
                            }
                        ])
                            .select("*")];
                case 2:
                    _a = _b.sent(), marcadoData = _a.data, errorMarcado = _a.error;
                    if (errorMarcado)
                        throw errorMarcado;
                    marcado = marcadoData[0];
                    return [4 /*yield*/, supabase.from("Lecturas_Marcado").insert([
                            {
                                NumBN_LM: marcado.NumBN_M,
                                NumLectura_LM: marcado.NumLectura_M,
                                NumLectMarc: 1
                            }
                        ])];
                case 3:
                    errorLectMarc = (_b.sent()).error;
                    if (errorLectMarc)
                        throw errorLectMarc;
                    toast.success(t("app.toast.lmAdded"));
                    return [4 /*yield*/, fetchMuestrasCompleto()];
                case 4:
                    _b.sent();
                    setCurrentLectMarcIndex(0);
                    return [3 /*break*/, 6];
                case 5:
                    err_12 = _b.sent();
                    console.error("Error al crear la lectura de marcado:", err_12);
                    toast.error(t("app.toast.lmCreateError"));
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    // ----------------- Agregar Lectura Marcado Nueva ------------
    var handleAddLecturaMarcadoNueva = function () { return __awaiter(_this, void 0, void 0, function () {
        var numNuevaLectMarc, prevLm, error, err_13;
        var _a, _b, _c, _d, _e, _f, _g;
        return __generator(this, function (_h) {
            switch (_h.label) {
                case 0:
                    if (!lecturaActual)
                        return [2 /*return*/]; // Necesitamos la lectura actual
                    _h.label = 1;
                case 1:
                    _h.trys.push([1, 4, , 5]);
                    numNuevaLectMarc = ((_a = lecturaActual.marcado) === null || _a === void 0 ? void 0 : _a.lecturasMarcado)
                        ? lecturaActual.marcado.lecturasMarcado.length + 1
                        : 1;
                    prevLm = (_d = (_c = (_b = lecturaActual.marcado) === null || _b === void 0 ? void 0 : _b.lecturasMarcado) === null || _c === void 0 ? void 0 : _c[lecturaActual.marcado.lecturasMarcado.length - 1]) !== null && _d !== void 0 ? _d : null;
                    return [4 /*yield*/, supabase.from("Lecturas_Marcado").insert([
                            {
                                NumBN_LM: lecturaActual.NumBN_L,
                                NumLectura_LM: lecturaActual.NumLectura,
                                NumLectMarc: numNuevaLectMarc,
                                Fecha_Lect_Marc: (_e = prevLm === null || prevLm === void 0 ? void 0 : prevLm.Fecha_Lect_Marc) !== null && _e !== void 0 ? _e : null,
                                Id_LtM: (_f = prevLm === null || prevLm === void 0 ? void 0 : prevLm.Id_LtM) !== null && _f !== void 0 ? _f : null,
                                Id_LtMm: (_g = prevLm === null || prevLm === void 0 ? void 0 : prevLm.Id_LtMm) !== null && _g !== void 0 ? _g : null,
                            },
                        ])];
                case 2:
                    error = (_h.sent()).error;
                    if (error)
                        throw error;
                    toast.success(t("app.toast.lmAdded"));
                    return [4 /*yield*/, fetchMuestrasCompleto()];
                case 3:
                    _h.sent(); // refresca los datos
                    // Ir automáticamente a la nueva lectura de marcado
                    setCurrentLectMarcIndex(numNuevaLectMarc - 1);
                    return [3 /*break*/, 5];
                case 4:
                    err_13 = _h.sent();
                    console.error("Error al crear la lectura de marcado:", err_13);
                    toast.error(t("app.toast.lmCreateError"));
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    // ---------------- Añadir Chip -----------------------
    var handleAddChip = function () { return __awaiter(_this, void 0, void 0, function () {
        var lecturaMarcada, selectedChip_1, yaAsignado, error, estadoError, newChip_1, lectIdx_1, lmIdx_1, appendChipToMuestra_1, err_14;
        var _a, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    lecturaMarcada = (_b = (_a = lecturaActual === null || lecturaActual === void 0 ? void 0 : lecturaActual.marcado) === null || _a === void 0 ? void 0 : _a.lecturasMarcado) === null || _b === void 0 ? void 0 : _b[currentLectMarcIndex];
                    if (!lecturaMarcada) {
                        toast.error(t("app.toast.noLmSelected"));
                        return [2 /*return*/];
                    }
                    if (!newChipNumber) {
                        toast.error(t("app.toast.selectChip"));
                        return [2 /*return*/];
                    }
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 4, , 5]);
                    selectedChip_1 = dChips.find(function (c) { return c.NumChip_D === parseInt(newChipNumber, 10); });
                    if (!selectedChip_1) {
                        toast.error(t("app.toast.chipNotFound"));
                        return [2 /*return*/];
                    }
                    yaAsignado = (lecturaMarcada.chips || []).some(function (c) { return Number(c.NumChip) === Number(selectedChip_1.NumChip_D); });
                    if (yaAsignado) {
                        toast.error(t("app.toast.chipAlreadyAssigned"));
                        return [2 /*return*/];
                    }
                    if (!chipTieneHuecoDisponible(Number(selectedChip_1.NumChip_D), asignacionesChip)) {
                        toast.error(t("app.toast.chipNoFc"));
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, supabase.from("Chips").insert([
                            {
                                NumBN_C: lecturaMarcada.NumBN_LM,
                                NumLectura_C: lecturaMarcada.NumLectura_LM,
                                NumLectMarc_C: lecturaMarcada.NumLectMarc,
                                NumChip: selectedChip_1.NumChip_D,
                                Chip_Nombre: selectedChip_1.Nombre_Chip,
                                Coment_Chip: null,
                                Repetir_Chip: null,
                            },
                        ])];
                case 2:
                    error = (_c.sent()).error;
                    if (error)
                        throw error;
                    return [4 /*yield*/, supabase
                            .from("Muestras")
                            .update({ Estado_Muestra: 2 })
                            .eq("NumBN", muestraActual.NumBN)];
                case 3:
                    estadoError = (_c.sent()).error;
                    if (estadoError)
                        throw estadoError;
                    toast.success(t("app.toast.chipAdded"));
                    setNewChipNumber("");
                    newChip_1 = {
                        NumBN_C: lecturaMarcada.NumBN_LM,
                        NumLectura_C: lecturaMarcada.NumLectura_LM,
                        NumLectMarc_C: lecturaMarcada.NumLectMarc,
                        NumChip: selectedChip_1.NumChip_D,
                        Chip_Nombre: selectedChip_1.Nombre_Chip,
                        Coment_Chip: null,
                        Repetir_Chip: null,
                        FC: null,
                    };
                    lectIdx_1 = currentLecturaIndex;
                    lmIdx_1 = currentLectMarcIndex;
                    appendChipToMuestra_1 = function (muestra) {
                        var _a, _b, _c, _d;
                        if (!muestra)
                            return muestra;
                        var updated = JSON.parse(JSON.stringify(muestra));
                        var lm = (_d = (_c = (_b = (_a = updated === null || updated === void 0 ? void 0 : updated.lecturas) === null || _a === void 0 ? void 0 : _a[lectIdx_1]) === null || _b === void 0 ? void 0 : _b.marcado) === null || _c === void 0 ? void 0 : _c.lecturasMarcado) === null || _d === void 0 ? void 0 : _d[lmIdx_1];
                        if (!lm)
                            return muestra;
                        if (!lm.chips)
                            lm.chips = [];
                        lm.chips.push(newChip_1);
                        updated.Estado_Muestra = 2;
                        return updated;
                    };
                    setEstadoMuestra(2);
                    if (editMode) {
                        setEditedData(function (prev) { return appendChipToMuestra_1(prev); });
                    }
                    setMuestras(function (prev) {
                        var updated = __spreadArray([], prev, true);
                        updated[currentMuestraIndex] = appendChipToMuestra_1(updated[currentMuestraIndex]);
                        return updated;
                    });
                    return [3 /*break*/, 5];
                case 4:
                    err_14 = _c.sent();
                    console.error("Error al añadir chip:", err_14);
                    toast.error(t("app.toast.chipAddError"));
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    // ----------------- Eliminar Chip Asignado -----------------
    var handleDeleteChipAssignment = function (lectIdx, lmIdx, chipIdx) { return __awaiter(_this, void 0, void 0, function () {
        var muestra, lectura, lm, chip, chipNum, confirmDelete, error, removeChipAt_1, err_15;
        var _a, _b, _c, _d, _e, _f, _g;
        return __generator(this, function (_h) {
            switch (_h.label) {
                case 0:
                    muestra = editMode ? editedData : muestras[currentMuestraIndex];
                    lectura = (_a = muestra === null || muestra === void 0 ? void 0 : muestra.lecturas) === null || _a === void 0 ? void 0 : _a[lectIdx];
                    lm = (_c = (_b = lectura === null || lectura === void 0 ? void 0 : lectura.marcado) === null || _b === void 0 ? void 0 : _b.lecturasMarcado) === null || _c === void 0 ? void 0 : _c[lmIdx];
                    chip = (_d = lm === null || lm === void 0 ? void 0 : lm.chips) === null || _d === void 0 ? void 0 : _d[chipIdx];
                    if (!chip) {
                        toast.error(t("app.toast.noChipToDelete"));
                        return [2 /*return*/];
                    }
                    chipNum = chip.NumChip;
                    confirmDelete = window.confirm(t("app.confirm.deleteChip", {
                        chipNum: chipNum,
                        chipName: chip.Chip_Nombre || t("common.unnamed"),
                        numLectMarc: lm.NumLectMarc,
                        numLectura: lectura === null || lectura === void 0 ? void 0 : lectura.NumLectura,
                        numBN: muestra === null || muestra === void 0 ? void 0 : muestra.NumBN,
                    }));
                    if (!confirmDelete)
                        return [2 /*return*/];
                    _h.label = 1;
                case 1:
                    _h.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, supabase
                            .from("Chips")
                            .delete()
                            .match({
                            NumBN_C: (_e = chip.NumBN_C) !== null && _e !== void 0 ? _e : lm.NumBN_LM,
                            NumLectura_C: (_f = chip.NumLectura_C) !== null && _f !== void 0 ? _f : lm.NumLectura_LM,
                            NumLectMarc_C: (_g = chip.NumLectMarc_C) !== null && _g !== void 0 ? _g : lm.NumLectMarc,
                            NumChip: chip.NumChip,
                        })];
                case 2:
                    error = (_h.sent()).error;
                    if (error)
                        throw error;
                    toast.success(t("app.toast.chipDeleted", { chipNum: chipNum }));
                    removeChipAt_1 = function (lecturasMarcado) {
                        var _a;
                        if (!((_a = lecturasMarcado === null || lecturasMarcado === void 0 ? void 0 : lecturasMarcado[lmIdx]) === null || _a === void 0 ? void 0 : _a.chips))
                            return;
                        lecturasMarcado[lmIdx].chips = lecturasMarcado[lmIdx].chips.filter(function (_, i) { return i !== chipIdx; });
                    };
                    setEditedData(function (prev) {
                        var _a, _b, _c;
                        var updated = JSON.parse(JSON.stringify(prev));
                        removeChipAt_1((_c = (_b = (_a = updated === null || updated === void 0 ? void 0 : updated.lecturas) === null || _a === void 0 ? void 0 : _a[lectIdx]) === null || _b === void 0 ? void 0 : _b.marcado) === null || _c === void 0 ? void 0 : _c.lecturasMarcado);
                        return updated;
                    });
                    setMuestras(function (prev) {
                        var _a, _b, _c, _d;
                        var updated = JSON.parse(JSON.stringify(prev));
                        removeChipAt_1((_d = (_c = (_b = (_a = updated === null || updated === void 0 ? void 0 : updated[currentMuestraIndex]) === null || _a === void 0 ? void 0 : _a.lecturas) === null || _b === void 0 ? void 0 : _b[lectIdx]) === null || _c === void 0 ? void 0 : _c.marcado) === null || _d === void 0 ? void 0 : _d.lecturasMarcado);
                        return updated;
                    });
                    return [3 /*break*/, 4];
                case 3:
                    err_15 = _h.sent();
                    console.error("Error al eliminar chip:", err_15);
                    toast.error(t("app.toast.chipDeleteError"));
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    // ----------------- Render -----------------
    if (loading)
        return (_jsxs("div", { className: "bionapp-subpage min-h-screen  p-4 flex flex-col items-center justify-center gap-3", children: [_jsx("span", { className: "text-lg font-medium", children: t("app.loadingSamples") }), _jsx(Loader2, { className: "h-10 w-10 animate-spin text-slate-600 dark:text-slate-200" })] }));
    if (!muestras.length && muestrasFetchError) {
        return (_jsxs(_Fragment, { children: [_jsx(Toaster, { position: "bottom-right" }), _jsxs("div", { className: "bionapp-subpage min-h-screen  p-4 flex flex-col", children: [_jsxs("div", { className: "flex flex-1 flex-col items-center justify-center gap-4 max-w-md text-center mx-auto w-full", children: [_jsx("p", { className: "text-lg font-medium text-slate-800 dark:text-slate-100", children: t("app.connectionError") }), _jsx("p", { className: "text-sm text-slate-600 dark:text-slate-400", children: muestrasFetchError }), _jsxs(Button, { onClick: function () { return void fetchMuestrasCompleto({ restoreLastMuestra: true }); }, className: "gap-2", children: [_jsx(RefreshCw, { className: "h-4 w-4" }), t("app.retry")] })] }), _jsx(AppFooter, {})] })] }));
    }
    if (!muestras.length) {
        return (_jsxs(_Fragment, { children: [_jsx(Toaster, { position: "bottom-right" }), _jsxs("div", { className: "bionapp-subpage min-h-screen  p-4 flex flex-col", children: [_jsxs("div", { className: "flex flex-1 flex-col items-center justify-center gap-4 w-full", children: [_jsx("p", { className: "text-lg text-slate-700 dark:text-slate-200", children: t("app.empty.noSamples") }), _jsxs(Button, { onClick: handleAddPrimeraMuestra, disabled: creatingPrimeraMuestra, className: "gap-2", children: [creatingPrimeraMuestra ? (_jsx(Loader2, { className: "h-4 w-4 animate-spin" })) : (_jsx(Plus, { className: "h-4 w-4" })), t("app.empty.addFirst")] })] }), _jsx(AppFooter, {})] })] }));
    }
    var muestraActual = editMode ? editedData : muestras[currentMuestraIndex];
    var lecturaActual = (_b = muestraActual.lecturas) === null || _b === void 0 ? void 0 : _b[currentLecturaIndex];
    var lectMarcActual = (_d = (_c = lecturaActual === null || lecturaActual === void 0 ? void 0 : lecturaActual.marcado) === null || _c === void 0 ? void 0 : _c.lecturasMarcado) === null || _d === void 0 ? void 0 : _d[currentLectMarcIndex];
    var preselectLinkActual = (muestraActual === null || muestraActual === void 0 ? void 0 : muestraActual.NumBN) != null ? preselectByNumBN[Number(muestraActual.NumBN)] : null;
    var preselectComentActual = ((_e = preselectLinkActual === null || preselectLinkActual === void 0 ? void 0 : preselectLinkActual.Coment_Preselect) === null || _e === void 0 ? void 0 : _e.trim()) || null;
    function handleToggleTag(tagNumber) {
        return __awaiter(this, void 0, void 0, function () {
            var numBN, exists, error_1, error, tag_1, _a, reloadData, reloadErr, e_4;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        numBN = (muestraActual === null || muestraActual === void 0 ? void 0 : muestraActual.NumBN) != null ? Number(muestraActual.NumBN) : null;
                        if (!numBN)
                            return [2 /*return*/];
                        exists = muestraTags.some(function (t) { return Number(t.Tag_Number) === Number(tagNumber); });
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 6, , 7]);
                        if (!exists) return [3 /*break*/, 3];
                        return [4 /*yield*/, supabase
                                .from("Muestra_Tags")
                                .delete()
                                .eq("NumBN_Tag", numBN)
                                .eq("Tag_Number", tagNumber)];
                    case 2:
                        error_1 = (_c.sent()).error;
                        if (error_1)
                            throw error_1;
                        setMuestraTags(function (prev) { return prev.filter(function (t) { return Number(t.Tag_Number) !== Number(tagNumber); }); });
                        setTagsByNumBN(function (prev) {
                            var next = __assign({}, prev);
                            var tags = (next[numBN] || []).filter(function (t) { return Number(t) !== Number(tagNumber); });
                            if (tags.length)
                                next[numBN] = tags;
                            else
                                delete next[numBN];
                            return next;
                        });
                        return [2 /*return*/];
                    case 3:
                        if (muestraTags.length >= MAX_TAGS_PER_MUESTRA) {
                            toast.error(t("app.toast.maxTags", { max: MAX_TAGS_PER_MUESTRA }));
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, supabase
                                .from("Muestra_Tags")
                                .insert([{ NumBN_Tag: numBN, Tag_Number: tagNumber }])];
                    case 4:
                        error = (_c.sent()).error;
                        if (error)
                            throw error;
                        tag_1 = tagsCatalog.find(function (t) { return Number(t.Tag_Number) === Number(tagNumber); });
                        if (tag_1) {
                            setMuestraTags(function (prev) {
                                return __spreadArray(__spreadArray([], prev, true), [{ Tag_Number: tag_1.Tag_Number, Tag_Name: tag_1.Tag_Name, Tag_Color: tag_1.Tag_Color }], false).sort(function (a, b) { return Number(a.Tag_Number) - Number(b.Tag_Number); });
                            });
                            setTagsByNumBN(function (prev) {
                                var _a;
                                var tags = __spreadArray(__spreadArray([], (prev[numBN] || []), true), [Number(tagNumber)], false).sort(function (a, b) { return a - b; });
                                return __assign(__assign({}, prev), (_a = {}, _a[numBN] = tags, _a));
                            });
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, supabase
                                .from("Muestra_Tags")
                                .select("Tag_Number, Tags ( Tag_Name, Tag_Color )")
                                .eq("NumBN_Tag", numBN)
                                .order("Tag_Number", { ascending: true })];
                    case 5:
                        _a = _c.sent(), reloadData = _a.data, reloadErr = _a.error;
                        if (reloadErr)
                            throw reloadErr;
                        setMuestraTags((reloadData || []).map(function (r) {
                            var _a, _b, _c, _d;
                            return ({
                                Tag_Number: Number(r.Tag_Number),
                                Tag_Name: (_b = (_a = r.Tags) === null || _a === void 0 ? void 0 : _a.Tag_Name) !== null && _b !== void 0 ? _b : "",
                                Tag_Color: (_d = (_c = r.Tags) === null || _c === void 0 ? void 0 : _c.Tag_Color) !== null && _d !== void 0 ? _d : "#64748b",
                            });
                        }));
                        return [3 /*break*/, 7];
                    case 6:
                        e_4 = _c.sent();
                        console.error(e_4);
                        toast.error((_b = e_4 === null || e_4 === void 0 ? void 0 : e_4.message) !== null && _b !== void 0 ? _b : t("app.toast.tagsSaveError"));
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    }
    var handleGoToPreselectComent = function () {
        if (!(preselectLinkActual === null || preselectLinkActual === void 0 ? void 0 : preselectLinkActual.Petic_Preselect))
            return;
        saveLastMuestraNumBN(muestraActual.NumBN);
        navigate(buildPreselectHighlightPath(preselectLinkActual.Petic_Preselect));
    };
    var handleToggleEstado = function () {
        if (!editMode)
            return; // solo se puede cambiar en modo edición
        // Secuencia de colores: null -> 1 -> 2 -> 3 -> 1 ...
        var siguienteEstado = estadoMuestra === null
            ? 1
            : estadoMuestra === 1
                ? 2
                : estadoMuestra === 2
                    ? 3
                    : 1;
        setEstadoMuestra(siguienteEstado);
        setEditedData(function (prev) { return (__assign(__assign({}, prev), { Estado_Muestra: siguienteEstado })); });
    };
    var handleToggleRepetirChip = function (lectIdx, lmIdx, chipIdx) { return __awaiter(_this, void 0, void 0, function () {
        var base, chip, lm, activo, nuevo, error, err_16;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0;
        return __generator(this, function (_1) {
            switch (_1.label) {
                case 0:
                    if (!editMode)
                        return [2 /*return*/];
                    base = muestras[currentMuestraIndex];
                    chip = (_g = (_f = (_e = (_d = (_c = (_b = (_a = editedData === null || editedData === void 0 ? void 0 : editedData.lecturas) === null || _a === void 0 ? void 0 : _a[lectIdx]) === null || _b === void 0 ? void 0 : _b.marcado) === null || _c === void 0 ? void 0 : _c.lecturasMarcado) === null || _d === void 0 ? void 0 : _d[lmIdx]) === null || _e === void 0 ? void 0 : _e.chips) === null || _f === void 0 ? void 0 : _f[chipIdx]) !== null && _g !== void 0 ? _g : (_o = (_m = (_l = (_k = (_j = (_h = base === null || base === void 0 ? void 0 : base.lecturas) === null || _h === void 0 ? void 0 : _h[lectIdx]) === null || _j === void 0 ? void 0 : _j.marcado) === null || _k === void 0 ? void 0 : _k.lecturasMarcado) === null || _l === void 0 ? void 0 : _l[lmIdx]) === null || _m === void 0 ? void 0 : _m.chips) === null || _o === void 0 ? void 0 : _o[chipIdx];
                    lm = (_t = (_s = (_r = (_q = (_p = editedData === null || editedData === void 0 ? void 0 : editedData.lecturas) === null || _p === void 0 ? void 0 : _p[lectIdx]) === null || _q === void 0 ? void 0 : _q.marcado) === null || _r === void 0 ? void 0 : _r.lecturasMarcado) === null || _s === void 0 ? void 0 : _s[lmIdx]) !== null && _t !== void 0 ? _t : (_x = (_w = (_v = (_u = base === null || base === void 0 ? void 0 : base.lecturas) === null || _u === void 0 ? void 0 : _u[lectIdx]) === null || _v === void 0 ? void 0 : _v.marcado) === null || _w === void 0 ? void 0 : _w.lecturasMarcado) === null || _x === void 0 ? void 0 : _x[lmIdx];
                    if (!chip || !lm || lm.NumBN_LM == null || chip.NumChip == null || chip.NumChip === "")
                        return [2 /*return*/];
                    activo = repetirChipActivado(chip.Repetir_Chip);
                    nuevo = activo ? null : 1;
                    _1.label = 1;
                case 1:
                    _1.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, supabase
                            .from("Chips")
                            .update({ Repetir_Chip: nuevo })
                            .eq("NumBN_C", (_y = chip.NumBN_C) !== null && _y !== void 0 ? _y : lm.NumBN_LM)
                            .eq("NumLectura_C", (_z = chip.NumLectura_C) !== null && _z !== void 0 ? _z : lm.NumLectura_LM)
                            .eq("NumLectMarc_C", (_0 = chip.NumLectMarc_C) !== null && _0 !== void 0 ? _0 : lm.NumLectMarc)
                            .eq("NumChip", Number(chip.NumChip))];
                case 2:
                    error = (_1.sent()).error;
                    if (error)
                        throw error;
                    setMuestras(function (prev) {
                        return patchMuestrasRepetirChip(prev, currentMuestraIndex, lectIdx, lmIdx, chipIdx, nuevo);
                    });
                    setEditedData(function (prev) { return patchChipRepetirEnMuestra(prev, lectIdx, lmIdx, chipIdx, nuevo); });
                    toast.success(nuevo === 1
                        ? t("app.toast.repeatOn")
                        : t("app.toast.repeatOff"));
                    return [3 /*break*/, 4];
                case 3:
                    err_16 = _1.sent();
                    console.error("Error al actualizar Repetir_Chip:", err_16);
                    toast.error(t("app.toast.repeatError"));
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); };
    return (_jsxs(_Fragment, { children: [_jsx(Toaster, { position: "bottom-right" }), "  ", _jsxs("div", { className: "bionapp-subpage min-h-screen p-3 flex flex-col", children: [_jsxs("div", { className: "bionapp-shell max-w-[1600px] mx-auto w-full min-w-0", children: [isSetupPendingSample() && editMode ? (_jsx("div", { className: "mb-3 bionapp-alert-warn p-3 text-sm", children: t("app.setupBanner") })) : null, _jsxs("header", { className: "bionapp-subpage-header bionapp-header mb-3", children: [_jsxs("div", { className: "bionapp-header-row--nav", children: [_jsx(Button, { onClick: handleFirstMuestra, disabled: editMode || posicionNavegacion === 0, variant: "outline", size: "sm", className: "bionapp-nav-mini-btn bionapp-nav-mini-btn--icon", children: _jsx(ChevronsLeft, { className: "h-4 w-4" }) }), _jsx(Button, { onClick: handlePrevMuestra, disabled: editMode || posicionNavegacion === 0, variant: "outline", size: "sm", className: "bionapp-nav-mini-btn bionapp-nav-mini-btn--icon", children: _jsx(ChevronLeft, { className: "h-4 w-4" }) }), _jsxs("span", { className: "text-xs sm:text-sm px-1 sm:px-2 whitespace-nowrap", children: [_jsxs("span", { className: "bionapp-registro-prefix", children: [t("app.nav.record"), " "] }), t("common.nOfTotal", { current: posicionNavegacion + 1, total: navegacionIndices.length })] }), _jsx(Button, { onClick: handleNextMuestra, disabled: editMode || posicionNavegacion >= navegacionIndices.length - 1, variant: "outline", size: "sm", className: "bionapp-nav-mini-btn bionapp-nav-mini-btn--icon", children: _jsx(ChevronRight, { className: "h-4 w-4" }) }), _jsx(Button, { onClick: handleLastMuestra, disabled: editMode || posicionNavegacion >= navegacionIndices.length - 1, variant: "outline", size: "sm", className: "bionapp-nav-mini-btn bionapp-nav-mini-btn--icon", children: _jsx(ChevronsRight, { className: "h-4 w-4" }) }), !editMode && (_jsxs("div", { className: "bionapp-nav-tools", children: [_jsx(Input, { type: "number", placeholder: t("app.search.placeholder"), value: buscarNumMuestra, onChange: function (e) { return setBuscarNumMuestra(e.target.value); }, onKeyDown: function (e) { return e.key === "Enter" && handleBuscar(); }, className: "h-7 w-20 text-xs shrink-0" }), _jsx(Button, { onClick: handleBuscar, size: "sm", className: "bionapp-nav-mini-btn bionapp-nav-mini-btn--text bionapp-btn-green shrink-0", title: t("app.search.goTitle"), children: t("app.search.go") }), _jsx("span", { ref: filtroBtnRef, className: "inline-flex shrink-0", children: _jsx(Button, { type: "button", size: "sm", variant: "outline", className: "bionapp-nav-mini-btn bionapp-nav-mini-btn--icon", title: t("app.filters.title"), "aria-expanded": filtroPanelOpen, "aria-controls": "bionapp-filtro-panel", onClick: toggleFiltroPanel, children: _jsx(Filter, { className: "h-4 w-4" }) }) }), filtroPanelOpen &&
                                                        createPortal(_jsxs("div", { id: "bionapp-filtro-panel", role: "dialog", "aria-label": t("app.filters.aria"), className: "petic-search-floating bionapp-filtro-panel", style: {
                                                                top: filtroPanelPos.top,
                                                                left: filtroPanelPos.left,
                                                            }, children: [_jsx("p", { className: "text-xs font-medium mb-2", children: t("app.filters.title") }), _jsxs("div", { className: "bionapp-filtro-panel__tabs mb-3", children: [_jsx("button", { type: "button", className: "bionapp-filtro-panel__tab".concat(filtroModo === "peticion" ? " bionapp-filtro-panel__tab--active" : ""), onClick: function () { return setFiltroModo("peticion"); }, children: t("app.filters.byRequest") }), _jsx("button", { type: "button", className: "bionapp-filtro-panel__tab".concat(filtroModo === "estado" ? " bionapp-filtro-panel__tab--active" : ""), onClick: function () { return setFiltroModo("estado"); }, children: t("app.filters.byStatus") }), _jsx("button", { type: "button", className: "bionapp-filtro-panel__tab".concat(filtroModo === "etiquetas" ? " bionapp-filtro-panel__tab--active" : ""), onClick: function () { return setFiltroModo("etiquetas"); }, children: t("app.filters.tags") })] }), filtroModo === "peticion" ? (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Input, { type: "text", placeholder: t("app.filters.requestPlaceholder"), value: filtroPetic, onChange: function (e) { return setFiltroPetic(e.target.value); }, onKeyDown: function (e) { return e.key === "Enter" && handleBuscarPetic(); }, className: "h-8 text-xs flex-1", autoFocus: true }), _jsx(Button, { type: "button", size: "sm", className: "h-8 bionapp-btn-green shrink-0", onClick: handleBuscarPetic, children: t("app.filters.apply") })] })) : filtroModo === "estado" ? (_jsxs("div", { className: "space-y-2", children: [_jsxs(Button, { type: "button", size: "sm", variant: "outline", className: "h-8 w-full justify-start text-xs gap-2", onClick: handleFiltrarCompletadas, children: [_jsx(CircleDot, { size: 16, color: "var(--bion-success-fill)", strokeWidth: 2, className: "shrink-0" }), t("app.status.completed")] }), _jsxs(Button, { type: "button", size: "sm", variant: "outline", className: "h-8 w-full justify-start text-xs gap-2", onClick: handleFiltrarPendientes, children: [_jsx(CircleDot, { size: 16, color: "var(--bion-warn-fill)", strokeWidth: 2, className: "shrink-0" }), t("app.status.pending")] }), _jsxs(Button, { type: "button", size: "sm", variant: "outline", className: "h-8 w-full justify-start text-xs gap-2", onClick: handleFiltrarFallidas, children: [_jsx(CircleDot, { size: 16, color: "var(--bion-danger-fill)", strokeWidth: 2, className: "shrink-0" }), t("app.status.failed")] })] })) : tagsCatalog.length === 0 ? (_jsx("p", { className: "text-xs text-muted-foreground", children: t("app.filters.noTags") })) : (_jsxs("div", { className: "bionapp-filtro-tags", children: [_jsx("p", { className: "text-[0.65rem] text-muted-foreground mb-2", children: t("app.filters.tagsHint") }), _jsx("div", { className: "bionapp-filtro-tags__list", role: "listbox", "aria-label": t("app.filters.tagsAria"), children: tagsCatalog.map(function (tag) {
                                                                                var selected = filtroTagsSeleccionados.includes(Number(tag.Tag_Number));
                                                                                return (_jsxs("label", { className: "bionapp-tag-picker__item", children: [_jsx("input", { type: "checkbox", className: "h-3.5 w-3.5 shrink-0 accent-slate-900 dark:accent-slate-100", checked: selected, onChange: function () { return toggleFiltroTag(Number(tag.Tag_Number)); } }), _jsx(Tag, { size: 13, color: tag.Tag_Color || "#64748b", strokeWidth: 2 }), _jsx("span", { className: "truncate", children: tag.Tag_Name })] }, tag.Tag_Number));
                                                                            }) }), _jsx(Button, { type: "button", size: "sm", className: "h-8 w-full bionapp-btn-green", onClick: handleFiltrarPorEtiquetas, children: t("app.filters.apply") })] }))] }), document.body), _jsx(Button, { type: "button", onClick: handleAddMuestra, size: "sm", className: "bionapp-nav-mini-btn bionapp-nav-mini-btn--icon shrink-0", title: t("app.newSample"), children: _jsx(Plus, { className: "h-4 w-4" }) })] }))] }), _jsx("div", { className: "bionapp-header-user-meta", children: _jsxs("span", { className: "bionapp-header-user", children: [_jsx("span", { className: "bionapp-header-role", title: userRole === "admin"
                                                        ? t("role.admin")
                                                        : userRole === "user"
                                                            ? t("role.user")
                                                            : t("role.unassigned"), "aria-label": userRole === "admin"
                                                        ? t("role.admin")
                                                        : userRole === "user"
                                                            ? t("role.user")
                                                            : t("role.unassigned"), children: userRole === "admin" ? (_jsx(ShieldCheck, { className: "bionapp-header-role-icon", size: 16, strokeWidth: 2.25 })) : (_jsx(User, { className: "bionapp-header-role-icon", size: 16, strokeWidth: 2.25 })) }), _jsx("span", { className: "bionapp-header-username", title: ((_g = (_f = user === null || user === void 0 ? void 0 : user.email) === null || _f === void 0 ? void 0 : _f.split("@")) === null || _g === void 0 ? void 0 : _g[0]) || t("app.user.unknown"), children: ((_j = (_h = user === null || user === void 0 ? void 0 : user.email) === null || _h === void 0 ? void 0 : _h.split("@")) === null || _j === void 0 ? void 0 : _j[0]) || t("app.user.unknown") })] }) }), _jsxs("div", { className: "bionapp-header-actions", children: [editMode && (_jsxs(Button, { onClick: handleDeleteMuestra, size: "sm", variant: "destructive", className: "h-7 px-2 shrink-0", title: t("app.deleteSample"), children: [_jsx(Minus, { className: "h-3 w-3 shrink-0" }), _jsx("span", { className: "bionapp-nav-label", children: t("app.deleteSample") })] })), !editMode && (_jsxs(_Fragment, { children: [_jsx(Button, { onClick: function () { return navigateFromBase("/preselect"); }, size: "sm", className: "bionapp-btn-info bionapp-nav-mini-btn bionapp-nav-mini-btn--icon shrink-0", title: t("nav.preselect"), children: _jsx(ClipboardList, { className: "h-5 w-5 text-white" }) }), _jsx(Button, { onClick: function () { return navigateFromBase("/calidad"); }, size: "sm", className: "bionapp-btn-green bionapp-nav-mini-btn bionapp-nav-mini-btn--icon shrink-0", title: t("nav.calidad"), children: _jsx(BadgeCheck, { className: "h-5 w-5 text-white" }) }), _jsx(Button, { onClick: function () { return navigateFromBase("/actions"); }, size: "sm", className: "bionapp-btn-green bionapp-nav-mini-btn bionapp-nav-mini-btn--icon shrink-0", title: t("nav.actions"), children: _jsx(Pickaxe, { className: "h-5 w-5 text-white" }) }), _jsx(Button, { onClick: function () { return navigateFromBase("/chips"); }, size: "sm", className: "bionapp-btn-green bionapp-nav-mini-btn bionapp-nav-mini-btn--icon shrink-0", title: t("nav.chips"), children: _jsx(Cpu, { className: "h-5 w-5 text-white" }) }), _jsx(Button, { onClick: function () { return navigateFromBase("/calcs"); }, size: "sm", className: "bionapp-btn-green bionapp-nav-mini-btn bionapp-nav-mini-btn--icon shrink-0", title: t("nav.calcs"), children: _jsx(Calculator, { className: "h-5 w-5 text-white" }) }), userRole === "admin" && (_jsx(Button, { onClick: function () { return navigateFromBase("/options"); }, size: "sm", className: "bionapp-btn-green bionapp-nav-mini-btn bionapp-nav-mini-btn--icon shrink-0", title: t("nav.options"), children: _jsx(CircleEllipsis, { className: "h-5 w-5 text-white" }) }))] })), (userRole === "admin" || isSetupPendingSample()) &&
                                                (!editMode ? (_jsx(Button, { onClick: toggleEditMode, size: "sm", className: "bionapp-nav-mini-btn bionapp-nav-mini-btn--icon shrink-0", title: t("app.edit"), children: _jsx(Edit, { className: "h-4 w-4 shrink-0" }) })) : (_jsxs(_Fragment, { children: [_jsxs(Button, { onClick: handleSave, size: "sm", className: "gap-2 shrink-0 bionapp-btn-green", title: t("common.save"), children: [_jsx(Save, { className: "h-4 w-4 shrink-0" }), _jsx("span", { className: "bionapp-nav-label", children: t("common.save") })] }), !isSetupPendingSample() ? (_jsxs(Button, { onClick: handleDiscard, variant: "outline", size: "sm", className: "gap-2 shrink-0", title: t("common.cancel"), children: [_jsx(X, { className: "h-4 w-4 shrink-0" }), _jsx("span", { className: "bionapp-nav-label", children: t("common.cancel") })] })) : null] }))), _jsxs(Button, { onClick: handleLogout, size: "sm", variant: "destructive", className: "gap-2 shrink-0 bionapp-nav-mini-btn", title: t("app.logout"), children: [_jsx(LogOut, { className: "h-5 w-5 shrink-0" }), _jsx("span", { className: "bionapp-nav-label", children: t("app.logout") })] })] })] }), filtroActivo ? (_jsxs("div", { className: "bionapp-filtro-activo mb-4 flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm".concat(filtroActivo.tipo === "completadas"
                                    ? " bionapp-filtro-activo--success"
                                    : filtroActivo.tipo === "pendientes"
                                        ? " bionapp-filtro-activo--warn"
                                        : filtroActivo.tipo === "fallidas"
                                            ? " bionapp-filtro-activo--danger"
                                            : ""), children: [_jsx("span", { children: t("app.filters.active", {
                                            label: filtroActivo.etiqueta,
                                            count: navegacionIndices.length,
                                        }) }), _jsxs(Button, { type: "button", size: "sm", variant: "outline", className: "h-7 gap-1.5 shrink-0", onClick: quitarFiltro, children: [_jsx(X, { className: "h-3.5 w-3.5" }), t("app.filters.clear")] })] })) : null, _jsxs("div", { className: "bionapp-card bionapp-panel bionapp-panel--muestra p-3 mb-2", children: [_jsxs("div", { className: "bionapp-form-grid text-sm", children: [_jsx("div", { className: "bionapp-field bionapp-field--estado-bn", children: _jsxs("div", { className: "bionapp-num-bn-cluster", children: [_jsx("button", { type: "button", onClick: handleToggleEstado, disabled: !editMode, className: "bionapp-icon-btn shrink-0 transition-transform duration-200\n                      ".concat(!editMode ? "cursor-not-allowed opacity-80" : "cursor-pointer hover:scale-110", "\n                    "), style: { width: 24, height: 24, minWidth: 24, minHeight: 24 }, title: estadoMuestra === 1 ? t("app.state.red") :
                                                                estadoMuestra === 2 ? t("app.state.yellow") :
                                                                    estadoMuestra === 3 ? t("app.state.green") :
                                                                        t("app.state.undefined"), children: _jsx(CircleDot, { size: 20, color: estadoMuestra === 1 ? "var(--bion-danger-fill)" :
                                                                    estadoMuestra === 2 ? "var(--bion-warn-fill)" :
                                                                        estadoMuestra === 3 ? "var(--bion-success-fill)" :
                                                                            "var(--bion-neutral-muted)", strokeWidth: 2 }) }), _jsx(Badge, { variant: "default", className: "bionapp-num-bn shrink-0", title: t("app.numBnTitle", { numBN: muestraActual.NumBN }), children: muestraActual.NumBN }), editMode && tagsCatalog.length > 0 ? (_jsxs("details", { className: "bionapp-tag-picker", children: [_jsxs("summary", { className: "bionapp-tag-picker__trigger bionapp-tag-picker__trigger--icon", title: t("app.tags.assign"), children: [_jsx(Tag, { size: 14, strokeWidth: 2.25 }), _jsx(ChevronDown, { size: 11, className: "bionapp-tag-picker__chevron" })] }), _jsx("div", { className: "bionapp-tag-picker__menu", role: "listbox", "aria-label": t("app.tags.aria"), children: tagsCatalog.map(function (t) {
                                                                        var selected = muestraTags.some(function (mt) { return Number(mt.Tag_Number) === Number(t.Tag_Number); });
                                                                        return (_jsxs("label", { className: "bionapp-tag-picker__item", children: [_jsx("input", { type: "checkbox", className: "h-3.5 w-3.5 shrink-0 accent-slate-900 dark:accent-slate-100", checked: selected, disabled: loadingTags, onChange: function () { return void handleToggleTag(Number(t.Tag_Number)); } }), _jsx(Tag, { size: 13, color: t.Tag_Color || "#64748b", strokeWidth: 2 }), _jsx("span", { className: "truncate", children: t.Tag_Name })] }, t.Tag_Number));
                                                                    }) })] })) : null, _jsxs("div", { className: "bionapp-muestra-tags", children: [muestraTags.map(function (t) { return (_jsx("span", { title: t.Tag_Name || "Tag #".concat(t.Tag_Number), className: "bionapp-muestra-tag-icon", children: _jsx(Tag, { size: 15, color: t.Tag_Color || "#64748b", strokeWidth: 2.25 }) }, t.Tag_Number)); }), preselectComentActual ? (_jsx("button", { type: "button", className: "bionapp-preselect-coment-btn shrink-0", title: preselectComentActual, onClick: handleGoToPreselectComent, children: _jsx(MessageSquare, { className: "h-3.5 w-3.5" }) })) : null] })] }) }), _jsxs("div", { className: "bionapp-field", children: [_jsx(Label, { className: "text-xs bionapp-field-label", children: t("app.field.requestNo") }), editMode ? (_jsx(Input, { value: muestraActual.Petic || "", onChange: function (e) { return handleChange("Petic", e.target.value); }, className: "h-7 text-xs" })) : (_jsx("span", { className: "text-xs", children: muestraActual.Petic || t("common.empty") }))] }), _jsxs("div", { className: "bionapp-field", children: [_jsx(Label, { className: "text-xs bionapp-field-label", children: t("app.field.position") }), editMode ? (_jsx(Input, { value: muestraActual.Posic || "", onChange: function (e) { return handleChange("Posic", e.target.value); }, className: "h-7 text-xs" })) : (_jsx("span", { className: "text-xs", children: muestraActual.Posic || t("common.empty") }))] }), _jsxs("div", { className: "bionapp-field", children: [_jsx(Label, { className: "text-xs bionapp-field-label", children: t("app.field.sampleType") }), editMode ? (_jsxs("select", { value: muestraActual.Muestra || "", onChange: function (e) { return handleChange("Muestra", parseInt(e.target.value)); }, className: "h-7 text-xs border rounded px-1", children: [_jsx("option", { value: "", children: t("common.selectPlaceholder") }), tiposMuestra.map(function (tipo) { return (_jsx("option", { value: tipo.Cod, children: tipo.TipoMuestra }, tipo.Cod)); })] })) : (_jsx("span", { className: "text-xs", children: ((_k = muestraActual.DMuestra) === null || _k === void 0 ? void 0 : _k.TipoMuestra) || t("common.empty") }))] }), _jsxs("div", { className: "bionapp-field", children: [_jsx(Label, { className: "text-xs bionapp-field-label", children: t("app.field.diagnosis") }), editMode ? (_jsxs("select", { value: muestraActual.Dx || "", onChange: function (e) { return handleChange("Dx", parseInt(e.target.value)); }, className: "h-7 text-xs border rounded px-1", children: [_jsx("option", { value: "", children: t("common.selectPlaceholder") }), dxs.map(function (d) { return (_jsx("option", { value: d.Cod, children: d.Dx }, d.Cod)); })] })) : (_jsx("span", { className: "text-xs", children: ((_l = muestraActual.DDx) === null || _l === void 0 ? void 0 : _l.Dx) || t("common.empty") }))] }), _jsxs("div", { className: "bionapp-field", children: [_jsx(Label, { className: "text-xs bionapp-field-label", children: t("app.field.processing") }), editMode ? (_jsx(Input, { value: muestraActual.Proces || "", onChange: function (e) { return handleChange("Proces", e.target.value); }, className: "h-7 text-xs" })) : (_jsx("span", { className: "text-xs", children: muestraActual.Proces || t("common.empty") }))] })] }), _jsxs("div", { className: "bionapp-span-full bionapp-field mt-2", children: [_jsx(Label, { className: "text-xs bionapp-field-label", children: t("app.field.comment") }), editMode ? (_jsx(Input, { value: muestraActual.Coment_Muestra || "", onChange: function (e) { return handleChange("Coment_Muestra", e.target.value); }, className: "h-7 text-xs flex-1 min-w-0" })) : (_jsx("span", { className: "text-xs", children: muestraActual.Coment_Muestra || t("common.empty") }))] })] }), _jsx("div", { className: "bionapp-card bionapp-panel p-3 mb-2", children: _jsxs("div", { className: "bionapp-form-grid text-sm", children: [_jsxs("div", { className: "bionapp-field bionapp-field--nowrap", children: [_jsx(Label, { className: "text-xs bionapp-field-label", children: t("app.field.extractionDate") }), editMode ? (_jsx(Input, { type: "date", value: formatDateForInput(muestraActual.Fecha || ""), onChange: function (e) { return handleChange("Fecha", e.target.value); }, className: "h-7 text-xs bionapp-campo-fecha" })) : (_jsx("span", { className: "text-xs whitespace-nowrap", children: formatDateDisplay(muestraActual.Fecha) }))] }), _jsxs("div", { className: "bionapp-field", children: [_jsx(Label, { className: "text-xs bionapp-field-label", children: "Pellet:" }), editMode ? (_jsx(Input, { value: muestraActual.Pellet || "", onChange: function (e) { return handleChange("Pellet", e.target.value); }, className: "h-7 text-xs" })) : (_jsx("span", { className: "text-xs", children: muestraActual.Pellet || t("common.empty") }))] }), _jsx(LoteLnField, { editMode: editMode, lots: lotesExtraido, current: {
                                                id: muestraActual.Id_LtE,
                                                PN: muestraActual.PN,
                                                LN: muestraActual.LN,
                                                Exp: muestraActual.Exp,
                                            }, label: "LN:", onSelect: applyExtractionLot, onOpen: function () { return goToLot("extraido", muestraActual.Id_LtE, muestraActual.LN); } }), _jsxs("div", { className: "bionapp-field bionapp-field--with-action", children: [_jsx(Label, { className: "text-xs bionapp-field-label", children: "Medusa:" }), editMode ? (_jsxs("div", { className: "bionapp-field-control-row", children: [_jsx(Input, { value: muestraActual.Medusa || "", onChange: function (e) { return handleChange("Medusa", e.target.value); }, className: "h-7 text-xs min-w-0" }), _jsx(Button, { onClick: handleCopyFromPrevious, size: "sm", className: "bionapp-btn-info h-7 w-8 p-0 shrink-0 rounded flex items-center justify-center", title: t("app.copy.extractionTitle"), type: "button", children: _jsx(ArrowDownToLine, { className: "h-4 w-4 text-white" }) })] })) : (_jsx("span", { className: "text-xs", children: muestraActual.Medusa || t("common.empty") }))] }), _jsxs("div", { className: "bionapp-span-2 bionapp-field", children: [_jsx(Label, { className: "text-xs bionapp-field-label", children: t("app.field.viscosity") }), editMode ? (_jsx(Input, { value: muestraActual.Visco_grado || "", onChange: function (e) { return handleChange("Visco_grado", e.target.value); }, className: "h-7 text-xs flex-1 min-w-0" })) : (_jsx("span", { className: "text-xs", children: displayValue(muestraActual.Visco_grado) }))] }), _jsxs("div", { className: "bionapp-span-4 bionapp-field", children: [_jsx(Label, { className: "text-xs bionapp-field-label", children: t("app.field.comment") }), editMode ? (_jsx(Input, { value: muestraActual.Coment_Extracc || "", onChange: function (e) { return handleChange("Coment_Extracc", e.target.value); }, className: "h-7 text-xs flex-1 min-w-0" })) : (_jsx("span", { className: "text-xs", children: muestraActual.Coment_Extracc || t("common.empty") }))] })] }) }), muestraActual.lecturas && muestraActual.lecturas.length > 0 ? (_jsxs("div", { className: "bionapp-card bionapp-lectura-extraido-panel p-2.5 min-w-0 mb-0", children: [_jsxs("div", { className: "bionapp-section-toolbar mb-1.5", children: [_jsx("h3", { className: "text-sm font-medium", children: t("app.extracted.title") }), _jsxs("div", { className: "bionapp-section-toolbar__actions flex items-center gap-2 shrink-0", children: [_jsx(Button, { onClick: handlePrevLectura, disabled: editMode || currentLecturaIndex === 0, variant: "outline", size: "sm", children: _jsx(ChevronLeft, { className: "h-3 w-3" }) }), _jsx("span", { className: "text-xs", children: t("common.nOfTotal", { current: currentLecturaIndex + 1, total: muestraActual.lecturas.length }) }), _jsx(Button, { onClick: handleNextLectura, disabled: editMode || currentLecturaIndex === muestraActual.lecturas.length - 1, variant: "outline", size: "sm", children: _jsx(ChevronRight, { className: "h-3 w-3" }) }), editMode && currentLecturaIndex === muestraActual.lecturas.length - 1 && (_jsx(Button, { onClick: handleDeleteLectura, size: "sm", variant: "destructive", title: t("app.extracted.delete"), children: _jsx(Minus, { className: "h-3 w-3" }) })), !editMode && (_jsx(Button, { onClick: handleAddLecturaNueva, size: "sm", className: "bionapp-btn-green", title: t("app.extracted.add"), children: "+" }))] })] }), (function () {
                                        var _a, _b, _c, _d, _e, _f;
                                        var lectura = muestraActual.lecturas[currentLecturaIndex];
                                        var lectIdx = currentLecturaIndex;
                                        var lecturaStats = editMode
                                            ? calcStatsLectura(lectura.Izq, lectura.Cen, lectura.Dcha)
                                            : null;
                                        return (_jsxs("div", { children: [_jsxs("div", { className: "bionapp-lectura-extraido-data text-xs mb-1", children: [_jsxs("div", { className: "bionapp-lectura-block bionapp-lectura-block--meta", children: [_jsxs("div", { className: "bionapp-lectura-item", children: [_jsx(Label, { className: "text-xs shrink-0", children: t("app.field.number") }), _jsx(Badge, { variant: "secondary", className: "text-xs", children: lectura.NumLectura })] }), _jsxs("div", { className: "bionapp-lectura-item bionapp-lectura-item--fecha", children: [_jsx(Label, { className: "text-xs shrink-0", children: t("app.field.date") }), editMode ? (_jsx(Input, { type: "date", value: formatDateForInput(lectura.Fecha_lectura), onChange: function (e) { return handleChange("lecturas.".concat(lectIdx, ".Fecha_lectura"), e.target.value); }, className: "h-7 text-xs bionapp-campo-fecha" })) : (_jsx("span", { className: "text-xs", children: formatDateDisplay(lectura.Fecha_lectura) }))] })] }), _jsxs("div", { className: "bionapp-lectura-block bionapp-lectura-block--stats", children: [_jsxs("div", { className: "bionapp-lectura-stats-grupo bionapp-lectura-stats-grupo--lecturas", children: [_jsxs("div", { className: "bionapp-lectura-item", children: [_jsxs(Label, { className: "text-xs shrink-0", children: [t("app.quant.left"), ":"] }), editMode ? (_jsx(Input, { type: "number", value: lectura.Izq || "", onChange: function (e) { return handleChange("lecturas.".concat(lectIdx, ".Izq"), e.target.value); }, className: "h-7 text-xs bionapp-campo-cuant" })) : (_jsx("span", { className: "text-xs", children: displayValue(lectura.Izq) }))] }), _jsxs("div", { className: "bionapp-lectura-item", children: [_jsxs(Label, { className: "text-xs shrink-0", children: [t("app.quant.center"), ":"] }), editMode ? (_jsx(Input, { type: "number", value: lectura.Cen || "", onChange: function (e) { return handleChange("lecturas.".concat(lectIdx, ".Cen"), e.target.value); }, className: "h-7 text-xs bionapp-campo-cuant" })) : (_jsx("span", { className: "text-xs", children: displayValue(lectura.Cen) }))] }), _jsxs("div", { className: "bionapp-lectura-item", children: [_jsxs(Label, { className: "text-xs shrink-0", children: [t("app.quant.right"), ":"] }), editMode ? (_jsx(Input, { type: "number", value: lectura.Dcha || "", onChange: function (e) { return handleChange("lecturas.".concat(lectIdx, ".Dcha"), e.target.value); }, className: "h-7 text-xs bionapp-campo-cuant" })) : (_jsx("span", { className: "text-xs", children: displayValue(lectura.Dcha) }))] })] }), _jsxs("div", { className: "bionapp-lectura-stats-grupo bionapp-lectura-stats-grupo--resumen", children: [_jsxs("div", { className: "bionapp-lectura-item", children: [_jsx(Label, { className: "text-xs shrink-0", children: "x\u0304:" }), _jsx("span", { className: "bionapp-campo-media-valor text-xs ".concat(mediaExtraidoSemaforoClass((lecturaStats === null || lecturaStats === void 0 ? void 0 : lecturaStats.media) != null ? lecturaStats.media : lectura.Media_Lectura)), children: displayValue((lecturaStats === null || lecturaStats === void 0 ? void 0 : lecturaStats.media) != null
                                                                                        ? formatCalcStat(lecturaStats.media)
                                                                                        : (_b = (_a = lectura.Media_Lectura) === null || _a === void 0 ? void 0 : _a.toFixed) === null || _b === void 0 ? void 0 : _b.call(_a, 2)) })] }), _jsxs("div", { className: "bionapp-lectura-item", children: [_jsx(Label, { className: "text-xs shrink-0", children: "SD:" }), _jsx("span", { className: "text-xs", children: displayValue((lecturaStats === null || lecturaStats === void 0 ? void 0 : lecturaStats.sd) != null
                                                                                        ? formatCalcStat(lecturaStats.sd)
                                                                                        : (_d = (_c = lectura.SD_Lectura) === null || _c === void 0 ? void 0 : _c.toFixed) === null || _d === void 0 ? void 0 : _d.call(_c, 2)) })] }), _jsxs("div", { className: "bionapp-lectura-item", children: [_jsx(Label, { className: "text-xs shrink-0", children: "CV:" }), _jsx("span", { className: "text-xs", children: displayValue((lecturaStats === null || lecturaStats === void 0 ? void 0 : lecturaStats.cv) != null
                                                                                        ? formatCalcStat(lecturaStats.cv)
                                                                                        : (_f = (_e = lectura.CV_Lectura) === null || _e === void 0 ? void 0 : _e.toFixed) === null || _f === void 0 ? void 0 : _f.call(_e, 2)) })] })] })] }), _jsx("div", { className: "bionapp-lectura-block bionapp-lectura-block--coment", children: _jsxs("div", { className: "bionapp-lectura-item bionapp-lectura-item--coment", children: [_jsx(Label, { className: "text-xs shrink-0", children: t("app.field.commentShort") }), editMode ? (_jsx(Input, { value: lectura.Coment_Lectura || "", onChange: function (e) { return handleChange("lecturas.".concat(lectIdx, ".Coment_Lectura"), e.target.value); }, className: "h-7 text-xs flex-1" })) : (_jsx("span", { className: "text-xs", children: lectura.Coment_Lectura || t("common.empty") }))] }) })] }), lectura.marcado && lectura.marcado.lecturasMarcado && lectura.marcado.lecturasMarcado.length > 0 ? (_jsxs("div", { className: "bionapp-marcado-panel p-2 min-w-0", children: [_jsxs("div", { className: "bionapp-section-toolbar mb-1.5", children: [_jsx("h4", { className: "text-xs font-medium", children: t("app.labeled.title") }), _jsxs("div", { className: "bionapp-section-toolbar__actions flex items-center gap-2 shrink-0", children: [_jsx(Button, { onClick: handlePrevLectMarc, disabled: editMode || currentLectMarcIndex === 0, variant: "outline", size: "sm", children: _jsx(ChevronLeft, { className: "h-3 w-3" }) }), _jsx("span", { className: "text-xs", children: t("common.nOfTotal", { current: currentLectMarcIndex + 1, total: lectura.marcado.lecturasMarcado.length }) }), _jsx(Button, { onClick: handleNextLectMarc, disabled: editMode || currentLectMarcIndex === lectura.marcado.lecturasMarcado.length - 1, variant: "outline", size: "sm", children: _jsx(ChevronRight, { className: "h-3 w-3" }) }), editMode && (_jsx(Button, { onClick: handleCopyMarcadoFromPreviousMuestra, size: "sm", className: "bionapp-btn-info h-7 w-8 p-0 shrink-0 rounded flex items-center justify-center", title: t("app.copy.labeledTitle"), type: "button", children: _jsx(ArrowDownToLine, { className: "h-4 w-4 text-white" }) })), editMode && currentLectMarcIndex === lectura.marcado.lecturasMarcado.length - 1 && (_jsx(Button, { onClick: handleDeleteLecturaMarcada, size: "sm", variant: "destructive", title: t("app.labeled.delete"), children: _jsx(Minus, { className: "h-3 w-3" }) })), !editMode && (_jsx(Button, { onClick: handleAddLecturaMarcadoNueva, size: "sm", className: "bionapp-btn-green", title: t("app.labeled.add"), children: "+" }))] })] }), (function () {
                                                            var _a, _b, _c, _d, _e, _f, _g;
                                                            var lm = lectura.marcado.lecturasMarcado[currentLectMarcIndex];
                                                            var lmIdx = currentLectMarcIndex;
                                                            var lmStats = editMode ? calcStatsMarcado(lm.Izq_LM, lm.Dcha_LM) : null;
                                                            return (_jsxs("div", { className: "bionapp-marcado-lm text-xs mb-0", children: [_jsxs("div", { className: "bionapp-marcado-lm__stack", children: [_jsxs("div", { className: "bionapp-marcado-block bionapp-marcado-block--head", children: [_jsxs("div", { className: "bionapp-marcado-field bionapp-marcado-field--num", children: [_jsx(Label, { className: "text-xs shrink-0", children: t("app.field.number") }), _jsx(Badge, { variant: "outline", className: "text-xs", children: lm.NumLectMarc })] }), _jsxs("div", { className: "bionapp-marcado-field bionapp-marcado-field--fecha", children: [_jsx(Label, { className: "text-xs shrink-0", children: t("app.field.date") }), editMode ? (_jsx(Input, { type: "date", value: formatDateForInput(lm.Fecha_Lect_Marc), onChange: function (e) {
                                                                                                    return handleChange("lecturas.".concat(lectIdx, ".marcado.lecturasMarcado.").concat(lmIdx, ".Fecha_Lect_Marc"), e.target.value);
                                                                                                }, className: "h-7 text-xs" })) : (_jsx("span", { className: "text-xs", children: formatDateDisplay(lm.Fecha_Lect_Marc) }))] })] }), _jsxs("div", { className: "bionapp-marcado-lote", children: [_jsx(LoteLnField, { layout: "inline", editMode: editMode, lots: lotesMarcado, current: {
                                                                                            id: lm.Id_LtM,
                                                                                            PN: lm.PN_LM,
                                                                                            LN: lm.LN_LM,
                                                                                            Exp: lm.Exp_LM,
                                                                                        }, label: "LN:", onSelect: function (lot) {
                                                                                            var _a, _b, _c, _d;
                                                                                            return applyLmLotFields(lectIdx, lmIdx, {
                                                                                                Id_LtM: (_a = lot === null || lot === void 0 ? void 0 : lot.id) !== null && _a !== void 0 ? _a : null,
                                                                                                PN_LM: (_b = lot === null || lot === void 0 ? void 0 : lot.PN) !== null && _b !== void 0 ? _b : null,
                                                                                                LN_LM: (_c = lot === null || lot === void 0 ? void 0 : lot.LN) !== null && _c !== void 0 ? _c : null,
                                                                                                Exp_LM: (_d = lot === null || lot === void 0 ? void 0 : lot.Exp) !== null && _d !== void 0 ? _d : null,
                                                                                            });
                                                                                        }, onOpen: function () { return goToLot("marcado", lm.Id_LtM, lm.LN_LM); } }), _jsx(LoteLnField, { layout: "inline", editMode: editMode, lots: lotesMembrana, current: {
                                                                                            id: lm.Id_LtMm,
                                                                                            PN: lm.PNM_LM,
                                                                                            LN: lm.LNM_LM,
                                                                                            Exp: lm.ExpM_LM,
                                                                                        }, label: "LNm:", onSelect: function (lot) {
                                                                                            var _a, _b, _c, _d;
                                                                                            return applyLmLotFields(lectIdx, lmIdx, {
                                                                                                Id_LtMm: (_a = lot === null || lot === void 0 ? void 0 : lot.id) !== null && _a !== void 0 ? _a : null,
                                                                                                PNM_LM: (_b = lot === null || lot === void 0 ? void 0 : lot.PN) !== null && _b !== void 0 ? _b : null,
                                                                                                LNM_LM: (_c = lot === null || lot === void 0 ? void 0 : lot.LN) !== null && _c !== void 0 ? _c : null,
                                                                                                ExpM_LM: (_d = lot === null || lot === void 0 ? void 0 : lot.Exp) !== null && _d !== void 0 ? _d : null,
                                                                                            });
                                                                                        }, onOpen: function () { return goToLot("membrana", lm.Id_LtMm, lm.LNM_LM); } }), _jsxs("div", { className: "bionapp-marcado-block bionapp-marcado-block--comment", children: [_jsx(Label, { className: "text-xs whitespace-nowrap", children: t("app.field.comment") }), editMode ? (_jsx(Input, { value: (_a = lm.Comentario_LMarcado) !== null && _a !== void 0 ? _a : "", onChange: function (e) {
                                                                                                    return handleChange("lecturas.".concat(lectIdx, ".marcado.lecturasMarcado.").concat(lmIdx, ".Comentario_LMarcado"), e.target.value);
                                                                                                }, placeholder: t("app.labeled.commentPlaceholder"), className: "h-7 text-xs bionapp-marcado-lm__comment-input" })) : (_jsx("span", { className: "text-xs text-slate-600 italic truncate min-w-0", children: lm.Comentario_LMarcado || t("common.empty") }))] })] }), _jsxs("div", { className: "bionapp-marcado-block bionapp-marcado-block--measures", children: [_jsxs("div", { className: "bionapp-marcado-field bionapp-marcado-field--stat", children: [_jsxs(Label, { className: "text-xs shrink-0", children: [t("app.quant.left"), ":"] }), editMode ? (_jsx(Input, { type: "number", value: lm.Izq_LM || "", onChange: function (e) { return handleChange("lecturas.".concat(lectIdx, ".marcado.lecturasMarcado.").concat(lmIdx, ".Izq_LM"), e.target.value); }, className: "h-7 text-xs bionapp-campo-cuant max-w-full" })) : (_jsx("span", { className: "text-xs", children: displayValue(lm.Izq_LM) }))] }), _jsxs("div", { className: "bionapp-marcado-field bionapp-marcado-field--stat", children: [_jsxs(Label, { className: "text-xs shrink-0", children: [t("app.quant.right"), ":"] }), editMode ? (_jsx(Input, { type: "number", value: lm.Dcha_LM || "", onChange: function (e) { return handleChange("lecturas.".concat(lectIdx, ".marcado.lecturasMarcado.").concat(lmIdx, ".Dcha_LM"), e.target.value); }, className: "h-7 text-xs bionapp-campo-cuant max-w-full" })) : (_jsx("span", { className: "text-xs", children: displayValue(lm.Dcha_LM) }))] }), _jsxs("div", { className: "bionapp-marcado-field bionapp-marcado-field--stat", children: [_jsx(Label, { className: "text-xs shrink-0", children: "x\u0304:" }), _jsx("span", { className: "bionapp-campo-media-valor text-xs ".concat(mediaMarcadoSemaforoClass((lmStats === null || lmStats === void 0 ? void 0 : lmStats.media) != null ? lmStats.media : lm.Media_LM)), children: displayValue((lmStats === null || lmStats === void 0 ? void 0 : lmStats.media) != null
                                                                                                    ? formatCalcStat(lmStats.media)
                                                                                                    : (_c = (_b = lm.Media_LM) === null || _b === void 0 ? void 0 : _b.toFixed) === null || _c === void 0 ? void 0 : _c.call(_b, 2)) })] }), _jsxs("div", { className: "bionapp-marcado-field bionapp-marcado-field--stat", children: [_jsx(Label, { className: "text-xs shrink-0", children: "SD:" }), _jsx("span", { className: "text-xs", children: displayValue((lmStats === null || lmStats === void 0 ? void 0 : lmStats.sd) != null
                                                                                                    ? formatCalcStat(lmStats.sd)
                                                                                                    : (_e = (_d = lm.SD_LM) === null || _d === void 0 ? void 0 : _d.toFixed) === null || _e === void 0 ? void 0 : _e.call(_d, 2)) })] }), _jsxs("div", { className: "bionapp-marcado-field bionapp-marcado-field--stat", children: [_jsx(Label, { className: "text-xs shrink-0", children: "CV:" }), _jsx("span", { className: "text-xs", children: displayValue((lmStats === null || lmStats === void 0 ? void 0 : lmStats.cv) != null
                                                                                                    ? formatCalcStat(lmStats.cv)
                                                                                                    : (_g = (_f = lm.CV_LM) === null || _f === void 0 ? void 0 : _f.toFixed) === null || _g === void 0 ? void 0 : _g.call(_f, 2)) })] })] })] }), _jsxs("div", { className: "bionapp-chips-block bionapp-marcado-lm__chips flex flex-col gap-1 w-full min-w-0", children: [_jsx(Label, { className: "text-xs", children: t("app.chips.label") }), (lm.chips || []).map(function (chip, chipIdx) {
                                                                                var _a, _b, _c;
                                                                                return (_jsx("div", { className: "bionapp-chip-item", children: _jsxs("div", { className: "bionapp-chip-item__head", children: [_jsxs("span", { className: "text-xs font-medium shrink-0", children: ["#", chip.NumChip || ""] }), _jsx("span", { className: "bionapp-chip-item__nombre text-xs text-slate-600", children: chip.Chip_Nombre || "" }), editMode ? (_jsxs("select", { value: (_a = chip.FC) !== null && _a !== void 0 ? _a : "", onChange: function (e) {
                                                                                                    return handleChange("lecturas.".concat(lectIdx, ".marcado.lecturasMarcado.").concat(lmIdx, ".chips.").concat(chipIdx, ".FC"), e.target.value);
                                                                                                }, className: "bionapp-chip-fc-select h-6 text-[11px] shrink-0 rounded border border-slate-300 bg-white px-1", children: [_jsx("option", { value: "", children: t("app.chips.fcPlaceholder") }), (function () {
                                                                                                        var libres = fcLibresParaChip(Number(chip.NumChip), asignacionesChip, chip);
                                                                                                        var actual = chip.FC != null && chip.FC !== "" ? Number(chip.FC) : null;
                                                                                                        var opciones = actual != null && !libres.includes(actual)
                                                                                                            ? __spreadArray([actual], libres, true) : libres;
                                                                                                        return opciones.map(function (fc) { return (_jsx("option", { value: fc, children: fc }, fc)); });
                                                                                                    })()] })) : (_jsx("span", { className: "text-xs text-slate-500 shrink-0", children: t("app.chips.fcValue", { fc: (_b = chip.FC) !== null && _b !== void 0 ? _b : t("common.empty") }) })), _jsx("button", { type: "button", onClick: editMode
                                                                                                    ? function () {
                                                                                                        return handleToggleRepetirChip(lectIdx, lmIdx, chipIdx);
                                                                                                    }
                                                                                                    : undefined, disabled: !editMode, className: editMode
                                                                                                    ? "bionapp-icon-btn shrink-0 cursor-pointer hover:scale-110 transition-transform duration-200"
                                                                                                    : "bionapp-icon-btn shrink-0 cursor-not-allowed opacity-80", title: repetirChipActivado(chip.Repetir_Chip)
                                                                                                    ? editMode
                                                                                                        ? t("app.chips.repeatOnEdit")
                                                                                                        : t("app.chips.repeatOn")
                                                                                                    : editMode
                                                                                                        ? t("app.chips.repeatMarkEdit")
                                                                                                        : t("app.chips.repeatMark"), children: _jsx(TriangleAlert, { size: 16, color: repetirChipActivado(chip.Repetir_Chip)
                                                                                                        ? "var(--bion-warn-fill)"
                                                                                                        : "var(--bion-neutral-muted)", strokeWidth: 2.25 }) }), editMode ? (_jsxs("div", { className: "bionapp-chip-item__tail", children: [_jsx(Input, { value: (_c = chip.Coment_Chip) !== null && _c !== void 0 ? _c : "", onChange: function (e) {
                                                                                                            return handleChange("lecturas.".concat(lectIdx, ".marcado.lecturasMarcado.").concat(lmIdx, ".chips.").concat(chipIdx, ".Coment_Chip"), e.target.value);
                                                                                                        }, placeholder: t("app.chips.commentPlaceholder"), className: "bionapp-chip-comment h-7 text-[11px]" }), _jsx(Button, { onClick: function () {
                                                                                                            return handleDeleteChipAssignment(lectIdx, lmIdx, chipIdx);
                                                                                                        }, size: "sm", variant: "destructive", className: "bionapp-chip-action-btn", title: t("app.chips.delete"), children: _jsx(Minus, { className: "h-3 w-3" }) })] })) : chip.Coment_Chip ? (_jsx("span", { className: "bionapp-chip-item__comentario text-xs text-slate-600 italic", children: chip.Coment_Chip })) : null] }) }, "".concat(chip.NumChip, "-").concat(chipIdx)));
                                                                            }), editMode && (_jsxs("div", { className: "bionapp-chip-add-row", children: [_jsxs("select", { value: newChipNumber, onChange: function (e) { return setNewChipNumber(e.target.value); }, className: "bionapp-chip-add-select h-7 text-xs min-w-0 border rounded px-1", children: [_jsx("option", { value: "", children: (lm.chips || []).length > 0
                                                                                                    ? t("app.chips.addAnother")
                                                                                                    : t("app.chips.select") }), dChips
                                                                                                .filter(function (c) {
                                                                                                if ((lm.chips || []).some(function (asig) {
                                                                                                    return Number(asig.NumChip) === Number(c.NumChip_D);
                                                                                                })) {
                                                                                                    return false;
                                                                                                }
                                                                                                return chipTieneHuecoDisponible(Number(c.NumChip_D), asignacionesChip);
                                                                                            })
                                                                                                .map(function (chipOpt) {
                                                                                                var libres = fcLibresParaChip(Number(chipOpt.NumChip_D), asignacionesChip);
                                                                                                return (_jsxs("option", { value: chipOpt.NumChip_D, children: ["#", chipOpt.NumChip_D, " - ", chipOpt.Nombre_Chip, " (", libres.length === 3
                                                                                                            ? t("chips.fc.allFree")
                                                                                                            : libres.length === 0
                                                                                                                ? t("chips.fc.noneFree")
                                                                                                                : t("chips.fc.someFree", { slots: libres.join(", ") }), ")"] }, chipOpt.NumChip_D));
                                                                                            })] }), _jsx(Button, { onClick: handleAddChip, size: "sm", className: "bionapp-chip-action-btn", disabled: !newChipNumber, title: t("app.chips.addToLm"), children: _jsx(Plus, { className: "h-3 w-3" }) })] })), !editMode && (lm.chips || []).length === 0 && (_jsx("span", { className: "text-xs text-slate-400", children: t("app.chips.none") }))] })] }, lmIdx));
                                                        })()] })) : (!editMode && (_jsx("div", { className: "flex items-center gap-2 p-2", children: _jsx(Button, { onClick: handleAddLecturaMarcado, size: "sm", className: "bionapp-btn-green", children: t("app.labeled.addFirst") }) })))] }));
                                    })()] })) : (!editMode && (_jsx(Button, { onClick: handleAddLectura, size: "sm", className: "bionapp-btn-green", children: t("app.extracted.addFirst") })))] }), _jsx("div", { className: "max-w-[1600px] mx-auto w-full min-w-0", children: _jsx(AppFooter, {}) })] })] }));
}
export default App;
