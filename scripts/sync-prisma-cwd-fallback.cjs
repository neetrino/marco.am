#!/usr/bin/env node

/**
 * Prisma's generated client sets `config.dirname` from `__dirname` only when
 * `schema.prisma` sits beside `index.js`. On Vercel, file tracing often omits
 * that file next to the resolved module, so Prisma falls back to
 * `process.cwd()/generated/prisma-client` (see shared/db/generated/.../index.js).
 * Mirror the full client (engines + schema) to that path before `next build`
 * so the fallback dirname exists and query engines resolve.
 *
 * Windows: `fs.rmSync(dest)` often hits EPERM when another Node process (e.g.
 * `pnpm run dev`) holds `query_engine-windows.dll.node`. We merge-copy from
 * `src` over `dest` instead of deleting the tree first.
 */

const fs = require("fs");
const path = require("path");

const repoRoot = path.join(__dirname, "..");
const src = path.join(repoRoot, "shared", "db", "generated", "prisma-client");
const dest = path.join(repoRoot, "generated", "prisma-client");

if (!fs.existsSync(path.join(src, "index.js"))) {
  console.warn("[sync-prisma-cwd-fallback] Skip: no client at", src);
  process.exit(0);
}

/**
 * @param {string} srcDir
 * @param {string} destDir
 */
function copyTreeOverwrite(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const from = path.join(srcDir, entry.name);
    const to = path.join(destDir, entry.name);
    if (entry.isDirectory()) {
      copyTreeOverwrite(from, to);
      continue;
    }
    try {
      fs.copyFileSync(from, to);
    } catch (err) {
      const code = err && typeof err === "object" && "code" in err ? err.code : "";
      const isEngine =
        /^query_engine.*\.(dll|exe)\.node$/i.test(entry.name) ||
        entry.name.endsWith(".node");
      if (process.platform === "win32" && (code === "EPERM" || code === "EBUSY") && isEngine) {
        console.warn(
          `[sync-prisma-cwd-fallback] Skipped locked native module "${entry.name}" under ${destDir}.`,
        );
        console.warn(
          "[sync-prisma-cwd-fallback] Stop `pnpm run dev` (or any process using that DLL) to refresh the mirrored engine.\n",
        );
        continue;
      }
      throw err;
    }
  }
}

fs.mkdirSync(path.dirname(dest), { recursive: true });

if (process.platform === "win32" && fs.existsSync(dest)) {
  copyTreeOverwrite(src, dest);
} else {
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true, force: true });
  }
  fs.cpSync(src, dest, { recursive: true });
}

console.log("[sync-prisma-cwd-fallback] Mirrored Prisma client ->", dest);
