/**
 * One-off: remove all products from Postgres (Neon) and product images from R2 (`products/` prefix).
 *
 * Usage (repo root): node scripts/delete-all-products-neon-r2.cjs
 *
 * Requires .env: DATABASE_URL, and for R2: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME.
 */

const path = require("path");
const fs = require("fs");
const {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} = require("@aws-sdk/client-s3");

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

const { PrismaClient } = require(path.join(
  __dirname,
  "..",
  "shared",
  "db",
  "generated",
  "prisma-client",
));

const R2_PRODUCTS_PREFIX = "products/";

/**
 * @param {S3Client} client
 * @param {string} bucket
 * @param {string} prefix
 * @returns {Promise<number>}
 */
async function deleteR2ObjectsWithPrefix(client, bucket, prefix) {
  let continuationToken;
  let total = 0;
  for (;;) {
    const listOut = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
        MaxKeys: 1000,
      }),
    );
    const keys = (listOut.Contents ?? [])
      .map((c) => c.Key)
      .filter((k) => typeof k === "string" && k.length > 0);
    continuationToken = listOut.IsTruncated
      ? listOut.NextContinuationToken
      : undefined;

    if (keys.length > 0) {
      await client.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: {
            Objects: keys.map((Key) => ({ Key })),
            Quiet: true,
          },
        }),
      );
      total += keys.length;
    }

    if (!continuationToken) break;
  }
  return total;
}

async function main() {
  const prisma = new PrismaClient();

  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;

  try {
    const variantRows = await prisma.productVariant.findMany({
      select: { id: true },
    });
    const variantIds = variantRows.map((v) => v.id);

    if (variantIds.length > 0) {
      const cleared = await prisma.orderItem.updateMany({
        where: { variantId: { in: variantIds } },
        data: { variantId: null },
      });
      process.stdout.write(
        `Order items unlinked from variants: ${cleared.count}\n`,
      );
    }

    const result = await prisma.product.deleteMany({});
    process.stdout.write(`Neon: deleted products row count: ${result.count}\n`);

    if (
      !accountId ||
      !accessKeyId ||
      !secretAccessKey ||
      !bucketName
    ) {
      process.stdout.write(
        "R2: skipped (set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME to delete objects).\n",
      );
      return;
    }

    const r2 = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const r2Deleted = await deleteR2ObjectsWithPrefix(
      r2,
      bucketName,
      R2_PRODUCTS_PREFIX,
    );
    process.stdout.write(
      `R2: deleted object count under "${R2_PRODUCTS_PREFIX}": ${r2Deleted}\n`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
