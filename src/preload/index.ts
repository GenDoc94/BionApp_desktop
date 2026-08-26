import { contextBridge, ipcRenderer } from 'electron'
import type { AppLocale } from '../shared/locale'
import type {
  AppConfigState,
  AuthUser,
  DbRequest,
  DbResponse,
  DocumentoItem,
  ExportFormat,
  ExportResult,
  Role
} from '../shared/types'

const api = {
  getState: (): Promise<AppConfigState> => ipcRenderer.invoke('app:getState'),
  setLocale: (locale: AppLocale): Promise<AppLocale> => ipcRenderer.invoke('app:setLocale', locale),
  pickDataFolder: (): Promise<string | null> => ipcRenderer.invoke('app:pickDataFolder'),
  setDataFolder: (path: string, adminCode?: string): Promise<AppConfigState> =>
    ipcRenderer.invoke('app:setDataFolder', path, adminCode),

  login: (email: string, password: string) => ipcRenderer.invoke('auth:login', email, password),
  logout: () => ipcRenderer.invoke('auth:logout'),
  getSession: () => ipcRenderer.invoke('auth:session'),
  getUser: () => ipcRenderer.invoke('auth:getUser'),
  getSessionRole: (): Promise<Role | null> => ipcRenderer.invoke('auth:getSessionRole'),

  createUserFn: (method: string, body?: unknown) =>
    ipcRenderer.invoke('fn:create-user', method, body),

  dbRequest: (req: DbRequest): Promise<DbResponse> => ipcRenderer.invoke('db:request', req),

  exportDatabase: (format: ExportFormat): Promise<ExportResult> =>
    ipcRenderer.invoke('export:database', format),

  listDocumentos: (): Promise<DocumentoItem[]> => ipcRenderer.invoke('docs:list'),
  uploadDocumento: (name: string, data: ArrayBuffer): Promise<{ ok: boolean }> =>
    ipcRenderer.invoke('docs:upload', name, data),
  deleteDocumento: (name: string): Promise<{ ok: boolean }> =>
    ipcRenderer.invoke('docs:delete', name),
  readDocumento: (name: string): Promise<{ name: string; data: Buffer }> =>
    ipcRenderer.invoke('docs:read', name),

  onDataChanged: (cb: () => void): (() => void) => {
    const handler = (): void => cb()
    ipcRenderer.on('data:changed', handler)
    return () => ipcRenderer.removeListener('data:changed', handler)
  },

  onAuthState: (cb: (user: AuthUser | null) => void): (() => void) => {
    const handler = (_e: Electron.IpcRendererEvent, user: AuthUser | null): void => cb(user)
    ipcRenderer.on('auth:state', handler)
    ipcRenderer.send('auth:subscribe')
    return () => ipcRenderer.removeListener('auth:state', handler)
  }
}

contextBridge.exposeInMainWorld('api', api)

export type BionApi = typeof api
