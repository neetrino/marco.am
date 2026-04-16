/**
 * One-off: insert 40 demo products into Neon (uses DATABASE_URL from .env).
 * Run from repo root: node shared/db/prisma/add-40-products.cjs
 * Idempotent: skips slugs seed-batch2-01 … seed-batch2-40 if they already exist.
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

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const PRODUCT_COUNT = 40;
const SLUG_PREFIX = "seed-batch2-";

const TITLES = [
  "Ceramic Bowl", "Stainless Pan", "Cutting Board", "Chef Knife", "Tea Kettle",
  "Espresso Maker", "Air Fryer", "Stand Mixer", "Food Processor", "Blender",
  "Vacuum Flask", "Lunch Box", "Ice Tray", "Measuring Cups", "Oven Mitts",
  "Apron", "Dish Rack", "Salad Spinner", "Grater", "Peeler Set",
  "Wine Glasses", "Champagne Flutes", "Carafe", "Coasters", "Table Runner",
  "Napkin Rings", "Candle Holder", "Picture Frame", "Wall Clock", "Desk Calendar",
  "Sticky Notes", "Highlighter Pack", "Binder Clips", "Stapler", "Paper Shredder",
  "Desk Lamp LED", "Webcam HD", "Headset Wireless", "HDMI Cable", "USB-C Hub Pro",
];

function seedProductImageUrl(index) {
  return `https://picsum.photos/seed/marco-batch2-${index}/640/640`;
}

async function main() {
  const categories = await prisma.category.findMany({
    where: { deletedAt: null, published: true },
    select: { id: true },
    orderBy: { position: "asc" },
    take: 20,
  });
  if (categories.length === 0) {
    console.error("[add-40] No published categories. Run: pnpm db:seed");
    process.exitCode = 1;
    return;
  }
  const categoryIds = categories.map((c) => c.id);

  const brands = await prisma.brand.findMany({
    where: { deletedAt: null, published: true },
    select: { id: true },
    take: 10,
  });
  const brandIds = brands.map((b) => b.id);

  let created = 0;
  let skipped = 0;

  for (let i = 0; i < PRODUCT_COUNT; i++) {
    const num = String(i + 1).padStart(2, "0");
    const slug = `${SLUG_PREFIX}${num}`;
    const exists = await prisma.productTranslation.findFirst({
      where: { locale: "en", slug },
      select: { id: true },
    });
    if (exists) {
      skipped += 1;
      continue;
    }

    const title = TITLES[i] || `Demo Product ${i + 1}`;
    const catIndex = i % categoryIds.length;
    const primaryCategoryId = categoryIds[catIndex];
    const categoryIdsList = [primaryCategoryId];
    const brandId = brandIds.length > 0 && i % 3 === 0 ? brandIds[i % brandIds.length] : null;
    const price = 2499 + (i % 40) * 400;
    const stock = 15 + (i % 85);
    const featured = i < 8;

    await prisma.product.create({
      data: {
        brandId,
        media: [seedProductImageUrl(i)],
        published: true,
        featured,
        discountPercent: i < 5 && featured ? 8 + (i % 4) : 0,
        publishedAt: new Date(),
        categoryIds: categoryIdsList,
        primaryCategoryId,
        attributeIds: [],
        categories: { connect: categoryIdsList.map((id) => ({ id })) },
        translations: {
          create: {
            locale: "en",
            title,
            slug,
            subtitle: `Hand-picked ${title.toLowerCase()}`,
            descriptionHtml: `<p>Demo catalog item batch 2, #${i + 1}.</p>`,
          },
        },
        variants: {
          create: {
            price,
            compareAtPrice: price * 1.15,
            stock,
            sku: `SKU-B2-${2000 + i}`,
            position: 0,
            published: true,
          },
        },
      },
    });
    created += 1;
  }

  console.log(`[add-40] Created: ${created}, skipped (already present): ${skipped}`);
}

main()
  .catch((e) => {
    console.error("[add-40] Error:", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
