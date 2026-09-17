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
import { useState } from "react";
import { Download, FileArchive, FileJson, FileSpreadsheet, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { EXPORT_TABLES } from "@shared/exportTables";
import { translateIpcError } from "../../i18n/ipcErrors";
export default function ExportacionTab() {
    var _this = this;
    var t = useTranslation().t;
    var _a = useState(null), busy = _a[0], setBusy = _a[1];
    var runExport = function (format) { return __awaiter(_this, void 0, void 0, function () {
        var result, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setBusy(format);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, window.api.exportDatabase(format)];
                case 2:
                    result = _a.sent();
                    if (result.canceled)
                        return [2 /*return*/];
                    if (!result.ok) {
                        toast.error(result.error ? translateIpcError(result.error) : t("export.toast.error"));
                        return [2 /*return*/];
                    }
                    toast.success(t("export.toast.saved", { path: result.path }));
                    return [3 /*break*/, 5];
                case 3:
                    e_1 = _a.sent();
                    console.error(e_1);
                    toast.error(e_1 instanceof Error ? translateIpcError(e_1.message) : t("export.toast.error"));
                    return [3 /*break*/, 5];
                case 4:
                    setBusy(null);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); };
    return (_jsxs("div", { className: "bionapp-panel p-4 space-y-4", children: [_jsxs("div", { children: [_jsx("p", { className: "font-semibold mb-1", children: t("export.title") }), _jsx("p", { className: "text-sm text-slate-600 dark:text-slate-300", children: t("export.help") })] }), _jsxs("div", { className: "flex flex-col gap-2 sm:flex-row sm:flex-wrap", children: [_jsxs(Button, { type: "button", variant: "outline", className: "gap-2 justify-start", disabled: !!busy, onClick: function () { return void runExport("xlsx"); }, children: [busy === "xlsx" ? (_jsx(Loader2, { className: "h-4 w-4 animate-spin" })) : (_jsx(FileSpreadsheet, { className: "h-4 w-4" })), t("export.excel")] }), _jsxs(Button, { type: "button", variant: "outline", className: "gap-2 justify-start", disabled: !!busy, onClick: function () { return void runExport("json"); }, children: [busy === "json" ? (_jsx(Loader2, { className: "h-4 w-4 animate-spin" })) : (_jsx(FileJson, { className: "h-4 w-4" })), t("export.json")] }), _jsxs(Button, { type: "button", variant: "outline", className: "gap-2 justify-start", disabled: !!busy, onClick: function () { return void runExport("sqlite"); }, children: [busy === "sqlite" ? (_jsx(Loader2, { className: "h-4 w-4 animate-spin" })) : (_jsx(FileArchive, { className: "h-4 w-4" })), t("export.sqlite")] })] }), _jsxs("p", { className: "text-xs text-muted-foreground flex items-start gap-1.5", children: [_jsx(Download, { className: "h-3.5 w-3.5 mt-0.5 shrink-0" }), t("export.tablesIncluded", { tables: EXPORT_TABLES.join(", ") })] })] }));
}
