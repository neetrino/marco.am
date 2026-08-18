/**
 * Canonical CSV catalog import for Marco products.
 *
 * Usage:
 *   pnpm import:products-csv -- "/path/to/marco-worksheet.csv"
 *
 * Idempotent by the source SKU. Set IMPORT_UPDATE_EXISTING=1 to update existing rows.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const {
  buildNewProductAttributeRelations,
  buildFilterColumnDefinitions,
  chooseExistingAttributeValue,
  chooseExistingFilterAttribute,
  hashText,
  mergeManagedAttributeIds,
  mergeManagedVariantAttributes,
  parseCsv,
  splitColorValues,
  syncManagedProductAttributes,
  toAsciiSlug,
  uniqueSelections,
} = require("./marco-csv-import-core.cjs");

require("@next/env").loadEnvConfig(process.cwd());

const { PrismaClient } = require(path.join(
  __dirname,
  "..",
  "shared",
  "db",
  "generated",
  "prisma-client",
));

const prisma = new PrismaClient();

const LOCALES = ["hy", "en", "ru"];

function stripDescriptionTags(value) {
  return String(value)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseDescriptionHtmlToEntries(descriptionHtml) {
  if (!descriptionHtml || !String(descriptionHtml).trim()) {
    return undefined;
  }

  const html = String(descriptionHtml).replace(/\\n/g, "\n");
  const rows = [];
  for (const line of html.split(/\n+/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const labelFirst = trimmed.match(/<strong[^>]*>([\s\S]*?)<\/strong>/i);
    if (labelFirst) {
      const title = stripDescriptionTags(labelFirst[1]);
      const value = stripDescriptionTags(trimmed.slice(labelFirst.index + labelFirst[0].length));
      if (title && value) {
        rows.push({ title, value });
      }
    }
  }

  if (rows.length > 0) {
    return rows;
  }

  const plain = stripDescriptionTags(html);
  return plain ? [{ title: "", value: plain }] : undefined;
}
const CSV_PATH =
  process.argv[2] ||
  "C:\\Users\\ROG\\Downloads\\Telegram Desktop\\Marco - Sheet1.csv";
/** Neon serverless often uses `connection_limit=1` — parallel workers exhaust the pool. */
const CONCURRENCY = Math.max(1, Number.parseInt(process.env.IMPORT_CONCURRENCY || "1", 10));
const UPDATE_EXISTING = process.env.IMPORT_UPDATE_EXISTING === "1";
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || "").trim().replace(/\/$/, "");
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const IMAGE_FETCH_TIMEOUT_MS = Math.max(
  5000,
  Number.parseInt(process.env.IMPORT_IMAGE_TIMEOUT_MS || "45000", 10)
);
const ROW_TIMEOUT_MS = Math.max(
  30000,
  Number.parseInt(process.env.IMPORT_ROW_TIMEOUT_MS || "180000", 10)
);
const SKIP_R2_UPLOAD = process.env.IMPORT_SKIP_R2 === "1";
const ALLOW_NO_PRICE = process.env.IMPORT_ALLOW_NO_PRICE === "1";
const CREATE_BRANDS = process.env.IMPORT_CREATE_BRANDS === "1";
const SKIP_CATEGORY_UPDATE_ON_EXISTING = process.env.IMPORT_SKIP_CATEGORY_UPDATE !== "0";
const r2 =
  process.env.R2_ACCOUNT_ID &&
  process.env.R2_ACCESS_KEY_ID &&
  process.env.R2_SECRET_ACCESS_KEY &&
  R2_BUCKET_NAME
    ? new S3Client({
        region: "auto",
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
        },
      })
    : null;

const attributeCache = new Map();
const attributeValueCache = new Map();
const brandCache = new Map();
const categoryCache = new Map();

function productSlug(row) {
  const id = row.ID || hashText(row.Name || Date.now());
  const tail = toAsciiSlug(row.Name, "product");
  return `marco-${id}-${tail}`.slice(0, 110).replace(/-+$/g, "");
}

function parseNumber(value) {
  if (!value) return null;
  const normalized = String(value).replace(/\s/g, "").replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseInteger(value) {
  const parsed = parseNumber(value);
  return parsed === null ? 0 : Math.max(0, Math.trunc(parsed));
}

function isDraftRow(row) {
  const draftCell = String(row.DraftStatus ?? row["Черновик"] ?? "").trim().toLowerCase();
  return draftCell === "черновик" || draftCell === "draft";
}

function resolvePublished(row) {
  return !isDraftRow(row);
}

function normalizeProductWarrantyYears(value) {
  if (value === null || value === undefined || value === "" || value === "none") {
    return null;
  }
  const numeric = typeof value === "string" ? Number.parseInt(value, 10) : value;
  if (numeric === 1 || numeric === 2 || numeric === 3) {
    return numeric;
  }
  const match = String(value).match(/(\d+)/);
  if (!match) {
    return null;
  }
  const parsed = Number.parseInt(match[1], 10);
  if (parsed === 1 || parsed === 2 || parsed === 3) {
    return parsed;
  }
  return null;
}

function inferProductClass(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "retail";
  if (
    normalized.includes("մեծածախ") ||
    normalized.includes("wholesale") ||
    normalized.includes("опт")
  ) {
    return "wholesale";
  }
  return "retail";
}

function parseImages(value) {
  if (!value) return [];
  const seen = new Set();
  const urls = String(value)
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.startsWith("http://") || item.startsWith("https://"))
    .filter((item) => {
      if (seen.has(item)) return false;
      seen.add(item);
      return true;
    });
  return urls;
}

function isR2Configured() {
  return Boolean(r2 && R2_BUCKET_NAME && R2_PUBLIC_URL);
}

function isR2Url(value) {
  return Boolean(R2_PUBLIC_URL && value && String(value).startsWith(R2_PUBLIC_URL));
}

function mimeToExt(mime) {
  switch ((mime || "").toLowerCase()) {
    case "image/jpeg":
    case "image/jpg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/gif":
      return "gif";
    case "image/webp":
      return "webp";
    case "image/svg+xml":
      return "svg";
    default:
      return "jpg";
  }
}

async function uploadBufferToR2(key, buffer, contentType) {
  if (!isR2Configured()) return null;
  await r2.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );
  return `${R2_PUBLIC_URL}/${key}`;
}

async function migrateImageToR2(sourceUrl, rowId, imageIndex) {
  if (!sourceUrl) return null;
  if (!isR2Configured()) return sourceUrl;
  if (isR2Url(sourceUrl)) return sourceUrl;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), IMAGE_FETCH_TIMEOUT_MS);
  const response = await fetch(sourceUrl, {
    signal: controller.signal,
    headers: { "user-agent": "MarcoImport/1.0" },
  }).finally(() => clearTimeout(timeout));
  if (!response.ok) {
    throw new Error(`Failed to fetch image (${response.status}) from ${sourceUrl}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const contentType = response.headers.get("content-type") || "image/jpeg";
  const ext = mimeToExt(contentType);
  const contentHash = crypto.createHash("sha1").update(buffer).digest("hex").slice(0, 12);
  const key = `products/imported/marco/${rowId}-${imageIndex + 1}-${contentHash}.${ext}`;
  const uploadedUrl = await uploadBufferToR2(key, buffer, contentType);
  if (!uploadedUrl) {
    throw new Error(`Failed to upload image to R2 for ${sourceUrl}`);
  }
  return uploadedUrl;
}

async function migrateImagesToR2(urls, rowId) {
  const results = [];
  for (let i = 0; i < urls.length; i += 1) {
    try {
      results.push(await migrateImageToR2(urls[i], rowId, i));
    } catch (error) {
      console.warn(
        `[import-marco] Image migration failed for row ${rowId}, image #${i + 1}: ${error.message}`
      );
    }
  }
  return results.filter(Boolean);
}

async function withRowTimeout(task, rowId) {
  let timer = null;
  try {
    return await Promise.race([
      task(),
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`Row timeout after ${ROW_TIMEOUT_MS}ms (ID: ${rowId})`));
        }, ROW_TIMEOUT_MS);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function splitCategoryPaths(value) {
  if (!value) return [];
  const seen = new Set();
  return String(value)
    .split(/\s*,\s*/)
    .map((pathValue) =>
      pathValue
        .split(/\s*>\s*/)
        .map((part) => part.trim())
        .filter(Boolean)
    )
    .filter((parts) => parts.length > 0)
    .filter((parts) => {
      const key = parts.join(" > ");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

async function ensureBrand(name) {
  const cleanName = String(name || "").trim();
  if (!cleanName) return null;
  const slug = toAsciiSlug(cleanName, "brand");
  if (brandCache.has(slug)) return brandCache.get(slug);

  let brand = await prisma.brand.findUnique({ where: { slug } });
  if (!brand) {
    const byTranslation = await prisma.brandTranslation.findFirst({
      where: {
        name: { equals: cleanName, mode: "insensitive" },
        brand: { deletedAt: null },
      },
      select: { brandId: true },
    });
    if (byTranslation) {
      brandCache.set(slug, byTranslation.brandId);
      return byTranslation.brandId;
    }
    if (!CREATE_BRANDS) {
      return null;
    }
    brand = await prisma.brand.create({
      data: {
        slug,
        published: true,
        translations: {
          create: LOCALES.map((locale) => ({
            locale,
            name: cleanName,
          })),
        },
      },
    });
  } else {
    await Promise.all(
      LOCALES.map((locale) =>
        prisma.brandTranslation.upsert({
          where: { brandId_locale: { brandId: brand.id, locale } },
          update: { name: cleanName },
          create: { brandId: brand.id, locale, name: cleanName },
        })
      )
    );
  }

  brandCache.set(slug, brand.id);
  return brand.id;
}

async function ensureCategoryPath(parts) {
  let parentId = null;
  const categoryIds = [];
  const slugParts = [];

  for (let i = 0; i < parts.length; i += 1) {
    const title = parts[i];
    const slug = toAsciiSlug(title, "cat");
    slugParts.push(slug);
    const fullPath = slugParts.join("/");
    const cacheKey = `${parentId || "root"}:${fullPath}`;

    if (categoryCache.has(cacheKey)) {
      const cachedId = categoryCache.get(cacheKey);
      categoryIds.push(cachedId);
      parentId = cachedId;
      continue;
    }

    let category = await prisma.category.findFirst({
      where: {
        parentId,
        translations: {
          some: {
            locale: "hy",
            fullPath,
          },
        },
      },
      select: { id: true },
    });

    if (!category) {
      category = await prisma.category.create({
        data: {
          parentId,
          position: i,
          published: true,
          translations: {
            create: LOCALES.map((locale) => ({
              locale,
              title,
              slug,
              fullPath,
            })),
          },
        },
        select: { id: true },
      });
    }

    categoryCache.set(cacheKey, category.id);
    categoryIds.push(category.id);
    parentId = category.id;
  }

  return categoryIds;
}

async function ensureCategories(categoryField) {
  const paths = splitCategoryPaths(categoryField);
  const ids = [];
  const seen = new Set();

  for (const parts of paths) {
    const pathIds = await ensureCategoryPath(parts);
    for (const id of pathIds) {
      if (!seen.has(id)) {
        seen.add(id);
        ids.push(id);
      }
    }
  }

  return ids;
}

async function ensureAttribute(key, name) {
  if (attributeCache.has(key)) return attributeCache.get(key);

  let attribute = await prisma.attribute.findUnique({ where: { key } });
  if (!attribute) {
    attribute = await prisma.attribute.create({
      data: {
        key,
        type: "select",
        filterable: true,
        translations: {
          create: LOCALES.map((locale) => ({
            locale,
            name,
          })),
        },
      },
    });
  } else {
    await Promise.all(
      LOCALES.map((locale) =>
        prisma.attributeTranslation.upsert({
          where: { attributeId_locale: { attributeId: attribute.id, locale } },
          update: { name },
          create: { attributeId: attribute.id, locale, name },
        })
      )
    );
  }

  attributeCache.set(key, attribute.id);
  return attribute.id;
}

async function resolveFilterDefinitions(definitions) {
  const resolved = [];

  for (const definition of definitions) {
    const legacyKey = `marco_filter_${definition.filterIndex}`;
    const attributes = await prisma.attribute.findMany({
      where: {
        OR: [
          { key: { in: [...new Set([definition.attributeKey, legacyKey])] } },
          {
            translations: {
              some: {
                name: { equals: definition.attributeLabel, mode: "insensitive" },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        key: true,
        translations: { select: { name: true } },
      },
    });
    const existing = chooseExistingFilterAttribute(definition, attributes);
    const attributeKey = existing?.key || definition.attributeKey;
    const attributeId = await ensureAttribute(attributeKey, definition.attributeLabel);
    resolved.push({ ...definition, attributeKey, attributeId });
  }

  return resolved;
}

async function ensureAttributeValue(attributeId, key, label) {
  const cleanLabel = String(label || "").trim();
  if (!cleanLabel) return null;
  const cacheKey = `${attributeId}:${cleanLabel.toLowerCase()}`;
  if (attributeValueCache.has(cacheKey)) return attributeValueCache.get(cacheKey);

  const matchingValues = await prisma.attributeValue.findMany({
    where: {
      attributeId,
      OR: [
        { value: { equals: cleanLabel, mode: "insensitive" } },
        {
          translations: {
            some: { label: { equals: cleanLabel, mode: "insensitive" } },
          },
        },
      ],
    },
    select: {
      id: true,
      value: true,
      translations: { select: { label: true } },
    },
  });
  let value = chooseExistingAttributeValue(matchingValues, cleanLabel);

  if (!value) {
    value = await prisma.attributeValue.create({
      data: {
        attributeId,
        value: cleanLabel,
        translations: {
          create: LOCALES.map((locale) => ({
            locale,
            label: cleanLabel,
          })),
        },
      },
      select: { id: true },
    });
  } else {
    await Promise.all(
      LOCALES.map((locale) =>
        prisma.attributeValueTranslation.upsert({
          where: {
            attributeValueId_locale: {
              attributeValueId: value.id,
              locale,
            },
          },
          update: { label: cleanLabel },
          create: {
            attributeValueId: value.id,
            locale,
            label: cleanLabel,
          },
        })
      )
    );
  }

  attributeValueCache.set(cacheKey, value.id);
  return value.id;
}

async function upsertProduct(row, index, attributeContext) {
  const { colorAttributeId, filterDefs, managedAttributeIds, managedAttributeKeys } =
    attributeContext;
  const id = row.ID;
  const title = row.Name;
  if (!id || !title) {
    return { status: "skipped", reason: "missing ID or Name" };
  }

  const skuFromSheet = String(row.SKU || row["Артикул"] || row["Արտիկուլ"] || "").trim();
  if (!skuFromSheet) {
    return { status: "skipped", reason: "missing SKU/Артикул" };
  }
  const sku = skuFromSheet;
  const published = resolvePublished(row);
  const publishedAt = published ? new Date() : null;
  const regularPrice = parseNumber(row.price);
  const salePrice = parseNumber(row["Sale price"]);
  const hasExplicitPrice = salePrice !== null || regularPrice !== null;
  const price = hasExplicitPrice ? salePrice ?? regularPrice : 0;
  if (!hasExplicitPrice && !ALLOW_NO_PRICE) {
    return { status: "skipped", reason: "no price" };
  }
  const compareAtPrice =
    hasExplicitPrice && regularPrice !== null && regularPrice > price ? regularPrice : null;
  const stock = hasExplicitPrice ? parseInteger(row.Stock) : 0;
  const media = parseImages(row.Images);
  const storedMedia = SKIP_R2_UPLOAD ? media : await migrateImagesToR2(media, id);
  const brandId = row.Brand ? await ensureBrand(row.Brand) : null;
  const categoryIds = await ensureCategories(row.Category);
  const primaryCategoryId = categoryIds[categoryIds.length - 1] || categoryIds[0] || null;
  const productClass = inferProductClass(row.Type);
  const slug = productSlug(row);
  const subtitle = row["Short description"] || undefined;
  const description = parseDescriptionHtmlToEntries(
    row.Description || row.description || row["Short description"] || undefined,
  );
  const discountPercent =
    regularPrice && compareAtPrice
      ? Math.max(0, Math.round(((regularPrice - price) / regularPrice) * 100))
      : 0;
  const warrantyYears = normalizeProductWarrantyYears(row.Warranty ?? row["Երաշխիք"]);

  /** @type {{ attributeId: string, attributeKey: string, valueId: string, value: string }[]} */
  const importedSelections = [];
  if (colorAttributeId) {
    for (const color of splitColorValues(row.Color)) {
      const valueId = await ensureAttributeValue(colorAttributeId, "color", color);
      if (valueId) {
        importedSelections.push({
          attributeId: colorAttributeId,
          attributeKey: "color",
          valueId,
          value: color,
        });
      }
    }
  }

  for (const def of filterDefs) {
    const cell = String(row[def.header] ?? "").trim();
    if (!cell) continue;
    const valueId = await ensureAttributeValue(def.attributeId, def.attributeKey, cell);
    if (!valueId) continue;
    importedSelections.push({
      attributeId: def.attributeId,
      attributeKey: def.attributeKey,
      valueId,
      value: cell,
    });
  }

  const selections = uniqueSelections(importedSelections);
  const canonicalRelations = buildNewProductAttributeRelations(selections);
  const selectedAttributeIds = canonicalRelations.attributeIds;

  const existingVariant = await prisma.productVariant.findUnique({
    where: { sku },
    select: {
      id: true,
      productId: true,
      attributes: true,
      product: { select: { attributeIds: true } },
    },
  });

  if (existingVariant) {
    if (!UPDATE_EXISTING) {
      return { status: "skipped", reason: "already imported" };
    }

    await prisma.$transaction(async (tx) => {
      const mergedAttributeIds = mergeManagedAttributeIds(
        existingVariant.product.attributeIds,
        managedAttributeIds,
        selectedAttributeIds,
      );
      const updateData = {
        brandId,
        productClass,
        media: storedMedia,
        published,
        publishedAt,
        discountPercent,
        warrantyYears,
        attributeIds: mergedAttributeIds,
      };
      if (!(UPDATE_EXISTING && SKIP_CATEGORY_UPDATE_ON_EXISTING)) {
        updateData.categoryIds = categoryIds;
        updateData.primaryCategoryId = primaryCategoryId;
        updateData.categories = { set: categoryIds.map((categoryId) => ({ id: categoryId })) };
      }
      await tx.product.update({
        where: { id: existingVariant.productId },
        data: updateData,
      });

      for (const locale of LOCALES) {
        await tx.productTranslation.upsert({
          where: {
            productId_locale: {
              productId: existingVariant.productId,
              locale,
            },
          },
          update: {
            title,
            slug,
            subtitle,
            description,
          },
          create: {
            productId: existingVariant.productId,
            locale,
            title,
            slug,
            subtitle,
            description,
          },
        });
      }

      await tx.productVariant.update({
        where: { id: existingVariant.id },
        data: {
          productClass,
          price,
          compareAtPrice,
          stock,
          imageUrl: storedMedia[0] || null,
          published,
          attributes: mergeManagedVariantAttributes(
            existingVariant.attributes,
            managedAttributeKeys,
            selections,
          ),
        },
      });

      if (managedAttributeIds.length > 0 || managedAttributeKeys.length > 0) {
        await tx.productVariantOption.deleteMany({
          where: {
            variantId: existingVariant.id,
            OR: [
              ...(managedAttributeIds.length > 0
                ? [{ attributeId: { in: managedAttributeIds } }]
                : []),
              ...(managedAttributeKeys.length > 0
                ? [{ attributeKey: { in: managedAttributeKeys } }]
                : []),
            ],
          },
        });
      }

      if (selections.length > 0) {
        await tx.productVariantOption.createMany({
          data: selections.map((selection) => ({
            variantId: existingVariant.id,
            attributeId: selection.attributeId,
            attributeKey: selection.attributeKey,
            valueId: selection.valueId,
            value: selection.value,
          })),
          skipDuplicates: true,
        });
      }

      await syncManagedProductAttributes(tx, {
        productId: existingVariant.productId,
        managedAttributeIds,
        selections,
      });
    });

    return { status: "updated" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.product.create({
      data: {
        brandId,
        skuPrefix: `MARCO-${id}`,
        media: storedMedia,
        published,
        featured: index < 24,
        publishedAt,
        categoryIds,
        primaryCategoryId,
        attributeIds: selectedAttributeIds,
        discountPercent,
        warrantyYears,
        categories:
          categoryIds.length > 0
            ? { connect: categoryIds.map((categoryId) => ({ id: categoryId })) }
            : undefined,
        translations: {
          create: LOCALES.map((locale) => ({
            locale,
            title,
            slug,
            subtitle,
            description,
          })),
        },
        productAttributes: canonicalRelations.productAttributes,
        attributeValues: canonicalRelations.attributeValues,
        variants: {
          create: {
            productClass,
            sku,
            barcode: id,
            price,
            compareAtPrice,
            stock,
            imageUrl: storedMedia[0] || undefined,
            position: 0,
            published,
            attributes:
              mergeManagedVariantAttributes(null, managedAttributeKeys, selections) ?? undefined,
            options:
              selections.length > 0
                ? {
                    create: selections.map((selection) => ({
                      attributeId: selection.attributeId,
                      attributeKey: selection.attributeKey,
                      valueId: selection.valueId,
                      value: selection.value,
                    })),
                  }
                : undefined,
          },
        },
      },
    });
  });

  return { status: "created" };
}

async function main() {
  if (!fs.existsSync(CSV_PATH)) {
    throw new Error(`CSV file not found: ${CSV_PATH}`);
  }

  const content = fs.readFileSync(CSV_PATH, "utf8");
  const rows = parseCsv(content);
  const rawFilterDefs = rows.length > 0 ? buildFilterColumnDefinitions(rows[0]) : [];
  const hasColorColumn = rows.length > 0 && Object.hasOwn(rows[0], "Color");
  const stats = {
    rows: rows.length,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  console.log(`[import-marco] Rows found: ${rows.length}`);
  console.log(`[import-marco] Filter columns (Woo Filter1…): ${rawFilterDefs.length}`);
  console.log(
    `[import-marco] Mode: ${UPDATE_EXISTING ? "update existing rows" : "skip existing rows"}, concurrency: ${CONCURRENCY}`
  );
  console.log(`[import-marco] Images: ${SKIP_R2_UPLOAD ? "keep source URLs (R2 skipped)" : "upload to R2"}`);
  console.log(`[import-marco] No-price rows: ${ALLOW_NO_PRICE ? "import as view-only (stock=0)" : "skip"}`);
  await prisma.$connect();

  console.log("[import-marco] Preparing brands, categories, and attributes...");
  const metadataStats = { brands: new Set(), categoryFields: new Set(), colors: new Set() };
  for (const row of rows) {
    if (row.Brand) metadataStats.brands.add(row.Brand.trim());
    if (row.Category) metadataStats.categoryFields.add(row.Category.trim());
    for (const color of splitColorValues(row.Color)) metadataStats.colors.add(color);
  }
  for (const brand of metadataStats.brands) {
    await ensureBrand(brand);
  }
  for (const categoryField of metadataStats.categoryFields) {
    await ensureCategories(categoryField);
  }
  const colorAttributeId = hasColorColumn ? await ensureAttribute("color", "Color") : null;
  if (colorAttributeId) {
    for (const color of metadataStats.colors) {
      await ensureAttributeValue(colorAttributeId, "color", color);
    }
  }

  const filterDefs = await resolveFilterDefinitions(rawFilterDefs);
  for (const row of rows) {
    for (const def of filterDefs) {
      const cell = String(row[def.header] ?? "").trim();
      if (cell) await ensureAttributeValue(def.attributeId, def.attributeKey, cell);
    }
  }

  const managedAttributeIds = [
    ...new Set([
      ...(colorAttributeId ? [colorAttributeId] : []),
      ...filterDefs.map((definition) => definition.attributeId),
    ]),
  ];
  const managedAttributeKeys = [
    ...new Set([
      ...(colorAttributeId ? ["color"] : []),
      ...filterDefs.map((definition) => definition.attributeKey),
    ]),
  ];
  const attributeContext = {
    colorAttributeId,
    filterDefs,
    managedAttributeIds,
    managedAttributeKeys,
  };
  console.log(
    `[import-marco] Metadata ready: ${metadataStats.brands.size} brands, ${metadataStats.categoryFields.size} category field variants, ${metadataStats.colors.size} colors, ${filterDefs.length} filter attribute definitions`
  );

  let nextIndex = 0;
  async function worker() {
    while (nextIndex < rows.length) {
      const i = nextIndex;
      nextIndex += 1;
      try {
        const result = await withRowTimeout(
          () => upsertProduct(rows[i], i, attributeContext),
          rows[i].ID || "unknown"
        );
        stats[result.status] += 1;
        const processed = stats.created + stats.updated + stats.skipped + stats.errors;
        if (processed % 100 === 0) {
          console.log(`[import-marco] Processed ${processed}/${rows.length}`);
        }
      } catch (error) {
        stats.errors += 1;
        console.error(
          `[import-marco] Row ${i + 2} failed (ID: ${rows[i].ID || "unknown"}):`,
          error.message
        );
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, rows.length) }, () => worker())
  );

  console.log("[import-marco] Done:", stats);

  if (stats.errors > 0) {
    process.exitCode = 1;
  }
}

main()
  .catch((error) => {
    console.error("[import-marco] Fatal:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
