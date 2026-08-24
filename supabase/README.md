# Supabase en este repositorio

Aquí vive la **configuración del CLI** (`config.toml`) y el **SQL de esquema** (`migrations/`). La app en sí solo necesita `.env` con URL y anon key; esta carpeta sirve para **recrear la base** en un proyecto nuevo.

## Quién lee qué


| Rol                                 | Qué mirar                                                                                                                                                                                   |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Investigador que instala la app** | [README principal](../README.md): modo **local** (`npm run setup:local`, `Iniciar-BionApp.bat`) o modo **red** (`npm run setup:red`). La primera muestra y los catálogos se crean desde la app. |
| **Mantenedor del repo** (tú)        | Esta página + sección *Sincronizar el esquema desde la nube* abajo.                                                                                                                         |


- **Modo local:** `supabase start` (Docker) + migraciones en este PC. Config en `datos/`.
- **Modo red:** `npx supabase db push --linked` al proyecto en la nube. No hace falta Docker.

En `config.toml` están desactivados servicios que BionApp no usa en local (realtime, storage, studio, etc.) para reducir descargas de Docker.

## Estado actual

- **Migraciones:** `migrations/20260512120000_initial_schema.sql` (esquema `public`) y `20260512120001_auth_user_trigger.sql` (perfil al crear usuario en Auth; necesario en modo local).
- **Edge Functions:** `functions/create-user` crea usuarios con `service_role` y exige el secreto `CREATE_USER_ADMIN_CODE`. En **modo red** va con `supabase secrets set`; en **modo local** se escribe en `supabase/functions/.env` (no en la nube).
- **Datos iniciales:** no van en SQL. La primera muestra se crea con el botón **Añadir primera muestra** en la app; los catálogos (tipo de muestra y diagnóstico) se rellenan en **Opciones** durante el asistente de configuración inicial.

### Comprobaciones que conviene tener en cuenta

1. **Trigger de registro → `profiles`**
  La migración `20260512120001_auth_user_trigger.sql` crea el trigger en `auth.users` en modo local. En proyectos **modo red** creados antes de esa migración, si los usuarios no tienen fila en `profiles`, aplica la migración con `db push` o el SQL a mano en el dashboard.
2. **Extensiones** (`pgcrypto`, `uuid-ossp`, etc.)
  Un proyecto Supabase nuevo suele traerlas; si al aplicar el SQL falla alguna `CREATE EXTENSION`, revisa en el dashboard qué extensiones están habilitadas en tu plantilla.

## Sincronizar el esquema desde la nube (solo mantenedor)

Cuando cambies tablas, RLS o funciones **en tu proyecto de referencia** en Supabase y quieras actualizar el repo:

1. Desde la raíz del repo, inicia sesión en la CLI (solo la primera vez o si caducó):
  ```powershell
   npx supabase login
  ```
2. Enlaza el proyecto de referencia (el de producción o el que uses como “verdad”). El **project ref** es el id de la URL (`https://XXXX.supabase.co`):
  ```powershell
   npx supabase link --project-ref TU_PROJECT_REF
  ```
   Te pedirá la contraseña de la base de datos del proyecto.
3. Volca el esquema `public` sobre el archivo de instalación:
  ```powershell
   npx supabase db dump --linked -s public -f supabase/migrations/20260512120000_initial_schema.sql --yes
  ```
4. Revisa el diff en Git, confirma que incluye tus cambios (columnas nuevas, políticas, etc.) y commitea si procede.

Comprueba que el proyecto correcto está enlazado:

```powershell
npx supabase projects list
```

La columna **LINKED** (●) indica cuál usa `db dump --linked`.

### Si no usas `db dump` enlazado

- `**npx supabase start`**: requiere [Docker Desktop](https://docs.docker.com/desktop/) en marcha; levanta un Supabase local, no exporta la nube.
- `**pg_dump` directo** (sin Docker): URI en **Settings → Database**, cliente PostgreSQL instalado, por ejemplo:
  ```powershell
  pg_dump "postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres" `
    --schema=public --schema-only --no-owner --no-privileges `
    -f supabase/migrations/20260512120000_initial_schema.sql
  ```
  (Codifica caracteres especiales de la contraseña en la URL si hace falta.)

