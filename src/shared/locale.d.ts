export declare const APP_LOCALES: readonly ["es", "en"];
export type AppLocale = (typeof APP_LOCALES)[number];
export declare const DEFAULT_LOCALE: AppLocale;
export declare function isAppLocale(value: unknown): value is AppLocale;
