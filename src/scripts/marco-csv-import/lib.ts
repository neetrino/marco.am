/**
 * Helpers for `import-marco-csv-products.ts` (keeps entry script under file size limits).
 */

import { nanoid } from "nanoid";
import { parse } from "csv-parse/sync";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { db } from "@white-shop/db";
import { prepareRasterForR2Upload } from "@/lib/utils/prepare-raster-for-r2-upload";
import { generateSlug } from "@/app/supersudo/products/add/utils/productUtils";

export const LOCALE = "hy";
export const DEFAULT_STOCK = 0;
export const FETCH_IMAGE_TIMEOUT_MS = 60_000;
export const R2_PREFIX = "product-import/csv";

export function parseImportArgs(argv: string[]): { csvPath: string; dryRun: boolean } {
  const dryRun = argv.includes("--dry-run");
  const pathArg = argv.find((a) => !a.startsWith("-") && a.endsWith(".csv"));
  if (!pathArg) {
    throw new Error(
      'Pass the CSV file path as an argument, e.g. pnpm run import:products-csv -- "D:\\Marco - Sheet1.csv"',
    );
  }
  return { csvPath: pathArg, dryRun };
}

export function parseCsvRows(raw: string): Record<string, string>[] {
  return parse(raw, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true,
    trim: true,
  }) as Record<string, string>[];
}

export function buildR2Client(): S3Client | null {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) return null;
  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export async function uploadBufferToR2(
  client: S3Client,
  bucket: string,
  publicBase: string,
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  const base = publicBase.replace(/\/$/, "");
  return `${base}/${key.startsWith("/") ? key.slice(1) : key}`;
}

export async function fetchRemoteImage(
  url: string,
): Promise<{ buffer: Buffer; mime: string } | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_IMAGE_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "user-agent": "MarcoCsvImport/1.0" },
    });
    if (!res.ok) return null;
    const mime = res.headers.get("content-type")?.split(";")[0]?.trim() ?? "image/jpeg";
    if (!mime.startsWith("image/")) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return buf.length > 0 ? { buffer: buf, mime } : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function uploadRowImagesToR2(
  r2: S3Client,
  bucket: string,
  publicUrl: string,
  legacyId: string,
  urls: string[],
): Promise<string[]> {
  const media: string[] = [];
  for (let i = 0; i < urls.length; i += 1) {
    const downloaded = await fetchRemoteImage(urls[i]!);
    if (!downloaded) continue;
    const prepared = await prepareRasterForR2Upload(downloaded.buffer, downloaded.mime);
    const key = `${R2_PREFIX}/${legacyId}/${i}.${prepared.extension}`;
    const uploaded = await uploadBufferToR2(
      r2,
      bucket,
      publicUrl,
      key,
      prepared.buffer,
      prepared.contentType,
    );
    media.push(uploaded);
  }
  return media;
}

export function splitImageUrls(cell: string): string[] {
  return cell
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.startsWith("http://") || s.startsWith("https://"));
}

export function parseMoney(raw: string | undefined): number | undefined {
  if (raw === undefined || raw === null) return undefined;
  const t = String(raw).trim();
  if (t === "") return undefined;
  const n = Number(t.replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

export async function findOrCreateBrandId(name: string): Promise<string | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const hit = await db.brandTranslation.findFirst({
    where: {
      OR: [{ locale: "hy", name: trimmed }, { locale: "en", name: trimmed }],
      brand: { deletedAt: null },
    },
    select: { brandId: true },
  });
  if (hit) return hit.brandId;

  const slug = `import-${nanoid(12)}`;
  const brand = await db.brand.create({
    data: {
      slug,
      published: true,
      translations: {
        create: [
          { locale: "hy", name: trimmed },
          { locale: "en", name: trimmed },
        ],
      },
    },
  });
  return brand.id;
}

export async function resolveCategoryIdsFromHyPath(
  categoryCell: string,
): Promise<{ categoryIds: string[]; primaryCategoryId: string | undefined }> {
  const firstPath = categoryCell.split(",")[0]?.trim() ?? "";
  const segments = firstPath
    .split(">")
    .map((s) => s.trim())
    .filter(Boolean);
  if (segments.length === 0) {
    return { categoryIds: [], primaryCategoryId: undefined };
  }

  const ids: string[] = [];
  let parentId: string | null = null;
  let breadcrumb = "";

  for (const title of segments) {
    breadcrumb = breadcrumb ? `${breadcrumb} > ${title}` : title;
    const found = await db.categoryTranslation.findFirst({
      where: {
        locale: LOCALE,
        title,
        category: { parentId, deletedAt: null },
      },
      select: { categoryId: true },
    });

    if (found) {
      ids.push(found.categoryId);
      parentId = found.categoryId;
      continue;
    }

    const slugHy = `hy-${nanoid(10)}`;
    const slugEn = `en-${nanoid(10)}`;
    const cat = await db.category.create({
      data: {
        parentId,
        published: true,
        translations: {
          create: [
            { locale: "hy", title, slug: slugHy, fullPath: breadcrumb },
            { locale: "en", title: `${title} (import)`, slug: slugEn, fullPath: breadcrumb },
          ],
        },
      },
    });
    ids.push(cat.id);
    parentId = cat.id;
  }

  const leaf = ids[ids.length - 1];
  return { categoryIds: ids, primaryCategoryId: leaf };
}

export function productSlug(name: string, sku: string): string {
  const g = generateSlug(name).replace(/^-+|-+$/g, "");
  if (g.length > 2) return `${g}-${sku}`.slice(0, 200);
  return `product-${sku}`.slice(0, 200);
}
