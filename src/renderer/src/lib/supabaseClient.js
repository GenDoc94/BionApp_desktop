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
var _a;
var WRITE_ACTIONS = new Set(['insert', 'update', 'upsert', 'delete']);
var QueryBuilder = /** @class */ (function () {
    function QueryBuilder(table) {
        this.action = 'select';
        this.selectClause = '*';
        this.filters = [];
        this.orderClauses = [];
        this.rowMode = 'many';
        this.returning = false;
        this.table = table;
    }
    QueryBuilder.prototype.select = function (columns) {
        if (columns === void 0) { columns = '*'; }
        this.selectClause = columns;
        // Tras un write, .select() pide representación (no cambia la acción a SELECT).
        if (WRITE_ACTIONS.has(this.action)) {
            this.returning = true;
            return this;
        }
        this.action = 'select';
        return this;
    };
    QueryBuilder.prototype.insert = function (data) {
        this.action = 'insert';
        this.payload = data;
        return this;
    };
    QueryBuilder.prototype.update = function (data) {
        this.action = 'update';
        this.payload = data;
        return this;
    };
    QueryBuilder.prototype.upsert = function (data, opts) {
        this.action = 'upsert';
        this.payload = data;
        this.onConflict = opts === null || opts === void 0 ? void 0 : opts.onConflict;
        return this;
    };
    QueryBuilder.prototype.delete = function () {
        this.action = 'delete';
        return this;
    };
    QueryBuilder.prototype.eq = function (column, value) {
        this.filters.push({ type: 'eq', column: column, value: value });
        return this;
    };
    QueryBuilder.prototype.neq = function (column, value) {
        this.filters.push({ type: 'neq', column: column, value: value });
        return this;
    };
    QueryBuilder.prototype.in = function (column, value) {
        this.filters.push({ type: 'in', column: column, value: value });
        return this;
    };
    QueryBuilder.prototype.is = function (column, value) {
        this.filters.push({ type: 'is', column: column, value: value });
        return this;
    };
    QueryBuilder.prototype.ilike = function (column, pattern) {
        this.filters.push({ type: 'ilike', column: column, value: String(pattern) });
        return this;
    };
    QueryBuilder.prototype.lt = function (column, value) {
        this.filters.push({ type: 'lt', column: column, value: value });
        return this;
    };
    QueryBuilder.prototype.lte = function (column, value) {
        this.filters.push({ type: 'lte', column: column, value: value });
        return this;
    };
    QueryBuilder.prototype.gt = function (column, value) {
        this.filters.push({ type: 'gt', column: column, value: value });
        return this;
    };
    QueryBuilder.prototype.gte = function (column, value) {
        this.filters.push({ type: 'gte', column: column, value: value });
        return this;
    };
    /** Equivale a varios `.eq()` (supabase `.match({ col: val })`). */
    QueryBuilder.prototype.match = function (values) {
        for (var _i = 0, _a = Object.entries(values); _i < _a.length; _i++) {
            var _b = _a[_i], column = _b[0], value = _b[1];
            this.filters.push({ type: 'eq', column: column, value: value });
        }
        return this;
    };
    /** Subconjunto de supabase `.not(column, operator, value)`. */
    QueryBuilder.prototype.not = function (column, operator, value) {
        if (operator === 'is' && value === null) {
            this.filters.push({ type: 'not_is', column: column, value: null });
            return this;
        }
        if (operator === 'eq') {
            this.filters.push({ type: 'not_eq', column: column, value: value });
            return this;
        }
        throw new Error("Operador .not no soportado: ".concat(operator));
    };
    QueryBuilder.prototype.order = function (column, opts) {
        this.orderClauses.push({ column: column, ascending: (opts === null || opts === void 0 ? void 0 : opts.ascending) !== false });
        return this;
    };
    QueryBuilder.prototype.single = function () {
        this.rowMode = 'single';
        return this;
    };
    QueryBuilder.prototype.maybeSingle = function () {
        this.rowMode = 'maybeSingle';
        return this;
    };
    QueryBuilder.prototype.limit = function (n) {
        this.limitN = n;
        return this;
    };
    QueryBuilder.prototype.range = function (from, to) {
        this.offsetN = from;
        this.limitN = to - from + 1;
        return this;
    };
    QueryBuilder.prototype.buildRequest = function () {
        return {
            table: this.table,
            action: this.action,
            select: this.selectClause,
            filters: this.filters,
            order: this.orderClauses,
            data: this.payload,
            onConflict: this.onConflict,
            limit: this.limitN,
            offset: this.offsetN,
            returning: this.returning || WRITE_ACTIONS.has(this.action)
        };
    };
    QueryBuilder.prototype.projectColumns = function (row) {
        var _a;
        var raw = (_a = this.selectClause) === null || _a === void 0 ? void 0 : _a.trim();
        if (!raw || raw === '*')
            return row;
        // Ignorar embeds en proyección post-write; solo columnas simples
        var cols = raw
            .split(',')
            .map(function (c) { return c.trim(); })
            .filter(function (c) { return c && c !== '*' && !c.includes('('); });
        if (!cols.length)
            return row;
        var out = {};
        for (var _i = 0, cols_1 = cols; _i < cols_1.length; _i++) {
            var c = cols_1[_i];
            if (c in row)
                out[c] = row[c];
        }
        return out;
    };
    QueryBuilder.prototype.shapeResult = function (res) {
        var _this = this;
        if (res.error)
            return { data: res.data, error: res.error };
        var data = res.data;
        if (WRITE_ACTIONS.has(this.action) && this.returning && this.selectClause !== '*') {
            if (Array.isArray(data)) {
                data = data.map(function (r) {
                    return r && typeof r === 'object' ? _this.projectColumns(r) : r;
                });
            }
            else if (data && typeof data === 'object') {
                data = this.projectColumns(data);
            }
        }
        if (this.rowMode === 'many')
            return { data: data, error: null };
        var rows = Array.isArray(data) ? data : data == null ? [] : [data];
        if (this.rowMode === 'maybeSingle') {
            if (rows.length === 0)
                return { data: null, error: null };
            if (rows.length === 1)
                return { data: rows[0], error: null };
            return {
                data: null,
                error: { message: 'JSON object requested, multiple (or no) rows returned' }
            };
        }
        if (rows.length === 1)
            return { data: rows[0], error: null };
        return {
            data: null,
            error: { message: 'JSON object requested, multiple (or no) rows returned' }
        };
    };
    QueryBuilder.prototype.then = function (onfulfilled, onrejected) {
        var _this = this;
        return window.api.dbRequest(this.buildRequest()).then(function (res) {
            var result = _this.shapeResult(res);
            return onfulfilled ? onfulfilled(result) : result;
        }, onrejected !== null && onrejected !== void 0 ? onrejected : undefined);
    };
    return QueryBuilder;
}());
var authListeners = new Set();
if (typeof window !== 'undefined' && ((_a = window.api) === null || _a === void 0 ? void 0 : _a.onAuthState)) {
    window.api.onAuthState(function (user) {
        var session = user ? { user: user } : null;
        for (var _i = 0, authListeners_1 = authListeners; _i < authListeners_1.length; _i++) {
            var cb = authListeners_1[_i];
            cb('AUTH', session);
        }
    });
}
export var supabase = {
    from: function (table) {
        return new QueryBuilder(table);
    },
    auth: {
        signInWithPassword: function (_a) {
            return __awaiter(this, arguments, void 0, function (_b) {
                var email = _b.email, password = _b.password;
                return __generator(this, function (_c) {
                    return [2 /*return*/, window.api.login(email, password)];
                });
            });
        },
        signOut: function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, window.api.logout()];
                });
            });
        },
        getSession: function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, window.api.getSession()];
                });
            });
        },
        getUser: function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, window.api.getUser()];
                });
            });
        },
        onAuthStateChange: function (cb) {
            authListeners.add(cb);
            void window.api.getSession().then(function (res) {
                var _a, _b;
                cb('INITIAL', (_b = (_a = res === null || res === void 0 ? void 0 : res.data) === null || _a === void 0 ? void 0 : _a.session) !== null && _b !== void 0 ? _b : null);
            });
            return {
                data: {
                    subscription: {
                        unsubscribe: function () {
                            authListeners.delete(cb);
                        }
                    }
                }
            };
        }
    },
    functions: {
        invoke: function (name, opts) {
            return __awaiter(this, void 0, void 0, function () {
                var method, res;
                var _this = this;
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            if (name !== 'create-user') {
                                return [2 /*return*/, { data: null, error: { message: "Funci\u00F3n no disponible en escritorio: ".concat(name) } }];
                            }
                            method = ((_a = opts === null || opts === void 0 ? void 0 : opts.method) !== null && _a !== void 0 ? _a : 'POST').toUpperCase();
                            return [4 /*yield*/, window.api.createUserFn(method, opts === null || opts === void 0 ? void 0 : opts.body)];
                        case 1:
                            res = _b.sent();
                            if (res.error) {
                                return [2 /*return*/, {
                                        data: null,
                                        error: {
                                            message: res.error.message,
                                            context: { json: function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                                                    return [2 /*return*/, ({ error: res.error.message })];
                                                }); }); } }
                                        }
                                    }];
                            }
                            return [2 /*return*/, { data: res.data, error: null }];
                    }
                });
            });
        }
    }
};
