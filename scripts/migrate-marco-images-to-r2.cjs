const path = require("path");
const crypto = require("crypto");
const { loadEnvConfig } = require("@next/env");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

loadEnvConfig(process.cwd());

const { PrismaClient } = require(path.join(
  __dirname,
  "..",
  "shared",
  "db",
  "generated",
  "prisma-client"
));

const FETCH_TIMEOUT_MS = Math.max(
  5000,
  Number.parseInt(process.env.MARCO_R2_FETCH_TIMEOUT_MS || "20000", 10)
);
const CONCURRENCY = Math.max(
  1,
  Number.parseInt(process.env.MARCO_R2_MIGRATION_CONCURRENCY || "4", 10)
);

function assertEnv(name) {
  const value = process.env[name];
  if (!value || !String(value).trim()) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return String(value).trim();
}

function isMarcoSku(sku) {
  return /^\d+$/.test(String(sku || ""));
}

function isHttpUrl(url) {
  const normalized = String(url || "").trim().toLowerCase();
  return normalized.startsWith("http://") || normalized.startsWith("https://");
}

function detectExtension(contentType, sourceUrl) {
  const fromMime = String(contentType || "").toLowerCase();
  if (fromMime.includes("image/png")) return "png";
  if (fromMime.includes("image/webp")) return "webp";
  if (fromMime.includes("image/gif")) return "gif";
  if (fromMime.includes("image/svg+xml")) return "svg";
  if (fromMime.includes("image/avif")) return "avif";

  const clean = String(sourceUrl || "").split("?")[0].split("#")[0];
  const dot = clean.lastIndexOf(".");
  if (dot > -1 && dot < clean.length - 1) {
    const ext = clean.slice(dot + 1).toLowerCase();
    if (["jpg", "jpeg", "png", "webp", "gif", "svg", "avif"].includes(ext)) {
      return ext === "jpeg" ? "jpg" : ext;
    }
  }
  return "jpg";
}

async function fetchImageBuffer(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "user-agent": "MarcoR2Migration/1.0" },
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const contentType = response.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (buffer.length === 0) {
      throw new Error("Empty image buffer");
    }
    if (!String(contentType).toLowerCase().includes("image")) {
      throw new Error(`Non-image content-type: ${contentType}`);
    }
    return { buffer, contentType };
  } finally {
    clearTimeout(timer);
  }
}

async function uploadToR2(client, bucket, publicUrl, variantSku, sourceUrl) {
  const { buffer, contentType } = await fetchImageBuffer(sourceUrl);
  const ext = detectExtension(contentType, sourceUrl);
  const hash = crypto.createHash("sha1").update(buffer).digest("hex").slice(0, 12);
  const key = `products/imported/marco/${variantSku}-${hash}.${ext}`;

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  return `${publicUrl.replace(/\/$/, "")}/${key}`;
}

async function main() {
  const accountId = assertEnv("R2_ACCOUNT_ID");
  const accessKeyId = assertEnv("R2_ACCESS_KEY_ID");
  const secretAccessKey = assertEnv("R2_SECRET_ACCESS_KEY");
  const bucket = assertEnv("R2_BUCKET_NAME");
  const publicUrl = assertEnv("R2_PUBLIC_URL");

  const r2 = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  const prisma = new PrismaClient();
  try {
    const variants = await prisma.productVariant.findMany({
      where: {
        imageUrl: { not: null },
      },
      select: {
        id: true,
        sku: true,
        imageUrl: true,
        productId: true,
      },
    });

    const queue = variants.filter((v) => {
      const sku = String(v.sku || "").trim();
      const imageUrl = String(v.imageUrl || "").trim();
      if (!isMarcoSku(sku)) return false;
      if (!isHttpUrl(imageUrl)) return false;
      return !imageUrl.startsWith(publicUrl);
    });

    console.log(`[marco-r2] candidates: ${queue.length}, concurrency: ${CONCURRENCY}`);
    if (queue.length === 0) {
      console.log("[marco-r2] Nothing to migrate.");
      return;
    }

    const stats = { ok: 0, failed: 0 };
    let index = 0;

    async function worker() {
      while (true) {
        const i = index;
        index += 1;
        if (i >= queue.length) return;

        const item = queue[i];
        const sku = String(item.sku || "").trim();
        const sourceUrl = String(item.imageUrl || "").trim();

        try {
          const r2Url = await uploadToR2(r2, bucket, publicUrl, sku, sourceUrl);
          await prisma.$transaction(async (tx) => {
            await tx.productVariant.update({
              where: { id: item.id },
              data: { imageUrl: r2Url },
            });

            const product = await tx.product.findUnique({
              where: { id: item.productId },
              select: { media: true },
            });
            const media = Array.isArray(product?.media) ? product.media : [];
            const patched = media.map((m) => (m === sourceUrl ? r2Url : m));
            if (JSON.stringify(patched) !== JSON.stringify(media)) {
              await tx.product.update({
                where: { id: item.productId },
                data: { media: patched },
              });
            }
          });

          stats.ok += 1;
          if (stats.ok % 50 === 0) {
            console.log(`[marco-r2] migrated ${stats.ok}/${queue.length}`);
          }
        } catch (error) {
          stats.failed += 1;
          console.error(`[marco-r2] fail sku=${sku} url=${sourceUrl}: ${error.message}`);
        }
      }
    }

    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, () => worker()));
    console.log("[marco-r2] done", stats);
    if (stats.failed > 0) {
      process.exitCode = 1;
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("[marco-r2] fatal", error);
  process.exitCode = 1;
});
