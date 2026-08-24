# Migraciones

El archivo `20260512120000_initial_schema.sql` define el esquema completo de la base (tablas, funciones, RLS, etc.) para una **instalación en frío**.

## Aplicar en un proyecto Supabase nuevo (instalador)

Desde la raíz del repo, con el proyecto ya creado en [Supabase](https://supabase.com/dashboard):

```bash
npx supabase login
npx supabase link --project-ref TU_PROJECT_REF
npx supabase db push --linked --yes
```

No hace falta Docker: los comandos actúan sobre tu proyecto en la nube.

Después configura Auth y `.env` según el [README principal](../../README.md) (pasos 2.3–3) y crea la primera muestra desde la app (paso 4).

## Actualizar este archivo desde Supabase (mantenedor)

Ver la sección *Sincronizar el esquema desde la nube* en [../README.md](../README.md).
