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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import pkg from "bionapp-pkg";
import i18n from "../i18n";
import { getChangesForVersion } from "./changelog";
export var UPDATE_REPO = "GenDoc94/BionApp_desktop";
export var UPDATE_BRANCH = "master";
var BRANCH_FALLBACKS = ["master", "main"];
/** Quita el prefijo `v` de un tag de GitHub (`v3.0.10` → `3.0.10`). */
export function stripVersionPrefix(tag) {
    return tag.trim().replace(/^v/i, "");
}
/** Escritorio Electron: siempre instalación local. */
export function isLocalInstall() {
    return true;
}
/** Compara semver simple (major.minor.patch). */
export function compareVersions(a, b) {
    var _a, _b;
    var pa = a.split(".").map(function (n) { return Number(n) || 0; });
    var pb = b.split(".").map(function (n) { return Number(n) || 0; });
    var len = Math.max(pa.length, pb.length);
    for (var i = 0; i < len; i++) {
        var da = (_a = pa[i]) !== null && _a !== void 0 ? _a : 0;
        var db = (_b = pb[i]) !== null && _b !== void 0 ? _b : 0;
        if (da > db)
            return 1;
        if (da < db)
            return -1;
    }
    return 0;
}
function getUpdateRepo() {
    var _a;
    var custom = String((_a = import.meta.env.VITE_BIONAPP_UPDATE_REPO) !== null && _a !== void 0 ? _a : "").trim();
    return custom || UPDATE_REPO;
}
function resolveDefaultBranch(repo) {
    return __awaiter(this, void 0, void 0, function () {
        var res, data, branch, _a;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch("https://api.github.com/repos/".concat(repo), {
                            headers: { Accept: "application/vnd.github+json" },
                            cache: "no-store",
                        })];
                case 1:
                    res = _c.sent();
                    if (!res.ok)
                        return [2 /*return*/, null];
                    return [4 /*yield*/, res.json()];
                case 2:
                    data = (_c.sent());
                    branch = (_b = data.default_branch) === null || _b === void 0 ? void 0 : _b.trim();
                    return [2 /*return*/, branch || null];
                case 3:
                    _a = _c.sent();
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function fetchPackageJsonFromBranch(repo, branch) {
    return __awaiter(this, void 0, void 0, function () {
        var rawUrl, rawRes, apiUrl, apiRes, payload, json;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    rawUrl = "https://raw.githubusercontent.com/".concat(repo, "/").concat(branch, "/package.json");
                    return [4 /*yield*/, fetch(rawUrl, { cache: "no-store" })];
                case 1:
                    rawRes = _a.sent();
                    if (!rawRes.ok) return [3 /*break*/, 3];
                    return [4 /*yield*/, rawRes.json()];
                case 2: return [2 /*return*/, (_a.sent())];
                case 3:
                    if (rawRes.status !== 404) {
                        throw new Error(i18n.t("updates.err.packageJson", { status: rawRes.status }));
                    }
                    apiUrl = "https://api.github.com/repos/".concat(repo, "/contents/package.json?ref=").concat(encodeURIComponent(branch));
                    return [4 /*yield*/, fetch(apiUrl, {
                            headers: {
                                Accept: "application/vnd.github+json",
                            },
                            cache: "no-store",
                        })];
                case 4:
                    apiRes = _a.sent();
                    if (!apiRes.ok) {
                        if (apiRes.status === 404)
                            return [2 /*return*/, null];
                        throw new Error(i18n.t("updates.err.packageJson", { status: apiRes.status }));
                    }
                    return [4 /*yield*/, apiRes.json()];
                case 5:
                    payload = (_a.sent());
                    if (payload.encoding !== "base64" || !payload.content) {
                        throw new Error(i18n.t("updates.err.invalidGithub"));
                    }
                    json = atob(payload.content.replace(/\n/g, ""));
                    return [2 /*return*/, JSON.parse(json)];
            }
        });
    });
}
function fetchLatestReleaseVersion(repo) {
    return __awaiter(this, void 0, void 0, function () {
        var res, data, version;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, fetch("https://api.github.com/repos/".concat(repo, "/releases/latest"), {
                        headers: { Accept: "application/vnd.github+json" },
                        cache: "no-store",
                    })];
                case 1:
                    res = _b.sent();
                    if (res.status === 404)
                        return [2 /*return*/, null];
                    if (!res.ok) {
                        throw new Error(i18n.t("updates.err.latestRelease", { status: res.status }));
                    }
                    return [4 /*yield*/, res.json()];
                case 2:
                    data = (_b.sent());
                    version = stripVersionPrefix((_a = data.tag_name) !== null && _a !== void 0 ? _a : "");
                    return [2 /*return*/, version || null];
            }
        });
    });
}
function fetchRemotePackageJson(repo) {
    return __awaiter(this, void 0, void 0, function () {
        var defaultBranch, branches, sawNotFound, _i, branches_1, branch, remotePkg, version, err_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, resolveDefaultBranch(repo)];
                case 1:
                    defaultBranch = _b.sent();
                    branches = __spreadArray([], new Set(__spreadArray([defaultBranch], BRANCH_FALLBACKS, true).filter(Boolean)), true);
                    sawNotFound = false;
                    _i = 0, branches_1 = branches;
                    _b.label = 2;
                case 2:
                    if (!(_i < branches_1.length)) return [3 /*break*/, 7];
                    branch = branches_1[_i];
                    _b.label = 3;
                case 3:
                    _b.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, fetchPackageJsonFromBranch(repo, branch)];
                case 4:
                    remotePkg = _b.sent();
                    if (!remotePkg) {
                        sawNotFound = true;
                        return [3 /*break*/, 6];
                    }
                    version = (_a = remotePkg.version) === null || _a === void 0 ? void 0 : _a.trim();
                    if (!version) {
                        throw new Error(i18n.t("updates.err.invalidRemoteVersion"));
                    }
                    return [2 /*return*/, { version: version, branch: branch }];
                case 5:
                    err_1 = _b.sent();
                    if (err_1 instanceof TypeError) {
                        throw new Error(i18n.t("updates.err.offline"));
                    }
                    throw err_1;
                case 6:
                    _i++;
                    return [3 /*break*/, 2];
                case 7:
                    if (sawNotFound) {
                        throw new Error(i18n.t("updates.err.repoNotFound"));
                    }
                    throw new Error(i18n.t("updates.err.readVersion"));
            }
        });
    });
}
function resolveRemoteVersion(repo) {
    return __awaiter(this, void 0, void 0, function () {
        var fromRelease, branch, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 4, , 5]);
                    return [4 /*yield*/, fetchLatestReleaseVersion(repo)];
                case 1:
                    fromRelease = _a.sent();
                    if (!fromRelease) return [3 /*break*/, 3];
                    return [4 /*yield*/, resolveDefaultBranch(repo)];
                case 2:
                    branch = (_a.sent()) || UPDATE_BRANCH;
                    return [2 /*return*/, { version: fromRelease, branch: branch }];
                case 3: return [2 /*return*/, fetchRemotePackageJson(repo)];
                case 4:
                    err_2 = _a.sent();
                    if (err_2 instanceof TypeError) {
                        throw new Error(i18n.t("updates.err.offline"));
                    }
                    throw err_2;
                case 5: return [2 /*return*/];
            }
        });
    });
}
export function checkForAppUpdate() {
    return __awaiter(this, void 0, void 0, function () {
        var currentVersion, repo, remote, err_3, latestVersion, base, changelogMd, changelogRes, _a, changes, hasUpdate;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    currentVersion = pkg.version;
                    repo = getUpdateRepo();
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, resolveRemoteVersion(repo)];
                case 2:
                    remote = _b.sent();
                    return [3 /*break*/, 4];
                case 3:
                    err_3 = _b.sent();
                    if (err_3 instanceof Error)
                        throw err_3;
                    throw new Error(i18n.t("updates.err.offline"));
                case 4:
                    latestVersion = remote.version;
                    base = "https://raw.githubusercontent.com/".concat(repo, "/").concat(remote.branch);
                    changelogMd = "";
                    _b.label = 5;
                case 5:
                    _b.trys.push([5, 9, , 10]);
                    return [4 /*yield*/, fetch("".concat(base, "/CHANGELOG.md"), { cache: "no-store" })];
                case 6:
                    changelogRes = _b.sent();
                    if (!changelogRes.ok) return [3 /*break*/, 8];
                    return [4 /*yield*/, changelogRes.text()];
                case 7:
                    changelogMd = _b.sent();
                    _b.label = 8;
                case 8: return [3 /*break*/, 10];
                case 9:
                    _a = _b.sent();
                    return [3 /*break*/, 10];
                case 10:
                    changes = getChangesForVersion(latestVersion, changelogMd);
                    hasUpdate = compareVersions(latestVersion, currentVersion) > 0;
                    return [2 /*return*/, {
                            currentVersion: currentVersion,
                            latestVersion: latestVersion,
                            hasUpdate: hasUpdate,
                            changes: changes,
                            releasesUrl: "https://github.com/".concat(repo, "/releases/latest"),
                            repoUrl: "https://github.com/".concat(repo),
                        }];
            }
        });
    });
}
