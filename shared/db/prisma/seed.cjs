const path = require("path");
const fs = require("fs");

// Load .env: try project root (../.. from shared/db/prisma) then cwd
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
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

/** Root categories — slugs align with `src/components/header/categoryNavPresentation.ts` (Figma nav). */
const CATEGORIES = [
  {
    slug: "furniture-hardware",
    titles: {
      en: "Furniture manufacturing accessories",
      hy: "Կահույքի պատրաստման պարագաներ",
      ru: "Фурнитура и комплектующие для мебели",
    },
  },
  {
    slug: "furniture",
    titles: {
      en: "Furniture",
      hy: "Կահույք",
      ru: "Мебель",
    },
  },
  {
    slug: "large-appliances",
    titles: {
      en: "Large home appliances",
      hy: "Խոշոր կենցաղային տեխնիկա",
      ru: "Крупная бытовая техника",
    },
  },
  {
    slug: "kitchen-appliances",
    titles: {
      en: "Kitchen appliances",
      hy: "Խոհանոցային տեխնիկա",
      ru: "Кухонная техника",
    },
  },
  {
    slug: "audio-video",
    titles: {
      en: "Audio and video systems",
      hy: "Աուդիո և վիդեո համակարգեր",
      ru: "Аудио- и видеотехника",
    },
  },
  {
    slug: "water-dispensers",
    titles: {
      en: "Water dispensers",
      hy: "Ջրի դիսպենսերներ",
      ru: "Кулеры и диспенсеры воды",
    },
  },
  {
    slug: "home-appliances",
    titles: {
      en: "Home appliances",
      hy: "Կենցաղային տեխնիկա",
      ru: "Мелкая бытовая техника",
    },
  },
  {
    slug: "air-conditioners",
    titles: {
      en: "Air conditioners and heaters",
      hy: "Օդորակիչներ և տաքացուցիչներ",
      ru: "Кондиционеры и обогреватели",
    },
  },
];

/**
 * Child categories for mega-menu pills (Figma 242:1949). Parent slugs must exist in CATEGORIES.
 * Idempotent: skips when a child slug already exists.
 */
const SUBCATEGORIES_BY_PARENT = {
  furniture: [
    {
      slug: "furniture-soft-seating",
      titles: {
        en: "Soft furniture",
        hy: "ՓԱՓՈՒԿ ԿԱՀՈՒՅՔ",
        ru: "Мягкая мебель",
      },
    },
    {
      slug: "furniture-dining-sets",
      titles: {
        en: "Dining room collection",
        hy: "ՃԱՇԱՍԵՆՅԱԿԱՅԻՆ ՀԱՎԱՔԱԾՈՒ",
        ru: "Обеденные группы",
      },
    },
    {
      slug: "furniture-bedroom",
      titles: {
        en: "Bedroom furniture",
        hy: "ՆՆՋԱՍԵՆՅԱԿԻ ԿԱՀՈՒՅՔ",
        ru: "Мебель для спальни",
      },
    },
  ],
  "kitchen-appliances": [
    {
      slug: "kitchen-appliances-cooking",
      titles: {
        en: "Cooking appliances",
        hy: "Խոհարարական տեխնիկա",
        ru: "Техника для приготовления",
      },
    },
    {
      slug: "kitchen-appliances-food-prep",
      titles: {
        en: "Food prep",
        hy: "Մթերքի մշակում",
        ru: "Измельчение и смешивание",
      },
    },
    {
      slug: "kitchen-appliances-coffee",
      titles: {
        en: "Coffee & beverages",
        hy: "Սուրճ և ըմպելիքներ",
        ru: "Кофе и напитки",
      },
    },
  ],
};

/** Shop filter brands (Figma / product listing) */
const BRANDS = [
  { slug: "apple", name: "Apple" },
  { slug: "samsung", name: "Samsung" },
  { slug: "xiaomi", name: "Xiaomi" },
  { slug: "oneplus", name: "OnePlus" },
  { slug: "google", name: "Google" },
  { slug: "sony", name: "Sony" },
];

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function seedAdmin() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin123!";
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    const roles = Array.isArray(existing.roles) ? existing.roles : [];
    const hasAdmin = roles.includes("admin");
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        roles: hasAdmin ? roles : [...roles, "admin"],
        passwordHash: adminPassword ? await bcrypt.hash(adminPassword, 10) : existing.passwordHash,
      },
    });
    console.log("[Seed] Admin user updated:", adminEmail);
  } else {
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash: await bcrypt.hash(adminPassword, 10),
        roles: ["admin"],
        emailVerified: true,
        locale: "en",
      },
    });
    console.log("[Seed] Admin user created:", adminEmail);
  }
}

async function seedCategories() {
  const ids = [];
  for (let i = 0; i < CATEGORIES.length; i++) {
    const { slug, titles } = CATEGORIES[i];
    const existing = await prisma.category.findFirst({
      where: { translations: { some: { slug, locale: "en" } } },
    });
    if (existing) {
      ids.push(existing.id);
      continue;
    }
    const cat = await prisma.category.create({
      data: {
        position: i,
        published: true,
        media: [],
        translations: {
          create: ["en", "hy", "ru"].map((locale) => ({
            locale,
            title: titles[locale],
            slug,
            fullPath: slug,
          })),
        },
      },
    });
    ids.push(cat.id);
  }
  console.log("[Seed] Categories:", ids.length);
  return ids;
}

async function seedSubcategories() {
  for (const [parentSlug, children] of Object.entries(SUBCATEGORIES_BY_PARENT)) {
    const parent = await prisma.category.findFirst({
      where: { translations: { some: { slug: parentSlug, locale: "en" } } },
    });
    if (!parent) {
      console.warn("[Seed] Subcategories: parent not found:", parentSlug);
      continue;
    }
    for (let i = 0; i < children.length; i++) {
      const { slug, titles } = children[i];
      const existing = await prisma.category.findFirst({
        where: { translations: { some: { slug, locale: "en" } } },
      });
      if (existing) {
        continue;
      }
      await prisma.category.create({
        data: {
          parentId: parent.id,
          position: i,
          published: true,
          media: [],
          translations: {
            create: ["en", "hy", "ru"].map((locale) => ({
              locale,
              title: titles[locale],
              slug,
              fullPath: `${parentSlug}/${slug}`,
            })),
          },
        },
      });
    }
  }
  console.log("[Seed] Subcategories ensured");
}

async function seedBrands() {
  const ids = [];
  for (const { slug, name } of BRANDS) {
    let brand = await prisma.brand.findUnique({ where: { slug } });
    if (!brand) {
      brand = await prisma.brand.create({
        data: {
          slug,
          published: true,
          translations: {
            create: { locale: "en", name },
          },
        },
      });
    }
    ids.push(brand.id);
  }
  console.log("[Seed] Brands:", ids.length);
  return ids;
}

/**
 * One demo product per shop brand — idempotent (skip if slug `seed-demo-{brandSlug}` exists).
 * For QA until real catalog is imported.
 */
async function seedBrandDemoProducts(categoryIds) {
  if (!categoryIds.length) {
    console.log("[Seed] Brand demo products: skipped (no categories)");
    return;
  }
  const primaryCategoryId = categoryIds[0];
  const categoryIdsList = [primaryCategoryId];
  let created = 0;
  for (let i = 0; i < BRANDS.length; i++) {
    const { slug: brandSlug, name: brandName } = BRANDS[i];
    const productSlug = `seed-demo-${brandSlug}`;
    const existingTr = await prisma.productTranslation.findFirst({
      where: { locale: "en", slug: productSlug },
    });
    if (existingTr) {
      continue;
    }
    const brand = await prisma.brand.findUnique({ where: { slug: brandSlug } });
    if (!brand) {
      console.warn("[Seed] Brand demo: brand not found:", brandSlug);
      continue;
    }
    const title = `Demo product (${brandName})`;
    const sku = `DEMO-${brandSlug.toUpperCase().replace(/-/g, "")}`;
    const price = 9990 + i * 1000;
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
            title,
            slug: productSlug,
            subtitle: `Placeholder for ${brandName} — replace when importing real catalog.`,
            descriptionHtml: `<p>Seed demo product for brand filter QA.</p>`,
          },
        },
        variants: {
          create: {
            price,
            compareAtPrice: Math.round(price * 1.1),
            stock: 99,
            sku,
            position: 0,
            published: true,
          },
        },
      },
    });
    created += 1;
  }
  console.log("[Seed] Brand demo products (new):", created);
}

async function seedProducts(categoryIds, brandIds) {
  const titles = [
    "Wireless Earbuds", "Running Shoes", "Cotton T-Shirt", "Desk Lamp", "Yoga Mat",
    "Water Bottle", "Backpack", "Smart Watch", "Sunglasses", "Notebook Set",
    "Bluetooth Speaker", "Winter Jacket", "Canvas Sneakers", "Throw Pillow", "Dumbbells",
    "Novel - The Journey", "Leather Belt", "Phone Stand", "Coffee Mug", "Garden Seeds",
    "Hiking Boots", "Polo Shirt", "Desk Organizer", "Resistance Bands", "Cookbook",
    "Wallet", "USB Hub", "Blanket", "Jump Rope", "Short Story Collection",
    "Cap", "Keyboard", "Curtains", "Kettlebell", "Poetry Book",
    "Scarf", "Mouse Pad", "Rug", "Foam Roller", "Essay Collection",
    "Socks Pack", "Monitor Stand", "Vase", "Pull-Up Bar", "Biography",
    "Gloves", "Cable Organizer", "Cushion", "Running Belt", "Art Book",
  ];
  const created = [];
  for (let i = 0; i < 50; i++) {
    const title = titles[i] || `Product ${i + 1}`;
    const slug = `seed-${slugify(title)}-${i + 1}`;
    const catIndex = i % categoryIds.length;
    const primaryCategoryId = categoryIds[catIndex];
    const categoryIdsList = [primaryCategoryId];
    const brandId = i % 3 === 0 ? brandIds[i % brandIds.length] : null;
    const price = 1999 + (i % 50) * 500;
    const stock = 10 + (i % 91);
    const featured = i < 10;
    const product = await prisma.product.create({
      data: {
        brandId,
        media: [],
        published: true,
        featured,
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
            subtitle: `Quality ${title.toLowerCase()}`,
            descriptionHtml: `<p>Great product for everyday use. Item #${i + 1}.</p>`,
          },
        },
        variants: {
          create: {
            price,
            compareAtPrice: price * 1.2,
            stock,
            sku: `SKU-${1000 + i}`,
            position: 0,
            published: true,
          },
        },
      },
    });
    created.push(product.id);
  }
  console.log("[Seed] Products created:", created.length);
  return created;
}

async function main() {
  console.log("=== Seed start ===");
  try {
    await seedAdmin();
    const categoryIds = await seedCategories();
    await seedSubcategories();
    const brandIds = await seedBrands();
    await seedBrandDemoProducts(categoryIds);
    await seedProducts(categoryIds, brandIds);
    console.log("=== Seed done ===");
  } catch (e) {
    console.error("Seed error:", e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
