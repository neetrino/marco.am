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
const prismaDir = path.join(repoRoot, "shared", "db", "prisma");
const generatedSchema = path.join(
  repoRoot,
  "shared",
  "db",
  "generated",
  "prisma-client",
  "schema.prisma",
);

function fileMtimeMs(filePath) {
  return fs.existsSync(filePath) ? fs.statSync(filePath).mtimeMs : 0;
}

/**
 * @param {string} dir
 * @returns {string[]}
 */
function collectPrismaSchemaFiles(dir) {
  /** @type {string[]} */
  const files = [];
  const mainSchema = path.join(dir, "schema.prisma");
  if (fs.existsSync(mainSchema)) {
    files.push(mainSchema);
  }

  const modelsDir = path.join(dir, "models");
  if (fs.existsSync(modelsDir)) {
    for (const entry of fs.readdirSync(modelsDir, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith(".prisma")) {
        files.push(path.join(modelsDir, entry.name));
      }
    }
  }

  return files;
}

function latestSourceSchemaMtimeMs() {
  const files = collectPrismaSchemaFiles(prismaDir);
  return files.reduce((latest, filePath) => {
    return Math.max(latest, fileMtimeMs(filePath));
  }, 0);
}

function shouldGeneratePrismaClient() {
  if (!fs.existsSync(generatedIndex) || !fs.existsSync(generatedSchema)) {
    return true;
  }

  const sourceSchemaMtimeMs = latestSourceSchemaMtimeMs();
  const generatedSchemaMtimeMs = fileMtimeMs(generatedSchema);
  const generatedIndexMtimeMs = fileMtimeMs(generatedIndex);

  // Regenerate when any schema file changed after the generated client artifacts.
  return sourceSchemaMtimeMs > Math.min(generatedSchemaMtimeMs, generatedIndexMtimeMs);
}

if (!shouldGeneratePrismaClient()) {
  process.exit(0);
}

console.log(
  "[ensure-prisma] Prisma client missing or stale; running pnpm db:generate…",
);

const result = spawnSync("pnpm", ["run", "db:generate"], {
  cwd: repoRoot,
  stdio: "inherit",
  shell: true,
  env: process.env,
});

process.exit(result.status ?? 1);
