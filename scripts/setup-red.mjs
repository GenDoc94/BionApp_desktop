/**
 * Asistente de instalación BionApp — modo red (Supabase en la nube).
 */

import fs from "node:fs";
import path from "node:path";
import {
  ROOT,
  ENV_PATH,
  ENV_EXAMPLE,
  ask,
  banner,
  createRl,
  ensureNpmInstall,
  isLoggedInToSupabase,
  log,
  normalizeSupabaseUrl,
  parseProjectRef,
  runNpm,
  runSupabase,
  writeDatosMode,
  writeEnvFile,
} from "./lib/setup-utils.mjs";

const rl = createRl();

async function main() {
  log(`
BionApp — instalación en modo red
=================================
Los datos de muestras y usuarios vivirán en tu proyecto Supabase en la nube.
La interfaz puede correr en tu PC (npm run dev) o publicarse en Vercel.

Antes de continuar, en https://supabase.com/dashboard:
  1. Crea un proyecto nuevo (anota la contraseña de la base de datos)
  2. Authentication → Providers → Email activado
  3. Authentication → URL configuration → Redirect URL: http://localhost:3000
  4. Project Settings → API: URL del proyecto y clave "anon public"
`);

  const ok = await ask(rl, "¿Continuar con modo red? (s/N): ");
  if (!/^s|si|y|yes$/i.test(ok)) {
    log("Instalación cancelada.");
    rl.close();
    return;
  }

  await ensureNpmInstall(rl);

  banner("Datos de tu proyecto Supabase");

  let projectRef = "";
  let supabaseUrl = "";

  const urlOrRef = await ask(
    rl,
    "Project URL (https://XXXX.supabase.co) o project ref (XXXX): "
  );
  projectRef = parseProjectRef(urlOrRef);
  supabaseUrl = normalizeSupabaseUrl(urlOrRef, projectRef);

  if (!projectRef) {
    projectRef = await ask(rl, "Project ref (id de la URL, p. ej. abcdefghijklmno): ");
    projectRef = parseProjectRef(projectRef) || projectRef;
  }
  if (!supabaseUrl) {
    const urlInput = await ask(rl, "Project URL completa: ");
    supabaseUrl = normalizeSupabaseUrl(urlInput, projectRef);
  }

  if (!projectRef || !supabaseUrl) {
    log("✗ No se pudo obtener project ref o URL. Revisa los datos.");
    process.exit(1);
  }

  let anonKey = await ask(rl, "Clave anon public (empieza por eyJ...): ");
  if (!anonKey.startsWith("eyJ")) {
    log("⚠ La clave anon suele empezar por eyJ. Si estás seguro, continúa.");
  }

  const dbPassword = await ask(
    rl,
    "Contraseña de la base de datos del proyecto (la definiste al crear el proyecto): "
  );
  if (!dbPassword) {
    log("✗ La contraseña de la base es obligatoria para enlazar el proyecto.");
    process.exit(1);
  }

  let adminCode = await ask(
    rl,
    "Código admin para crear usuarios desde la app (mín. 8 caracteres, guárdalo en secreto): "
  );
  if (adminCode.length < 8) {
    log("✗ El código admin debe tener al menos 8 caracteres.");
    process.exit(1);
  }

  banner("Archivo .env");
  if (fs.existsSync(ENV_PATH)) {
    const overwrite = await ask(rl, ".env ya existe. ¿Sobrescribir? (s/N): ");
    if (!/^s|si|y|yes$/i.test(overwrite)) {
      log("Se mantiene el .env anterior.");
    } else {
      writeEnvFile({ url: supabaseUrl, anonKey, mode: "red" });
      log(`✓ Escrito ${ENV_PATH}`);
    }
  } else {
    if (!fs.existsSync(ENV_EXAMPLE)) {
      log("⚠ No hay .env.example; se crea .env igualmente.");
    }
    writeEnvFile({ url: supabaseUrl, anonKey, mode: "red" });
    log(`✓ Escrito ${ENV_PATH}`);
  }

  writeDatosMode("red");

  banner("Supabase CLI");

  if (!isLoggedInToSupabase()) {
    log(
      "Se abrirá el navegador para iniciar sesión en Supabase (solo la primera vez).\n"
    );
    runSupabase(["login"], { label: "supabase login" });
  } else {
    log("✓ Ya hay sesión activa en Supabase CLI.");
  }

  runSupabase(
    ["link", "--project-ref", projectRef, "--password", dbPassword, "--yes"],
    { label: `supabase link --project-ref ${projectRef}` }
  );

  runSupabase(["db", "push", "--linked", "--yes"], {
    label: "supabase db push (esquema de tablas)",
  });

  const secretsFile = path.join(ROOT, ".setup-secrets.tmp");
  try {
    fs.writeFileSync(
      secretsFile,
      `CREATE_USER_ADMIN_CODE=${adminCode.replace(/\r?\n/g, "")}\n`,
      "utf8"
    );
    runSupabase(["secrets", "set", "--env-file", secretsFile], {
      label: "supabase secrets set CREATE_USER_ADMIN_CODE",
    });
  } finally {
    if (fs.existsSync(secretsFile)) fs.unlinkSync(secretsFile);
  }

  runSupabase(["functions", "deploy", "create-user"], {
    label: "supabase functions deploy create-user",
  });

  rl.close();

  log(`
==================================
✓ Instalación en modo red completada

Siguiente:

  1. npm run dev
  2. Abre http://localhost:3000 (se abre sola si usas npm run dev)
  3. Pulsa "Añadir nuevo usuario" (primer admin + el código admin que acabas de definir)
  4. Inicia sesión → "Añadir primera muestra" → catálogos en Opciones

Guarda el código admin en un sitio seguro; lo pedirá cada alta de usuario desde la app.
`);
}

main().catch((err) => {
  console.error(err);
  rl.close();
  process.exit(1);
});
