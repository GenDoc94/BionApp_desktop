# BionApp desktop

Versión de escritorio de BionApp. 

Misma interfaz y esquema de datos que la versión online (`BionApp_online`), cambiando Supabase ni Vercel, por base en SQLite y desarrollo de escritorio en Electron.

## Requisitos

- Node.js 20+
- Windows (empaquetado portable)

## Arranque

```bash
npm install
npm run dist
```

Con ello se genera el archivo`release/BionApp.exe` .

Al abrirlo, primera ejecución: elige carpeta de datos + código admin. Ahí se crea `bionapp.sqlite` y `documentos/`.

## Arquitectura

- `src/main` — Electron + better-sqlite3 + IPC
- `src/preload` — `window.api`
- `src/renderer` — React (UI)
- `src/shared` — tipos compartidos
- `resources/` — icono de la app

