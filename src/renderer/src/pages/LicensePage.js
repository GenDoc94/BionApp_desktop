import { jsx as _jsx } from "react/jsx-runtime";
import { Scale } from "lucide-react";
import { useTranslation } from "react-i18next";
import SubpageShell from "../components/SubpageShell";
import { MIT_LICENSE_TEXT } from "../content/mitLicense";
export default function LicensePage() {
    var t = useTranslation().t;
    return (_jsx(SubpageShell, { title: t("license.title"), icon: Scale, maxWidthClass: "max-w-3xl", children: _jsx("div", { className: "bionapp-panel p-4 sm:p-6", children: _jsx("pre", { className: "whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700 dark:text-slate-200 font-mono", children: MIT_LICENSE_TEXT.trim() }) }) }));
}
