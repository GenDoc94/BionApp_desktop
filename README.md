# BionApp desktop

Aplicación de escritorio (**beta**) para la **gestión de muestras de OGM** en laboratorio. Sigue en prueba. Misma interfaz y esquema de datos que la edición online, con SQLite local en lugar de Supabase/Vercel.

**Windows x64 · portable · sin cuenta en la nube.**

## Descargar

1. Ve a [Releases](https://github.com/GenDoc94/BionApp_desktop/releases/latest).
2. Descarga `BionApp.exe` y ejecútalo.

En el **primer arranque** eliges la carpeta de datos y un código maestro. Ahí se crean `bionapp.sqlite` y `documentos/`. Guía completa: [docs/uso.md](docs/uso.md).

El `.exe` no está firmado. Si Windows SmartScreen avisa: *Más información* → *Ejecutar de todas formas*.

## Citar

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.22116491.svg)](https://doi.org/10.5281/zenodo.22116491)

Usa el botón **Cite this repository** de GitHub o el archivo [`CITATION.cff`](CITATION.cff).

Autor: [Juan José Domínguez-García](https://orcid.org/0000-0001-6210-1294) ([GenDoc94](https://github.com/GenDoc94)).

- DOI de concepto (citar BionApp): [10.5281/zenodo.22116491](https://doi.org/10.5281/zenodo.22116491)
- DOI de esta versión (v3.0.10): [10.5281/zenodo.22116492](https://doi.org/10.5281/zenodo.22116492)

## Declaración de inteligencia artificial y aviso

Se ha utilizado inteligencia artificial para la **generación de código** de la aplicación.

La **idea original** del desarrollo de software, las **bases**, **toda la arquitectura** de la app y su **uso** son de [GenDoc94](https://github.com/GenDoc94) (Juan José Domínguez-García). La IA no es autora del producto ni de su diseño de laboratorio: es una herramienta de implementación bajo dirección del autor.

BionApp **no ha sido creada por un informático profesional**, sino por un **médico aficionado a la informática**. Puede haber **errores de código e incluso de concepto**. El autor **no se responsabiliza** de daños, pérdidas de datos, decisiones clínicas o de laboratorio, ni de cualquier otro perjuicio derivado del uso de esta aplicación. Se ofrece tal cual, en fase beta, bajo la [licencia MIT](LICENSE).

Esta declaración también aparece en la pestaña *Autoría* de la propia app.

## Requisitos para desarrollar

- Node.js 20+
- Windows (empaquetado portable)

```bash
npm ci
npm test
npm run dist
```

El portable queda en `release/BionApp.exe`.

Publicar una versión: con Zenodo ya conectado al repo, sube los cambios a `master` y crea el tag:

```bash
git tag v3.0.10
git push origin v3.0.10
```

GitHub Actions empaqueta el `.exe` y abre el Release. Zenodo archiva el tag y asigna el DOI.

## Arquitectura

- `src/main` — Electron + better-sqlite3 + IPC
- `src/preload` — `window.api`
- `src/renderer` — React (UI)
- `src/shared` — tipos compartidos
- `resources/` — icono de la app

Licencia [MIT](LICENSE). Seguridad: [SECURITY.md](SECURITY.md).
