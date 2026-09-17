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
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { supabase } from "../lib/supabaseClient";
import { toast } from "sonner";
import SubpageShell from "../components/SubpageShell";
import { buildChipPanels, filterChipPanels } from "../lib/chipPageData";
import { chipRepetirActivo } from "../lib/marcarCriterios";
import { buildMuestraAppPath, saveMuestraNavegacion } from "../lib/navegacionMuestra";
import { Cpu, Plus, Save, Search, SquarePen, Trash2, X } from "lucide-react";
function ChipPage() {
    var _this = this;
    var t = useTranslation().t;
    var navigate = useNavigate();
    var _a = useState([]), chips = _a[0], setChips = _a[1];
    var _b = useState([]), asignaciones = _b[0], setAsignaciones = _b[1];
    var _c = useState(true), loading = _c[0], setLoading = _c[1];
    var _d = useState(1), nextChipNum = _d[0], setNextChipNum = _d[1];
    var _e = useState(""), nextChipName = _e[0], setNextChipName = _e[1];
    var _f = useState(null), editingChipNum = _f[0], setEditingChipNum = _f[1];
    var _g = useState(""), editingChipName = _g[0], setEditingChipName = _g[1];
    var _h = useState(false), savingChipName = _h[0], setSavingChipName = _h[1];
    var _j = useState(""), chipSearchQuery = _j[0], setChipSearchQuery = _j[1];
    var formatTodayForName = function () {
        var date = new Date();
        return "".concat(date.getFullYear()).concat(String(date.getMonth() + 1).padStart(2, "0")).concat(String(date.getDate()).padStart(2, "0"));
    };
    var buildChipName = function (chipNum) { return "".concat(formatTodayForName(), "_Chip").concat(chipNum); };
    var fetchChips = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var _a, _b, chipsData, chipsError, _c, asigData, asigError, catalog, maxNum, nextNum;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    setLoading(true);
                    return [4 /*yield*/, Promise.all([
                            supabase.from("DChips").select("*").order("NumChip_D", { ascending: true }),
                            supabase
                                .from("Chips")
                                .select("NumChip, NumBN_C, NumLectura_C, NumLectMarc_C, FC, Repetir_Chip")
                                .order("NumChip", { ascending: true })
                                .order("FC", { ascending: true }),
                        ])];
                case 1:
                    _a = _d.sent(), _b = _a[0], chipsData = _b.data, chipsError = _b.error, _c = _a[1], asigData = _c.data, asigError = _c.error;
                    if (chipsError) {
                        console.error("Error al cargar chips:", chipsError);
                        toast.error(t("chips.toast.loadError"));
                    }
                    else {
                        catalog = chipsData || [];
                        setChips(catalog);
                        maxNum = catalog.reduce(function (max, chip) { return Math.max(max, chip.NumChip_D || 0); }, 0);
                        nextNum = maxNum + 1;
                        setNextChipNum(nextNum);
                        setNextChipName(buildChipName(nextNum));
                    }
                    if (asigError) {
                        console.error("Error al cargar asignaciones:", asigError);
                        toast.error(t("chips.toast.loadAssignments"));
                        setAsignaciones([]);
                    }
                    else {
                        setAsignaciones((asigData || []));
                    }
                    setLoading(false);
                    return [2 /*return*/];
            }
        });
    }); }, [t]);
    useEffect(function () {
        void fetchChips();
    }, [fetchChips]);
    var chipPanels = useMemo(function () { return buildChipPanels(chips, asignaciones); }, [chips, asignaciones]);
    var filteredChipPanels = useMemo(function () { return filterChipPanels(chipPanels, chipSearchQuery); }, [chipPanels, chipSearchQuery]);
    var chipSearchActive = chipSearchQuery.trim().length > 0;
    function handleAddChip() {
        return __awaiter(this, void 0, void 0, function () {
            var nombre, error, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        nombre = nextChipName.trim();
                        if (!nombre) {
                            toast.error(t("chips.toast.emptyName"));
                            return [2 /*return*/];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        return [4 /*yield*/, supabase.from("DChips").insert({
                                NumChip_D: nextChipNum,
                                Nombre_Chip: nombre,
                            })];
                    case 2:
                        error = (_a.sent()).error;
                        if (error)
                            throw error;
                        toast.success(t("chips.toast.added"));
                        return [4 /*yield*/, fetchChips()];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        err_1 = _a.sent();
                        console.error("Error al añadir chip:", err_1);
                        toast.error(t("chips.toast.addError"));
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }
    function handleDeleteChip(chip) {
        return __awaiter(this, void 0, void 0, function () {
            var deleteDChipsError, deleteChipsError, err_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!confirm(t("chips.confirm.delete", { num: chip.NumChip_D, name: chip.Nombre_Chip })))
                            return [2 /*return*/];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        return [4 /*yield*/, supabase
                                .from("DChips")
                                .delete()
                                .eq("NumChip_D", chip.NumChip_D)];
                    case 2:
                        deleteDChipsError = (_a.sent()).error;
                        if (deleteDChipsError)
                            throw deleteDChipsError;
                        return [4 /*yield*/, supabase
                                .from("Chips")
                                .delete()
                                .eq("NumChip", chip.NumChip_D)];
                    case 3:
                        deleteChipsError = (_a.sent()).error;
                        if (deleteChipsError)
                            throw deleteChipsError;
                        toast.success(t("chips.toast.deleted"));
                        if (editingChipNum === chip.NumChip_D)
                            handleCancelEditChipName();
                        return [4 /*yield*/, fetchChips()];
                    case 4:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 5:
                        err_2 = _a.sent();
                        console.error("Error al eliminar chip:", err_2);
                        toast.error(t("chips.toast.deleteError"));
                        return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    }
    function handleStartEditChipName(chip) {
        var _a;
        setEditingChipNum(chip.NumChip_D);
        setEditingChipName((_a = chip.Nombre_Chip) !== null && _a !== void 0 ? _a : "");
    }
    function handleCancelEditChipName() {
        setEditingChipNum(null);
        setEditingChipName("");
    }
    function handleSaveChipName(chipNum) {
        return __awaiter(this, void 0, void 0, function () {
            var nombre, dChipsError, chipsError, err_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        nombre = editingChipName.trim();
                        if (!nombre) {
                            toast.error(t("chips.toast.emptyName"));
                            return [2 /*return*/];
                        }
                        setSavingChipName(true);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, 5, 6]);
                        return [4 /*yield*/, supabase
                                .from("DChips")
                                .update({ Nombre_Chip: nombre })
                                .eq("NumChip_D", chipNum)];
                    case 2:
                        dChipsError = (_a.sent()).error;
                        if (dChipsError)
                            throw dChipsError;
                        return [4 /*yield*/, supabase
                                .from("Chips")
                                .update({ Chip_Nombre: nombre })
                                .eq("NumChip", chipNum)];
                    case 3:
                        chipsError = (_a.sent()).error;
                        if (chipsError)
                            throw chipsError;
                        setChips(function (prev) {
                            return prev.map(function (chip) {
                                return chip.NumChip_D === chipNum ? __assign(__assign({}, chip), { Nombre_Chip: nombre }) : chip;
                            });
                        });
                        toast.success(t("chips.toast.renamed"));
                        handleCancelEditChipName();
                        return [3 /*break*/, 6];
                    case 4:
                        err_3 = _a.sent();
                        console.error("Error al actualizar nombre del chip:", err_3);
                        toast.error(t("chips.toast.renameError"));
                        return [3 /*break*/, 6];
                    case 5:
                        setSavingChipName(false);
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    }
    function handleOpenMuestra(asignacion) {
        var target = {
            numBN: Number(asignacion.NumBN_C),
            numLectura: Number(asignacion.NumLectura_C),
            numLectMarc: Number(asignacion.NumLectMarc_C),
        };
        saveMuestraNavegacion(target);
        navigate(buildMuestraAppPath(target));
    }
    if (loading) {
        return (_jsx("div", { className: "bionapp-subpage min-h-screen p-4 flex items-center justify-center", children: _jsxs("div", { className: "flex flex-col items-center gap-4", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-primary" }), _jsx("p", { className: "text-muted-foreground", children: t("chips.loading") })] }) }));
    }
    return (_jsxs(SubpageShell, { title: t("chips.title"), icon: Cpu, maxWidthClass: "max-w-[1400px]", children: [_jsx("div", { className: "bionapp-panel p-4 mb-6", children: _jsxs("div", { className: "grid gap-4 md:grid-cols-[90px_minmax(320px,1fr)_auto] md:items-center", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-slate-500", children: t("chips.number") }), _jsx("p", { className: "text-sm font-medium", children: nextChipNum })] }), _jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "text-xs text-slate-500 mb-1", children: t("chips.name") }), _jsx(Input, { value: nextChipName, onChange: function (e) { return setNextChipName(e.target.value); }, className: "h-9 text-sm", placeholder: buildChipName(nextChipNum) })] }), _jsx("div", { className: "flex justify-end", children: _jsxs(Button, { onClick: handleAddChip, size: "sm", className: "h-9 gap-2 bionapp-btn-green", children: [_jsx(Plus, { className: "h-4 w-4" }), t("chips.add")] }) })] }) }), chipPanels.length > 0 ? (_jsx("div", { className: "bionapp-panel p-4 mb-6", children: _jsxs("div", { className: "flex flex-col gap-2 sm:flex-row sm:items-center", children: [_jsxs("div", { className: "relative min-w-0 flex-1", children: [_jsx(Search, { className: "pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" }), _jsx(Input, { value: chipSearchQuery, onChange: function (e) { return setChipSearchQuery(e.target.value); }, className: "h-9 pl-9 text-sm", placeholder: t("chips.searchPlaceholder") })] }), chipSearchActive ? (_jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [_jsx("p", { className: "text-xs text-slate-500", children: t("chips.searchCount", {
                                        filtered: filteredChipPanels.length,
                                        total: chipPanels.length,
                                    }) }), _jsx(Button, { type: "button", variant: "ghost", size: "sm", className: "h-8 px-2 text-xs", onClick: function () { return setChipSearchQuery(""); }, children: t("chips.clear") })] })) : null] }) })) : null, chipPanels.length === 0 ? (_jsx("div", { className: "bionapp-panel p-6 text-center text-sm text-muted-foreground", children: t("chips.empty") })) : filteredChipPanels.length === 0 ? (_jsx("div", { className: "bionapp-panel p-6 text-center text-sm text-muted-foreground", children: t("chips.noMatch", { query: chipSearchQuery.trim() }) })) : (_jsx("div", { className: "bionapp-chip-grid", children: filteredChipPanels.map(function (_a) {
                    var chip = _a.chip, flowcells = _a.flowcells;
                    return (_jsxs("article", { className: "bionapp-chip-card", children: [_jsxs("header", { className: "bionapp-chip-card__header", children: [_jsxs("div", { className: "bionapp-chip-card__title min-w-0", children: [_jsxs(Badge, { variant: "outline", className: "shrink-0", children: ["#", chip.NumChip_D] }), editingChipNum === chip.NumChip_D ? (_jsx(Input, { value: editingChipName, onChange: function (e) { return setEditingChipName(e.target.value); }, className: "h-8 text-sm min-w-0", autoFocus: true, onKeyDown: function (e) {
                                                    if (e.key === "Enter")
                                                        void handleSaveChipName(chip.NumChip_D);
                                                    if (e.key === "Escape")
                                                        handleCancelEditChipName();
                                                } })) : (_jsx("span", { className: "text-sm font-medium truncate", title: chip.Nombre_Chip || "", children: chip.Nombre_Chip || t("common.empty") }))] }), _jsx("div", { className: "bionapp-chip-card__actions", children: editingChipNum === chip.NumChip_D ? (_jsxs(_Fragment, { children: [_jsx(Button, { variant: "ghost", size: "sm", onClick: function () { return void handleSaveChipName(chip.NumChip_D); }, disabled: savingChipName, className: "h-7 w-7 p-0", title: t("chips.saveName"), children: _jsx(Save, { className: "h-3.5 w-3.5 bionapp-text-success" }) }), _jsx(Button, { variant: "ghost", size: "sm", onClick: handleCancelEditChipName, disabled: savingChipName, className: "h-7 w-7 p-0", title: t("chips.cancel"), children: _jsx(X, { className: "h-3.5 w-3.5 text-slate-700" }) })] })) : (_jsxs(_Fragment, { children: [_jsx(Button, { variant: "ghost", size: "sm", onClick: function () { return handleStartEditChipName(chip); }, className: "h-7 w-7 p-0", title: t("chips.editName"), children: _jsx(SquarePen, { className: "h-3.5 w-3.5 text-slate-700" }) }), _jsx(Button, { variant: "ghost", size: "sm", onClick: function () { return handleDeleteChip(chip); }, className: "h-7 w-7 p-0", title: t("chips.delete"), children: _jsx(Trash2, { className: "h-3.5 w-3.5 text-destructive" }) })] })) })] }), _jsx("div", { className: "bionapp-chip-fc-grid", children: flowcells.map(function (row, idx) {
                                    var fcNumber = idx + 1;
                                    var ocupada = row != null && row.NumBN_C != null;
                                    if (ocupada) {
                                        var repetir = chipRepetirActivo(row);
                                        return (_jsxs("button", { type: "button", className: "bionapp-chip-fc bionapp-chip-fc--ocupada bionapp-chip-fc--btn".concat(repetir ? " bionapp-chip-fc--repetir" : ""), title: "".concat(t("chips.goSample", {
                                                numBN: row.NumBN_C,
                                                numLectura: row.NumLectura_C,
                                                numLectMarc: row.NumLectMarc_C,
                                            })).concat(repetir ? t("chips.repeatMarked") : ""), onClick: function () { return handleOpenMuestra(row); }, children: [_jsx("span", { className: "bionapp-chip-fc__label", children: t("chips.fc.slot", { n: fcNumber }) }), _jsx("span", { className: "bionapp-chip-fc__muestra", children: row.NumBN_C })] }, fcNumber));
                                    }
                                    return (_jsxs("div", { className: "bionapp-chip-fc", children: [_jsx("span", { className: "bionapp-chip-fc__label", children: t("chips.fc.slot", { n: fcNumber }) }), _jsx("span", { className: "bionapp-chip-fc__vacio", children: t("common.empty") })] }, fcNumber));
                                }) })] }, chip.NumChip_D));
                }) }))] }));
}
export default ChipPage;
