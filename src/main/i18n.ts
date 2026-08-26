import { DEFAULT_LOCALE, isAppLocale, type AppLocale } from '../shared/locale'

const STRINGS: Record<
  AppLocale,
  {
    windowTitle: string
    pickDataFolder: string
    exportDialog: string
    emptySheet: string
    edit: string
    undo: string
    redo: string
    cut: string
    copy: string
    paste: string
    selectAll: string
  }
> = {
  es: {
    windowTitle: 'BionApp (beta)',
    pickDataFolder: 'Seleccionar carpeta compartida de datos BionApp',
    exportDialog: 'Exportar base de datos',
    emptySheet: '(sin filas)',
    edit: 'Editar',
    undo: 'Deshacer',
    redo: 'Rehacer',
    cut: 'Cortar',
    copy: 'Copiar',
    paste: 'Pegar',
    selectAll: 'Seleccionar todo'
  },
  en: {
    windowTitle: 'BionApp (beta)',
    pickDataFolder: 'Select BionApp shared data folder',
    exportDialog: 'Export database',
    emptySheet: '(no rows)',
    edit: 'Edit',
    undo: 'Undo',
    redo: 'Redo',
    cut: 'Cut',
    copy: 'Copy',
    paste: 'Paste',
    selectAll: 'Select all'
  }
}

let current: AppLocale = DEFAULT_LOCALE

export function getMainLocale(): AppLocale {
  return current
}

export function setMainLocale(value: unknown): AppLocale {
  current = isAppLocale(value) ? value : DEFAULT_LOCALE
  return current
}

export function mt(key: keyof (typeof STRINGS)['es']): string {
  return STRINGS[current][key]
}
