import js from "@eslint/js";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import globals from "globals";

/** @type {import('eslint').Linter.Config[]} */
const config = [
  { ignores: ["**/dist/**"] },
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  },
  {
    files: ["**/*.ts", "**/*.tsx"],
    ignores: ["**/*.d.ts"], // Exclude type declaration files from linting
    plugins: {
      "@typescript-eslint": typescriptEslint
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname
      },
      globals: {
        ...globals.node
      }
    },
    rules: {
      ...typescriptEslint.configs.recommended.rules
      // Add or override rules as needed
    }
  },
  {
    files: [".github/scripts/**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  }
];

export default config;
