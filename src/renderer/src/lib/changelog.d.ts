export declare const LAST_SEEN_VERSION_KEY = "bionapp-last-seen-version";
/** Extrae las viñetas de la sección `## versión` del CHANGELOG. */
export declare function getChangesForVersion(version: string, markdown?: string): string[];
export declare function getLastSeenVersion(): string | null;
export declare function markVersionSeen(version: string): void;
export declare function shouldShowVersionNotice(currentVersion: string): boolean;
