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
import { useCallback, useEffect, useRef, useState } from "react";
import { Download, FileText, Loader2, Trash2, Upload } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { translateIpcError } from "../../i18n/ipcErrors";
function formatBytes(bytes) {
    if (bytes < 1024)
        return "".concat(bytes, " B");
    if (bytes < 1024 * 1024)
        return "".concat((bytes / 1024).toFixed(1), " KB");
    return "".concat((bytes / (1024 * 1024)).toFixed(1), " MB");
}
function formatDate(iso) {
    try {
        return new Date(iso).toLocaleString("es-ES");
    }
    catch (_a) {
        return iso;
    }
}
export default function DocumentosTab() {
    var _this = this;
    var t = useTranslation().t;
    var inputRef = useRef(null);
    var _a = useState([]), files = _a[0], setFiles = _a[1];
    var _b = useState(true), loading = _b[0], setLoading = _b[1];
    var _c = useState(false), uploading = _c[0], setUploading = _c[1];
    var _d = useState(null), deleting = _d[0], setDeleting = _d[1];
    var loadFiles = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var list, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, window.api.listDocumentos()];
                case 2:
                    list = _a.sent();
                    setFiles(list);
                    return [3 /*break*/, 5];
                case 3:
                    err_1 = _a.sent();
                    console.error(err_1);
                    toast.error(t("docs.toast.loadError"));
                    setFiles([]);
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [t]);
    useEffect(function () {
        void loadFiles();
    }, [loadFiles]);
    var handleUpload = function (fileList) { return __awaiter(_this, void 0, void 0, function () {
        var _i, _a, file, buffer, err_2;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!(fileList === null || fileList === void 0 ? void 0 : fileList.length))
                        return [2 /*return*/];
                    setUploading(true);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 8, 9, 10]);
                    _i = 0, _a = Array.from(fileList);
                    _b.label = 2;
                case 2:
                    if (!(_i < _a.length)) return [3 /*break*/, 6];
                    file = _a[_i];
                    return [4 /*yield*/, file.arrayBuffer()];
                case 3:
                    buffer = _b.sent();
                    return [4 /*yield*/, window.api.uploadDocumento(file.name, buffer)];
                case 4:
                    _b.sent();
                    _b.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 2];
                case 6:
                    toast.success(fileList.length === 1
                        ? t("docs.toast.uploadedOne")
                        : t("docs.toast.uploadedMany", { count: fileList.length }));
                    return [4 /*yield*/, loadFiles()];
                case 7:
                    _b.sent();
                    return [3 /*break*/, 10];
                case 8:
                    err_2 = _b.sent();
                    console.error(err_2);
                    toast.error(err_2 instanceof Error ? translateIpcError(err_2.message) : t("docs.toast.uploadError"));
                    return [3 /*break*/, 10];
                case 9:
                    setUploading(false);
                    if (inputRef.current)
                        inputRef.current.value = "";
                    return [7 /*endfinally*/];
                case 10: return [2 /*return*/];
            }
        });
    }); };
    var handleDownload = function (name) { return __awaiter(_this, void 0, void 0, function () {
        var file, blob, url, anchor, err_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, window.api.readDocumento(name)];
                case 1:
                    file = _a.sent();
                    blob = new Blob([file.data]);
                    url = URL.createObjectURL(blob);
                    anchor = document.createElement("a");
                    anchor.href = url;
                    anchor.download = file.name;
                    anchor.click();
                    URL.revokeObjectURL(url);
                    return [3 /*break*/, 3];
                case 2:
                    err_3 = _a.sent();
                    console.error(err_3);
                    toast.error(t("docs.toast.downloadError"));
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    var handleDelete = function (name) { return __awaiter(_this, void 0, void 0, function () {
        var err_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!window.confirm(t("docs.confirmDelete", { name: name })))
                        return [2 /*return*/];
                    setDeleting(name);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, window.api.deleteDocumento(name)];
                case 2:
                    _a.sent();
                    toast.success(t("docs.toast.deleted"));
                    return [4 /*yield*/, loadFiles()];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 6];
                case 4:
                    err_4 = _a.sent();
                    console.error(err_4);
                    toast.error(t("docs.toast.deleteError"));
                    return [3 /*break*/, 6];
                case 5:
                    setDeleting(null);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "bionapp-panel p-4 space-y-3", children: [_jsxs("div", { children: [_jsx("div", { className: "font-semibold", children: t("docs.title") }), _jsx("p", { className: "text-xs text-slate-500 mt-1", children: t("docs.help") })] }), _jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [_jsx("input", { ref: inputRef, type: "file", multiple: true, className: "hidden", onChange: function (e) { return void handleUpload(e.target.files); } }), _jsxs(Button, { type: "button", size: "sm", className: "bionapp-btn-green gap-1.5", disabled: uploading, onClick: function () { var _a; return (_a = inputRef.current) === null || _a === void 0 ? void 0 : _a.click(); }, children: [uploading ? (_jsx(Loader2, { className: "h-4 w-4 animate-spin" })) : (_jsx(Upload, { className: "h-4 w-4" })), t("docs.upload")] }), _jsx(Button, { type: "button", size: "sm", variant: "outline", onClick: function () { return void loadFiles(); }, children: t("docs.refresh") })] })] }), _jsx("div", { className: "bionapp-panel p-4", children: loading ? (_jsxs("div", { className: "flex items-center gap-2 text-sm text-slate-500", children: [_jsx(Loader2, { className: "h-4 w-4 animate-spin" }), t("docs.loading")] })) : files.length === 0 ? (_jsx("p", { className: "text-sm text-slate-500", children: t("docs.empty") })) : (_jsx("ul", { className: "divide-y divide-border", children: files.map(function (file) { return (_jsxs("li", { className: "flex flex-wrap items-center gap-2 py-3 first:pt-0 last:pb-0", children: [_jsx(FileText, { className: "h-4 w-4 shrink-0 text-slate-500" }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("p", { className: "text-sm font-medium break-all", children: file.name }), _jsxs("p", { className: "text-xs text-slate-500", children: [formatBytes(file.size), " \u00B7 ", formatDate(file.updatedAt)] })] }), _jsxs("div", { className: "flex items-center gap-1 shrink-0", children: [_jsxs(Button, { type: "button", size: "sm", variant: "outline", className: "h-8 gap-1", onClick: function () { return void handleDownload(file.name); }, children: [_jsx(Download, { className: "h-3.5 w-3.5" }), t("docs.download")] }), _jsx(Button, { type: "button", size: "sm", variant: "destructive", className: "h-8 w-8 p-0", title: t("docs.delete"), disabled: deleting === file.name, onClick: function () { return void handleDelete(file.name); }, children: deleting === file.name ? (_jsx(Loader2, { className: "h-3.5 w-3.5 animate-spin" })) : (_jsx(Trash2, { className: "h-3.5 w-3.5" })) })] })] }, file.name)); }) })) })] }));
}
