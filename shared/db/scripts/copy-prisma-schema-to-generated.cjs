#!/usr/bin/env node

/**
 * Prisma's generated `index.js` sets `config.dirname = __dirname` only when
 * `schema.prisma` exists beside the generated client. Without it, Prisma assumes a
 * "bundled" layout and rewires `dirname` to `process.cwd()/generated/prisma-client`,
 * which is wrong for this repo (`shared/db/generated/prisma-client`). That breaks
 * Vercel (Linux) query engine resolution even when `binaryTargets` includes rhel.
 *
 * Multi-file schema: copy the main schema file and the models/ folder so Prisma
 * Studio and runtime dirname resolution stay consistent.
 */

const fs = require("fs");
const path = require("path");

const dbRoot = path.join(__dirname, "..");
const prismaDir = path.join(dbRoot, "prisma");
const destDir = path.join(dbRoot, "generated", "prisma-client");
const mainSchemaSrc = path.join(prismaDir, "schema.prisma");
const mainSchemaDest = path.join(destDir, "schema.prisma");
const modelsSrc = path.join(prismaDir, "models");
const modelsDest = path.join(destDir, "models");

if (!fs.existsSync(mainSchemaSrc)) {
  console.error(
    `[copy-prisma-schema] Missing source schema: ${mainSchemaSrc}`,
  );
  process.exit(1);
}

if (!fs.existsSync(path.join(destDir, "index.js"))) {
  console.error(
    `[copy-prisma-schema] Generated client missing; run prisma generate first. Expected: ${path.join(destDir, "index.js")}`,
  );
  process.exit(1);
}

/**
 * @param {string} srcDir
 * @param {string} destDirPath
 */
function copyTree(srcDir, destDirPath) {
  fs.mkdirSync(destDirPath, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const from = path.join(srcDir, entry.name);
    const to = path.join(destDirPath, entry.name);
    if (entry.isDirectory()) {
      copyTree(from, to);
      continue;
    }
    fs.copyFileSync(from, to);
  }
}

fs.mkdirSync(destDir, { recursive: true });
fs.copyFileSync(mainSchemaSrc, mainSchemaDest);

if (fs.existsSync(modelsSrc)) {
  if (fs.existsSync(modelsDest)) {
    fs.rmSync(modelsDest, { recursive: true, force: true });
  }
  copyTree(modelsSrc, modelsDest);
}

console.log(`[copy-prisma-schema] Copied schema -> ${mainSchemaDest}`);
