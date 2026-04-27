#!/usr/bin/env node

/**
 * Fails the build if the custom-output Prisma client is missing the Linux/Vercel
 * query engine or the copied schema (required for correct `config.dirname`).
 */

const fs = require("fs");
const path = require("path");

const repoRoot = path.join(__dirname, "..");
const clientDir = path.join(
  repoRoot,
  "shared",
  "db",
  "generated",
  "prisma-client",
);
const rhelEngine = path.join(
  clientDir,
  "libquery_engine-rhel-openssl-3.0.x.so.node",
);
const schemaCopy = path.join(clientDir, "schema.prisma");

const errors = [];
if (!fs.existsSync(path.join(clientDir, "index.js"))) {
  errors.push(`Missing generated client: ${clientDir}`);
}
if (!fs.existsSync(rhelEngine)) {
  errors.push(
    `Missing Vercel/Linux query engine (run prisma generate with binaryTargets rhel-openssl-3.0.x): ${rhelEngine}`,
  );
}
if (!fs.existsSync(schemaCopy)) {
  errors.push(
    `Missing schema.prisma next to generated client (post-generate copy failed): ${schemaCopy}`,
  );
}

if (errors.length) {
  console.error("[verify-prisma-engine]\n", errors.join("\n"));
  process.exit(1);
}

console.log("[verify-prisma-engine] OK:", clientDir);
