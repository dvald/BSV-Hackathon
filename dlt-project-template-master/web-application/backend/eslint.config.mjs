import eslint from "@eslint/js";
import typescriptEslint from "typescript-eslint";
import globals from "globals";
import unusedImports from "eslint-plugin-unused-imports";

export default typescriptEslint.config(
    { ignores: ["*.d.ts", "**/coverage", "**/dist"] },
    {
        extends: [eslint.configs.recommended, ...typescriptEslint.configs.recommended],
        files: ["**/*.{ts,vue}"],
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: globals.browser,
            parserOptions: {
                parser: typescriptEslint.parser,
            },
        },
        plugins: {
            "unused-imports": unusedImports,
        },
        rules: {
            "unused-imports/no-unused-imports": "error",
            "prefer-spread": "off",
            "@typescript-eslint/no-var-requires": "off",
            "@typescript-eslint/explicit-module-boundary-types": "off",
            "no-console": "off",
            "no-async-promise-executor": "off",
            "only-arrow-functions": "off",
            "interface-name": "off",
            "no-empty": "off",
            "max-line-length": "off",
            "max-classes-per-file": "off",
            "eqeqeq": ["error", "always"],
            "semi": "off",
            "indent": ["error", 4, { "SwitchCase": 1 }],
            "no-var-requires": "off",
            "@typescript-eslint/no-require-imports": "off",
            "@typescript-eslint/explicit-function-return-type": "off",
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-empty-function": "off",
            "@typescript-eslint/camelcase": "off",
            "object-literal-sort-keys": "off",
            "no-useless-escape": "off",
            "@typescript-eslint/no-unused-vars": "off",
            "@typescript-eslint/no-use-before-define": "off",
        },
    },
);
