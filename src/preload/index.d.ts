import type { AppLocale } from '../shared/locale';
import type { AppConfigState, AuthUser, DbActivity, DbRequest, DbResponse, DocumentoItem, ExportFormat, ExportResult, Role } from '../shared/types';
declare const api: {
    getState: () => Promise<AppConfigState>;
    getDbActivity: () => Promise<DbActivity>;
    setLocale: (locale: AppLocale) => Promise<AppLocale>;
    pickDataFolder: () => Promise<string | null>;
    setDataFolder: (path: string, adminCode?: string) => Promise<AppConfigState>;
    verifyAdminCode: (adminCode: string) => Promise<{ ok: true } | { ok: false; error: string }>;
    login: (email: string, password: string) => Promise<any>;
    logout: () => Promise<any>;
    getSession: () => Promise<any>;
    getUser: () => Promise<any>;
    getSessionRole: () => Promise<Role | null>;
    createUserFn: (method: string, body?: unknown) => Promise<any>;
    dbRequest: (req: DbRequest) => Promise<DbResponse>;
    exportDatabase: (format: ExportFormat) => Promise<ExportResult>;
    listDocumentos: () => Promise<DocumentoItem[]>;
    uploadDocumento: (name: string, data: ArrayBuffer) => Promise<{
        ok: boolean;
    }>;
    deleteDocumento: (name: string) => Promise<{
        ok: boolean;
    }>;
    readDocumento: (name: string) => Promise<{
        name: string;
        data: Buffer;
    }>;
    onDataChanged: (cb: () => void) => (() => void);
    onAuthState: (cb: (user: AuthUser | null) => void) => (() => void);
    restoreKeyboardFocus: () => Promise<void>;
};
export type BionApi = typeof api;
export {};
