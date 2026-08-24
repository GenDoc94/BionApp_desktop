/**
 * Descarga con reintentos las imágenes Docker del modo local.
 * Útil cuando supabase start falla con "EOF" o "failed to copy" (red inestable, VPN, proxy).
 */

import fs from "node:fs";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { ROOT, log, run, runCapture } from "./lib/setup-utils.mjs";

/** Imágenes mínimas con la config actual (realtime, storage, studio, etc. desactivados). */
const FALLBACK_IMAGES = [
  "public.ecr.aws/supabase/postgres:17.6.1.106",
  "public.ecr.aws/supabase/gotrue:v2.189.0",
  "public.ecr.aws/supabase/kong:2.8.1",
  "public.ecr.aws/supabase/postgrest:v13.0.7",
  "public.ecr.aws/supabase/edge-runtime:v1.69.28",
];

function imageAlreadyPresent(image) {
  const result = runCapture("docker", ["image", "inspect", image]);
  return result.ok;
}

async function pullOne(image, maxAttempts = 5) {
  if (imageAlreadyPresent(image)) {
    log(`✓ Ya descargada: ${image}`);
    return true;
  }

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    log(`→ docker pull ${image} (${attempt}/${maxAttempts})`);
    const ok = run("docker", ["pull", image], { allowFail: true });
    if (ok && imageAlreadyPresent(image)) return true;
    if (attempt < maxAttempts) {
      const waitSec = 8 * attempt;
      log(`   Esperando ${waitSec}s antes de reintentar…`);
      await sleep(waitSec * 1000);
    }
  }
  return false;
}

function discoverImagesFromTemp() {
  const tempDir = path.join(ROOT, "supabase", ".temp");
  if (!fs.existsSync(tempDir)) return [];

  const found = new Set();
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/docker-compose.*\.ya?ml$/i.test(entry.name)) {
        const text = fs.readFileSync(full, "utf8");
        for (const m of text.matchAll(/image:\s*['"]?([^\s'"]+)['"]?/g)) {
          if (m[1].includes("supabase") || m[1].includes("ecr.aws")) found.add(m[1]);
        }
      }
    }
  };
  walk(tempDir);
  return [...found];
}

async function main() {
  log(`
BionApp — descarga de imágenes Docker (modo local)
==================================================
Si npm run setup:local falla con "EOF" al descargar, ejecuta este script
con Docker Desktop en marcha y una conexión estable (sin VPN si puedes).
`);

  const discovered = discoverImagesFromTemp();
  const images = discovered.length > 0 ? discovered : FALLBACK_IMAGES;

  if (discovered.length > 0) {
    log(`Imágenes detectadas en supabase/.temp: ${images.length}\n`);
  } else {
    log(`Usando lista por defecto (${images.length} imágenes).\n`);
  }

  let failed = 0;
  for (const image of images) {
    const ok = await pullOne(image);
    if (!ok) {
      log(`✗ No se pudo descargar: ${image}`);
      failed++;
    }
  }

  if (failed > 0) {
    log(`
${failed} imagen(es) no se descargaron.

Prueba:
  • Reiniciar Docker Desktop
  • Desactivar VPN / proxy del hospital un momento
  • Probar otra red (por ejemplo, compartir internet del móvil)
  • Luego: npm run setup:local
`);
    process.exit(1);
  }

  log(`
✓ Imágenes listas. Continúa con: npm run setup:local
`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
