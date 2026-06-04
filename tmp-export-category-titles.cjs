const path = require('path');
const fs = require('fs');

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  fs.readFileSync(filePath, 'utf8').split('\n').forEach((line) => {
    const t = line.trim();
    if (t && !t.startsWith('#')) {
      const eq = t.indexOf('=');
      if (eq > 0) {
        const key = t.slice(0, eq).trim();
        let val = t.slice(eq + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  });
}
loadEnv(path.join(__dirname, '.env'));

const { PrismaClient } = require(path.join(__dirname, 'shared/db/generated/prisma-client'));
const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.categoryTranslation.findMany({
    select: { categoryId: true, locale: true, title: true, slug: true },
    orderBy: [{ categoryId: 'asc' }, { locale: 'asc' }],
  });
  const byCat = new Map();
  for (const r of rows) {
    if (!byCat.has(r.categoryId)) byCat.set(r.categoryId, []);
    byCat.get(r.categoryId).push(r);
  }
  const unique = new Map();
  for (const [, trs] of byCat) {
    const hy = trs.find((t) => t.locale === 'hy') || trs.find((t) => t.locale === 'en');
    if (!hy) continue;
    const armenianInEn = trs.some((t) => t.locale === 'en' && /[\u0530-\u058F]/.test(t.title));
    if (!armenianInEn && hy.title !== trs.find((t) => t.locale === 'en')?.title) continue;
    if (!unique.has(hy.title)) unique.set(hy.title, hy.slug);
  }
  console.log(JSON.stringify([...unique.entries()].sort((a, b) => a[0].localeCompare(b[0], 'hy')), null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
