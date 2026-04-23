/**
 * One-off CSV catalog import for Marco products.
 *
 * Usage:
 *   node scripts/import-marco-csv-products.cjs "C:\Users\ROG\Downloads\Telegram Desktop\Marco - Worksheet (1).csv"
 *
 * Idempotent by variant SKU: MARCO-{CSV ID}. Re-running updates imported rows.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

require("@next/env").loadEnvConfig(process.cwd());

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const LOCALES = ["hy", "en", "ru"];
const CSV_PATH =
  process.argv[2] ||
  "C:\\Users\\ROG\\Downloads\\Telegram Desktop\\Marco - Worksheet (1).csv";
const CONCURRENCY = Math.max(1, Number.parseInt(process.env.IMPORT_CONCURRENCY || "8", 10));
const UPDATE_EXISTING = process.env.IMPORT_UPDATE_EXISTING === "1";

const attributeCache = new Map();
const attributeValueCache = new Map();
const brandCache = new Map();
const categoryCache = new Map();

function parseCsv(content) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    const next = content[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(field);
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((value) => value.trim() !== "")) rows.push(row);
  }

  if (rows.length === 0) return [];
  const headers = rows[0].map((header) => header.trim());
  return rows.slice(1).map((values) => {
    const record = {};
    headers.forEach((header, index) => {
      record[header] = (values[index] || "").trim();
    });
    return record;
  });
}

function hashText(value, length = 10) {
  return crypto.createHash("sha1").update(String(value)).digest("hex").slice(0, length);
}

function toAsciiSlug(value, fallbackPrefix) {
  const slug = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  if (slug) return slug;
  return `${fallbackPrefix}-${hashText(value)}`;
}

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

async function ensureAttributeValue(attributeId, key, label) {
  const cleanLabel = String(label || "").trim();
  if (!cleanLabel) return null;
  const cacheKey = `${attributeId}:${cleanLabel.toLowerCase()}`;
  if (attributeValueCache.has(cacheKey)) return attributeValueCache.get(cacheKey);

  let value = await prisma.attributeValue.findFirst({
    where: { attributeId, value: cleanLabel },
    select: { id: true },
  });

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

async function upsertProduct(row, index) {
  const id = row.ID;
  const title = row.Name;
  if (!id || !title) {
    return { status: "skipped", reason: "missing ID or Name" };
  }

  const sku = `MARCO-${id}`;
  const price = parseNumber(row["Sale price"]) ?? parseNumber(row.price) ?? 0;
  const regularPrice = parseNumber(row.price);
  const compareAtPrice =
    regularPrice !== null && regularPrice > price ? regularPrice : null;
  const stock = parseInteger(row.Stock);
  const media = parseImages(row.Images);
  const brandId = await ensureBrand(row.Brand);
  const categoryIds = await ensureCategories(row.Category);
  const primaryCategoryId = categoryIds[categoryIds.length - 1] || categoryIds[0] || null;
  const slug = productSlug(row);
  const subtitle = row["Short description"] || undefined;
  const descriptionHtml = row.description || row["Short description"] || undefined;
  const color = String(row.Color || "").trim();
  const discountPercent =
    regularPrice && compareAtPrice
      ? Math.max(0, Math.round(((regularPrice - price) / regularPrice) * 100))
      : 0;

  let colorAttributeId = null;
  let colorValueId = null;
  if (color) {
    colorAttributeId = await ensureAttribute("color", "Color");
    colorValueId = await ensureAttributeValue(colorAttributeId, "color", color);
  }

  const existingVariant = await prisma.productVariant.findUnique({
    where: { sku },
    select: { id: true, productId: true },
  });

  if (existingVariant) {
    if (!UPDATE_EXISTING) {
      return { status: "skipped", reason: "already imported" };
    }

    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: existingVariant.productId },
        data: {
          brandId,
          media,
          published: true,
          publishedAt: new Date(),
          categoryIds,
          primaryCategoryId,
          attributeIds: colorAttributeId ? [colorAttributeId] : [],
          discountPercent,
          categories: { set: categoryIds.map((categoryId) => ({ id: categoryId })) },
        },
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
            descriptionHtml,
          },
          create: {
            productId: existingVariant.productId,
            locale,
            title,
            slug,
            subtitle,
            descriptionHtml,
          },
        });
      }

      await tx.productVariant.update({
        where: { id: existingVariant.id },
        data: {
          price,
          compareAtPrice,
          stock,
          imageUrl: media[0] || null,
          published: true,
          attributes:
            color && colorValueId
              ? {
                  color: [{ valueId: colorValueId, value: color, attributeKey: "color" }],
                }
              : null,
        },
      });

      await tx.productVariantOption.deleteMany({
        where: { variantId: existingVariant.id },
      });

      if (color && colorValueId) {
        await tx.productVariantOption.create({
          data: {
            variantId: existingVariant.id,
            attributeId: colorAttributeId,
            attributeKey: "color",
            valueId: colorValueId,
            value: color,
          },
        });
      }

      await tx.productAttribute.deleteMany({
        where: { productId: existingVariant.productId },
      });

      if (colorAttributeId) {
        await tx.productAttribute.create({
          data: {
            productId: existingVariant.productId,
            attributeId: colorAttributeId,
          },
        });
      }
    });

    return { status: "updated" };
  }

  await prisma.product.create({
    data: {
      brandId,
      skuPrefix: `MARCO-${id}`,
      media,
      published: true,
      featured: index < 24,
      publishedAt: new Date(),
      categoryIds,
      primaryCategoryId,
      attributeIds: colorAttributeId ? [colorAttributeId] : [],
      discountPercent,
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
          descriptionHtml,
        })),
      },
      productAttributes: colorAttributeId
        ? {
            create: {
              attributeId: colorAttributeId,
            },
          }
        : undefined,
      variants: {
        create: {
          productClass: "retail",
          sku,
          barcode: id,
          price,
          compareAtPrice,
          stock,
          imageUrl: media[0] || undefined,
          position: 0,
          published: true,
          attributes:
            color && colorValueId
              ? {
                  color: [{ valueId: colorValueId, value: color, attributeKey: "color" }],
                }
              : undefined,
          options:
            color && colorValueId
              ? {
                  create: {
                    attributeId: colorAttributeId,
                    attributeKey: "color",
                    valueId: colorValueId,
                    value: color,
                  },
                }
              : undefined,
        },
      },
    },
  });

  return { status: "created" };
}

async function main() {
  if (!fs.existsSync(CSV_PATH)) {
    throw new Error(`CSV file not found: ${CSV_PATH}`);
  }

  const content = fs.readFileSync(CSV_PATH, "utf8");
  const rows = parseCsv(content);
  const stats = {
    rows: rows.length,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: 0,
  };

  console.log(`[import-marco] Rows found: ${rows.length}`);
  console.log(
    `[import-marco] Mode: ${UPDATE_EXISTING ? "update existing rows" : "skip existing rows"}, concurrency: ${CONCURRENCY}`
  );
  await prisma.$connect();

  console.log("[import-marco] Preparing brands, categories, and attributes...");
  const metadataStats = { brands: new Set(), categoryFields: new Set(), colors: new Set() };
  for (const row of rows) {
    if (row.Brand) metadataStats.brands.add(row.Brand.trim());
    if (row.Category) metadataStats.categoryFields.add(row.Category.trim());
    if (row.Color) metadataStats.colors.add(row.Color.trim());
  }
  for (const brand of metadataStats.brands) {
    await ensureBrand(brand);
  }
  for (const categoryField of metadataStats.categoryFields) {
    await ensureCategories(categoryField);
  }
  if (metadataStats.colors.size > 0) {
    const colorAttributeId = await ensureAttribute("color", "Color");
    for (const color of metadataStats.colors) {
      await ensureAttributeValue(colorAttributeId, "color", color);
    }
  }
  console.log(
    `[import-marco] Metadata ready: ${metadataStats.brands.size} brands, ${metadataStats.categoryFields.size} category field variants, ${metadataStats.colors.size} colors`
  );

  let nextIndex = 0;
  async function worker() {
    while (nextIndex < rows.length) {
      const i = nextIndex;
      nextIndex += 1;
      try {
        const result = await upsertProduct(rows[i], i);
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

  /*
  for (let i = 0; i < rows.length; i += 1) {
    try {
      const result = await upsertProduct(rows[i], i);
      stats[result.status] += 1;
      if ((i + 1) % 100 === 0) {
        console.log(`[import-marco] Processed ${i + 1}/${rows.length}`);
      }
    } catch (error) {
      stats.errors += 1;
      console.error(
        `[import-marco] Row ${i + 2} failed (ID: ${rows[i].ID || "unknown"}):`,
        error.message
      );
    }
  }
  */

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
