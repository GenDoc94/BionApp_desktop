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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import SubpageShell from "../components/SubpageShell";
import { supabase } from "../lib/supabaseClient";
import { Toaster, toast } from "sonner";
import { buildFechaPreselectNow, crearMuestraDesdePreselect, fetchNextNumBN, formatPreselectFecha, labelDxPreselect, parsePeticInput, parsePreselectHighlightPetic, sortPreselectRows, samePetic, filterPreselectByDx, PRESELECT_DX_FILTER_NONE, } from "../lib/preselectData";
import { buildMuestraAppPath, saveMuestraNavegacion } from "../lib/navegacionMuestra";
import { ClipboardList, ExternalLink, Plus, Save, SquarePen, Trash2, X, ChevronLeft, ChevronRight, } from "lucide-react";
function PreselectPage() {
    var _this = this;
    var t = useTranslation().t;
    var navigate = useNavigate();
    var _a = useSearchParams(), searchParams = _a[0], setSearchParams = _a[1];
    var pendingHighlightPetic = useRef(null);
    var _b = useState([]), rows = _b[0], setRows = _b[1];
    var _c = useState([]), dxList = _c[0], setDxList = _c[1];
    var _d = useState(true), loading = _d[0], setLoading = _d[1];
    var _e = useState(""), newPetic = _e[0], setNewPetic = _e[1];
    var _f = useState(""), newComent = _f[0], setNewComent = _f[1];
    var _g = useState(""), newDx = _g[0], setNewDx = _g[1];
    var _h = useState(false), adding = _h[0], setAdding = _h[1];
    var _j = useState(null), editingPetic = _j[0], setEditingPetic = _j[1];
    var _k = useState(""), editingComent = _k[0], setEditingComent = _k[1];
    var _l = useState(""), editingDx = _l[0], setEditingDx = _l[1];
    var _m = useState(false), savingRow = _m[0], setSavingRow = _m[1];
    var _o = useState(null), creatingMuestraPetic = _o[0], setCreatingMuestraPetic = _o[1];
    var _p = useState("desc"), addedSortOrder = _p[0], setAddedSortOrder = _p[1];
    var _q = useState("added"), inSamplesSortKey = _q[0], setInSamplesSortKey = _q[1];
    var _r = useState("desc"), inSamplesSortDir = _r[0], setInSamplesSortDir = _r[1];
    var _s = useState(10), pendingPageSize = _s[0], setPendingPageSize = _s[1];
    var _t = useState(0), pendingPageIndex = _t[0], setPendingPageIndex = _t[1];
    var _u = useState(""), pendingDxFilter = _u[0], setPendingDxFilter = _u[1];
    var fetchRows = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var _a, _b, data, error, _c, dxData, dxError;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    setLoading(true);
                    return [4 /*yield*/, Promise.all([
                            supabase
                                .from("Preselect")
                                .select("Petic_Preselect, Coment_Preselect, NumBN_Preselect, Fecha_Preselect, Dx_Preselect, DDx ( Dx )")
                                .order("Fecha_Preselect", { ascending: false })
                                .order("Petic_Preselect", { ascending: true }),
                            supabase.from("DDx").select("Cod, Dx").order("Dx", { ascending: true }),
                        ])];
                case 1:
                    _a = _d.sent(), _b = _a[0], data = _b.data, error = _b.error, _c = _a[1], dxData = _c.data, dxError = _c.error;
                    if (error) {
                        console.error("Error al cargar preselección:", error);
                        toast.error(t("preselect.toast.loadError"));
                        setRows([]);
                    }
                    else {
                        setRows((data || []));
                    }
                    if (dxError) {
                        console.error("Error al cargar diagnósticos:", dxError);
                        toast.error(t("preselect.toast.dxLoadError"));
                        setDxList([]);
                    }
                    else {
                        setDxList((dxData || []));
                    }
                    setLoading(false);
                    return [2 /*return*/];
            }
        });
    }); }, [t]);
    useEffect(function () {
        void fetchRows();
    }, [fetchRows]);
    useEffect(function () {
        var petic = parsePreselectHighlightPetic(searchParams);
        if (petic != null)
            pendingHighlightPetic.current = petic;
    }, [searchParams]);
    useEffect(function () {
        if (loading || pendingHighlightPetic.current == null)
            return;
        var petic = pendingHighlightPetic.current;
        pendingHighlightPetic.current = null;
        setSearchParams({}, { replace: true });
        window.requestAnimationFrame(function () {
            var el = document.getElementById("preselect-coment-".concat(petic));
            if (!el) {
                toast.error(t("preselect.toast.peticNotFound", { petic: petic }));
                return;
            }
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.classList.add("bionapp-preselect-coment-cell--flash");
            window.setTimeout(function () { return el.classList.remove("bionapp-preselect-coment-cell--flash"); }, 1800);
        });
    }, [loading, rows, setSearchParams]);
    var pendientes = useMemo(function () {
        return sortPreselectRows(filterPreselectByDx(rows.filter(function (row) { return row.NumBN_Preselect == null; }), pendingDxFilter), "added", addedSortOrder);
    }, [rows, addedSortOrder, pendingDxFilter]);
    var enMuestras = useMemo(function () {
        return sortPreselectRows(rows.filter(function (row) { return row.NumBN_Preselect != null; }), inSamplesSortKey, inSamplesSortDir);
    }, [rows, inSamplesSortKey, inSamplesSortDir]);
    var duplicatePeticInInput = useMemo(function () {
        var petic = parsePeticInput(newPetic);
        if (petic == null)
            return false;
        return rows.some(function (row) { return samePetic(row.Petic_Preselect, petic); });
    }, [newPetic, rows]);
    var pendingPageSizeResolved = useMemo(function () {
        return pendingPageSize === "all" ? pendientes.length : pendingPageSize;
    }, [pendingPageSize, pendientes.length]);
    var pendingMaxPageIndex = useMemo(function () {
        if (pendingPageSizeResolved <= 0)
            return 0;
        return Math.max(0, Math.ceil(pendientes.length / pendingPageSizeResolved) - 1);
    }, [pendingPageSizeResolved, pendientes.length]);
    useEffect(function () {
        setPendingPageIndex(0);
    }, [pendingDxFilter]);
    useEffect(function () {
        setPendingPageIndex(function (prev) { return Math.min(prev, pendingMaxPageIndex); });
    }, [pendingMaxPageIndex]);
    var pendientesPaged = useMemo(function () {
        if (pendingPageSizeResolved <= 0)
            return [];
        var start = pendingPageIndex * pendingPageSizeResolved;
        return pendientes.slice(start, start + pendingPageSizeResolved);
    }, [pendientes, pendingPageIndex, pendingPageSizeResolved]);
    function handleAddPreselect() {
        return __awaiter(this, void 0, void 0, function () {
            var petic, dxCod, error, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        petic = parsePeticInput(newPetic);
                        if (petic == null) {
                            toast.error(t("preselect.toast.invalidPetic"));
                            return [2 /*return*/];
                        }
                        if (rows.some(function (row) { return samePetic(row.Petic_Preselect, petic); })) {
                            toast.error(t("preselect.toast.duplicate"));
                            return [2 /*return*/];
                        }
                        setAdding(true);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, 5, 6]);
                        dxCod = newDx ? Number(newDx) : null;
                        return [4 /*yield*/, supabase.from("Preselect").insert({
                                Petic_Preselect: petic,
                                Coment_Preselect: newComent.trim() || null,
                                NumBN_Preselect: null,
                                Fecha_Preselect: buildFechaPreselectNow(),
                                Dx_Preselect: dxCod,
                            })];
                    case 2:
                        error = (_a.sent()).error;
                        if (error) {
                            if (error.code === "23505") {
                                toast.error(t("preselect.toast.duplicate"));
                            }
                            else {
                                throw error;
                            }
                            return [2 /*return*/];
                        }
                        toast.success(t("preselect.toast.added"));
                        setNewPetic("");
                        setNewComent("");
                        setNewDx("");
                        return [4 /*yield*/, fetchRows()];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 4:
                        err_1 = _a.sent();
                        console.error("Error al añadir preselección:", err_1);
                        toast.error(t("preselect.toast.addError"));
                        return [3 /*break*/, 6];
                    case 5:
                        setAdding(false);
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    }
    function handleDelete(row) {
        return __awaiter(this, void 0, void 0, function () {
            var error, err_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (row.NumBN_Preselect != null) {
                            toast.error(t("preselect.toast.alreadyInSamples", {
                                petic: row.Petic_Preselect,
                                numBN: row.NumBN_Preselect,
                            }));
                            return [2 /*return*/];
                        }
                        if (!confirm(t("preselect.confirm.delete", { petic: row.Petic_Preselect })))
                            return [2 /*return*/];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, supabase
                                .from("Preselect")
                                .delete()
                                .eq("Petic_Preselect", row.Petic_Preselect)];
                    case 2:
                        error = (_a.sent()).error;
                        if (error)
                            throw error;
                        if (editingPetic === row.Petic_Preselect) {
                            handleCancelEditRow();
                        }
                        toast.success(t("preselect.toast.deleted"));
                        return [4 /*yield*/, fetchRows()];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        err_2 = _a.sent();
                        console.error("Error al eliminar preselección:", err_2);
                        toast.error(t("preselect.toast.deleteError"));
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    function handleStartEditRow(row) {
        var _a;
        setEditingPetic(row.Petic_Preselect);
        setEditingComent((_a = row.Coment_Preselect) !== null && _a !== void 0 ? _a : "");
        setEditingDx(row.Dx_Preselect != null ? String(row.Dx_Preselect) : "");
    }
    function handleCancelEditRow() {
        setEditingPetic(null);
        setEditingComent("");
        setEditingDx("");
    }
    function handleSaveRow(petic) {
        return __awaiter(this, void 0, void 0, function () {
            var dxCod_1, error, dxLabel_1, err_3;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        setSavingRow(true);
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, 4, 5]);
                        dxCod_1 = editingDx ? Number(editingDx) : null;
                        return [4 /*yield*/, supabase
                                .from("Preselect")
                                .update({
                                Coment_Preselect: editingComent.trim() || null,
                                Dx_Preselect: dxCod_1,
                            })
                                .eq("Petic_Preselect", petic)];
                    case 2:
                        error = (_c.sent()).error;
                        if (error)
                            throw error;
                        dxLabel_1 = dxCod_1
                            ? (_b = (_a = dxList.find(function (d) { return Number(d.Cod) === Number(dxCod_1); })) === null || _a === void 0 ? void 0 : _a.Dx) !== null && _b !== void 0 ? _b : null
                            : null;
                        setRows(function (prev) {
                            return prev.map(function (row) {
                                return row.Petic_Preselect === petic
                                    ? __assign(__assign({}, row), { Coment_Preselect: editingComent.trim() || null, Dx_Preselect: dxCod_1, DDx: dxLabel_1 ? { Dx: dxLabel_1 } : null }) : row;
                            });
                        });
                        toast.success(t("preselect.toast.updated"));
                        handleCancelEditRow();
                        return [3 /*break*/, 5];
                    case 3:
                        err_3 = _c.sent();
                        console.error("Error al actualizar preselección:", err_3);
                        toast.error(t("preselect.toast.updateError"));
                        return [3 /*break*/, 5];
                    case 4:
                        setSavingRow(false);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    function handleCrearMuestra(row) {
        return __awaiter(this, void 0, void 0, function () {
            var siguiente, dxLabel, dxTexto, numBN, err_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetchNextNumBN(supabase)];
                    case 1:
                        siguiente = _a.sent();
                        dxLabel = labelDxPreselect(row, dxList);
                        dxTexto = dxLabel !== "—" ? t("preselect.dxSuffix", { dx: dxLabel }) : "";
                        if (!confirm(t("preselect.confirm.create", {
                            numBN: siguiente,
                            petic: row.Petic_Preselect,
                            dxTexto: dxTexto,
                        }))) {
                            return [2 /*return*/];
                        }
                        setCreatingMuestraPetic(row.Petic_Preselect);
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 5, 6, 7]);
                        return [4 /*yield*/, crearMuestraDesdePreselect(supabase, row.Petic_Preselect)];
                    case 3:
                        numBN = _a.sent();
                        toast.success(t("preselect.toast.sampleCreated", { numBN: numBN, petic: row.Petic_Preselect }));
                        return [4 /*yield*/, fetchRows()];
                    case 4:
                        _a.sent();
                        return [3 /*break*/, 7];
                    case 5:
                        err_4 = _a.sent();
                        console.error("Error al crear muestra desde preselección:", err_4);
                        toast.error(err_4 instanceof Error ? err_4.message : t("preselect.toast.createError"));
                        return [3 /*break*/, 7];
                    case 6:
                        setCreatingMuestraPetic(null);
                        return [7 /*endfinally*/];
                    case 7: return [2 /*return*/];
                }
            });
        });
    }
    function handleOpenMuestra(numBN) {
        var target = { numBN: numBN };
        saveMuestraNavegacion(target);
        navigate(buildMuestraAppPath(target));
    }
    function renderDxSelect(value, onChange, className, emptyLabel) {
        return (_jsxs("select", { value: value, onChange: function (e) { return onChange(e.target.value); }, className: className, children: [_jsx("option", { value: "", children: emptyLabel }), dxList.map(function (d) { return (_jsx("option", { value: d.Cod, children: d.Dx }, d.Cod)); })] }));
    }
    function toggleInSamplesSort(key) {
        if (inSamplesSortKey === key) {
            setInSamplesSortDir(function (dir) { return (dir === "desc" ? "asc" : "desc"); });
            return;
        }
        setInSamplesSortKey(key);
        setInSamplesSortDir("desc");
    }
    function sortHeaderButton(label, title, active, dir, onClick) {
        return (_jsx("button", { type: "button", className: "text-left text-sm font-medium bionapp-text-info hover:underline", onClick: onClick, title: title, children: active ? "".concat(label, " ").concat(dir === "desc" ? "↓" : "↑") : label }));
    }
    function renderTable(sectionRows, variant) {
        var isPendiente = variant === "pendiente";
        return (_jsx("div", { className: "bionapp-panel overflow-x-auto", children: _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { className: "w-[100px]", children: t("preselect.requestNo") }), _jsx(TableHead, { className: "w-[72px]", children: "Dx" }), _jsx(TableHead, { className: "min-w-[160px]", children: t("preselect.comment") }), _jsx(TableHead, { className: "w-[150px]", children: isPendiente
                                        ? sortHeaderButton(t("preselect.addedLabel"), t("preselect.sortByAdded"), true, addedSortOrder, function () { return setAddedSortOrder(function (prev) { return (prev === "desc" ? "asc" : "desc"); }); })
                                        : sortHeaderButton(t("preselect.addedLabel"), t("preselect.sortByAdded"), inSamplesSortKey === "added", inSamplesSortDir, function () { return toggleInSamplesSort("added"); }) }), !isPendiente ? (_jsx(TableHead, { className: "w-[120px]", children: sortHeaderButton(t("preselect.bnNo"), t("preselect.sortByBn"), inSamplesSortKey === "numBN", inSamplesSortDir, function () { return toggleInSamplesSort("numBN"); }) })) : null, _jsx(TableHead, { className: "w-[150px] text-right", children: t("preselect.actions") })] }) }), _jsx(TableBody, { children: sectionRows.map(function (row) {
                            var editando = editingPetic === row.Petic_Preselect;
                            var creando = creatingMuestraPetic === row.Petic_Preselect;
                            return (_jsxs(TableRow, { children: [_jsx(TableCell, { className: "font-medium", children: row.Petic_Preselect }), _jsx(TableCell, { className: "w-[72px]", children: editando && isPendiente ? (renderDxSelect(editingDx, setEditingDx, "bionapp-preselect-dx-select h-8 text-xs", t("common.empty"))) : (_jsx("span", { className: "text-sm font-medium", children: labelDxPreselect(row, dxList) })) }), _jsx(TableCell, { id: "preselect-coment-".concat(row.Petic_Preselect), className: "min-w-[160px]", children: editando && isPendiente ? (_jsx(Input, { value: editingComent, onChange: function (e) { return setEditingComent(e.target.value); }, className: "h-8 text-sm", autoFocus: true, onKeyDown: function (e) {
                                                if (e.key === "Enter")
                                                    void handleSaveRow(row.Petic_Preselect);
                                                if (e.key === "Escape")
                                                    handleCancelEditRow();
                                            } })) : (_jsx("span", { className: "text-sm", children: row.Coment_Preselect || t("common.empty") })) }), _jsx(TableCell, { className: "text-sm whitespace-nowrap", children: formatPreselectFecha(row.Fecha_Preselect) }), !isPendiente ? (_jsx(TableCell, { children: _jsx("button", { type: "button", className: "text-sm font-semibold bionapp-text-info hover:underline", onClick: function () { return handleOpenMuestra(row.NumBN_Preselect); }, title: t("preselect.goSample"), children: row.NumBN_Preselect }) })) : null, _jsx(TableCell, { children: _jsx("div", { className: "flex justify-end gap-1", children: editando && isPendiente ? (_jsxs(_Fragment, { children: [_jsx(Button, { variant: "ghost", size: "sm", onClick: function () { return void handleSaveRow(row.Petic_Preselect); }, disabled: savingRow, className: "h-7 w-7 p-0", title: t("preselect.save"), children: _jsx(Save, { className: "h-3.5 w-3.5 bionapp-text-success" }) }), _jsx(Button, { variant: "ghost", size: "sm", onClick: handleCancelEditRow, disabled: savingRow, className: "h-7 w-7 p-0", title: t("preselect.cancel"), children: _jsx(X, { className: "h-3.5 w-3.5 text-slate-700" }) })] })) : (_jsxs(_Fragment, { children: [isPendiente ? (_jsx(Button, { variant: "ghost", size: "sm", onClick: function () { return handleStartEditRow(row); }, className: "h-7 w-7 p-0", title: t("preselect.edit"), children: _jsx(SquarePen, { className: "h-3.5 w-3.5 text-slate-700" }) })) : null, isPendiente ? (_jsx(Button, { size: "sm", onClick: function () { return void handleCrearMuestra(row); }, disabled: creando, className: "h-7 px-2 text-xs bionapp-btn-info", title: t("preselect.createSample"), children: creando ? "..." : t("preselect.createBn") })) : (_jsx(Button, { variant: "ghost", size: "sm", onClick: function () { return handleOpenMuestra(row.NumBN_Preselect); }, className: "h-7 w-7 p-0", title: t("preselect.goToSample"), children: _jsx(ExternalLink, { className: "h-3.5 w-3.5 bionapp-text-info" }) })), isPendiente ? (_jsx(Button, { variant: "ghost", size: "sm", onClick: function () { return void handleDelete(row); }, className: "h-7 w-7 p-0", title: t("preselect.delete"), children: _jsx(Trash2, { className: "h-3.5 w-3.5 text-destructive" }) })) : null] })) }) })] }, row.Petic_Preselect));
                        }) })] }) }));
    }
    function renderSection(title, count, sectionRows, variant, emptyMessage) {
        return (_jsxs("section", { className: "mb-8 last:mb-0", children: [_jsxs("div", { className: "mb-3", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsx("h2", { className: "text-sm font-semibold", children: title }), _jsx(Badge, { variant: "outline", className: variant === "pendiente" ? "text-xs bionapp-text-warn-emphasis" : "text-xs", children: count }), variant === "pendiente" ? (_jsxs("div", { className: "flex flex-wrap items-center gap-2 ml-auto", children: [_jsx("label", { className: "text-xs text-muted-foreground shrink-0", htmlFor: "preselect-dx-filter", children: "Dx" }), _jsxs("select", { id: "preselect-dx-filter", value: pendingDxFilter, onChange: function (e) { return setPendingDxFilter(e.target.value); }, className: "h-7 text-sm border rounded-md px-2 max-w-[11rem]", title: t("preselect.filterDx"), children: [_jsx("option", { value: "", children: t("preselect.all") }), _jsx("option", { value: PRESELECT_DX_FILTER_NONE, children: t("common.empty") }), dxList.map(function (d) { return (_jsx("option", { value: String(d.Cod), children: d.Dx }, d.Cod)); })] }), _jsx("div", { className: "text-xs text-muted-foreground", children: pendingPageSize === "all" ? (t("preselect.showingAll")) : (_jsx(Trans, { i18nKey: "preselect.showingPage", values: {
                                                    shown: Math.min(pendientes.length, pendingPageIndex * pendingPageSizeResolved + pendingPageSizeResolved),
                                                    total: pendientes.length,
                                                } })) }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Button, { type: "button", variant: "outline", size: "sm", className: "h-7 px-2", onClick: function () { return setPendingPageIndex(function (p) { return Math.max(0, p - 1); }); }, disabled: pendingPageIndex <= 0 || pendingPageSize === "all", title: t("preselect.prevPage"), children: _jsx(ChevronLeft, { className: "h-4 w-4" }) }), _jsx(Button, { type: "button", variant: "outline", size: "sm", className: "h-7 px-2", onClick: function () {
                                                        return setPendingPageIndex(function (p) { return Math.min(pendingMaxPageIndex, p + 1); });
                                                    }, disabled: pendingPageIndex >= pendingMaxPageIndex || pendingPageSize === "all", title: t("preselect.nextPage"), children: _jsx(ChevronRight, { className: "h-4 w-4" }) })] }), _jsxs("select", { value: pendingPageSize, onChange: function (e) {
                                                var v = e.target.value;
                                                if (v === "all")
                                                    setPendingPageSize("all");
                                                else
                                                    setPendingPageSize(Number(v));
                                                setPendingPageIndex(0);
                                            }, className: "h-7 text-sm border rounded-md px-2", title: t("preselect.pageSize"), disabled: pendientes.length === 0, children: [_jsx("option", { value: 10, children: "10" }), _jsx("option", { value: 15, children: "15" }), _jsx("option", { value: 20, children: "20" }), _jsx("option", { value: "all", children: t("preselect.all") })] })] })) : null] }), variant === "en-muestras" ? (_jsx("p", { className: "text-xs text-muted-foreground mt-1", children: t("preselect.inSamplesHint") })) : null] }), sectionRows.length === 0 ? (_jsx("div", { className: "bionapp-panel p-4 text-center text-sm text-muted-foreground", children: emptyMessage })) : (renderTable(sectionRows, variant))] }));
    }
    if (loading) {
        return (_jsx("div", { className: "bionapp-subpage min-h-screen p-4 flex items-center justify-center", children: _jsxs("div", { className: "flex flex-col items-center gap-4", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-primary" }), _jsx("p", { className: "text-muted-foreground", children: t("preselect.loading") })] }) }));
    }
    return (_jsxs(SubpageShell, { title: t("preselect.title"), icon: ClipboardList, maxWidthClass: "max-w-[1200px]", children: [_jsx(Toaster, { position: "bottom-right" }), _jsx("p", { className: "text-sm text-muted-foreground mb-4", children: t("preselect.intro") }), _jsx("div", { className: "bionapp-panel bionapp-panel--muestra p-4 mb-6 overflow-visible", children: _jsxs("div", { className: "bionapp-preselect-add-row", children: [_jsxs("div", { className: "bionapp-preselect-add-field bionapp-preselect-add-field--petic", children: [_jsxs("p", { className: "text-xs text-slate-500 mb-1 bionapp-preselect-petic-label", children: [t("preselect.requestNo"), duplicatePeticInInput ? (_jsx("span", { className: "bionapp-preselect-existe", children: t("preselect.exists") })) : null] }), _jsx(Input, { type: "text", value: newPetic, onChange: function (e) { return setNewPetic(e.target.value); }, onKeyDown: function (e) {
                                        if (e.key === "Enter")
                                            void handleAddPreselect();
                                    }, className: "h-9 text-sm ".concat(duplicatePeticInInput ? "border-destructive bg-destructive/10" : ""), placeholder: t("preselect.requestPlaceholder"), autoComplete: "off", spellCheck: false })] }), _jsxs("div", { className: "bionapp-preselect-add-field bionapp-preselect-add-field--dx", children: [_jsx("p", { className: "text-xs text-slate-500 mb-1", children: "Dx" }), renderDxSelect(newDx, setNewDx, "bionapp-preselect-dx-select h-9 text-sm", t("common.empty"))] }), _jsxs("div", { className: "bionapp-preselect-add-field bionapp-preselect-add-field--coment min-w-0", children: [_jsx("p", { className: "text-xs text-slate-500 mb-1", children: t("preselect.comment") }), _jsx(Input, { value: newComent, onChange: function (e) { return setNewComent(e.target.value); }, onKeyDown: function (e) {
                                        if (e.key === "Enter")
                                            void handleAddPreselect();
                                    }, className: "h-9 text-sm", placeholder: t("preselect.commentPlaceholder") })] }), _jsx("div", { className: "bionapp-preselect-add-field bionapp-preselect-add-field--btn", children: _jsxs(Button, { onClick: function () { return void handleAddPreselect(); }, disabled: adding, size: "sm", className: "h-9 gap-2 bionapp-btn-info w-full sm:w-auto", children: [_jsx(Plus, { className: "h-4 w-4" }), t("preselect.add")] }) })] }) }), rows.length === 0 ? (_jsx("div", { className: "bionapp-panel p-6 text-center text-sm text-muted-foreground", children: t("preselect.empty") })) : (_jsxs(_Fragment, { children: [renderSection(t("preselect.pending"), pendientes.length, pendientesPaged, "pendiente", pendingDxFilter ? t("preselect.emptyPendingDx") : t("preselect.emptyPending")), renderSection(t("preselect.inSamples"), enMuestras.length, enMuestras, "en-muestras", t("preselect.emptyInSamples"))] }))] }));
}
export default PreselectPage;
