# BionApp desktop

Versión de escritorio de BionApp (Electron + SQLite), con la misma UI que la versión online y la misma estructura de datos.

Arquitectura inspirada en AppFéresis:

- **electron-vite** (`src/main`, `src/preload`, `src/renderer`, `src/shared`)
- **better-sqlite3** solo en el proceso principal
- IPC tipado vía `window.api` (preload + contextBridge)
- Carpeta de datos configurable (red/local) con `bionapp.sqlite` + `documentos/`

## Arranque

```bash
npm install
npm run dev
```

Primera ejecución: elige la carpeta de datos compartida. Luego crea el primer usuario (el código admin que uses queda fijado en esa carpeta).

## Empaquetado Windows (portable)

```bash
npm run dist
```

Salida: `release/BionApp.exe`

## Datos

| Online (Supabase) | Desktop (SQLite) |
|-------------------|------------------|
| Postgres + Auth + Edge Function | `bionapp.sqlite` + usuarios locales (bcrypt) |
| Jerarquía Muestras→…→Chips | Misma, con FK CASCADE |
| Media/SD/CV por triggers PG | Calculados al escribir (Lectura / Lecturas_Marcado) |
| Embeds PostgREST (`DDx`, `DMuestra`, `Tags`) | JOINs equivalentes en la capa IPC |
| Documentos vía Vite `/api/documentos` | Carpeta `documentos/` en la carpeta de datos |

La versión online sigue en el repo `BionApp_online`.
