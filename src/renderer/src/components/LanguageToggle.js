import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { setAppLocale } from '../i18n';
export default function LanguageToggle(_a) {
    var _b = _a.className, className = _b === void 0 ? '' : _b;
    var i18n = useTranslation().i18n;
    var locale = i18n.language.startsWith('en') ? 'en' : 'es';
    return (_jsxs("div", { className: "inline-flex rounded-md border border-border p-0.5 ".concat(className).trim(), children: [_jsx(Button, { type: "button", size: "sm", variant: locale === 'es' ? 'default' : 'ghost', className: "h-9 px-3", onClick: function () { return void setAppLocale('es'); }, children: "Espa\u00F1ol" }), _jsx(Button, { type: "button", size: "sm", variant: locale === 'en' ? 'default' : 'ghost', className: "h-9 px-3", onClick: function () { return void setAppLocale('en'); }, children: "English" })] }));
}
