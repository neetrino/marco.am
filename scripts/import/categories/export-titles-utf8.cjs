const fs = require('fs');
const path = require('path');
const { loadEnvConfig } = require('@next/env');

const ROOT = path.join(__dirname, '..', '..', '..');
const CACHE_IMPORT_DIR = path.join(ROOT, '.cache', 'import');
const OUTPUT_FILE = path.join(CACHE_IMPORT_DIR, 'category-titles-needing-fix.json');

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
    const en = translations.find((t) => t.locale === 'en');
    const hy = translations.find((t) => t.locale === 'hy');
    if (!en) continue;
    const sourceTitle = hy?.title || en.title;
    const needsFix =
      /[\u0530-\u058F]/.test(en.title) || en.title.endsWith(' (import)');
    if (!needsFix) continue;
    if (!unique.has(sourceTitle)) unique.set(sourceTitle, true);
  }
  const titles = [...unique.keys()].sort((a, b) => a.localeCompare(b, 'hy'));
  fs.mkdirSync(CACHE_IMPORT_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(titles, null, 2), 'utf8');
  console.log('Wrote', titles.length, 'titles ->', OUTPUT_FILE);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
