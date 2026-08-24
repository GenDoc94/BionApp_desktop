/**
 * Asistente de instalación BionApp.
 * Elige modo local (datos en este PC) o modo red (Supabase en la nube).
 */

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ask, createRl, drainPendingStdin, log } from "./lib/setup-utils.mjs";

const SCRIPTS_DIR = path.dirname(fileURLToPath(import.meta.url));

function runScript(name, extraEnv = {}) {
  const scriptPath = path.join(SCRIPTS_DIR, name);
  const result = spawnSync(process.execPath, [scriptPath], {
    stdio: "inherit",
    cwd: path.resolve(SCRIPTS_DIR, ".."),
    env: { ...process.env, ...extraEnv },
  });
  process.exit(result.status ?? 1);
}

async function main() {
  const rl = createRl();

  log(`
BionApp — asistente de instalación
==================================

Elige cómo quieres guardar los datos de muestras y usuarios:

  1) Modo local
     • Datos en este ordenador (sin Supabase en la nube)
     • Requiere Docker Desktop
     • Uso diario: doble clic en Iniciar-BionApp.bat

  2) Modo red
     • Datos en tu proyecto Supabase (nube)
     • La app puede correr en tu PC o publicarse en Vercel
     • Requiere cuenta en supabase.com
`);

  const choice = await ask(rl, "¿Modo local (1) o modo red (2)? [1/2]: ");
  rl.close();
  await drainPendingStdin();

  if (choice === "1" || /^local$/i.test(choice)) {
    runScript("setup-local.mjs");
    return;
  }
  if (choice === "2" || /^red$/i.test(choice)) {
    runScript("setup-red.mjs");
    return;
  }

  log("✗ Opción no válida. Ejecuta de nuevo: npm run setup");
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
