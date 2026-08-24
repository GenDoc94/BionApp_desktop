import { spawnSync } from "node:child_process";
import { spawn } from "node:child_process";
import fs from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const ENV_PATH = path.join(ROOT, ".env");
export const ENV_EXAMPLE = path.join(ROOT, ".env.example");
export const DATOS_DIR = path.join(ROOT, "datos");
export const DATOS_MODE = path.join(DATOS_DIR, "mode.json");
export const DATOS_SECRETS = path.join(DATOS_DIR, "secrets.env");

export function createRl() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

export function ask(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

const useColor = Boolean(process.stdout.isTTY) && process.env.NO_COLOR !== "1";

export const color = {
  bold: useColor ? "\x1b[1m" : "",
  green: useColor ? "\x1b[32m" : "",
  yellow: useColor ? "\x1b[33m" : "",
  cyan: useColor ? "\x1b[36m" : "",
  reset: useColor ? "\x1b[0m" : "",
};

export function logHighlight(msg) {
  log(`${color.bold}${color.green}${msg}${color.reset}`);
}

export function logWarn(msg) {
  log(`${color.bold}${color.yellow}${msg}${color.reset}`);
}

/** Evita que un Enter residual (p. ej. tras elegir modo en setup.mjs) consuma la primera respuesta. */
export async function drainPendingStdin() {
  if (!process.stdin.isTTY) return;
  await sleep(100);
  const hadRaw = process.stdin.isRaw;
  try {
    if (process.stdin.setRawMode) process.stdin.setRawMode(true);
    process.stdin.resume();
    const deadline = Date.now() + 200;
    while (Date.now() < deadline) {
      const chunk = process.stdin.read();
      if (chunk === null) {
        await sleep(20);
        continue;
      }
    }
  } finally {
    if (process.stdin.setRawMode) process.stdin.setRawMode(hadRaw ?? false);
  }
}

export function isYes(answer) {
  return /^s|si|y|yes$/i.test(answer);
}

export function isNo(answer) {
  return /^n|no$/i.test(answer);
}

export function log(msg) {
  console.log(msg);
}

export function banner(title) {
  log(`\n=== ${title} ===\n`);
}

export function parseProjectRef(input) {
  const trimmed = input.trim();
  const fromUrl = trimmed.match(/https?:\/\/([a-z0-9]+)\.supabase\.co/i);
  if (fromUrl) return fromUrl[1];
  if (/^[a-z0-9]{10,}$/i.test(trimmed)) return trimmed;
  return null;
}

export function normalizeSupabaseUrl(input, projectRef) {
  const trimmed = input.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed.replace(/\/+$/, "");
  if (projectRef) return `https://${projectRef}.supabase.co`;
  return null;
}

export function run(cmd, args, { label, allowFail = false, cwd = ROOT, env } = {}) {
  if (label) log(`→ ${label}`);
  const result = spawnSync(cmd, args, {
    cwd,
    stdio: "inherit",
    shell: true,
    env: env ? { ...process.env, ...env } : undefined,
  });
  if (result.status !== 0 && !allowFail) {
    log(`\n✗ Falló: ${label || `${cmd} ${args.join(" ")}`}`);
    process.exit(result.status ?? 1);
  }
  return result.status === 0;
}

export function runNpm(args, opts = {}) {
  return run("npm", args, opts);
}

export function runSupabase(args, opts = {}) {
  return run("npm", ["exec", "--", "supabase", ...args], opts);
}

export function runCapture(cmd, args, { cwd = ROOT } = {}) {
  const result = spawnSync(cmd, args, {
    cwd,
    encoding: "utf8",
    shell: true,
  });
  return {
    ok: result.status === 0,
    stdout: (result.stdout || "").trim(),
    stderr: (result.stderr || "").trim(),
    status: result.status ?? 1,
  };
}

export function runSupabaseCapture(args) {
  return runCapture("npm", ["exec", "--", "supabase", ...args]);
}

export function isLoggedInToSupabase() {
  const result = runSupabaseCapture(["projects", "list"]);
  if (!result.ok) return false;
  const out = `${result.stdout}${result.stderr}`;
  return !/not logged in|access token not found/i.test(out);
}

export function isDockerAvailable() {
  const result = runCapture("docker", ["info"], { cwd: ROOT });
  return result.ok;
}

export function ensureDatosDir() {
  fs.mkdirSync(DATOS_DIR, { recursive: true });
}

export function readDatosMode() {
  if (!fs.existsSync(DATOS_MODE)) return null;
  try {
    return JSON.parse(fs.readFileSync(DATOS_MODE, "utf8"));
  } catch {
    return null;
  }
}

export function writeDatosMode(mode) {
  ensureDatosDir();
  fs.writeFileSync(
    DATOS_MODE,
    JSON.stringify(
      {
        mode,
        installedAt: new Date().toISOString(),
      },
      null,
      2
    ),
    "utf8"
  );
}

export function writeDatosSecrets(adminCode) {
  ensureDatosDir();
  fs.writeFileSync(
    DATOS_SECRETS,
    `# Generado por BionApp — no subir a Git\nCREATE_USER_ADMIN_CODE=${adminCode.replace(/\r?\n/g, "")}\n`,
    "utf8"
  );
}

export function readDatosSecrets() {
  if (!fs.existsSync(DATOS_SECRETS)) return null;
  const content = fs.readFileSync(DATOS_SECRETS, "utf8");
  const match = content.match(/^CREATE_USER_ADMIN_CODE=(.+)$/m);
  return match ? match[1].trim() : null;
}

export function writeEnvFile({ url, anonKey, mode }) {
  const content = `# Generado por BionApp — no subir a Git
VITE_BIONAPP_MODE=${mode}
VITE_SUPABASE_URL=${url}
VITE_SUPABASE_ANON_KEY=${anonKey}
`;
  fs.writeFileSync(ENV_PATH, content, "utf8");
}

export async function ensureNpmInstall(rl) {
  banner("Dependencias npm");
  if (!fs.existsSync(path.join(ROOT, "node_modules"))) {
    runNpm(["install"], { label: "npm install" });
    return;
  }
  const installDeps = await ask(rl, "¿Ejecutar npm install por si acaso? (s/N): ");
  if (isYes(installDeps)) {
    runNpm(["install"], { label: "npm install" });
  }
}

export function ensureNpmInstallLocal() {
  banner("Dependencias npm");
  runNpm(["install"], { label: "npm install" });
}

export async function askAdminCodeConfirmed(rl, minLength = 8) {
  while (true) {
    const code = await ask(
      rl,
      `Código admin para crear usuarios (mín. ${minLength} caracteres, guárdalo en secreto): `
    );
    if (code.length < minLength) {
      log(`✗ El código admin debe tener al menos ${minLength} caracteres.`);
      continue;
    }
    const codeRepeat = await ask(rl, "Repite el código admin: ");
    if (code !== codeRepeat) {
      log("✗ Los códigos no coinciden. Vuelve a escribirlos.");
      continue;
    }
    return code;
  }
}

export async function confirmLocalReinstall(rl) {
  const first = await ask(rl, "¿Reinstalar desde cero (borra la base local)? (s/N): ");
  if (!isYes(first)) return false;

  log("");
  logWarn("⚠ ATENCIÓN: esto borrará TODOS los datos almacenados hasta el momento");
  logWarn("  (muestras, usuarios, catálogos, etc.).");
  log("");

  const second = await ask(rl, "¿Seguro que quieres borrar todos los datos? (s/N): ");
  return isYes(second);
}

/** Código de salida: instalación OK y la app se abrió en otra ventana (el .bat puede cerrarse). */
export const EXIT_LAUNCH_APP = 2;

export function launchLocalAppDetached() {
  spawn(process.execPath, ["scripts/start-local.mjs", "--background"], {
    cwd: ROOT,
    detached: true,
    stdio: "ignore",
    windowsHide: process.platform === "win32",
  }).unref();
}

export function logLocalInstallComplete() {
  log("");
  log(`${color.cyan}${"=".repeat(50)}${color.reset}`);
  logHighlight("✓ Instalación en modo local completada");
  log(`${color.cyan}${"=".repeat(50)}${color.reset}`);
  log(`
Los datos de muestras quedan en el motor PostgreSQL de Docker en este PC.
La configuración local está en la carpeta "datos/".

Uso diario (cada vez que quieras abrir la app):
  • Doble clic en "Iniciar-BionApp.bat" (Windows)
  • O en terminal: npm run start:local

La primera vez que abras la app:
  1. Pulsa "Añadir nuevo usuario" (rol admin + el código admin que definiste)
  2. Inicia sesión
  3. "Añadir primera muestra" → catálogos en Opciones

Guarda el código admin en un sitio seguro.
`);
}

export function normalizeSupabaseStatus(raw) {
  if (!raw || typeof raw !== "object") return null;
  const apiUrl = raw.API_URL ?? raw.api_url;
  const anonKey =
    raw.ANON_KEY ?? raw.anon_key ?? raw.PUBLISHABLE_KEY ?? raw.publishable_key;
  if (!apiUrl || !anonKey) return null;
  return { ...raw, API_URL: apiUrl, anon_key: anonKey };
}

export function getSupabaseStatus() {
  const result = runSupabaseCapture(["status", "--output", "json"]);
  if (!result.ok) return null;
  try {
    const text = result.stdout;
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end <= start) return null;
    return normalizeSupabaseStatus(JSON.parse(text.slice(start, end + 1)));
  } catch {
    return null;
  }
}

export function isSupabaseRunning() {
  const status = getSupabaseStatus();
  return Boolean(status?.API_URL);
}

export async function waitForSupabase(maxAttempts = 60, intervalMs = 2000) {
  for (let i = 0; i < maxAttempts; i++) {
    const status = getSupabaseStatus();
    if (status?.API_URL && status?.anon_key) return status;
    await sleep(intervalMs);
  }
  return null;
}

export const FUNCTIONS_ENV_PATH = path.join(ROOT, "supabase", "functions", ".env");

/**
 * Modo local: el código admin va en supabase/functions/.env (cargado por supabase start).
 * NO usar "supabase secrets set": eso es solo para proyectos en la nube.
 */
export function syncLocalFunctionEnv() {
  if (!fs.existsSync(DATOS_SECRETS)) {
    log("⚠ No se encontró datos/secrets.env");
    return false;
  }
  const raw = fs.readFileSync(DATOS_SECRETS, "utf8");
  const line = raw.match(/^CREATE_USER_ADMIN_CODE=(.+)$/m);
  if (!line) {
    log("⚠ datos/secrets.env no contiene CREATE_USER_ADMIN_CODE");
    return false;
  }
  fs.mkdirSync(path.dirname(FUNCTIONS_ENV_PATH), { recursive: true });
  fs.writeFileSync(
    FUNCTIONS_ENV_PATH,
    `# Generado por BionApp (modo local) — no subir a Git\nCREATE_USER_ADMIN_CODE=${line[1].trim()}\n`,
    "utf8"
  );
  log("✓ Código admin en supabase/functions/.env (solo este PC; no usa tu cuenta en la nube)");
  return true;
}

/** @deprecated Usar syncLocalFunctionEnv en modo local */
export function applyLocalSecrets() {
  return syncLocalFunctionEnv();
}

/** Evita que supabase start intente alinear versiones con un proyecto enlazado en la nube. */
export function isProjectLinked() {
  const ref = path.join(ROOT, "supabase", ".temp", "project-ref");
  return fs.existsSync(ref);
}

export function unlinkRemoteProjectForLocal() {
  if (!isProjectLinked()) return;
  runSupabase(["unlink", "--yes"], {
    label: "Desenlazar proyecto en la nube (solo modo local)",
    allowFail: true,
  });
}

export function logDockerStartFailureHelp() {
  log(`
✗ No se pudo arrancar el motor local (supabase start).

Causa habitual: Docker no pudo terminar de descargar imágenes desde internet
(error "EOF", "failed to copy" o "cloudfront.net"). No es un fallo de tu cuenta
Supabase ni del código de BionApp: es la red o el proxy/VPN al bajar contenedores.

Prueba en este orden:

  1. Reinicia Docker Desktop (clic derecho en el icono → Restart).
  2. Desactiva VPN o proxy del hospital unos minutos.
  3. Comprueba Docker con: docker pull hello-world
  4. Descarga las imágenes con reintentos:
       npm run pull:local-images
  5. Vuelve a instalar:
       npm run setup:local

Si sigue fallando, prueba otra red (datos del móvil) solo para la primera
descarga. Después el modo local puede usarse sin internet.

Más ayuda en el README → "Si algo falla" → modo local / EOF.
`);
}

const SUPABASE_START_FLAGS = ["start", "--dns-resolver", "https"];

export async function runSupabaseStartWithRetries(maxAttempts = 5) {
  unlinkRemoteProjectForLocal();

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (attempt > 1) {
      log(`\n→ Reintento ${attempt}/${maxAttempts}…`);
      runSupabase(["stop", "--no-backup"], { allowFail: true, label: "supabase stop (limpieza)" });
      await sleep(8000);
    }

    const label =
      attempt === 1
        ? "supabase start"
        : `supabase start (intento ${attempt}/${maxAttempts})`;
    const ok = runSupabase(SUPABASE_START_FLAGS, { label, allowFail: true });
    if (!ok) continue;

    log("✓ Contenedores arrancados; comprobando API local…");
    const status = await waitForSupabase(30, 2000);
    if (status?.API_URL && status?.anon_key) return status;
  }

  return null;
}

export async function ensureLocalSupabaseRunning() {
  if (isSupabaseRunning()) {
    const status = getSupabaseStatus();
    if (status?.API_URL && status?.anon_key) return status;
  }
  return runSupabaseStartWithRetries();
}

export function ensureEnvOverwrite(rl) {
  return (async () => {
    if (!fs.existsSync(ENV_PATH)) return true;
    const overwrite = await ask(rl, ".env ya existe. ¿Sobrescribir? (s/N): ");
    return /^s|si|y|yes$/i.test(overwrite);
  })();
}
