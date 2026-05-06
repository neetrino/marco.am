#!/usr/bin/env node

/**
 * `shared/db/generated/` is gitignored. `next dev` does not run `prebuild`, so Turbopack
 * can fail on first import of `./generated/prisma-client`. Run `pnpm db:generate` only
 * when the client bundle is missing (fast no-op when already generated).
 */

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const repoRoot = path.join(__dirname, "..");
const generatedIndex = path.join(
  repoRoot,
  "shared",
  "db",
  "generated",
  "prisma-client",
  "index.js",
);

if (fs.existsSync(generatedIndex)) {
  process.exit(0);
}

console.log(
  "[ensure-prisma] Prisma client missing at shared/db/generated/prisma-client; running pnpm db:generate…",
);

const result = spawnSync("pnpm", ["run", "db:generate"], {
  cwd: repoRoot,
  stdio: "inherit",
  shell: true,
  env: process.env,
});

process.exit(result.status ?? 1);
