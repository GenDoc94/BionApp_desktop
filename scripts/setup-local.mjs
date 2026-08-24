/**
 * Asistente de instalación BionApp — modo local.
 * Los datos de muestras y usuarios quedan en este ordenador (carpeta datos/ + motor en Docker).
 */

import fs from "node:fs";
import {
  ENV_PATH,
  ask,
  askAdminCodeConfirmed,
  banner,
  confirmLocalReinstall,
  createRl,
  DATOS_DIR,
  drainPendingStdin,
  ensureDatosDir,
  ensureNpmInstallLocal,
  EXIT_LAUNCH_APP,
  isDockerAvailable,
  isNo,
  isSupabaseRunning,
  launchLocalAppDetached,
  log,
  logDockerStartFailureHelp,
  logLocalInstallComplete,
  readDatosMode,
  run,
  runSupabase,
  runSupabaseStartWithRetries,
  syncLocalFunctionEnv,
  writeDatosMode,
  writeDatosSecrets,
  writeEnvFile,
} from "./lib/setup-utils.mjs";

const rl = createRl();

async function main() {
  await drainPendingStdin();

  log(`
BionApp — instalación en modo local
===================================
Los datos de muestras y usuarios se guardan en ESTE ordenador, sin usar Supabase en la nube.
No hace falta cuenta en supabase.com ni conexión a internet tras la instalación.

Requisitos:
  • Node.js (LTS)
  • Docker Desktop instalado y en marcha
    https://docs.docker.com/desktop/

La carpeta "datos/" guardará la configuración local (no confundir con "documentos/",
que solo contiene PDFs de protocolos desde Opciones → Documentos).

La carpeta "supabase/" del proyecto NO es tu cuenta en la nube: son archivos técnicos
(SQL, config) que vienen con BionApp. En modo local no se enlaza ningún proyecto remoto.
`);

  const existing = readDatosMode();
  const isReinstall = existing?.mode === "local" && fs.existsSync(ENV_PATH);

  if (isReinstall) {
    log(`\n⚠ Ya hay una instalación en modo local (${existing.installedAt || "fecha desconocida"}).`);
    const reinstall = await confirmLocalReinstall(rl);
    if (!reinstall) {
      log(`
Instalación cancelada. Para usar la app, haz doble clic en "Iniciar-BionApp.bat"
o ejecuta: npm run start:local
`);
      rl.close();
      return;
    }
  }

  if (!isDockerAvailable()) {
    log(`
✗ Docker no está disponible. Instala Docker Desktop, ábrelo y espera a que diga "Running".
Luego vuelve a ejecutar: npm run setup:local
`);
    rl.close();
    process.exit(1);
  }

  ensureNpmInstallLocal();

  const adminCode = await askAdminCodeConfirmed(rl);

  banner("Carpeta datos/");
  ensureDatosDir();
  writeDatosSecrets(adminCode);
  writeDatosMode("local");
  log("✓ datos/secrets.env y datos/mode.json creados");
  syncLocalFunctionEnv();

  if (isSupabaseRunning()) {
    log("→ Reiniciando motor local para cargar supabase/functions/.env …");
    runSupabase(["stop", "--no-backup"], { allowFail: true });
  }

  banner("Motor de datos local (Docker en este PC)");
  log(
    "La primera vez descarga imágenes de Docker por internet (varios cientos de MB).\n" +
      "Si falla con error EOF, ejecuta antes: npm run pull:local-images\n"
  );

  const pullFirst = await ask(
    rl,
    "¿Descargar imágenes Docker ahora con reintentos? (recomendado la primera vez) (S/n): "
  );
  if (!isNo(pullFirst)) {
    run("node", ["scripts/pull-local-images.mjs"], {
      label: "Descarga de imágenes Docker",
      allowFail: true,
    });
  }

  const status = await runSupabaseStartWithRetries();
  if (!status?.API_URL || !status?.anon_key) {
    logDockerStartFailureHelp();
    process.exit(1);
  }

  const apiUrl = status.API_URL.replace(/\/+$/, "");

  banner("Esquema de base de datos");
  log("→ Aplicando esquema de tablas (db reset)…");
  runSupabase(["db", "reset", "--yes"], {
    label: "supabase db reset (migraciones + trigger de usuarios)",
  });

  banner("Archivo .env de la app");
  writeEnvFile({ url: apiUrl, anonKey: status.anon_key, mode: "local" });
  log(`✓ Escrito ${ENV_PATH}`);

  logLocalInstallComplete();

  const openApp = await ask(rl, "¿Abrir la app y cerrar esta terminal de instalación? (S/n): ");
  rl.close();

  if (!isNo(openApp)) {
    launchLocalAppDetached();
    ensureDatosDir();
    fs.writeFileSync(`${DATOS_DIR}/.setup-launched`, "", "utf8");
    log("\nAbriendo BionApp en otra ventana…");
    process.exit(EXIT_LAUNCH_APP);
  }

  log("\nPara abrir más tarde: doble clic en Iniciar-BionApp.bat o npm run start:local");
}

main().catch((err) => {
  console.error(err);
  rl.close();
  process.exit(1);
});
