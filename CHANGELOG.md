# Changelog

## 4.0.2

- En el setup inicial se elige primero la carpeta. Si ya hay `bionapp.sqlite`, se usa esa base y su código maestro; no se pide otro código ni se sustituye el archivo.

## 4.0.1

- El pie muestra cuándo se cambió por última vez la base SQLite, para ver si varios PCs apuntan a la carpeta más actualizada.
- En el login, **Configuración** (código maestro) permite cambiar la carpeta de `bionapp.sqlite`.

## 4.0.0

- Página **Calidad**: envíos (Sales Order y fecha de llegada), catálogo de lotes (extracción, marcado, membrana y chip), registro de filtros de aire y árbol de trazabilidad Envío → Lote → Muestra → lecturas → chips.
- Acciones de laboratorio: preparar muestras, mandar a leer con fecha de extracción, marcar con la fecha de Datos del marcado, lotes de chip con Ver Estados, y Acciones antes de Chips en la barra.
- Cálculos: dilución de DNA para marcado (750 ng, o la cantidad real si se llega al máximo de volumen) y preparación de tubos.
- No se pueden repetir LN ni Sales Order al crear (aviso «Ya existe»). Los lotes muestran el envío asignado. Al volver a la app se conserva el Nº BN.

## 3.0.12

- Catálogo de lotes de extracción, marcado y membrana (PN, LN y caducidad), con página de Lotes y edición de lotes existentes.
- Nº de petición alfanumérico en muestras y preselección.
- Semáforo de la media de extraído (45–90) y de marcado (4–16), con los mismos colores que Acciones.
- Ajustes de interfaz: cabecera con usuario e icono de rol, chips de lote, aviso «Ya existe» en preselección y ordenación de «En muestras» por Nº Bionano.

## 3.0.11

- Añadiendo la opción de idioma (español e inglés) en la interfaz.

## 3.0.10

- Añadiendo pestaña de exportación de datos.
- Primera publicación como GitHub Release (`BionApp.exe` portable).
- Comprobación de actualizaciones desde el último Release.
- Metadatos de citación (`CITATION.cff`) y declaración de uso de IA / aviso de responsabilidad.

## 3.0.9

- Mejoras de software. User-friendly. Compatibilidad versión Desktop.

## 3.0.8

- Sistema de preselección de muestras mejorado.


## 3.0.7

- Añadiendo etiquetas a las muestras.


## 3.0.6

- Añadiendo un control de versiones de la app.

## 3.0.5

- Modo local: instalación y uso en el PC sin cuenta en Supabase en la nube.
- Asistentes `npm run setup` / `Iniciar-BionApp.bat` para usuarios no técnicos.
- Aviso de nueva versión al actualizar la app.

