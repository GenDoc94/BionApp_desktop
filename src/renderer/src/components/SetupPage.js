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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import logo from '../assets/BionApp.svg';
import { translateIpcError } from '../i18n/ipcErrors';
import LanguageToggle from './LanguageToggle';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
export default function SetupPage(_a) {
    var _this = this;
    var onDone = _a.onDone;
    var t = useTranslation().t;
    var _b = useState(null), path = _b[0], setPath = _b[1];
    var _c = useState(''), adminCode = _c[0], setAdminCode = _c[1];
    var _d = useState(''), adminCodeConfirm = _d[0], setAdminCodeConfirm = _d[1];
    var _e = useState(false), busy = _e[0], setBusy = _e[1];
    var _f = useState(null), error = _f[0], setError = _f[1];
    var codesMatch = adminCode.trim() === adminCodeConfirm.trim();
    var codesPartial = Boolean(adminCode.trim() || adminCodeConfirm.trim());
    var canContinue = Boolean(path) &&
        !busy &&
        (!codesPartial || (codesMatch && adminCode.trim().length >= 4));
    return (_jsx("div", { className: "bionapp-subpage min-h-screen flex flex-col items-center justify-center p-6", children: _jsxs("div", { className: "w-full max-w-md bionapp-panel shadow-sm p-6 space-y-4", children: [_jsx("div", { className: "flex justify-center", children: _jsx(LanguageToggle, {}) }), _jsxs("div", { className: "flex flex-col items-center gap-2", children: [_jsx("img", { src: logo, alt: "BionApp", className: "h-20 w-auto" }), _jsx("h1", { className: "text-lg font-semibold", children: t('setup.title') })] }), _jsx("p", { className: "text-sm text-muted-foreground text-center", children: t('setup.body') }), _jsx(Button, { variant: "secondary", className: "w-full", onClick: function () { return __awaiter(_this, void 0, void 0, function () {
                        var p;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, window.api.pickDataFolder()];
                                case 1:
                                    p = _a.sent();
                                    if (p)
                                        setPath(p);
                                    return [2 /*return*/];
                            }
                        });
                    }); }, children: t('setup.pickFolder') }), path && (_jsx("code", { className: "block text-xs break-all bg-muted/40 rounded p-2", children: path })), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "admin-code", className: "text-xs", children: t('setup.adminCode') }), _jsx(Input, { id: "admin-code", type: "password", autoComplete: "new-password", value: adminCode, onChange: function (e) { return setAdminCode(e.target.value); }, placeholder: t('setup.adminCodePlaceholder'), className: "h-9 text-sm" })] }), _jsxs("div", { className: "space-y-2", children: [_jsx(Label, { htmlFor: "admin-code-confirm", className: "text-xs", children: t('setup.confirmCode') }), _jsx(Input, { id: "admin-code-confirm", type: "password", autoComplete: "new-password", value: adminCodeConfirm, onChange: function (e) { return setAdminCodeConfirm(e.target.value); }, placeholder: t('setup.confirmPlaceholder'), className: "h-9 text-sm" }), codesPartial && !codesMatch && (_jsx("p", { className: "text-xs text-destructive", children: t('setup.mismatch') }))] }), error && _jsx("p", { className: "text-sm text-destructive", children: error }), _jsx(Button, { className: "w-full", disabled: !canContinue, onClick: function () { return __awaiter(_this, void 0, void 0, function () {
                        var e_1;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    if (!path || !canContinue)
                                        return [2 /*return*/];
                                    setBusy(true);
                                    setError(null);
                                    _a.label = 1;
                                case 1:
                                    _a.trys.push([1, 3, 4, 5]);
                                    return [4 /*yield*/, onDone(path, adminCode.trim())];
                                case 2:
                                    _a.sent();
                                    return [3 /*break*/, 5];
                                case 3:
                                    e_1 = _a.sent();
                                    setError(translateIpcError(e_1 instanceof Error ? e_1.message : String(e_1)));
                                    return [3 /*break*/, 5];
                                case 4:
                                    setBusy(false);
                                    return [7 /*endfinally*/];
                                case 5: return [2 /*return*/];
                            }
                        });
                    }); }, children: busy ? t('setup.preparing') : t('setup.continue') }), _jsx("p", { className: "text-[11px] text-muted-foreground text-center", children: t('setup.remember') })] }) }));
}
