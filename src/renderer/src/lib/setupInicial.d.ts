export declare const SETUP_STORAGE_KEY = "bionapp_setup_inicial";
export declare const SETUP_PENDING_CATALOGS = "pending_catalogs";
export declare const SETUP_PENDING_SAMPLE = "pending_sample";
export declare function getSetupPhase(): string | null;
export declare function setSetupPhase(phase: string | null): void;
export declare function isSetupPendingSample(): boolean;
