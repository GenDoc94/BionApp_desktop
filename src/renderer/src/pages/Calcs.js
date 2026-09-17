import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Calculator } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import SubpageShell from "../components/SubpageShell";
import DilucionDnaTab from "../components/calcs/DilucionDnaTab";
function clampInt(value, min, max, fallback) {
    var n = Number.parseInt(value, 10);
    if (Number.isNaN(n))
        return fallback;
    return Math.min(max, Math.max(min, n));
}
function fmt(n, decimals) {
    if (decimals === void 0) { decimals = 2; }
    if (Number.isInteger(n) && decimals === 2)
        return String(n);
    return n.toFixed(decimals);
}
function CalcTable(_a) {
    var title = _a.title, subtitle = _a.subtitle, rows = _a.rows, showOrder = _a.showOrder, totalLabel = _a.totalLabel, totalUlDecimals = _a.totalUlDecimals;
    var t = useTranslation().t;
    var resolvedTotalLabel = totalLabel !== null && totalLabel !== void 0 ? totalLabel : t("calcs.total");
    var totalPerSample = rows.reduce(function (acc, r) { return acc + r.perSample; }, 0);
    var totalTotal = rows.reduce(function (acc, r) { return acc + r.total; }, 0);
    return (_jsxs("div", { className: "bionapp-panel p-4", children: [_jsx("div", { className: "flex items-center justify-between gap-3 mb-3", children: _jsxs("div", { children: [_jsx("div", { className: "font-semibold", children: title }), subtitle ? _jsx("div", { className: "text-xs text-slate-500", children: subtitle }) : null] }) }), _jsx("div", { className: "overflow-auto", children: _jsxs("table", { className: "min-w-[680px] w-full text-sm border-collapse", children: [_jsx("thead", { children: _jsxs("tr", { className: "text-left border-b border-slate-200 dark:border-slate-800", children: [showOrder ? _jsx("th", { className: "py-2 pr-3 w-24", children: t("calcs.col.order") }) : null, _jsx("th", { className: "py-2 pr-3", children: t("calcs.col.reagent") }), _jsx("th", { className: "py-2 pr-3 w-40", children: t("calcs.col.ulPerSample") }), _jsx("th", { className: "py-2 pr-3 w-40", children: t("calcs.col.totalUl") })] }) }), _jsxs("tbody", { children: [rows.map(function (r) {
                                    var _a;
                                    return (_jsxs("tr", { className: "border-b border-slate-100 dark:border-slate-900", children: [showOrder ? _jsx("td", { className: "py-2 pr-3", children: (_a = r.order) !== null && _a !== void 0 ? _a : "" }) : null, _jsx("td", { className: "py-2 pr-3", children: r.name }), _jsx("td", { className: "py-2 pr-3", children: fmt(r.perSample) }), _jsx("td", { className: "py-2 pr-3 font-medium", children: totalUlDecimals != null ? fmt(r.total, totalUlDecimals) : fmt(r.total) })] }, r.name));
                                }), _jsxs("tr", { className: "border-t border-slate-200 dark:border-slate-800", children: [showOrder ? _jsx("td", {}) : null, _jsx("td", { className: "py-2 pr-3 font-semibold", children: resolvedTotalLabel }), _jsx("td", { className: "py-2 pr-3 font-semibold", children: fmt(totalPerSample) }), _jsx("td", { className: "py-2 pr-3 font-semibold", children: totalUlDecimals != null ? fmt(totalTotal, totalUlDecimals) : fmt(totalTotal) })] })] })] }) })] }));
}
export default function Calcs() {
    var _a = useTranslation(), t = _a.t, i18n = _a.i18n;
    var _b = useState(6), nExtr = _b[0], setNExtr = _b[1]; // max 6
    var _c = useState(9), nMarc = _c[0], setNMarc = _c[1]; // max 12
    var extr = useMemo(function () {
        var n = nExtr;
        var excesoLD = 1.2;
        var sb = [
            { name: t("calcs.reagent.cellBuffer"), perSample: 49, total: 49 * n },
            { name: t("calcs.reagent.dnaStabilizer"), perSample: 1, total: 1 * n },
        ];
        var sbRa = [
            { name: t("calcs.reagent.stabilizerBuffer"), perSample: 36, total: 36 * n },
            { name: t("calcs.reagent.rnase"), perSample: 12, total: 12 * n },
        ];
        var ld = [
            { name: t("calcs.reagent.digestionEnhancer"), perSample: 270, total: 270 * excesoLD * n, order: 1 },
            { name: t("calcs.reagent.nucleaseFreeWater"), perSample: 66.25, total: 66.25 * excesoLD * n, order: 2 },
            { name: t("calcs.reagent.lbb"), perSample: 80, total: 80 * excesoLD * n, order: 3 },
            { name: t("calcs.reagent.deDetergent"), perSample: 3.75, total: 3.75 * excesoLD * n, order: 4 },
            { name: t("calcs.reagent.tlpk"), perSample: 10, total: 10 * excesoLD * n, order: 5 },
        ];
        var reaccionesConc = n * 3 + 2 + 1;
        var conc = [
            { name: t("calcs.reagent.brBuffer"), perSample: 199, total: 199 * reaccionesConc },
            { name: t("calcs.reagent.dye"), perSample: 1, total: 1 * reaccionesConc },
        ];
        return { sb: sb, sbRa: sbRa, ld: ld, conc: conc, reaccionesConc: reaccionesConc, excesoLD: excesoLD };
    }, [nExtr, t, i18n.language]);
    var marc = useMemo(function () {
        var n = nMarc;
        var excesoMM = 1.2;
        var excesoStain = 1.25;
        var labelingMM = [
            { name: t("calcs.reagent.dle1BufferRt"), perSample: 6, total: 6 * n * excesoMM },
            { name: t("calcs.reagent.dlGreenIce"), perSample: 1.5, total: 1.5 * n * excesoMM },
            { name: t("calcs.reagent.dle1Enzyme"), perSample: 3, total: 3 * n * excesoMM },
        ];
        var wetDisk = [
            { name: t("calcs.reagent.dle1Buffer"), perSample: 6, total: 6 * n },
            { name: t("calcs.reagent.ultrapureWater"), perSample: 24, total: 24 * n },
        ];
        var staining = [
            { name: t("calcs.reagent.flowBuffer"), perSample: 15, total: 15 * n * excesoStain },
            { name: t("calcs.reagent.dtt"), perSample: 6, total: 6 * n * excesoStain },
            { name: t("calcs.reagent.dnaStain"), perSample: 3.5, total: 3.5 * n * excesoStain },
            { name: t("calcs.reagent.ultraPureH2o"), perSample: 15.5, total: 15.5 * n * excesoStain },
        ];
        var reaccionesHS = n * 2 + 2 + 1;
        var hs = [
            { name: t("calcs.reagent.hsBuffer"), perSample: 179, total: 179 * reaccionesHS },
            { name: t("calcs.reagent.dye"), perSample: 1, total: 1 * reaccionesHS },
        ];
        return { labelingMM: labelingMM, wetDisk: wetDisk, staining: staining, hs: hs, reaccionesHS: reaccionesHS, excesoMM: excesoMM, excesoStain: excesoStain };
    }, [nMarc, t, i18n.language]);
    return (_jsx(SubpageShell, { title: t("calcs.title"), icon: Calculator, headerActions: _jsx(Button, { variant: "outline", size: "sm", onClick: function () { return window.print(); }, children: t("calcs.print") }), children: _jsxs(Tabs, { defaultValue: "extraccion", className: "gap-4", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [_jsx("div", { className: "bionapp-calcs-tabs-panel bionapp-calcs-tabs-panel--prep", children: _jsxs(TabsList, { children: [_jsx(TabsTrigger, { value: "extraccion", children: t("calcs.tab.extraction") }), _jsx(TabsTrigger, { value: "marcaje", children: t("calcs.tab.labeling") })] }) }), _jsx("div", { className: "bionapp-calcs-tabs-panel bionapp-calcs-tabs-panel--dilucion", children: _jsx(TabsList, { children: _jsx(TabsTrigger, { value: "dilucion", children: t("calcs.tab.dilution") }) }) })] }), _jsxs(TabsContent, { value: "extraccion", className: "space-y-4", children: [_jsx("div", { className: "bionapp-panel p-4", children: _jsxs("div", { className: "flex flex-wrap items-end gap-4", children: [_jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium mb-1", children: t("calcs.nSamplesMax6") }), _jsx(Input, { className: "bionapp-campo-info w-32", type: "number", min: 1, max: 6, value: nExtr, onChange: function (e) { return setNExtr(clampInt(e.target.value, 1, 6, 6)); } })] }), _jsxs("div", { className: "text-xs text-slate-500", children: [t("calcs.excessLd"), " ", _jsx("span", { className: "font-medium", children: extr.excesoLD })] }), _jsx("div", { className: "text-xs text-slate-500", children: t("calcs.concReactions", { n: extr.reaccionesConc }) })] }) }), _jsx(CalcTable, { title: t("calcs.table.sb"), rows: extr.sb }), _jsx(CalcTable, { title: t("calcs.table.sbra"), rows: extr.sbRa }), _jsx(CalcTable, { title: t("calcs.table.ld"), subtitle: t("calcs.totalsIncludeExcess"), rows: extr.ld, showOrder: true }), _jsx(CalcTable, { title: t("calcs.table.conc"), subtitle: t("calcs.reactionsEq", { n: extr.reaccionesConc }), rows: extr.conc })] }), _jsxs(TabsContent, { value: "marcaje", className: "space-y-4", children: [_jsx("div", { className: "bionapp-panel p-4", children: _jsxs("div", { className: "flex flex-wrap items-end gap-4", children: [_jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium mb-1", children: t("calcs.nSamplesMax12") }), _jsx(Input, { className: "bionapp-campo-info w-32", type: "number", min: 1, max: 12, value: nMarc, onChange: function (e) { return setNMarc(clampInt(e.target.value, 1, 12, 9)); } })] }), _jsxs("div", { className: "text-xs text-slate-500", children: [t("calcs.excessLabeling"), " ", _jsx("span", { className: "font-medium", children: marc.excesoMM })] }), _jsxs("div", { className: "text-xs text-slate-500", children: [t("calcs.excessStaining"), " ", _jsx("span", { className: "font-medium", children: marc.excesoStain })] }), _jsx("div", { className: "text-xs text-slate-500", children: t("calcs.hsReactions", { n: marc.reaccionesHS }) })] }) }), _jsx(CalcTable, { title: t("calcs.table.labelingMm"), subtitle: t("calcs.totalsIncludeExcess"), rows: marc.labelingMM, totalUlDecimals: 1 }), _jsx(CalcTable, { title: t("calcs.table.wetDisk"), subtitle: t("calcs.noExcess"), rows: marc.wetDisk }), _jsx(CalcTable, { title: t("calcs.table.staining"), subtitle: t("calcs.totalsIncludeExcess"), rows: marc.staining, totalUlDecimals: 1 }), _jsx(CalcTable, { title: t("calcs.table.hs"), subtitle: t("calcs.reactionsEq", { n: marc.reaccionesHS }), rows: marc.hs })] }), _jsx(TabsContent, { value: "dilucion", children: _jsx(DilucionDnaTab, {}) })] }) }));
}
