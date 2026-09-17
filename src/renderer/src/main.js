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
import "./i18n";
import { Suspense, lazy, useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Navigate, Routes, Route, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AuthProvider } from "./authContext";
import { supabase } from "./lib/supabaseClient";
import { applyTheme, getStoredTheme } from "./lib/theme";
import { getStoredLocale } from "./i18n";
import SetupPage from "./components/SetupPage";
import "./index.css";
applyTheme(getStoredTheme());
var App = lazy(function () { return import("./pages/App"); });
var Login = lazy(function () { return import("./pages/Login"); });
var CreateUser = lazy(function () { return import("./pages/CreateUser"); });
var ChipPage = lazy(function () { return import("./pages/ChipPage"); });
var CalidadPage = lazy(function () { return import("./pages/CalidadPage"); });
var PreselectPage = lazy(function () { return import("./pages/PreselectPage"); });
var ActionsPage = lazy(function () { return import("./pages/ActionsPage"); });
var Calcs = lazy(function () { return import("./pages/Calcs"); });
var Options = lazy(function () { return import("./pages/options"); });
var LicensePage = lazy(function () { return import("./pages/LicensePage"); });
function LoadingScreen() {
    var t = useTranslation().t;
    return (_jsx("div", { className: "bionapp-subpage min-h-screen flex items-center justify-center text-muted-foreground", children: t("common.loading") }));
}
function PublicRoutes(_a) {
    var onLogin = _a.onLogin;
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/nuevo-usuario", element: _jsx(CreateUser, {}) }), _jsx(Route, { path: "*", element: _jsx(Login, { onLogin: onLogin }) })] }));
}
function LotesToCalidadRedirect() {
    var params = useSearchParams()[0];
    var qs = new URLSearchParams(params);
    qs.set("tab", "lotes");
    return _jsx(Navigate, { to: "/calidad?".concat(qs.toString()), replace: true });
}
function PrivateRoutes() {
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(App, {}) }), _jsx(Route, { path: "/preselect", element: _jsx(PreselectPage, {}) }), _jsx(Route, { path: "/calidad", element: _jsx(CalidadPage, {}) }), _jsx(Route, { path: "/lotes", element: _jsx(LotesToCalidadRedirect, {}) }), _jsx(Route, { path: "/chips", element: _jsx(ChipPage, {}) }), _jsx(Route, { path: "/actions", element: _jsx(ActionsPage, {}) }), _jsx(Route, { path: "/calcs", element: _jsx(Calcs, {}) }), _jsx(Route, { path: "/options", element: _jsx(Options, {}) }), _jsx(Route, { path: "/license", element: _jsx(LicensePage, {}) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }));
}
function Main() {
    var _this = this;
    var _a = useState(false), ready = _a[0], setReady = _a[1];
    var _b = useState(false), dbReady = _b[0], setDbReady = _b[1];
    var _c = useState(null), user = _c[0], setUser = _c[1];
    var _d = useState(true), loading = _d[0], setLoading = _d[1];
    useEffect(function () {
        void window.api.setLocale(getStoredLocale());
        void window.api.getState().then(function (s) {
            setDbReady(!!s.dbReady && !!s.dataPath);
            setReady(true);
        });
    }, []);
    useEffect(function () {
        if (!dbReady)
            return;
        supabase.auth.getSession().then(function (_a) {
            var _b;
            var session = _a.data.session;
            setUser((_b = session === null || session === void 0 ? void 0 : session.user) !== null && _b !== void 0 ? _b : null);
            setLoading(false);
        });
        var listener = supabase.auth.onAuthStateChange(function (_event, session) {
            var _a;
            setUser((_a = session === null || session === void 0 ? void 0 : session.user) !== null && _a !== void 0 ? _a : null);
            setLoading(false);
        }).data;
        return function () { return listener.subscription.unsubscribe(); };
    }, [dbReady]);
    if (!ready)
        return _jsx(LoadingScreen, {});
    if (!dbReady) {
        return (_jsx(SetupPage, { onDone: function (path, adminCode) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, window.api.setDataFolder(path, adminCode)];
                        case 1:
                            _a.sent();
                            setDbReady(true);
                            return [2 /*return*/];
                    }
                });
            }); } }));
    }
    if (loading)
        return _jsx(LoadingScreen, {});
    return (_jsx(AuthProvider, { user: user, setUser: setUser, children: _jsx(HashRouter, { children: _jsx(Suspense, { fallback: _jsx(LoadingScreen, {}), children: user ? _jsx(PrivateRoutes, {}) : _jsx(PublicRoutes, { onLogin: function (u) { return setUser(u); } }) }) }) }));
}
var root = ReactDOM.createRoot(document.getElementById("root"));
root.render(_jsx(Main, {}));
