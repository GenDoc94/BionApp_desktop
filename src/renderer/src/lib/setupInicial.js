export var SETUP_STORAGE_KEY = "bionapp_setup_inicial";
export var SETUP_PENDING_CATALOGS = "pending_catalogs";
export var SETUP_PENDING_SAMPLE = "pending_sample";
export function getSetupPhase() {
    try {
        return sessionStorage.getItem(SETUP_STORAGE_KEY);
    }
    catch (_a) {
        return null;
    }
}
export function setSetupPhase(phase) {
    try {
        if (phase)
            sessionStorage.setItem(SETUP_STORAGE_KEY, phase);
        else
            sessionStorage.removeItem(SETUP_STORAGE_KEY);
    }
    catch (_a) {
        /* ignore */
    }
}
export function isSetupPendingSample() {
    return getSetupPhase() === SETUP_PENDING_SAMPLE;
}
