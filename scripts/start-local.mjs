/**
 * Arranca BionApp en modo local: motor Docker + interfaz web.
 * Uso diario tras haber ejecutado npm run setup:local una vez.
 *
 * --background  Arranca en segundo plano, abre el navegador y termina
 *               (para Iniciar-BionApp.bat: la ventana de terminal se cierra sola).
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";
import {
  ENV_PATH,
  ROOT,
  ensureLocalSupabaseRunning,
  isDockerAvailable,
  log,
  logDockerStartFailureHelp,
  readDatosMode,
  run,
  syncLocalFunctionEnv,
} from "./lib/setup-utils.mjs";

const APP_URL = "http://localhost:3000";
const background = process.argv.includes("--background");

function fail(msg) {
  log(`\n✗ ${msg}`);
  process.exit(1);
}

async function waitForServer(url, maxAttempts = 90, intervalMs = 500) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status < 500) return true;
    } catch {
      /* servidor aún no listo */
    }
    await sleep(intervalMs);
  }
  return false;
}

function openBrowser(url) {
  if (process.platform === "win32") {
    spawn("cmd.exe", ["/c", "start", url], { detached: true, stdio: "ignore" }).unref();
    return;
  }
  if (process.platform === "darwin") {
    spawn("open", [url], { detached: true, stdio: "ignore" }).unref();
    return;
  }
  spawn("xdg-open", [url], { detached: true, stdio: "ignore" }).unref();
}

function startDevServerDetached() {
  const child = spawn("npm", ["run", "dev"], {
    cwd: ROOT,
    detached: true,
    stdio: "ignore",
    shell: true,
    windowsHide: true,
    env: { ...process.env, BROWSER: "none" },
  });
  child.unref();
}

async function main() {
  const mode = readDatosMode();
  if (mode?.mode !== "local") {
    fail(
      'No hay instalación en modo local. Ejecuta primero: npm run setup\n(o "npm run setup" y elige modo local).'
    );
  }

  if (!fs.existsSync(ENV_PATH)) {
    fail("Falta el archivo .env. Ejecuta: npm run setup:local");
  }

  if (!isDockerAvailable()) {
    fail(
      'Docker no está en marcha. Abre Docker Desktop y vuelve a ejecutar "Iniciar-BionApp.bat".'
    );
  }

  log("BionApp — modo local\n");

  syncLocalFunctionEnv();

  const status = await ensureLocalSupabaseRunning();
  if (!status?.API_URL) {
    logDockerStartFailureHelp();
    fail("El motor local no respondió. Comprueba Docker y ejecuta: npx supabase status");
  }

  run("docker", ["restart", "supabase_edge_runtime_BionApp"], { allowFail: true });

  if (background) {
    log(`→ Abriendo la app en ${APP_URL} …\n`);
    startDevServerDetached();

    const ready = await waitForServer(APP_URL);
    if (!ready) {
      fail(
        "La interfaz no respondió a tiempo. Comprueba que el puerto 3000 esté libre e inténtalo de nuevo."
      );
    }

    openBrowser(APP_URL);
    process.exit(0);
  }

  log(`→ Arrancando la interfaz en ${APP_URL} …\n`);
  log("(Cierra esta ventana o pulsa Ctrl+C para detener la app.)\n");

  const child = spawn("npm", ["run", "dev"], {
    cwd: ROOT,
    stdio: "inherit",
    shell: true,
  });

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
