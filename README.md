# BionApp desktop

Versión de escritorio de BionApp (**Electron + SQLite**). Misma UI y esquema de datos que la versión online (`BionApp_online`), sin Supabase ni Vercel.

## Requisitos

- Node.js 20+
- Windows (empaquetado portable)

## Arranque

```bash
npm install
npm run dev
```

Primera ejecución: elige carpeta de datos + código admin. Ahí se crea `bionapp.sqlite` y `documentos/`.

## Scripts

| Comando | Uso |
|---------|-----|
| `npm run dev` | Desarrollo |
| `npm run build` | Compilar main/preload/renderer |
| `npm run dist` | Portable `release/BionApp.exe` |
| `npm run db:pull-supabase` | Importar datos desde el proyecto online (app cerrada) |
| `npm test` | Tests unitarios del renderer |

## Arquitectura

- `src/main` — Electron + better-sqlite3 + IPC
- `src/preload` — `window.api`
- `src/renderer` — React (UI)
- `src/shared` — tipos compartidos
- `resources/` — icono de la app

Para sincronizar código de UI con la versión online, conviene un `shared`/monorepo a medio plazo. Los datos se copian puntual con `db:pull-supabase` (no hay sync en tiempo real).
