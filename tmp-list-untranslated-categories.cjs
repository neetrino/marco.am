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
  const needsFix = [];
  for (const [id, trs] of byCat) {
    const en = trs.find((t) => t.locale === 'en');
    const hy = trs.find((t) => t.locale === 'hy');
    const ru = trs.find((t) => t.locale === 'ru');
    if (!en || !hy) continue;
    const armenianInEn = /[\u0530-\u058F]/.test(en.title);
    const sameAll = en.title === hy.title && (!ru || en.title === ru.title);
    if (armenianInEn || sameAll) {
      needsFix.push({ id, en: en.title, slug: en.slug, locales: trs.map((t) => t.locale) });
    }
  }
  console.log('Categories needing translation fix:', needsFix.length);
  needsFix.slice(0, 60).forEach((c) => console.log(c.slug, '|', c.en));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
