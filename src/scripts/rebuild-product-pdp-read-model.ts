import { loadEnvConfig } from '@next/env';
import { db } from '@white-shop/db';
import {
  PRODUCT_PDP_READ_MODEL_DEFAULT_LOCALES,
  rebuildProductPdpReadModel,
} from '@/lib/read-model/product-pdp-read-model-sync';

loadEnvConfig(process.cwd());

const DEFAULT_BATCH_SIZE = 50;

function parseArgs(argv: readonly string[]): { locales: string[]; batchSize: number } {
  const localeArg = argv.find((arg) => arg.startsWith('--locales='));
  const batchArg = argv.find((arg) => arg.startsWith('--batch-size='));
  const locales =
    localeArg
      ?.slice('--locales='.length)
      .split(',')
      .map((locale) => locale.trim().toLowerCase())
      .filter(Boolean) ?? [...PRODUCT_PDP_READ_MODEL_DEFAULT_LOCALES];
  const parsedBatch = Number(batchArg?.slice('--batch-size='.length));
  const batchSize =
    Number.isInteger(parsedBatch) && parsedBatch > 0 ? Math.min(parsedBatch, 200) : DEFAULT_BATCH_SIZE;
  return { locales: [...new Set(locales)], batchSize };
}

if (require.main === module) {
  rebuildProductPdpReadModel({
    ...parseArgs(process.argv.slice(2)),
    logProgress: (message) => process.stdout.write(`${message}\n`),
  })
    .then((result) => {
      process.stdout.write(`[product-pdp-read-model] complete ${JSON.stringify(result)}\n`);
    })
    .catch((error) => {
      console.error('[product-pdp-read-model] failed', error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await db.$disconnect();
    });
}
