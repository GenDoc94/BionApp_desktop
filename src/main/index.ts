import { app, BrowserWindow, dialog, ipcMain, Menu, shell } from 'electron'
import { join } from 'path'
import fs from 'fs'
import Store from 'electron-store'
import type Database from 'better-sqlite3'
import { dbPathFor, initSchema, openDatabase } from './db'
import { hasAdminCode, hasUsers, createUser, login, setAdminCode, toAuthUser } from './auth'
import { executeDbRequest } from './query'
import { exportDatabase } from './exportDb'
import type { ExportFormat } from '../shared/types'
import * as docs from './documentos'
import type {
  AppConfigState,
  AuthUser,
  DbRequest,
  Role,
  UserSession
} from '../shared/types'

const store = new Store<{ dataPath?: string }>({ name: 'bionapp-desktop-config' })

let mainWindow: BrowserWindow | null = null
let db: Database.Database | null = null
let session: UserSession | null = null
let watchTimer: NodeJS.Timeout | null = null
let lastMtime = 0
let authListeners = 0

function ensureDb(): Database.Database {
  if (!db) throw new Error('Base de datos no conectada. Configure la carpeta de datos.')
  return db
}

function ensureDataPath(): string {
  const p = store.get('dataPath')
  if (!p) throw new Error('Carpeta de datos no configurada')
  return p
}

function connectDataPath(dataPath: string): AppConfigState {
  if (db) {
    try {
      db.close()
    } catch {
      /* ignore */
    }
    db = null
  }
  fs.mkdirSync(dataPath, { recursive: true })
  fs.mkdirSync(join(dataPath, 'documentos'), { recursive: true })
  db = openDatabase(dataPath)
  initSchema(db)
  store.set('dataPath', dataPath)
  startWatch(dataPath)
  return getState()
}

function getState(): AppConfigState {
  const dataPath = store.get('dataPath') ?? null
  return {
    dataPath,
    dbReady: !!db,
    version: app.getVersion(),
    hasAdminCode: db ? hasAdminCode(db) : false
  }
}

function startWatch(dataPath: string): void {
  if (watchTimer) clearInterval(watchTimer)
  const file = dbPathFor(dataPath)
  try {
    lastMtime = fs.existsSync(file) ? fs.statSync(file).mtimeMs : 0
  } catch {
    lastMtime = 0
  }
  watchTimer = setInterval(() => {
    try {
      if (!fs.existsSync(file)) return
      const m = fs.statSync(file).mtimeMs
      if (m > lastMtime + 50) {
        lastMtime = m
        mainWindow?.webContents.send('data:changed')
      }
    } catch {
      /* ignore */
    }
  }, 2000)
}

function broadcastAuth(user: AuthUser | null): void {
  mainWindow?.webContents.send('auth:state', user)
}

function createWindow(): void {
  const isMac = process.platform === 'darwin'
  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac ? [{ role: 'appMenu' as const }] : []),
    {
      label: 'Editar',
      submenu: [
        { role: 'undo', label: 'Deshacer' },
        { role: 'redo', label: 'Rehacer' },
        { type: 'separator' },
        { role: 'cut', label: 'Cortar' },
        { role: 'copy', label: 'Copiar' },
        { role: 'paste', label: 'Pegar' },
        { role: 'selectAll', label: 'Seleccionar todo' }
      ]
    }
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))

  const iconPath = join(__dirname, '../../resources/icon.ico')

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 480,
    minHeight: 560,
    show: false,
    title: 'BionApp (beta)',
    icon: iconPath,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  mainWindow.setMenuBarVisibility(false)
  mainWindow.on('ready-to-show', () => mainWindow?.show())
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function registerIpc(): void {
  ipcMain.handle('app:getState', () => getState())

  ipcMain.handle('app:pickDataFolder', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      title: 'Seleccionar carpeta compartida de datos BionApp',
      properties: ['openDirectory', 'createDirectory']
    })
    if (result.canceled || !result.filePaths[0]) return null
    return result.filePaths[0]
  })

  ipcMain.handle('app:setDataFolder', (_e, dataPath: string, adminCode?: string) => {
    session = null
    broadcastAuth(null)
    const state = connectDataPath(dataPath)
    const database = ensureDb()
    if (!hasAdminCode(database)) {
      const result = setAdminCode(database, String(adminCode ?? ''))
      if (!result.ok) {
        throw new Error(result.error)
      }
    }
    return getState()
  })

  ipcMain.handle('auth:login', (_e, email: string, password: string) => {
    const s = login(ensureDb(), email, password)
    session = s
    const user = s ? toAuthUser(s) : null
    broadcastAuth(user)
    if (!s) return { data: { user: null, session: null }, error: { message: 'Correo o contraseña incorrectos' } }
    return {
      data: {
        user,
        session: { user }
      },
      error: null
    }
  })

  ipcMain.handle('auth:logout', () => {
    session = null
    broadcastAuth(null)
    return { error: null }
  })

  ipcMain.handle('auth:session', () => {
    const user = session ? toAuthUser(session) : null
    return {
      data: { session: user ? { user } : null },
      error: null
    }
  })

  ipcMain.handle('auth:getUser', () => {
    const user = session ? toAuthUser(session) : null
    return { data: { user }, error: user ? null : { message: 'No hay sesión' } }
  })

  ipcMain.handle('auth:getSessionRole', () => session?.role ?? null)

  ipcMain.handle('fn:create-user', (_e, method: string, body?: {
    email?: string
    password?: string
    role?: Role
    adminCode?: string
  }) => {
    const database = ensureDb()
    if (method === 'GET') {
      return { data: { hasUsers: hasUsers(database) }, error: null }
    }
    if (method === 'POST') {
      const result = createUser(database, {
        email: String(body?.email ?? ''),
        password: String(body?.password ?? ''),
        role: (body?.role as Role) ?? 'user',
        adminCode: String(body?.adminCode ?? '')
      })
      if (result.error) {
        return {
          data: null,
          error: { message: result.error, status: result.status ?? 400 }
        }
      }
      return { data: { user: result.user }, error: null }
    }
    return { data: null, error: { message: 'Método no soportado' } }
  })

  ipcMain.handle('db:request', (_e, req: DbRequest) => executeDbRequest(ensureDb(), req))

  ipcMain.handle('export:database', async (_e, format: ExportFormat) => {
    return exportDatabase(ensureDb(), ensureDataPath(), format, mainWindow)
  })

  ipcMain.handle('docs:list', () => docs.listDocumentos(ensureDataPath()))
  ipcMain.handle('docs:upload', async (_e, name: string, data: ArrayBuffer) => {
    await docs.uploadDocumento(ensureDataPath(), name, data)
    return { ok: true }
  })
  ipcMain.handle('docs:delete', async (_e, name: string) => {
    await docs.deleteDocumento(ensureDataPath(), name)
    return { ok: true }
  })
  ipcMain.handle('docs:read', async (_e, name: string) => {
    const file = await docs.readDocumento(ensureDataPath(), name)
    return { name: file.name, data: file.data }
  })

  ipcMain.on('auth:subscribe', (event) => {
    authListeners++
    const user = session ? toAuthUser(session) : null
    event.sender.send('auth:state', user)
  })
}

app.whenReady().then(() => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('es.hospital.bionapp')
  }
  registerIpc()
  const saved = store.get('dataPath')
  if (saved && fs.existsSync(saved)) {
    try {
      connectDataPath(saved)
    } catch (err) {
      console.error('No se pudo abrir la BD', err)
    }
  }
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (watchTimer) clearInterval(watchTimer)
  if (db) db.close()
  if (process.platform !== 'darwin') app.quit()
})

void authListeners
