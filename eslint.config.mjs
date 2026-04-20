import nextConfig from "eslint-config-next";
import tseslint from "typescript-eslint";

/**
 * ESLint config — Phase 1 ratchet.
 *
 * Strategy: rules are tightened compared to the historical "off" state but
 * still warn instead of error so existing debt is visible without blocking
 * builds. Target final values come from `.cursor/rules/00-core.mdc` and
 * `03-typescript.mdc`. The current warning count is locked in `package.json`
 * via `--max-warnings`; new violations must not grow the count.
 *
 * Targets (do not edit without an ADR):
 *   - no-explicit-any: error
 *   - max-lines: 300
 *   - max-lines-per-function: 50
 *   - max-depth: 3
 */
/** @type {import("eslint").Linter.Config[]} */
const config = [
  ...nextConfig,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "no-unused-vars": "off",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "max-lines": ["warn", { max: 800, skipBlankLines: true, skipComments: true }],
      "max-lines-per-function": [
        "warn",
        { max: 200, skipBlankLines: true, skipComments: true, IIFEs: true },
      ],
      "max-depth": ["warn", { max: 5 }],
      "react-hooks/exhaustive-deps": "warn",
      "@next/next/no-img-element": "warn",
      // React 19 / Next 16 compiler-era rules — keep off until upstream stabilizes.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
      "react-hooks/incompatible-library": "off",
    },
  },
  {
    files: ["next.config.js", "next.config.mjs", "**/*.cjs", "eslint.config.mjs"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "import/no-anonymous-default-export": "off",
    },
  },
  {
    files: ["shared/db/**/*.ts", "shared/db/**/*.js", "shared/db/**/*.cjs"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    // Next.js App Router framework-required default exports.
    // See `.cursor/rules/04-react-nextjs.mdc` for the canonical list.
    files: [
      "**/app/**/page.{ts,tsx,js,jsx}",
      "**/app/**/layout.{ts,tsx,js,jsx}",
      "**/app/**/template.{ts,tsx,js,jsx}",
      "**/app/**/default.{ts,tsx,js,jsx}",
      "**/app/**/loading.{ts,tsx,js,jsx}",
      "**/app/**/error.{ts,tsx,js,jsx}",
      "**/app/**/global-error.{ts,tsx,js,jsx}",
      "**/app/**/not-found.{ts,tsx,js,jsx}",
      "**/app/**/manifest.{ts,js}",
      "**/app/**/sitemap.{ts,js}",
      "**/app/**/robots.{ts,js}",
      "**/app/**/opengraph-image.{ts,tsx,js,jsx}",
      "**/app/**/twitter-image.{ts,tsx,js,jsx}",
      "**/app/**/icon.{ts,tsx,js,jsx}",
      "**/app/**/apple-icon.{ts,tsx,js,jsx}",
    ],
    rules: {
      "import/no-default-export": "off",
    },
  },
  {
    files: ["src/scripts/**/*.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-console": "off",
      "max-depth": "off",
    },
  },
  {
    files: ["src/lib/utils/logger.ts"],
    rules: {
      "no-console": "off",
    },
  },
  {
    files: ["scripts/**/*.js", "shared/db/**/*.cjs"],
    rules: {
      "no-console": "off",
    },
  },
];

export default config;
