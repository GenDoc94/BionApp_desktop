import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";
export default function UpdateCheckDialog(_a) {
    var info = _a.info, onDismiss = _a.onDismiss;
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
    var title = info.hasUpdate
        ? t("updates.newVersion", { version: info.latestVersion })
        : t("updates.upToDate");
    return createPortal(_jsx("div", { className: "bionapp-version-dialog-backdrop", role: "presentation", onClick: onDismiss, children: _jsxs("div", { className: "bionapp-version-dialog", role: "dialog", "aria-modal": "true", "aria-labelledby": "bionapp-update-dialog-title", onClick: function (e) { return e.stopPropagation(); }, children: [_jsx("h2", { id: "bionapp-update-dialog-title", className: "bionapp-version-dialog__title", children: title }), _jsxs("p", { className: "bionapp-version-dialog__meta", children: [t("updates.installed", { current: info.currentVersion }), info.hasUpdate && (_jsxs(_Fragment, { children: [" ", t("updates.availableOnGithub", { latest: info.latestVersion })] }))] }), info.hasUpdate && info.changes.length > 0 && (_jsxs(_Fragment, { children: [_jsx("p", { className: "bionapp-version-dialog__subtitle", children: t("updates.changes") }), _jsx("ul", { className: "bionapp-version-dialog__list", children: info.changes.map(function (item) { return (_jsx("li", { children: item }, item)); }) })] })), info.hasUpdate && (_jsxs("div", { className: "bionapp-version-dialog__instructions", children: [_jsx("p", { className: "bionapp-version-dialog__subtitle", children: t("updates.howToTitle") }), _jsx("p", { children: t("updates.howToBody") }), _jsx("p", { children: t("updates.howToSmartscreen") })] })), !info.hasUpdate && (_jsx("p", { className: "bionapp-version-dialog__meta", children: t("updates.none") })), _jsxs("div", { className: "bionapp-version-dialog__actions", children: [info.hasUpdate && (_jsx(Button, { className: "bionapp-btn-green", size: "sm", asChild: true, children: _jsx("a", { href: info.releasesUrl, target: "_blank", rel: "noreferrer", children: t("updates.openGithub") }) })), _jsx(Button, { variant: "outline", size: "sm", onClick: onDismiss, children: t("updates.close") })] })] }) }), document.body);
}
