const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { loadEnvConfig } = require("@next/env");
const { S3Client, HeadObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");

loadEnvConfig(process.cwd());

const REPO_ROOT = process.cwd();
const SRC_DIR = path.join(REPO_ROOT, "src");
const PUBLIC_DIR = path.join(REPO_ROOT, "public");
const REPORT_DIR = path.join(REPO_ROOT, "docs", "reports");
const REPORT_PATH = path.join(REPORT_DIR, "used-public-assets-r2-upload.json");
const KEY_PREFIX = "static-site";

const SOURCE_CODE_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".css",
  ".json",
]);

const ASSET_EXTENSION_REGEX = /\.(png|jpe?g|webp|gif|avif|svg|ico)$/i;

function assertEnv(name) {
  const value = process.env[name];
  if (!value || !String(value).trim()) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return String(value).trim();
}

function walkFiles(rootDir) {
  const out = [];
  const stack = [rootDir];
  while (stack.length > 0) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }
      const ext = path.extname(entry.name).toLowerCase();
      if (SOURCE_CODE_EXTENSIONS.has(ext)) {
        out.push(fullPath);
      }
    }
  }
  return out;
}

function toPublicRelative(assetPath) {
  const normalized = assetPath.replace(/\\/g, "/");
  if (!normalized.startsWith("/")) {
    return null;
  }
  if (normalized.startsWith("/icons/")) {
    return null;
  }
  if (!ASSET_EXTENSION_REGEX.test(normalized)) {
    return null;
  }
  return normalized.slice(1);
}

function collectUsedNonIconAssets() {
  const sourceFiles = walkFiles(SRC_DIR);
  const matches = new Set();
  const pattern =
    /["'`](\/(?:assets|images|profile|brand|flags)[^"'`]*\.(?:png|jpe?g|webp|gif|avif|svg|ico))["'`]/g;

  for (const filePath of sourceFiles) {
    const text = fs.readFileSync(filePath, "utf8");
    let match = pattern.exec(text);
    while (match) {
      const publicRelative = toPublicRelative(match[1]);
      if (publicRelative) {
        matches.add(publicRelative);
      }
      match = pattern.exec(text);
    }
  }

  return Array.from(matches).sort((a, b) => a.localeCompare(b));
}

function contentTypeFromExt(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".avif":
      return "image/avif";
    case ".svg":
      return "image/svg+xml";
    case ".ico":
      return "image/x-icon";
    default:
      return "application/octet-stream";
  }
}

function sha1Hex(buffer) {
  return crypto.createHash("sha1").update(buffer).digest("hex");
}

async function objectNeedsUpload(client, bucket, key, checksum) {
  try {
    const response = await client.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );
    const existing = String(response.Metadata?.checksum || "");
    return existing !== checksum;
  } catch {
    return true;
  }
}

async function main() {
  const accountId = assertEnv("R2_ACCOUNT_ID");
  const accessKeyId = assertEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey = assertEnv("R2_SECRET_ACCESS_KEY");
  const bucket = assertEnv("R2_BUCKET_NAME");
  const publicUrl = assertEnv("R2_PUBLIC_URL").replace(/\/$/, "");

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  const usedAssets = collectUsedNonIconAssets();
  if (usedAssets.length === 0) {
    console.log("[assets-r2] no used non-icon assets found");
    return;
  }

  const report = {
    generatedAt: new Date().toISOString(),
    bucket,
    publicBaseUrl: publicUrl,
    keyPrefix: KEY_PREFIX,
    uploaded: [],
    skipped: [],
    missingLocally: [],
  };

  for (const publicRelative of usedAssets) {
    const fullPath = path.join(PUBLIC_DIR, publicRelative);
    if (!fs.existsSync(fullPath)) {
      report.missingLocally.push(publicRelative);
      continue;
    }

    const key = `${KEY_PREFIX}/${publicRelative.replace(/\\/g, "/")}`;
    const fileBuffer = fs.readFileSync(fullPath);
    const checksum = sha1Hex(fileBuffer);
    const needsUpload = await objectNeedsUpload(client, bucket, key, checksum);

    if (!needsUpload) {
      report.skipped.push({
        local: publicRelative,
        key,
        url: `${publicUrl}/${key}`,
      });
      continue;
    }

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: fileBuffer,
        ContentType: contentTypeFromExt(fullPath),
        CacheControl: "public, max-age=31536000, immutable",
        Metadata: { checksum },
      }),
    );

    report.uploaded.push({
      local: publicRelative,
      key,
      url: `${publicUrl}/${key}`,
    });
  }

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), "utf8");

  console.log(`[assets-r2] uploaded: ${report.uploaded.length}`);
  console.log(`[assets-r2] skipped: ${report.skipped.length}`);
  console.log(`[assets-r2] missing: ${report.missingLocally.length}`);
  console.log(`[assets-r2] report: ${path.relative(REPO_ROOT, REPORT_PATH)}`);
}

main().catch((error) => {
  console.error("[assets-r2] fatal", error);
  process.exitCode = 1;
});
