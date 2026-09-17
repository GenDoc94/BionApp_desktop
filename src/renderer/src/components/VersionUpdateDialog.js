import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";
export default function VersionUpdateDialog(_a) {
    var version = _a.version, changes = _a.changes, onDismiss = _a.onDismiss;
    var t = useTranslation().t;
    var dismissRef = useRef(onDismiss);
    dismissRef.current = onDismiss;
    useEffect(function () {
        var onKeyDown = function (e) {
            if (e.key === "Escape")
                dismissRef.current();
        };
        document.addEventListener("keydown", onKeyDown);
        return function () { return document.removeEventListener("keydown", onKeyDown); };
    }, []);
    return createPortal(_jsx("div", { className: "bionapp-version-dialog-backdrop", role: "presentation", onClick: onDismiss, children: _jsxs("div", { className: "bionapp-version-dialog", role: "dialog", "aria-modal": "true", "aria-labelledby": "bionapp-version-dialog-title", onClick: function (e) { return e.stopPropagation(); }, children: [_jsx("h2", { id: "bionapp-version-dialog-title", className: "bionapp-version-dialog__title", children: t("updates.whatsNewTitle", { version: version }) }), _jsx("p", { className: "bionapp-version-dialog__subtitle", children: t("updates.changes") }), _jsx("ul", { className: "bionapp-version-dialog__list", children: changes.map(function (item) { return (_jsx("li", { children: item }, item)); }) }), _jsx(Button, { className: "w-full bionapp-btn-green mt-4", size: "sm", onClick: onDismiss, children: t("updates.gotIt") })] }) }), document.body);
}
