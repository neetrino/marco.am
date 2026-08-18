/**
 * Compatibility wrapper for the canonical Marco CSV importer.
 * Prefer `pnpm import:products-csv -- <path>`.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";

const importerPath = path.join(process.cwd(), "scripts", "import-marco-csv-products.cjs");
const result = spawnSync(process.execPath, [importerPath, ...process.argv.slice(2)], {
  stdio: "inherit",
  env: process.env,
});

if (result.error) {
  throw result.error;
}

process.exitCode = result.status ?? 1;
