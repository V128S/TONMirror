import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import nextPlugin from "@next/eslint-plugin-next";
import reactHooks from "eslint-plugin-react-hooks";

/**
 * Flat ESLint config (ESLint 9). We wire the Next.js + TypeScript + react-hooks
 * plugins directly instead of FlatCompat-extending the legacy `eslint-config-next`
 * shareable config — that path injects a flat-config `name` property the legacy
 * schema rejects ("Unexpected top-level property name"). Run via the ESLint CLI
 * (`eslint .`); `next lint` is deprecated.
 */
const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "next-env.d.ts",
      "public/**",
      "prisma/migrations/**",
    ],
  },
  js.configs.recommended,
  // App + test sources
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: "latest", sourceType: "module" },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      "@next/next": nextPlugin,
      "react-hooks": reactHooks,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      // TS handles undefined-var/redeclare detection; the core rules double-report.
      "no-unused-vars": "off",
      "no-undef": "off",
      // Empty catch is an intentional best-effort-cleanup idiom across this codebase.
      "no-empty": ["error", { allowEmptyCatch: true }],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  // CommonJS config files (postcss.config.js, etc.)
  {
    files: ["**/*.{js,cjs}"],
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        module: "writable",
        require: "readonly",
        process: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        console: "readonly",
      },
    },
  },
];

export default eslintConfig;
