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
    where: {
      OR: [
        { title: { contains: 'Կահույք' } },
        { title: { contains: 'Տեխնիկա' } },
        { title: { contains: 'ինտերիեր' } },
      ],
    },
    include: { category: { select: { id: true, parentId: true } } },
    orderBy: [{ categoryId: 'asc' }, { locale: 'asc' }],
  });
  const byCat = new Map();
  for (const row of rows) {
    if (!byCat.has(row.categoryId)) byCat.set(row.categoryId, []);
    byCat.get(row.categoryId).push({
      locale: row.locale,
      title: row.title,
      slug: row.slug,
    });
  }
  for (const [id, translations] of byCat) {
    console.log('---', id);
    translations.forEach((translation) => {
      console.log(' ', translation.locale, '|', translation.title, '|', translation.slug);
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
