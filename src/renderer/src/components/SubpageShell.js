import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import AppFooter from "./AppFooter";
import { Button } from "./ui/button";
import { cn } from "./ui/utils";
export default function SubpageShell(_a) {
    var title = _a.title, Icon = _a.icon, headerActions = _a.headerActions, _b = _a.maxWidthClass, maxWidthClass = _b === void 0 ? "max-w-6xl" : _b, children = _a.children, className = _a.className, _c = _a.showBackButton, showBackButton = _c === void 0 ? true : _c, onBack = _a.onBack;
    var t = useTranslation().t;
    var navigate = useNavigate();
    return (_jsxs("div", { className: cn("bionapp-subpage min-h-screen p-4 flex flex-col", className), children: [_jsxs("div", { className: cn(maxWidthClass, "mx-auto w-full flex-1 min-w-0"), children: [_jsxs("header", { className: "bionapp-subpage-header flex flex-wrap items-center justify-between gap-3 mb-4", children: [_jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [Icon ? _jsx(Icon, { className: "h-5 w-5 shrink-0 text-muted-foreground" }) : null, _jsx("h1", { className: "font-semibold text-lg truncate", children: title })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-2 shrink-0", children: [headerActions, showBackButton ? (_jsxs(Button, { type: "button", variant: "outline", size: "sm", className: "gap-2", onClick: function () { return (onBack ? onBack() : navigate("/")); }, children: [_jsx(ArrowLeft, { className: "h-4 w-4" }), t("nav.backToApp")] })) : null] })] }), children] }), _jsx("div", { className: cn(maxWidthClass, "mx-auto w-full min-w-0"), children: _jsx(AppFooter, {}) })] }));
}
