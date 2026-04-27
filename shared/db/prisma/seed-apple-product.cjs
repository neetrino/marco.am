/**
 * Minimal seed: one published product with brand Apple only.
 * Run: cd shared/db && npm run db:seed:apple
 * Idempotent: skips if product slug `seed-demo-apple` already exists (en).
 */
const path = require("path");
const fs = require("fs");

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
loadEnv(path.join(__dirname, "../../.env"));
loadEnv(path.join(process.cwd(), ".env"));

const { PrismaClient } = require(path.join(__dirname, "..", "generated", "prisma-client"));
const prisma = new PrismaClient();

const PRODUCT_SLUG = "seed-demo-apple";
const BRAND_SLUG = "apple";
const BRAND_NAME = "Apple";

async function main() {
  const existingTr = await prisma.productTranslation.findFirst({
    where: { locale: "en", slug: PRODUCT_SLUG },
  });
  if (existingTr) {
    console.log("[seed-apple] Product already exists:", PRODUCT_SLUG);
    return;
  }

  let brand = await prisma.brand.findUnique({ where: { slug: BRAND_SLUG } });
  if (!brand) {
    brand = await prisma.brand.create({
      data: {
        slug: BRAND_SLUG,
        published: true,
        translations: {
          create: { locale: "en", name: BRAND_NAME },
        },
      },
    });
    console.log("[seed-apple] Brand created:", BRAND_SLUG);
  }

  const category = await prisma.category.findFirst({
    where: {
      published: true,
      deletedAt: null,
      translations: { some: { locale: "en", slug: "electronics" } },
    },
  });
  if (!category) {
    throw new Error(
      "[seed-apple] No category with slug `electronics` (en). Run full `npm run db:seed` once or create a category."
    );
  }

  const primaryCategoryId = category.id;
  const categoryIdsList = [primaryCategoryId];

  await prisma.product.create({
    data: {
      brandId: brand.id,
      media: [],
      published: true,
      featured: false,
      publishedAt: new Date(),
      categoryIds: categoryIdsList,
      primaryCategoryId,
      attributeIds: [],
      categories: { connect: categoryIdsList.map((id) => ({ id })) },
      translations: {
        create: {
          locale: "en",
          title: `Demo product (${BRAND_NAME})`,
          slug: PRODUCT_SLUG,
          subtitle: "Placeholder — replace when importing real catalog.",
          descriptionHtml: "<p>Seed demo product for Apple brand QA.</p>",
        },
      },
      variants: {
        create: {
          price: 9990,
          compareAtPrice: 10990,
          stock: 99,
          sku: "DEMO-APPLE",
          position: 0,
          published: true,
        },
      },
    },
  });

  console.log("[seed-apple] Created product slug:", PRODUCT_SLUG, "brand:", BRAND_SLUG);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
