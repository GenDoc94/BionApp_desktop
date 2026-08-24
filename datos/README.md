# Carpeta de datos en modo local

En **modo local**, BionApp guarda aquí la configuración de tu instalación:

| Archivo       | Contenido                                         |
| ------------- | ------------------------------------------------- |
| `mode.json`   | Indica que la instalación es en modo local        |
| `secrets.env` | Código admin para crear usuarios (no subir a Git) |

Los **datos de muestras** (tablas PostgreSQL: muestras, lecturas, marcado, chips, etc.) viven en el motor de base de datos que Docker levanta en este ordenador. Persisten entre sesiones mientras no borres los volúmenes de Docker ni reinstales desde cero.

**No confundir** con la carpeta `documentos/` de la raíz del proyecto: esa solo guarda PDFs de protocolos que subes desde **Opciones → Documentos**.

## Copia de seguridad

Para respaldar las muestras, desde la carpeta del proyecto (con el motor local en marcha):

```bash
npx supabase db dump --local -f datos/backup-muestras.sql
```

Para restaurar en una instalación nueva en modo local, consulta la documentación de Supabase CLI (`db reset` + importación).
