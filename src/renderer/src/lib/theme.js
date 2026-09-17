export var THEME_STORAGE_KEY = "bionapp-theme";
export function getStoredTheme() {
    try {
        var value = localStorage.getItem(THEME_STORAGE_KEY);
        return value === "dark" ? "dark" : "light";
    }
    catch (_a) {
        return "light";
    }
}
export function applyTheme(mode) {
    document.documentElement.classList.toggle("dark", mode === "dark");
}
export function setTheme(mode) {
    try {
        localStorage.setItem(THEME_STORAGE_KEY, mode);
    }
    catch (_a) {
        // localStorage no disponible
    }
    applyTheme(mode);
}
