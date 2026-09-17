import changelogRaw from "../../../../CHANGELOG.md?raw";
export var LAST_SEEN_VERSION_KEY = "bionapp-last-seen-version";
/** Extrae las viñetas de la sección `## versión` del CHANGELOG. */
export function getChangesForVersion(version, markdown) {
    if (markdown === void 0) { markdown = changelogRaw; }
    var escaped = version.replace(/\./g, "\\.");
    var sectionRe = new RegExp("##\\s+".concat(escaped, "\\s*\\n([\\s\\S]*?)(?=\\n##\\s|$)"));
    var match = markdown.match(sectionRe);
    if (!match)
        return [];
    return match[1]
        .split("\n")
        .map(function (line) { return line.trim(); })
        .filter(function (line) { return line.startsWith("- "); })
        .map(function (line) { return line.slice(2).trim(); })
        .filter(Boolean);
}
export function getLastSeenVersion() {
    try {
        return localStorage.getItem(LAST_SEEN_VERSION_KEY);
    }
    catch (_a) {
        return null;
    }
}
export function markVersionSeen(version) {
    try {
        localStorage.setItem(LAST_SEEN_VERSION_KEY, version);
    }
    catch (_a) {
        // localStorage no disponible
    }
}
export function shouldShowVersionNotice(currentVersion) {
    var changes = getChangesForVersion(currentVersion);
    if (changes.length === 0)
        return false;
    return getLastSeenVersion() !== currentVersion;
}
