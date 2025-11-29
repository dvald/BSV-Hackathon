// App preferences

import { fetchFromLocalStorage, fetchFromLocalStorageCache, saveIntoLocalStorage } from "@/utils/local-storage";
import { AppEvents } from "./app-events";

export type ColorThemeName = "light" | "dark";

/**
 * Gets default theme - Always returns light theme
 * @returns The theme name (always "light")
 */
function defaultBrowserTheme(): ColorThemeName {
    // Siempre usar modo claro - MiCiudadID solo soporta tema light
    return "light";
}

const LS_KEY_THEME = "app-pref-theme";

/**
 * Event triggered when the theme changes
 */
export const EVENT_NAME_THEME_CHANGED = "theme-changed";

/**
 * Gets color theme
 * @returns The theme name
 */
export function getTheme(): ColorThemeName {
    return fetchFromLocalStorageCache(LS_KEY_THEME, defaultBrowserTheme());
}

/**
 * Sets color theme
 * @param theme The theme name
 */
export function setTheme(theme: ColorThemeName) {
    saveIntoLocalStorage(LS_KEY_THEME, theme);
    AppEvents.Emit(EVENT_NAME_THEME_CHANGED, theme);
}

/**
 * Gets default wallet ID
 * @param uid The user ID
 * @returns The default wallet id
 */
export function getDefaultWallet(uid: string) {
    return fetchFromLocalStorage("app-pref-default-wallet-" + uid, "");
}

/**
 * Sets default wallet
 * @param uid The user ID
 * @param wallet The wallet ID
 */
export function setDefaultWallet(uid: string, wallet: string) {
    saveIntoLocalStorage("app-pref-default-wallet-" + uid, wallet);
}

const LS_KEY_COOKIES_PREFERENCE = "app-pref-cookies";

/**
 * Cookies preferences value
 */
export type CookiesPreference = "all" | "essential" | "";

/**
 * Gets cookie preference value set by the user
 * @returns The cookie preference
 */
export function getCookiePreference(): CookiesPreference {
    return fetchFromLocalStorageCache(LS_KEY_COOKIES_PREFERENCE, "") as CookiesPreference;
}

/**
 * Sets cookie preference
 * @param preference The cookie preference
 */
export function setCookiePreference(preference: CookiesPreference) {
    saveIntoLocalStorage(LS_KEY_COOKIES_PREFERENCE, preference);
}
