import { loadEnvConfig } from '@next/env';
import { db } from '@white-shop/db';
import { parseProductDescriptionJson } from '../lib/products/product-description';

loadEnvConfig(process.cwd());

async function main(): Promise<void> {
  const samples = await db.productTranslation.findMany({
    take: 1,
    select: { title: true, locale: true, description: true },
  });

  const sample = samples[0];
  if (!sample?.description) {
    process.stdout.write('No descriptions found.\n');
    return;
  }

  const entries = parseProductDescriptionJson(sample.description);
  process.stdout.write(`${sample.locale} — ${sample.title}\n`);
  process.stdout.write(`${JSON.stringify(entries.slice(0, 4), null, 2)}\n`);

  const all = await db.productTranslation.findMany({ select: { description: true } });
  const count = all.filter((row) => row.description !== null).length;
  process.stdout.write(`Total with JSON description: ${count}\n`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
