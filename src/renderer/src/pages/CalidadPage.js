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
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BadgeCheck, Filter, Layers } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import SubpageShell from "../components/SubpageShell";
import { supabase } from "../lib/supabaseClient";
import { daysBetweenIso, filtroStats, formatIsoDateDisplay, openFiltro, parseIsoDate, planFilterChange, sortFiltros, toFiltroRow, todayIsoDate, } from "../lib/filtrosPageData";
import LotesPage from "./LotesPage";
function parseCalidadTab(raw) {
    return raw === "filtros" || raw === "fechas" ? "filtros" : "lotes";
}
function FiltrosTab() {
    var _this = this;
    var _a;
    var t = useTranslation().t;
    var _b = useState([]), rows = _b[0], setRows = _b[1];
    var _c = useState(true), loading = _c[0], setLoading = _c[1];
    var _d = useState(todayIsoDate), fecha = _d[0], setFecha = _d[1];
    var _e = useState(false), saving = _e[0], setSaving = _e[1];
    var fetchFiltros = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var _a, data, error;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    setLoading(true);
                    return [4 /*yield*/, supabase.from("Filtros").select("*").order("NumFiltro", {
                            ascending: true,
                        })];
                case 1:
                    _a = _b.sent(), data = _a.data, error = _a.error;
                    if (error) {
                        console.error(error);
                        toast.error(t("filtros.toast.loadError"));
                        setRows([]);
                    }
                    else {
                        setRows(sortFiltros((data || [])
                            .map(function (row) { return toFiltroRow(row); })
                            .filter(function (row) { return row != null; })));
                    }
                    setLoading(false);
                    return [2 /*return*/];
            }
        });
    }); }, [t]);
    useEffect(function () {
        void fetchFiltros();
    }, [fetchFiltros]);
    var current = useMemo(function () { return openFiltro(rows); }, [rows]);
    var stats = useMemo(function () { return filtroStats(rows); }, [rows]);
    var plan = useMemo(function () { return planFilterChange(rows, fecha); }, [rows, fecha]);
    function handleRegister() {
        return __awaiter(this, void 0, void 0, function () {
            var closeError, insertPayload, insertError, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!plan.ok) {
                            toast.error(plan.error === "beforeCurrent"
                                ? t("filtros.toast.beforeCurrent")
                                : t("filtros.toast.invalidDate"));
                            return [2 /*return*/];
                        }
                        setSaving(true);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, 8, 9]);
                        if (!plan.close) return [3 /*break*/, 3];
                        return [4 /*yield*/, supabase
                                .from("Filtros")
                                .update({ FechaRetir: plan.close.FechaRetir })
                                .eq("NumFiltro", plan.close.NumFiltro)];
                    case 2:
                        closeError = (_a.sent()).error;
                        if (closeError)
                            throw closeError;
                        _a.label = 3;
                    case 3:
                        insertPayload = {
                            NumFiltro: plan.insert.NumFiltro,
                            FechaColoc: plan.insert.FechaColoc,
                        };
                        if (plan.insert.FechaRetir)
                            insertPayload.FechaRetir = plan.insert.FechaRetir;
                        return [4 /*yield*/, supabase.from("Filtros").insert([insertPayload])];
                    case 4:
                        insertError = (_a.sent()).error;
                        if (insertError)
                            throw insertError;
                        toast.success(t("filtros.toast.saved"));
                        setFecha(todayIsoDate());
                        return [4 /*yield*/, fetchFiltros()];
                    case 5:
                        _a.sent();
                        return [3 /*break*/, 9];
                    case 6:
                        err_1 = _a.sent();
                        console.error(err_1);
                        toast.error(t("filtros.toast.saveError"));
                        return [4 /*yield*/, fetchFiltros()];
                    case 7:
                        _a.sent();
                        return [3 /*break*/, 9];
                    case 8:
                        setSaving(false);
                        return [7 /*endfinally*/];
                    case 9: return [2 /*return*/];
                }
            });
        });
    }
    if (loading) {
        return (_jsx("div", { className: "p-8 flex items-center justify-center", children: _jsxs("div", { className: "flex flex-col items-center gap-4", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-primary" }), _jsx("p", { className: "text-muted-foreground", children: t("filtros.loading") })] }) }));
    }
    return (_jsxs("div", { className: "flex flex-col gap-4", children: [_jsxs("div", { className: "bionapp-filtros-stats", children: [_jsxs("div", { className: "bionapp-panel p-4", children: [_jsx("p", { className: "text-xs text-slate-500 mb-1", children: t("filtros.current") }), current ? (_jsxs(_Fragment, { children: [_jsx("p", { className: "font-semibold", children: t("filtros.currentNum", { num: current.NumFiltro }) }), _jsx("p", { className: "text-sm text-slate-600 dark:text-slate-300", children: t("filtros.placedOn", { date: formatIsoDateDisplay(current.FechaColoc) }) }), _jsx("p", { className: "text-sm mt-1", children: t("filtros.daysInUse", { count: (_a = stats.currentDays) !== null && _a !== void 0 ? _a : 0 }) })] })) : (_jsx("p", { className: "text-sm text-slate-500", children: t("filtros.currentNone") }))] }), _jsxs("div", { className: "bionapp-panel p-4", children: [_jsx("p", { className: "text-xs text-slate-500 mb-1", children: t("filtros.avg") }), _jsx("p", { className: "font-semibold", children: stats.avgDays == null
                                    ? t("common.empty")
                                    : t("filtros.daysAvg", { count: Math.round(stats.avgDays) }) }), _jsx("p", { className: "text-sm text-slate-500 mt-1", children: t("filtros.changesCount", { count: stats.changes }) })] }), _jsxs("div", { className: "bionapp-panel p-4", children: [_jsx("p", { className: "text-xs text-slate-500 mb-1", children: t("filtros.total") }), _jsx("p", { className: "font-semibold", children: t("filtros.totalCount", { count: stats.total }) })] })] }), _jsxs("div", { className: "bionapp-panel p-4", children: [_jsx("p", { className: "text-xs text-slate-500 mb-3", children: t("filtros.hint") }), _jsxs("div", { className: "grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-slate-500 mb-1", children: t("filtros.date") }), _jsx(Input, { type: "date", value: fecha, onChange: function (e) { return setFecha(e.target.value); }, className: "h-9 text-sm" })] }), _jsx(Button, { type: "button", size: "sm", variant: "outline", className: "h-9", onClick: function () { return setFecha(todayIsoDate()); }, children: t("filtros.today") }), _jsx(Button, { type: "button", size: "sm", className: "h-9 gap-2 bionapp-btn-green", onClick: function () { return void handleRegister(); }, disabled: saving || !plan.ok, children: current ? t("filtros.register") : t("filtros.registerFirst") })] }), plan.ok && current ? (_jsx("p", { className: "text-xs text-slate-500 mt-3", children: t("filtros.registerHint", {
                            current: current.NumFiltro,
                            next: plan.insert.NumFiltro,
                            date: formatIsoDateDisplay(plan.insert.FechaColoc),
                        }) })) : null, !plan.ok && parseIsoDate(fecha) ? (_jsx("p", { className: "text-xs text-red-600 mt-3", children: t("filtros.toast.beforeCurrent") })) : null] }), rows.length === 0 ? (_jsx("p", { className: "text-sm text-slate-500", children: t("filtros.empty") })) : (_jsx("div", { className: "bionapp-panel p-4 overflow-auto", children: _jsxs("table", { className: "min-w-[560px] w-full text-sm border-collapse", children: [_jsx("thead", { children: _jsxs("tr", { className: "text-left border-b border-slate-200 dark:border-slate-800", children: [_jsx("th", { className: "py-2 pr-3 w-28", children: t("filtros.num") }), _jsx("th", { className: "py-2 pr-3", children: t("filtros.coloc") }), _jsx("th", { className: "py-2 pr-3", children: t("filtros.retir") }), _jsx("th", { className: "py-2 pr-3 w-32", children: t("filtros.days") })] }) }), _jsx("tbody", { children: __spreadArray([], rows, true).reverse().map(function (row) {
                                var _a;
                                var end = (_a = parseIsoDate(row.FechaRetir)) !== null && _a !== void 0 ? _a : todayIsoDate();
                                var days = daysBetweenIso(row.FechaColoc, end);
                                var open = !parseIsoDate(row.FechaRetir);
                                return (_jsxs("tr", { className: "border-b border-slate-100 dark:border-slate-900", children: [_jsx("td", { className: "py-2 pr-3 font-medium", children: row.NumFiltro }), _jsx("td", { className: "py-2 pr-3", children: formatIsoDateDisplay(row.FechaColoc) }), _jsx("td", { className: "py-2 pr-3", children: open ? t("filtros.open") : formatIsoDateDisplay(row.FechaRetir) }), _jsx("td", { className: "py-2 pr-3", children: days == null ? t("common.empty") : t("filtros.daysCount", { count: days }) })] }, row.NumFiltro));
                            }) })] }) }))] }));
}
function CalidadPage() {
    var t = useTranslation().t;
    var _a = useSearchParams(), searchParams = _a[0], setSearchParams = _a[1];
    var tab = parseCalidadTab(searchParams.get("tab"));
    function handleTabChange(next) {
        var value = parseCalidadTab(next);
        var nextParams = new URLSearchParams(searchParams);
        nextParams.set("tab", value);
        setSearchParams(nextParams, { replace: true });
    }
    return (_jsx(SubpageShell, { title: t("calidad.title"), icon: BadgeCheck, maxWidthClass: "max-w-[1400px]", children: _jsxs(Tabs, { value: tab, onValueChange: handleTabChange, className: "gap-4", children: [_jsxs(TabsList, { children: [_jsxs(TabsTrigger, { value: "lotes", className: "gap-1.5", children: [_jsx(Layers, { className: "h-4 w-4" }), t("calidad.tab.lotes")] }), _jsxs(TabsTrigger, { value: "filtros", className: "gap-1.5", children: [_jsx(Filter, { className: "h-4 w-4" }), t("calidad.tab.filtros")] })] }), _jsx(TabsContent, { value: "lotes", children: _jsx(LotesPage, { embedded: true }) }), _jsx(TabsContent, { value: "filtros", children: _jsx(FiltrosTab, {}) })] }) }));
}
export default CalidadPage;
