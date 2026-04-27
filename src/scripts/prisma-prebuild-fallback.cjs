#!/usr/bin/env node

/**
 * Runs `pnpm run db:generate` in shared/db. If it fails (e.g. Windows EPERM while
 * `next dev` holds the query engine DLL) but a previously generated client exists,
 * exit 0 so `pnpm run build` can proceed. CI/fresh clones must succeed on first generate.
 */

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "../..");
const dbDir = path.join(rootDir, "shared", "db");
const generatedIndex = path.join(
  dbDir,
  "generated",
  "prisma-client",
  "index.js",
);

const result = spawnSync("pnpm", ["run", "db:generate"], {
  cwd: dbDir,
  stdio: "inherit",
  shell: true,
  env: process.env,
});

if (result.status === 0) {
  process.exit(0);
}

if (fs.existsSync(generatedIndex)) {
  console.warn(
    "\n[prebuild] prisma generate failed, but an existing client was found at shared/db/generated/prisma-client.",
  );
  console.warn(
    "[prebuild] Stop `pnpm run dev` before build if you changed the Prisma schema, then run `pnpm run build` again.\n",
  );
  process.exit(0);
}

process.exit(result.status ?? 1);
