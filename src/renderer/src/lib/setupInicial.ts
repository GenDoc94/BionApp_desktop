export const SETUP_STORAGE_KEY = "bionapp_setup_inicial";
export const SETUP_PENDING_CATALOGS = "pending_catalogs";
export const SETUP_PENDING_SAMPLE = "pending_sample";

export function getSetupPhase(): string | null {
  try {
    return sessionStorage.getItem(SETUP_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setSetupPhase(phase: string | null) {
  try {
    if (phase) sessionStorage.setItem(SETUP_STORAGE_KEY, phase);
    else sessionStorage.removeItem(SETUP_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function isSetupPendingSample(): boolean {
  return getSetupPhase() === SETUP_PENDING_SAMPLE;
}
