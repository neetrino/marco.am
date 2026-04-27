#!/usr/bin/env node

/**
 * Prisma's generated client sets `config.dirname` from `__dirname` only when
 * `schema.prisma` sits beside `index.js`. On Vercel, file tracing often omits
 * that file next to the resolved module, so Prisma falls back to
 * `process.cwd()/generated/prisma-client` (see shared/db/generated/.../index.js).
 * Mirror the full client (engines + schema) to that path before `next build`
 * so the fallback dirname exists and query engines resolve.
 */

const fs = require("fs");
const path = require("path");

const repoRoot = path.join(__dirname, "..");
const src = path.join(repoRoot, "shared", "db", "generated", "prisma-client");
const dest = path.join(repoRoot, "generated", "prisma-client");

if (!fs.existsSync(path.join(src, "index.js"))) {
  console.warn(
    "[sync-prisma-cwd-fallback] Skip: no client at",
    src,
  );
  process.exit(0);
}

fs.mkdirSync(path.dirname(dest), { recursive: true });
if (fs.existsSync(dest)) {
  fs.rmSync(dest, { recursive: true, force: true });
}
fs.cpSync(src, dest, { recursive: true });
console.log("[sync-prisma-cwd-fallback] Mirrored Prisma client ->", dest);
