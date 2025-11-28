// AUTOMATICALLY GENERATED FILE - DO NOT EDIT MANUALLY
// Generated from variables.css using: npm run update-theme
// Last updated: 2025-07-15

export const themeVariableNames = [
    "background-dark",
    "background-dark-soft",
    "background-light",
    "background-light-soft",
    "danger-color",
    "danger-color-hover",
    "primary-color",
    "secondary-color",
    "success-color",
    "success-color-hover",
    "tertiary-color",
    "warning-color",
    "warning-color-hover",
] as const;

export type ThemeVariableName = (typeof themeVariableNames)[number];

/**
 * Function to get the value of a CSS variable from the theme
 * @param name - Variable name (without --)
 * @returns The value of the CSS variable
 */
export function getThemeVar(name: ThemeVariableName): string {
    return getComputedStyle(document.body).getPropertyValue(`--${name}`).trim();
}

/**
 * Reactive object for direct access to theme variables
 * Usage: theme['primary-color'] or theme.primaryColor (if using camelCase)
 */
export const theme = new Proxy(
    {},
    {
        get(_, prop: string) {
            return getThemeVar(prop as ThemeVariableName);
        },
    },
) as Record<ThemeVariableName, string>;

/**
 * Hook to use theme variables in Vue components
 * @returns Object with all theme functions and variables
 */
export function useTheme() {
    return {
        theme,
        getThemeVar,
        themeVariableNames: [...themeVariableNames], // Copy to avoid mutations
    };
}

// Export individual variables for convenience
export const themeVars = {
    "background-dark": () => getThemeVar("background-dark"),
    "background-dark-soft": () => getThemeVar("background-dark-soft"),
    "background-light": () => getThemeVar("background-light"),
    "background-light-soft": () => getThemeVar("background-light-soft"),
    "danger-color": () => getThemeVar("danger-color"),
    "danger-color-hover": () => getThemeVar("danger-color-hover"),
    "primary-color": () => getThemeVar("primary-color"),
    "secondary-color": () => getThemeVar("secondary-color"),
    "success-color": () => getThemeVar("success-color"),
    "success-color-hover": () => getThemeVar("success-color-hover"),
    "tertiary-color": () => getThemeVar("tertiary-color"),
    "warning-color": () => getThemeVar("warning-color"),
    "warning-color-hover": () => getThemeVar("warning-color-hover"),
} as const;
