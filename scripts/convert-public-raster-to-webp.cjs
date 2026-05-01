/**
 * One-off / maintenance: converts raster images under `public/` to WebP and removes originals.
 * Run from repo root: `node scripts/convert-public-raster-to-webp.cjs`
 */
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const WEBP_QUALITY = 88;
const publicDir = path.join(__dirname, "..", "public");

/** @param {string} dir */
async function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full);
      continue;
    }
    if (!/\.(png|jpe?g)$/i.test(entry.name)) {
      continue;
    }
    const outPath = full.replace(/\.(png|jpe?g)$/i, ".webp");
    await sharp(full).webp({ quality: WEBP_QUALITY }).toFile(outPath);
    fs.unlinkSync(full);
    process.stdout.write(`OK ${path.relative(publicDir, full)} -> ${path.relative(publicDir, outPath)}\n`);
  }
}

async function main() {
  if (!fs.existsSync(publicDir)) {
    process.stderr.write(`Missing public dir: ${publicDir}\n`);
    process.exit(1);
  }
  await walk(publicDir);
}

main().catch((err) => {
  process.stderr.write(String(err) + "\n");
  process.exit(1);
});
