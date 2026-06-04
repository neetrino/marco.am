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
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
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
  for (const r of rows) {
    if (!byCat.has(r.categoryId)) byCat.set(r.categoryId, []);
    byCat.get(r.categoryId).push({ locale: r.locale, title: r.title, slug: r.slug });
  }
  for (const [id, trs] of byCat) {
    console.log('---', id);
    trs.forEach((t) => console.log(' ', t.locale, '|', t.title, '|', t.slug));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
