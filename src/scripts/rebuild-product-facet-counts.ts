import { loadEnvConfig } from '@next/env';
import { db } from '@white-shop/db';
import { rebuildProductFacetCountsFromReadModel } from '@/lib/read-model/product-read-model-sync';

loadEnvConfig(process.cwd());

const DEFAULT_BATCH_SIZE = 1_000;

function parseArgs(argv: readonly string[]): { batchSize: number } {
  const batchArg = argv.find((arg) => arg.startsWith('--batch-size='));
  const parsedBatch = Number(batchArg?.slice('--batch-size='.length));
  return {
    batchSize:
      Number.isInteger(parsedBatch) && parsedBatch > 0
        ? Math.min(parsedBatch, 5_000)
        : DEFAULT_BATCH_SIZE,
  };
}

if (require.main === module) {
  rebuildProductFacetCountsFromReadModel({
    ...parseArgs(process.argv.slice(2)),
    logProgress: (message) => process.stdout.write(`${message}\n`),
  })
    .then((result) => {
      process.stdout.write(`[product-facet-counts] complete ${JSON.stringify(result)}\n`);
    })
    .catch((error) => {
      console.error('[product-facet-counts] failed', error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await db.$disconnect();
    });
}
