const fs = require('fs');
const path = require('path');
const { loadEnvConfig } = require('@next/env');

const ROOT = path.join(__dirname, '..', '..', '..');
const CACHE_IMPORT_DIR = path.join(ROOT, '.cache', 'import');
const OUTPUT_FILE = path.join(CACHE_IMPORT_DIR, 'category-title-slugs.json');

loadEnvConfig(ROOT);

const { PrismaClient } = require(path.join(
  ROOT,
  'shared',
  'db',
  'generated',
  'prisma-client',
));
const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.categoryTranslation.findMany({
    select: { categoryId: true, locale: true, title: true, slug: true },
    orderBy: [{ categoryId: 'asc' }, { locale: 'asc' }],
  });
  const byCat = new Map();
  for (const row of rows) {
    if (!byCat.has(row.categoryId)) byCat.set(row.categoryId, []);
    byCat.get(row.categoryId).push(row);
  }
  const unique = new Map();
  for (const [, translations] of byCat) {
    const hy =
      translations.find((t) => t.locale === 'hy') ||
      translations.find((t) => t.locale === 'en');
    if (!hy) continue;
    const armenianInEn = translations.some(
      (t) => t.locale === 'en' && /[\u0530-\u058F]/.test(t.title),
    );
    if (
      !armenianInEn &&
      hy.title !== translations.find((t) => t.locale === 'en')?.title
    ) {
      continue;
    }
    if (!unique.has(hy.title)) unique.set(hy.title, hy.slug);
  }
  const payload = [...unique.entries()].sort((a, b) =>
    a[0].localeCompare(b[0], 'hy'),
  );
  fs.mkdirSync(CACHE_IMPORT_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(payload, null, 2), 'utf8');
  console.log('Wrote', payload.length, 'pairs ->', OUTPUT_FILE);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
