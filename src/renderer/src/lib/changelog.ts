import changelogRaw from "../../../../CHANGELOG.md?raw";

export const LAST_SEEN_VERSION_KEY = "bionapp-last-seen-version";

/** Extrae las viñetas de la sección `## versión` del CHANGELOG. */
export function getChangesForVersion(version: string, markdown = changelogRaw): string[] {
  const escaped = version.replace(/\./g, "\\.");
  const sectionRe = new RegExp(`##\\s+${escaped}\\s*\\n([\\s\\S]*?)(?=\\n##\\s|$)`);
  const match = markdown.match(sectionRe);
  if (!match) return [];

  return match[1]
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim())
    .filter(Boolean);
}

export function getLastSeenVersion(): string | null {
  try {
    return localStorage.getItem(LAST_SEEN_VERSION_KEY);
  } catch {
    return null;
  }
}

export function markVersionSeen(version: string) {
  try {
    localStorage.setItem(LAST_SEEN_VERSION_KEY, version);
  } catch {
    // localStorage no disponible
  }
}

export function shouldShowVersionNotice(currentVersion: string): boolean {
  const changes = getChangesForVersion(currentVersion);
  if (changes.length === 0) return false;
  return getLastSeenVersion() !== currentVersion;
}
