import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from "react-i18next";
import { Label } from "./ui/label";
import { findLotId, lotLnForDisplay, lotOptionLabel } from "../lib/lotesPageData";
export default function LoteLnField(_a) {
    var editMode = _a.editMode, lots = _a.lots, current = _a.current, label = _a.label, _b = _a.layout, layout = _b === void 0 ? "stack" : _b, onSelect = _a.onSelect, onOpen = _a.onOpen;
    var t = useTranslation().t;
    var selectedId = findLotId(lots, current);
    var lnText = lotLnForDisplay(lots, current);
    var Wrapper = layout === "inline" ? "div" : "div";
    var wrapClass = layout === "inline" ? "bionapp-marcado-field" : "bionapp-field bionapp-field--lote-ln";
    var chipClass = layout === "inline" ? "bionapp-lote-ln-chip" : "bionapp-lote-ln-chip bionapp-lote-ln-chip--plain";
    var control = editMode ? (_jsxs("select", { value: selectedId !== null && selectedId !== void 0 ? selectedId : "", onChange: function (e) {
            var _a;
            var raw = e.target.value;
            if (!raw) {
                onSelect(null);
                return;
            }
            onSelect((_a = lots.find(function (l) { return l.id === Number(raw); })) !== null && _a !== void 0 ? _a : null);
        }, className: "h-7 text-xs border rounded px-1 min-w-0", children: [_jsx("option", { value: "", children: t("common.selectPlaceholder") }), lots.map(function (lot) { return (_jsx("option", { value: lot.id, children: lotOptionLabel(lot, lots) }, lot.id)); })] })) : lnText && onOpen ? (_jsx("button", { type: "button", className: chipClass, title: t("lotes.goToLot"), onClick: onOpen, children: lnText })) : (_jsx("span", { className: lnText ? "".concat(chipClass, " bionapp-lote-ln-chip--static") : "text-xs", children: lnText || t("common.empty") }));
    return (_jsxs(Wrapper, { className: wrapClass, children: [layout === "inline" ? (_jsx(Label, { className: "text-xs whitespace-nowrap", children: label })) : editMode ? (_jsx(Label, { className: "text-xs bionapp-field-label", children: label })) : (_jsx("span", { className: "text-xs bionapp-field-label", children: label })), control] }));
}
