export declare const THEME_STORAGE_KEY = "bionapp-theme";
export type ThemeMode = "light" | "dark";
export declare function getStoredTheme(): ThemeMode;
export declare function applyTheme(mode: ThemeMode): void;
export declare function setTheme(mode: ThemeMode): void;
