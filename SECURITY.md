# Política de seguridad

Gracias por ayudar a mantener BionApp segura. Esta política describe cómo informar de vulnerabilidades en el **código del repositorio** y qué esperar a continuación.

## Alcance

| Dentro del alcance | Fuera del alcance (responsabilidad del operador) |
| ------------------ | ------------------------------------------------ |
| Código de esta app (frontend, migraciones SQL incluidas en el repo) | Configuración de tu proyecto Supabase (contraseñas, API keys, backups, región, cumplimiento RGPD/LOPD, etc.) |
| Defectos que permitan acceso o modificación indebida **más allá del diseño documentado** | Cuentas de usuario creadas por el laboratorio en su propio proyecto |
| Fugas de secretos en el repositorio (claves `service_role`, `.env` commiteados, etc.) | Infraestructura de red, antivirus o políticas internas del centro |

BionApp está pensada para que **cada laboratorio despliegue su propio proyecto Supabase**. Quien instala la herramienta es responsable de quién tiene cuenta, de proteger las credenciales y del tratamiento de datos sensibles (muestras, datos genómicos o clínicos, según aplique).

## Modelo de seguridad (resumen)

Conviene conocerlo al evaluar o informar un hallazgo:

- La app usa la clave **anon** en el navegador (variable `VITE_SUPABASE_ANON_KEY`). **No** expongas nunca la clave `service_role` en el cliente ni en repositorios públicos.
- El acceso a la base exige **usuario autenticado** en Supabase Auth (correo/contraseña en instalaciones típicas).
- En el esquema actual, las políticas RLS de tablas de muestras (`Muestras`, `Lectura`, catálogos, etc.) permiten operaciones a **cualquier usuario autenticado** del proyecto (`USING (true)`). El rol `admin` en `profiles` limita sobre todo la **interfaz** (p. ej. botones Modificar/Guardar); no sustituye por sí solo políticas RLS más restrictivas si necesitas separación estricta entre usuarios.
- La tabla `profiles` solo permite **lectura** de la fila propia vía RLS; cambiar roles suele hacerse con privilegios de administrador de base (dashboard o `service_role`).

Si tu laboratorio necesita aislamiento fuerte entre usuarios, eso requiere **políticas RLS y/o despliegues** adaptados; no está garantizado solo con la instalación por defecto.

## Versiones con soporte de seguridad

| Versión | Soporte |
| ------- | ------- |
| Última versión publicada en la rama `main` del repositorio | Sí |
| Versiones anteriores / forks sin actualizar | No garantizado |

## Cómo informar de una vulnerabilidad

**No abras un issue público** si el informe puede ayudar a explotar un fallo antes de que haya corrección.

1. **Preferido:** [Informe privado de seguridad en GitHub](https://github.com/GenDoc94/BionApp/security/advisories/new) (pestaña **Security** → **Report a vulnerability**).
2. **Alternativa:** si no puedes usar GitHub Advisories, escribe al mantenedor por un canal privado que ya uses con el proyecto (por ejemplo el contacto asociado a [Buy Me A Coffee](https://www.buymeacoffee.com/gendoc94)) con asunto claro: `BionApp — informe de seguridad`.

Incluye, en la medida de lo posible:

- Descripción del problema y impacto (confidencialidad, integridad, disponibilidad).
- Pasos para reproducir (versión/commit, configuración mínima, capturas o logs **sin** datos reales de pacientes).
- Si conoces una mitigación o parche.

## Qué puedes esperar

- **Acuse de recibo:** intentaremos responder en un plazo de **7 días laborables**.
- **Evaluación:** confirmaremos si es un fallo del software y su gravedad; puede pedirse más información.
- **Corrección:** para vulnerabilidades válidas y reproducibles, trabajaremos en un arreglo o mitigación documentada; el plazo depende de la complejidad.
- **Crédito:** si lo deseas y el informe es de buena fe, podemos mencionarte en las notas de la corrección (salvo que prefieras anonimato).
- **Divulgación coordinada:** no publiques detalles del exploit hasta que exista una versión corregida o acordemos un plazo razonable.

No se aplican programas de recompensa económica (bug bounty); el proyecto es de código abierto en espíritu colaborativo.

## Buenas prácticas para quien instala BionApp

Estas medidas no sustituyen un informe de vulnerabilidad, pero reducen el riesgo en producción:

- Mantén **solo usuarios de confianza** en Authentication de tu proyecto Supabase.
- No subas `.env` ni claves al repositorio; rota la contraseña de base si se filtró.
- Revisa periódicamente **Redirect URLs** y proveedores Auth en el dashboard.
- Aplica migraciones del repo con `npx supabase db push` tras revisar los cambios en SQL.
- Valora políticas RLS más estrictas y copias de seguridad si manejas datos personales o genéticos regulados.

## Divulgación responsable

Se agradece investigación de buena fe: no acceder a datos de terceros, no realizar pruebas destructivas en sistemas que no controles y no exfiltrar datos reales de laboratorio en los informes.
