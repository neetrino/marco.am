const path = require('path');
const { loadEnvConfig } = require('@next/env');

const ROOT = path.join(__dirname, '..', '..', '..');

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
  const needsFix = [];
  for (const [id, translations] of byCat) {
    const en = translations.find((t) => t.locale === 'en');
    const hy = translations.find((t) => t.locale === 'hy');
    const ru = translations.find((t) => t.locale === 'ru');
    if (!en || !hy) continue;
    const armenianInEn = /[\u0530-\u058F]/.test(en.title);
    const sameAll =
      en.title === hy.title && (!ru || en.title === ru.title);
    if (armenianInEn || sameAll) {
      needsFix.push({
        id,
        en: en.title,
        slug: en.slug,
        locales: translations.map((t) => t.locale),
      });
    }
  }
  console.log('Categories needing translation fix:', needsFix.length);
  needsFix.slice(0, 60).forEach((category) => {
    console.log(category.slug, '|', category.en);
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
