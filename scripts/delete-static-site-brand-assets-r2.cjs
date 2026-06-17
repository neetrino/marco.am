/**
 * One-off: delete legacy bundled brand logos from R2 under `static-site/assets/brands/`.
 * Canonical logos live in `brands/logos/*.webp` (see brand-logo-storage).
 *
 * Usage:
 *   node scripts/delete-static-site-brand-assets-r2.cjs           # dry-run (list only)
 *   node scripts/delete-static-site-brand-assets-r2.cjs --apply   # delete objects
 *
 * Requires .env: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME.
 */

const path = require("path");
const fs = require("fs");
const {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} = require("@aws-sdk/client-s3");

const STATIC_SITE_BRANDS_PREFIX = "static-site/assets/brands/";

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  content.split("\n").forEach((line) => {
    const t = line.trim();
    if (t && !t.startsWith("#")) {
      const eq = t.indexOf("=");
      if (eq > 0) {
        const key = t.slice(0, eq).trim();
        let val = t.slice(eq + 1).trim();
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
        process.env[key] = val;
      }
    }
  });
}

loadEnv(path.join(__dirname, "..", ".env"));
loadEnv(path.join(process.cwd(), ".env"));

/**
 * @param {S3Client} client
 * @param {string} bucket
 * @param {string} prefix
 * @returns {Promise<string[]>}
 */
async function listR2KeysWithPrefix(client, bucket, prefix) {
  const keys = [];
  let continuationToken;

  for (;;) {
    const listOut = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
        MaxKeys: 1000,
      }),
    );

    for (const item of listOut.Contents ?? []) {
      if (typeof item.Key === "string" && item.Key.length > 0) {
        keys.push(item.Key);
      }
    }

    if (!listOut.IsTruncated) break;
    continuationToken = listOut.NextContinuationToken;
  }

  return keys;
}

/**
 * @param {S3Client} client
 * @param {string} bucket
 * @param {string[]} keys
 * @returns {Promise<number>}
 */
async function deleteR2Keys(client, bucket, keys) {
  let deleted = 0;

  for (let i = 0; i < keys.length; i += 1000) {
    const chunk = keys.slice(i, i + 1000);
    await client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: {
          Objects: chunk.map((Key) => ({ Key })),
          Quiet: true,
        },
      }),
    );
    deleted += chunk.length;
  }

  return deleted;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const accountId = process.env.R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucketName = process.env.R2_BUCKET_NAME?.trim();

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    throw new Error(
      "R2 credentials missing — set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME",
    );
  }

  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  const keys = await listR2KeysWithPrefix(
    client,
    bucketName,
    STATIC_SITE_BRANDS_PREFIX,
  );

  process.stdout.write(
    `[static-site-brands] mode: ${apply ? "APPLY" : "DRY-RUN"}\n`,
  );
  process.stdout.write(
    `[static-site-brands] prefix: ${STATIC_SITE_BRANDS_PREFIX}\n`,
  );
  process.stdout.write(`[static-site-brands] objects found: ${keys.length}\n`);

  if (keys.length > 0 && keys.length <= 20) {
    for (const key of keys) {
      process.stdout.write(`  - ${key}\n`);
    }
  } else if (keys.length > 20) {
    for (const key of keys.slice(0, 5)) {
      process.stdout.write(`  - ${key}\n`);
    }
    process.stdout.write(`  ... and ${keys.length - 5} more\n`);
  }

  if (!apply) {
    process.stdout.write(
      "[static-site-brands] dry-run complete — pass --apply to delete\n",
    );
    return;
  }

  if (keys.length === 0) {
    process.stdout.write("[static-site-brands] nothing to delete\n");
    return;
  }

  const deleted = await deleteR2Keys(client, bucketName, keys);
  process.stdout.write(`[static-site-brands] deleted: ${deleted}\n`);
}

main().catch((err) => {
  console.error("[static-site-brands] fatal", err);
  process.exit(1);
});
