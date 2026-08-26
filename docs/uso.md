# Uso de BionApp Desktop

Versión **beta**: la app sigue en prueba. Puede haber errores de código e incluso de concepto. No la uses como sistema clínico certificado ni como única fuente de verdad. El autor (médico aficionado a la informática, no informático profesional) no se responsabiliza de daños o pérdidas derivados de su uso; licencia MIT.

## Instalación (Windows)

1. Abre [Releases](https://github.com/GenDoc94/BionApp_desktop/releases/latest).
2. Descarga `BionApp.exe` (portable x64). No requiere instalador.
3. Colócalo en una carpeta permanente (por ejemplo `C:\BionApp\`) y crea un acceso directo si quieres.

El ejecutable **no está firmado** (no hay certificado Authenticode). En el primer arranque, SmartScreen de Windows puede mostrar un aviso: *Más información* → *Ejecutar de todas formas*.

## Primer arranque

1. Elige la **carpeta de datos**. Ahí se crean `bionapp.sqlite` y `documentos/`.
2. Define un **código maestro** (admin) para dar de alta usuarios. No se puede cambiar después desde la app.
3. Crea el primer usuario e inicia sesión.

La carpeta de datos y el código maestro quedan ligados a esa instalación. No elijas una carpeta temporal.

## Actualizar

1. Cierra BionApp.
2. Descarga el `BionApp.exe` nuevo desde Releases y **sustituye** el anterior.
3. **No toques** la carpeta de datos. El esquema y los documentos siguen ahí.

En la pantalla de inicio, *Buscar actualizaciones* consulta la última versión publicada en GitHub.

## Copias de seguridad

Cierra la app y copia **toda** la carpeta de datos:

- `bionapp.sqlite`
- `bionapp.sqlite-wal` y `bionapp.sqlite-shm` si existen (modo WAL)
- `documentos/`

Restaurar es volver a apuntar BionApp a esa carpeta (o sustituir su contenido).

## Varios PC

Varios equipos pueden usar la **misma carpeta de datos en red**. SQLite está en modo WAL. Evita copias concurrentes del archivo `.sqlite` mientras la app está abierta.

## Límites

- Solo Windows x64 (portable).
- Todo es local: no hay cuenta en la nube ni subida automática de datos.
- No sustituye un LIMS certificado ni un sistema de historial clínico.

## Compilar desde el código

Requisito: Node.js 20+ en Windows.

```bash
npm ci
npm test
npm run dist
```

El portable queda en `release/BionApp.exe`.
