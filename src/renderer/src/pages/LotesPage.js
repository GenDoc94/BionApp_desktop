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
import { useTranslation } from "react-i18next";
import { Layers, Plus, Save, Search, SquarePen, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import SubpageShell from "../components/SubpageShell";
import { supabase } from "../lib/supabaseClient";
import { buildMuestraAppPath, saveMuestraNavegacion } from "../lib/navegacionMuestra";
import { filterLots, groupUsosExtraido, groupUsosLm, lotExpFromInputValue, lotExpToInputValue, loteCardDomId, LOTE_ID_COL, parseLotesHighlight, resolveHighlightedLotId, sortLots, toLoteRow, } from "../lib/lotesPageData";
var TABLE_BY_TIPO = {
    extraido: "Lotes_Extraido",
    marcado: "Lotes_Marcado",
    membrana: "Lotes_Membrana",
};
function LotesPage(_a) {
    var _this = this;
    var _b = _a.embedded, embedded = _b === void 0 ? false : _b;
    var t = useTranslation().t;
    var navigate = useNavigate();
    var _c = useSearchParams(), searchParams = _c[0], setSearchParams = _c[1];
    var _d = useState("extraido"), tipo = _d[0], setTipo = _d[1];
    var _e = useState({
        extraido: [],
        marcado: [],
        membrana: [],
    }), lotsByTipo = _e[0], setLotsByTipo = _e[1];
    var _f = useState(new Map()), usosExtraido = _f[0], setUsosExtraido = _f[1];
    var _g = useState(new Map()), usosMarcado = _g[0], setUsosMarcado = _g[1];
    var _h = useState(new Map()), usosMembrana = _h[0], setUsosMembrana = _h[1];
    var _j = useState(true), loading = _j[0], setLoading = _j[1];
    var _k = useState(""), searchQuery = _k[0], setSearchQuery = _k[1];
    var _l = useState(""), newPn = _l[0], setNewPn = _l[1];
    var _m = useState(""), newLn = _m[0], setNewLn = _m[1];
    var _o = useState(""), newExp = _o[0], setNewExp = _o[1];
    var _p = useState(false), saving = _p[0], setSaving = _p[1];
    var _q = useState(null), editingId = _q[0], setEditingId = _q[1];
    var _r = useState(""), editPn = _r[0], setEditPn = _r[1];
    var _s = useState(""), editLn = _s[0], setEditLn = _s[1];
    var _t = useState(""), editExp = _t[0], setEditExp = _t[1];
    var _u = useState(false), savingEdit = _u[0], setSavingEdit = _u[1];
    var pendingHighlight = useRef(parseLotesHighlight(searchParams));
    var fetchLotes = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var _a, extraidoRes, marcadoRes, membranaRes, muestrasRes, lmRes, errors, mapRows, lmRows;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    setLoading(true);
                    return [4 /*yield*/, Promise.all([
                            supabase.from("Lotes_Extraido").select("*"),
                            supabase.from("Lotes_Marcado").select("*"),
                            supabase.from("Lotes_Membrana").select("*"),
                            supabase.from("Muestras").select("NumBN, Id_LtE"),
                            supabase.from("Lecturas_Marcado").select("NumBN_LM, NumLectura_LM, NumLectMarc, Id_LtM, Id_LtMm"),
                        ])];
                case 1:
                    _a = _b.sent(), extraidoRes = _a[0], marcadoRes = _a[1], membranaRes = _a[2], muestrasRes = _a[3], lmRes = _a[4];
                    errors = [
                        extraidoRes.error,
                        marcadoRes.error,
                        membranaRes.error,
                        muestrasRes.error,
                        lmRes.error,
                    ].filter(Boolean);
                    if (errors.length) {
                        console.error(errors[0]);
                        toast.error(t("lotes.toast.loadError"));
                        setLoading(false);
                        return [2 /*return*/];
                    }
                    mapRows = function (rows, kind) {
                        return sortLots((rows || []).map(function (row) { return toLoteRow(row, kind); }).filter(function (r) { return r != null; }));
                    };
                    setLotsByTipo({
                        extraido: mapRows((extraidoRes.data || []), "extraido"),
                        marcado: mapRows((marcadoRes.data || []), "marcado"),
                        membrana: mapRows((membranaRes.data || []), "membrana"),
                    });
                    setUsosExtraido(groupUsosExtraido((muestrasRes.data || [])));
                    lmRows = (lmRes.data || []);
                    setUsosMarcado(groupUsosLm(lmRows.map(function (r) { return ({
                        lotId: r.Id_LtM,
                        NumBN: r.NumBN_LM,
                        NumLectura: r.NumLectura_LM,
                        NumLectMarc: r.NumLectMarc,
                    }); })));
                    setUsosMembrana(groupUsosLm(lmRows.map(function (r) { return ({
                        lotId: r.Id_LtMm,
                        NumBN: r.NumBN_LM,
                        NumLectura: r.NumLectura_LM,
                        NumLectMarc: r.NumLectMarc,
                    }); })));
                    setLoading(false);
                    return [2 /*return*/];
            }
        });
    }); }, [t]);
    useEffect(function () {
        void fetchLotes();
    }, [fetchLotes]);
    useEffect(function () {
        pendingHighlight.current = parseLotesHighlight(searchParams);
        var parsed = pendingHighlight.current;
        if (parsed === null || parsed === void 0 ? void 0 : parsed.tipo)
            setTipo(parsed.tipo);
    }, [searchParams]);
    var lots = lotsByTipo[tipo];
    var usosLm = tipo === "marcado" ? usosMarcado : usosMembrana;
    var filtered = useMemo(function () { return filterLots(lots, usosExtraido, usosLm, searchQuery); }, [lots, usosExtraido, usosLm, searchQuery]);
    var searchActive = searchQuery.trim().length > 0;
    useEffect(function () {
        if (loading)
            return;
        var highlight = pendingHighlight.current;
        if (!highlight || (highlight.id == null && !highlight.ln)) {
            pendingHighlight.current = null;
            return;
        }
        pendingHighlight.current = null;
        var id = resolveHighlightedLotId(lotsByTipo[highlight.tipo], highlight);
        setSearchParams(function (prev) {
            var next = new URLSearchParams(prev);
            next.delete("tipo");
            next.delete("id");
            next.delete("ln");
            if (!next.get("tab"))
                next.set("tab", "lotes");
            return next;
        }, { replace: true });
        if (id == null) {
            toast.error(t("lotes.toast.notFound"));
            return;
        }
        window.requestAnimationFrame(function () {
            var el = document.getElementById(loteCardDomId(highlight.tipo, id));
            if (!el) {
                toast.error(t("lotes.toast.notFound"));
                return;
            }
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            el.classList.add("bionapp-lote-card--flash");
            window.setTimeout(function () { return el.classList.remove("bionapp-lote-card--flash"); }, 1800);
        });
    }, [loading, lotsByTipo, setSearchParams, t]);
    function handleAddLote() {
        return __awaiter(this, void 0, void 0, function () {
            var pn, ln, exp, error, err_1, msg;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        pn = newPn.trim();
                        ln = newLn.trim();
                        exp = lotExpFromInputValue(newExp);
                        if (!pn || !ln) {
                            toast.error(t("lotes.toast.needPnLn"));
                            return [2 /*return*/];
                        }
                        setSaving(true);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 4, 5, 6]);
                        return [4 /*yield*/, supabase.from(TABLE_BY_TIPO[tipo]).insert({
                                PN: pn,
                                LN: ln,
                                Exp: exp,
                            })];
                    case 2:
                        error = (_b.sent()).error;
                        if (error)
                            throw error;
                        toast.success(t("lotes.toast.added"));
                        setNewPn("");
                        setNewLn("");
                        setNewExp("");
                        return [4 /*yield*/, fetchLotes()];
                    case 3:
                        _b.sent();
                        return [3 /*break*/, 6];
                    case 4:
                        err_1 = _b.sent();
                        console.error(err_1);
                        msg = String((_a = err_1 === null || err_1 === void 0 ? void 0 : err_1.message) !== null && _a !== void 0 ? _a : err_1);
                        if (/UNIQUE/i.test(msg))
                            toast.error(t("lotes.toast.duplicate"));
                        else
                            toast.error(t("lotes.toast.addError"));
                        return [3 /*break*/, 6];
                    case 5:
                        setSaving(false);
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    }
    function handleStartEdit(lot) {
        setEditingId(lot.id);
        setEditPn(lot.PN);
        setEditLn(lot.LN);
        setEditExp(lotExpToInputValue(lot.Exp));
    }
    function handleCancelEdit() {
        setEditingId(null);
        setEditPn("");
        setEditLn("");
        setEditExp("");
    }
    function handleSaveEdit(lotId) {
        return __awaiter(this, void 0, void 0, function () {
            var pn, ln, exp, error, err_2, msg;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        pn = editPn.trim();
                        ln = editLn.trim();
                        exp = lotExpFromInputValue(editExp);
                        if (!pn || !ln) {
                            toast.error(t("lotes.toast.needPnLn"));
                            return [2 /*return*/];
                        }
                        setSavingEdit(true);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 4, 5, 6]);
                        return [4 /*yield*/, supabase
                                .from(TABLE_BY_TIPO[tipo])
                                .update({ PN: pn, LN: ln, Exp: exp })
                                .eq(LOTE_ID_COL[tipo], lotId)];
                    case 2:
                        error = (_b.sent()).error;
                        if (error)
                            throw error;
                        toast.success(t("lotes.toast.updated"));
                        handleCancelEdit();
                        return [4 /*yield*/, fetchLotes()];
                    case 3:
                        _b.sent();
                        return [3 /*break*/, 6];
                    case 4:
                        err_2 = _b.sent();
                        console.error(err_2);
                        msg = String((_a = err_2 === null || err_2 === void 0 ? void 0 : err_2.message) !== null && _a !== void 0 ? _a : err_2);
                        if (/UNIQUE/i.test(msg))
                            toast.error(t("lotes.toast.duplicate"));
                        else
                            toast.error(t("lotes.toast.updateError"));
                        return [3 /*break*/, 6];
                    case 5:
                        setSavingEdit(false);
                        return [7 /*endfinally*/];
                    case 6: return [2 /*return*/];
                }
            });
        });
    }
    function handleOpenMuestra(numBN, numLectura, numLectMarc) {
        var target = { numBN: numBN, numLectura: numLectura, numLectMarc: numLectMarc };
        saveMuestraNavegacion(target);
        navigate(buildMuestraAppPath(target));
    }
    function switchTipo(next) {
        setTipo(next);
        setSearchQuery("");
        handleCancelEdit();
    }
    if (loading) {
        var spinner = (_jsx("div", { className: embedded
                ? "p-8 flex items-center justify-center"
                : "bionapp-subpage min-h-screen p-4 flex items-center justify-center", children: _jsxs("div", { className: "flex flex-col items-center gap-4", children: [_jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-primary" }), _jsx("p", { className: "text-muted-foreground", children: t("lotes.loading") })] }) }));
        return spinner;
    }
    var body = (_jsxs(_Fragment, { children: [_jsx("div", { className: "flex flex-wrap gap-2 mb-4", children: ["extraido", "marcado", "membrana"].map(function (key) { return (_jsxs(Button, { type: "button", size: "sm", variant: tipo === key ? "default" : "outline", className: tipo === key ? "bionapp-btn-green" : "", onClick: function () { return switchTipo(key); }, children: [t("lotes.tipo.".concat(key)), _jsx(Badge, { variant: "secondary", className: "ml-2", children: lotsByTipo[key].length })] }, key)); }) }), _jsxs("div", { className: "bionapp-panel p-4 mb-4", children: [_jsx("p", { className: "text-xs text-slate-500 mb-3", children: t("lotes.createHint") }), _jsxs("div", { className: "grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs text-slate-500 mb-1", children: "PN" }), _jsx(Input, { value: newPn, onChange: function (e) { return setNewPn(e.target.value); }, className: "h-9 text-sm" })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-slate-500 mb-1", children: "LN" }), _jsx(Input, { value: newLn, onChange: function (e) { return setNewLn(e.target.value); }, className: "h-9 text-sm" })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs text-slate-500 mb-1", children: "Exp" }), _jsx(Input, { type: "date", value: newExp, onChange: function (e) { return setNewExp(e.target.value); }, className: "h-9 text-sm" })] }), _jsxs(Button, { type: "button", size: "sm", className: "h-9 gap-2 bionapp-btn-green", onClick: function () { return void handleAddLote(); }, disabled: saving, children: [_jsx(Plus, { className: "h-4 w-4" }), t("lotes.add")] })] })] }), lots.length > 0 ? (_jsxs("div", { className: "bionapp-panel p-4 mb-4", children: [_jsxs("div", { className: "relative min-w-0", children: [_jsx(Search, { className: "pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" }), _jsx(Input, { value: searchQuery, onChange: function (e) { return setSearchQuery(e.target.value); }, className: "h-9 pl-9 text-sm", placeholder: t("lotes.searchPlaceholder") })] }), searchActive ? (_jsx("p", { className: "text-xs text-slate-500 mt-2", children: t("lotes.searchCount", { filtered: filtered.length, total: lots.length }) })) : null] })) : null, filtered.length === 0 ? (_jsx("p", { className: "text-sm text-slate-500", children: lots.length === 0 ? t("lotes.empty") : t("lotes.noMatch") })) : (_jsx("div", { className: "bionapp-lote-grid", children: filtered.map(function (lot) {
                    var extra = tipo === "extraido" ? usosExtraido.get(lot.id) || [] : [];
                    var lmUsos = tipo === "extraido" ? [] : usosLm.get(lot.id) || [];
                    return (_jsxs("article", { id: loteCardDomId(tipo, lot.id), className: "bionapp-lote-card", children: [_jsxs("header", { className: "bionapp-lote-card__header", children: [editingId === lot.id ? (_jsxs("div", { className: "bionapp-lote-card__edit", onKeyDown: function (e) {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                void handleSaveEdit(lot.id);
                                            }
                                            if (e.key === "Escape")
                                                handleCancelEdit();
                                        }, children: [_jsxs("label", { className: "min-w-0", children: [_jsx("span", { className: "text-xs text-slate-500", children: "LN" }), _jsx(Input, { value: editLn, onChange: function (e) { return setEditLn(e.target.value); }, className: "h-8 text-sm", autoFocus: true })] }), _jsxs("label", { className: "min-w-0", children: [_jsx("span", { className: "text-xs text-slate-500", children: "PN" }), _jsx(Input, { value: editPn, onChange: function (e) { return setEditPn(e.target.value); }, className: "h-8 text-sm" })] }), _jsxs("label", { className: "min-w-0", children: [_jsx("span", { className: "text-xs text-slate-500", children: "Exp" }), _jsx(Input, { type: "date", value: editExp, onChange: function (e) { return setEditExp(e.target.value); }, className: "h-8 text-sm" })] })] })) : (_jsxs("div", { children: [_jsx("p", { className: "bionapp-lote-card__ln", children: lot.LN || t("common.empty") }), _jsxs("p", { className: "text-xs text-slate-500", children: ["PN ", lot.PN || t("common.empty"), lot.Exp ? " \u00B7 Exp ".concat(lot.Exp) : ""] })] })), _jsxs("div", { className: "bionapp-lote-card__actions", children: [_jsx(Badge, { variant: "secondary", children: tipo === "extraido"
                                                    ? t("lotes.samplesCount", { count: extra.length })
                                                    : t("lotes.readingsCount", { count: lmUsos.length }) }), editingId === lot.id ? (_jsxs(_Fragment, { children: [_jsx(Button, { variant: "ghost", size: "sm", onClick: function () { return void handleSaveEdit(lot.id); }, disabled: savingEdit, className: "h-7 w-7 p-0", title: t("lotes.save"), children: _jsx(Save, { className: "h-3.5 w-3.5 bionapp-text-success" }) }), _jsx(Button, { variant: "ghost", size: "sm", onClick: handleCancelEdit, disabled: savingEdit, className: "h-7 w-7 p-0", title: t("lotes.cancel"), children: _jsx(X, { className: "h-3.5 w-3.5 text-slate-700" }) })] })) : (_jsx(Button, { variant: "ghost", size: "sm", onClick: function () { return handleStartEdit(lot); }, className: "h-7 w-7 p-0", title: t("lotes.edit"), children: _jsx(SquarePen, { className: "h-3.5 w-3.5 text-slate-700" }) }))] })] }), tipo === "extraido" ? (extra.length === 0 ? (_jsx("p", { className: "text-xs text-slate-400", children: t("lotes.noUsos") })) : (_jsx("div", { className: "bionapp-lote-usos", children: extra.map(function (uso) { return (_jsxs("button", { type: "button", className: "bionapp-lote-uso-btn", onClick: function () { return handleOpenMuestra(uso.NumBN); }, children: ["BN ", uso.NumBN] }, uso.NumBN)); }) }))) : lmUsos.length === 0 ? (_jsx("p", { className: "text-xs text-slate-400", children: t("lotes.noUsos") })) : (_jsx("div", { className: "bionapp-lote-usos", children: lmUsos.map(function (uso) { return (_jsxs("button", { type: "button", className: "bionapp-lote-uso-btn", onClick: function () {
                                        return handleOpenMuestra(uso.NumBN, uso.NumLectura, uso.NumLectMarc);
                                    }, children: ["BN ", uso.NumBN, " \u00B7 L", uso.NumLectura, " \u00B7 LM", uso.NumLectMarc] }, "".concat(uso.NumBN, "-").concat(uso.NumLectura, "-").concat(uso.NumLectMarc))); }) }))] }, lot.id));
                }) }))] }));
    if (embedded)
        return body;
    return (_jsx(SubpageShell, { title: t("lotes.title"), icon: Layers, maxWidthClass: "max-w-[1400px]", children: body }));
}
export default LotesPage;
