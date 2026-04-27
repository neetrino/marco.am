#!/usr/bin/env node

/**
 * Runs `pnpm run db:generate` in shared/db. If it fails (e.g. Windows EPERM while
 * `next dev` holds the query engine DLL) but a previously generated client exists,
 * exit 0 so `pnpm run build` can proceed. CI/fresh clones must succeed on first generate.
 */

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const dbDir = path.join(__dirname, "../..", "shared", "db");
const generatedClientDir = path.join(dbDir, "generated", "prisma-client");
const generatedIndex = path.join(generatedClientDir, "index.js");
const windowsEngine = path.join(
  generatedClientDir,
  "query_engine-windows.dll.node",
);

/**
 * Windows: avoid `rmSync` on the whole client dir — it can delete `index.js` then fail
 * on the locked DLL, leaving a broken tree. Instead unlink only the engine + tmp files.
 * @returns {boolean} true if prisma generate should run; false if engine is locked and
 *   an existing `index.js` should be reused (skip prisma).
 */
function tryPrepareWindowsPrismaGenerate() {
  if (process.platform !== "win32") {
    return true;
  }
  if (!fs.existsSync(generatedClientDir)) {
    return true;
  }

  if (!fs.existsSync(generatedIndex)) {
    try {
      fs.rmSync(generatedClientDir, { recursive: true, force: true });
    } catch {
      /* prisma generate may still recover */
    }
    return true;
  }

  if (!fs.existsSync(windowsEngine)) {
    return true;
  }

  try {
    fs.unlinkSync(windowsEngine);
    for (const name of fs.readdirSync(generatedClientDir)) {
      if (name.includes(".tmp")) {
        try {
          fs.unlinkSync(path.join(generatedClientDir, name));
        } catch {
          /* ignore */
        }
      }
    }
    console.log(
      "[prebuild] Removed Prisma Query Engine binary so `prisma generate` can replace it.",
    );
    return true;
  } catch (err) {
    const code =
      err && typeof err === "object" && "code" in err ? String(err.code) : "";
    console.warn(
      `[prebuild] Query Engine DLL is in use (${code || err}); often another terminal runs \`pnpm run dev\`.`,
    );
    return false;
  }
}

const canRunGenerate = tryPrepareWindowsPrismaGenerate();

if (!canRunGenerate && fs.existsSync(generatedIndex)) {
  console.warn(
    "[prebuild] Skipping `prisma generate` (Query Engine DLL locked). Using existing client at shared/db/generated/prisma-client.",
  );
  console.warn(
    "[prebuild] After schema changes, stop `pnpm run dev`, then run `pnpm run db:generate` or `pnpm run build`.\n",
  );
  process.exit(0);
}

const result = spawnSync("pnpm", ["run", "db:generate"], {
  cwd: dbDir,
  stdio: "inherit",
  shell: true,
  env: process.env,
});

if (result.status === 0) {
  process.exit(0);
}

const isCiLike =
  process.env.VERCEL === "1" ||
  process.env.CI === "true" ||
  process.env.CONTINUOUS_INTEGRATION === "true";

if (isCiLike) {
  console.error(
    "\n[prebuild] prisma generate failed on CI/Vercel; refusing stale fallback (engines must match Linux build).",
  );
  process.exit(result.status ?? 1);
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
