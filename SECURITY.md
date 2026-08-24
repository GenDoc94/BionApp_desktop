# Política de seguridad — BionApp desktop

## Alcance

App de escritorio local (Electron + SQLite). No usa Supabase en runtime.

| Dentro del alcance | Fuera del alcance |
| ------------------ | ----------------- |
| Código de este repo (main/preload/renderer) | Carpeta de datos del laboratorio (permisos de red, backups) |
| Fugas de secretos en el repositorio | Credenciales del proyecto online (`BionApp_online`) |

## Modelo (resumen)

- SQLite solo en el proceso principal de Electron; el renderer habla por IPC (`window.api`).
- Usuarios locales con contraseña hasheada (bcrypt); código admin para altas.
- Varios PCs pueden compartir la misma carpeta de datos en red (WAL).

## Cómo informar

**No abras un issue público** si el informe puede ayudar a explotar un fallo.

Usa un [aviso de seguridad privado en GitHub](https://github.com/GenDoc94/BionApp_desktop/security/advisories/new) o contacta al mantenedor por un canal privado.
