#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const colors = require("./console-colors.cjs");

/**
 * Script to automatically generate useTheme.ts from variables.css
 * Usage: npm run update-theme
 */

// File paths
const VARIABLES_CSS_PATH = path.join(__dirname, "../src/style/variables.css");
const USE_THEME_PATH = path.join(__dirname, "../src/composables/useTheme.ts");

function extractCSSVariables(cssContent) {
    // Regex to find CSS variables: --variable-name
    const variableRegex = /--([a-zA-Z0-9-_]+)\s*:/g;
    const variables = [];
    let match;

    while ((match = variableRegex.exec(cssContent)) !== null) {
        const variableName = match[1];
        if (!variables.includes(variableName)) {
            variables.push(variableName);
        }
    }

    return variables.sort();
}

function generateUseThemeContent(variables) {
    const variablesList = variables.map((v) => `  '${v}'`).join(",\n");

    return `// AUTOMATICALLY GENERATED FILE - DO NOT EDIT MANUALLY
// Generated from variables.css using: npm run update-theme
// Last updated: ${new Date().toISOString().split("T")[0]}

export const themeVariableNames = [
${variablesList}
] as const;

export type ThemeVariableName = typeof themeVariableNames[number];

/**
 * Function to get the value of a CSS variable from the theme
 * @param name - Variable name (without --)
 * @returns The value of the CSS variable
 */
export function getThemeVar(name: ThemeVariableName): string {
  return getComputedStyle(document.body).getPropertyValue(\`--\${name}\`).trim();
}

/**
 * Reactive object for direct access to theme variables
 * Usage: theme['primary-color'] or theme.primaryColor (if using camelCase)
 */
export const theme = new Proxy({}, {
  get(_, prop: string) {
    return getThemeVar(prop as ThemeVariableName);
  }
}) as Record<ThemeVariableName, string>;

/**
 * Hook to use theme variables in Vue components
 * @returns Object with all theme functions and variables
 */
export function useTheme() {
  return {
    theme,
    getThemeVar,
    themeVariableNames: [...themeVariableNames] // Copy to avoid mutations
  };
}

// Export individual variables for convenience
export const themeVars = {
${variables.map((v) => `  '${v}': () => getThemeVar('${v}'),`).join("\n")}
} as const;
`;
}

function main() {
    try {
        console.log(colors.cyan + "Generating useTheme.ts from variables.css..." + colors.reset);

        // Read the CSS file
        if (!fs.existsSync(VARIABLES_CSS_PATH)) {
            throw new Error(`File not found: ${VARIABLES_CSS_PATH}`);
        }

        const cssContent = fs.readFileSync(VARIABLES_CSS_PATH, "utf8");
        console.log(colors.green + "CSS file read successfully" + colors.reset);

        // Extract variables
        const variables = extractCSSVariables(cssContent);

        if (variables.length === 0) {
            throw new Error("No CSS variables found in the file");
        }

        console.log(colors.yellow + `Found ${variables.length} variables:` + colors.reset + " " + colors.green + "[" + colors.reset);
        variables.forEach((v) => console.log(`  ${colors.green}'${v}'${colors.reset},`));
        console.log(colors.green + "]" + colors.reset);

        // Generate composable content
        const useThemeContent = generateUseThemeContent(variables);

        // Create directory if it doesn't exist
        const useThemeDir = path.dirname(USE_THEME_PATH);
        if (!fs.existsSync(useThemeDir)) {
            fs.mkdirSync(useThemeDir, { recursive: true });
        }

        // Write file
        fs.writeFileSync(USE_THEME_PATH, useThemeContent, "utf8");

        console.log(colors.green + "useTheme.ts generated successfully" + colors.reset);
        console.log(colors.blue + "Location:" + colors.reset + " " + USE_THEME_PATH);
        console.log("\n" + colors.cyan + "You can now use:" + colors.reset);
        console.log("   - " + colors.yellow + 'import { theme, getThemeVar } from "@/composables/useTheme"' + colors.reset);
        console.log("   - " + colors.yellow + 'theme["primary-color"]' + colors.reset + " for dynamic access");
        console.log("   - " + colors.yellow + 'getThemeVar("primary-color")' + colors.reset + " for direct access");
        console.log("\n" + colors.cyan + "Variables available with TypeScript autocomplete:" + colors.reset);
        variables.forEach((v) => console.log(`   - ${colors.green}${v}${colors.reset}`));
    } catch (error) {
        console.error(colors.red + "Error:" + colors.reset, error.message);
        process.exit(1);
    }
}

// Run if this is the main script
if (require.main === module) {
    main();
}

module.exports = { extractCSSVariables, generateUseThemeContent };
