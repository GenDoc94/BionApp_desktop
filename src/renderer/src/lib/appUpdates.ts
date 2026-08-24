import pkg from "bionapp-pkg";
import { getChangesForVersion } from "./changelog";

export const UPDATE_REPO = "GenDoc94/BionApp_desktop";
export const UPDATE_BRANCH = "master";
const BRANCH_FALLBACKS = ["master", "main"];

export type RemoteUpdateInfo = {
  currentVersion: string;
  latestVersion: string;
  hasUpdate: boolean;
  changes: string[];
  releasesUrl: string;
  repoUrl: string;
};

/** Escritorio Electron: siempre instalación local. */
export function isLocalInstall(): boolean {
  return true;
}

/** Compara semver simple (major.minor.patch). */
export function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map((n) => Number(n) || 0);
  const pb = b.split(".").map((n) => Number(n) || 0);
  const len = Math.max(pa.length, pb.length);

  for (let i = 0; i < len; i++) {
    const da = pa[i] ?? 0;
    const db = pb[i] ?? 0;
    if (da > db) return 1;
    if (da < db) return -1;
  }
  return 0;
}

function getUpdateRepo(): string {
  const custom = String(import.meta.env.VITE_BIONAPP_UPDATE_REPO ?? "").trim();
  return custom || UPDATE_REPO;
}

async function resolveDefaultBranch(repo: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}`, {
      headers: { Accept: "application/vnd.github+json" },
      cache: "no-store",
    });
    if (!res.ok) return null;

    const data = (await res.json()) as { default_branch?: string };
    const branch = data.default_branch?.trim();
    return branch || null;
  } catch {
    return null;
  }
}

async function fetchPackageJsonFromBranch(
  repo: string,
  branch: string
): Promise<{ version?: string } | null> {
  const rawUrl = `https://raw.githubusercontent.com/${repo}/${branch}/package.json`;
  const rawRes = await fetch(rawUrl, { cache: "no-store" });
  if (rawRes.ok) {
    return (await rawRes.json()) as { version?: string };
  }

  if (rawRes.status !== 404) {
    throw new Error(`No se pudo leer package.json en GitHub (${rawRes.status})`);
  }

  const apiUrl = `https://api.github.com/repos/${repo}/contents/package.json?ref=${encodeURIComponent(branch)}`;
  const apiRes = await fetch(apiUrl, {
    headers: {
      Accept: "application/vnd.github+json",
    },
    cache: "no-store",
  });

  if (!apiRes.ok) {
    if (apiRes.status === 404) return null;
    throw new Error(`No se pudo leer package.json en GitHub (${apiRes.status})`);
  }

  const payload = (await apiRes.json()) as { content?: string; encoding?: string };
  if (payload.encoding !== "base64" || !payload.content) {
    throw new Error("La respuesta de GitHub no es válida");
  }

  const json = atob(payload.content.replace(/\n/g, ""));
  return JSON.parse(json) as { version?: string };
}

async function fetchRemotePackageJson(repo: string): Promise<{ version: string; branch: string }> {
  const defaultBranch = await resolveDefaultBranch(repo);
  const branches = [...new Set([defaultBranch, ...BRANCH_FALLBACKS].filter(Boolean))] as string[];

  let sawNotFound = false;

  for (const branch of branches) {
    try {
      const remotePkg = await fetchPackageJsonFromBranch(repo, branch);
      if (!remotePkg) {
        sawNotFound = true;
        continue;
      }

      const version = remotePkg.version?.trim();
      if (!version) {
        throw new Error("La versión remota no es válida");
      }

      return { version, branch };
    } catch (err) {
      if (err instanceof TypeError) {
        throw new Error("No se pudo comprobar. ¿Hay conexión a internet?");
      }
      throw err;
    }
  }

  if (sawNotFound) {
    throw new Error(
      "No se encontró el repositorio en GitHub. Si es privado, hazlo público o usa Actualizar-BionApp.bat."
    );
  }

  throw new Error("No se pudo leer la versión en GitHub");
}

export async function checkForAppUpdate(): Promise<RemoteUpdateInfo> {
  const currentVersion = pkg.version;
  const repo = getUpdateRepo();

  let remote: { version: string; branch: string };
  try {
    remote = await fetchRemotePackageJson(repo);
  } catch (err) {
    if (err instanceof Error) throw err;
    throw new Error("No se pudo comprobar. ¿Hay conexión a internet?");
  }

  const latestVersion = remote.version;
  const base = `https://raw.githubusercontent.com/${repo}/${remote.branch}`;

  let changelogMd = "";
  try {
    const changelogRes = await fetch(`${base}/CHANGELOG.md`, { cache: "no-store" });
    if (changelogRes.ok) changelogMd = await changelogRes.text();
  } catch {
    // El changelog remoto es opcional.
  }

  const changes = getChangesForVersion(latestVersion, changelogMd);
  const hasUpdate = compareVersions(latestVersion, currentVersion) > 0;

  return {
    currentVersion,
    latestVersion,
    hasUpdate,
    changes,
    releasesUrl: `https://github.com/${repo}/releases/latest`,
    repoUrl: `https://github.com/${repo}`,
  };
}
