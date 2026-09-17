import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import pkg from "bionapp-pkg";
var version = pkg.version;
var year = new Date().getFullYear();
export default function AppFooter() {
    var t = useTranslation().t;
    return (_jsxs("footer", { className: "bionapp-footer mt-3 pt-2 border-t border-border text-center text-xs text-muted-foreground", children: [_jsx("p", { className: "font-medium text-foreground/80", children: t("footer.tagline", { version: version }) }), _jsxs("p", { className: "mt-1 inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1", children: [_jsxs("span", { children: ["\u00A9 ", year] }), _jsxs("a", { href: "https://github.com/GenDoc94", target: "_blank", rel: "noreferrer", className: "inline-flex items-center gap-1 text-foreground hover:underline", children: ["GenDoc94", _jsx("img", { src: "https://raw.githubusercontent.com/GenDoc94/PCR_Analyser/main/logo_hem.png", alt: "", className: "h-3 w-auto", "aria-hidden": true })] }), _jsx("span", { "aria-hidden": true, children: "\u00B7" }), _jsxs("a", { href: "https://buymeacoffee.com/gendoc94", target: "_blank", rel: "noreferrer", className: "inline-flex items-center gap-1 hover:underline", children: ["Buy me a coffee", _jsx("img", { src: "https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png", alt: "", className: "h-3 w-auto", "aria-hidden": true })] }), _jsx("span", { "aria-hidden": true, children: "\u00B7" }), _jsx(Link, { to: "/license", className: "hover:underline text-foreground", children: "MIT License" })] })] }));
}
