export declare const UPDATE_REPO = "GenDoc94/BionApp_desktop";
export declare const UPDATE_BRANCH = "master";
/** Quita el prefijo `v` de un tag de GitHub (`v3.0.10` → `3.0.10`). */
export declare function stripVersionPrefix(tag: string): string;
export type RemoteUpdateInfo = {
    currentVersion: string;
    latestVersion: string;
    hasUpdate: boolean;
    changes: string[];
    releasesUrl: string;
    repoUrl: string;
};
/** Escritorio Electron: siempre instalación local. */
export declare function isLocalInstall(): boolean;
/** Compara semver simple (major.minor.patch). */
export declare function compareVersions(a: string, b: string): number;
export declare function checkForAppUpdate(): Promise<RemoteUpdateInfo>;
