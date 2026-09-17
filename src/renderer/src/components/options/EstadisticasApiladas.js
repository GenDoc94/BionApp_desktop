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
import { useTranslation } from "react-i18next";
var CHART_HEIGHT = 180;
export default function EstadisticasApiladas(_a) {
    var porPeriodo = _a.porPeriodo;
    var t = useTranslation().t;
    var maxTotal = Math.max.apply(Math, __spreadArray(__spreadArray([], porPeriodo.map(function (p) { return p.total; }), false), [1], false));
    return (_jsxs("div", { className: "space-y-3", children: [_jsx("div", { className: "flex items-end gap-2 sm:gap-3 h-[200px] border-b border-border pb-2", children: porPeriodo.map(function (periodo) {
                    var barHeight = Math.max(4, Math.round((periodo.total / maxTotal) * CHART_HEIGHT));
                    return (_jsxs("div", { className: "flex flex-1 min-w-[2rem] max-w-[4rem] flex-col items-center justify-end gap-1", title: t("stats.bar.title", { label: periodo.label, total: periodo.total }), children: [_jsx("span", { className: "text-[10px] tabular-nums text-slate-500", children: periodo.total }), _jsxs("div", { className: "w-full flex flex-col justify-end rounded-t overflow-hidden", style: { height: barHeight }, children: [periodo.fallidas > 0 ? (_jsx("div", { className: "w-full bionapp-chart-fill--danger", style: { flex: periodo.fallidas }, title: t("stats.bar.failed", { count: periodo.fallidas }) })) : null, periodo.enProceso > 0 ? (_jsx("div", { className: "w-full bionapp-chart-fill--warn", style: { flex: periodo.enProceso }, title: t("stats.bar.inProgress", { count: periodo.enProceso }) })) : null, periodo.completas > 0 ? (_jsx("div", { className: "w-full bionapp-chart-fill--ok", style: { flex: periodo.completas }, title: t("stats.bar.completed", { count: periodo.completas }) })) : null] }), _jsx("span", { className: "text-[10px] text-slate-500 text-center leading-tight max-w-full truncate", children: periodo.label })] }, periodo.period));
                }) }), _jsxs("div", { className: "flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500", children: [_jsxs("span", { className: "inline-flex items-center gap-1.5", children: [_jsx("span", { className: "inline-block h-3 w-3 rounded-sm bionapp-chart-fill--danger" }), t("stats.legend.failedShort")] }), _jsxs("span", { className: "inline-flex items-center gap-1.5", children: [_jsx("span", { className: "inline-block h-3 w-3 rounded-sm bionapp-chart-fill--warn" }), t("stats.legend.inProgressShort")] }), _jsxs("span", { className: "inline-flex items-center gap-1.5", children: [_jsx("span", { className: "inline-block h-3 w-3 rounded-sm bionapp-chart-fill--ok" }), t("stats.legend.completedShort")] })] })] }));
}
