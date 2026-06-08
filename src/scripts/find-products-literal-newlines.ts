/**
 * Legacy diagnostic — descriptionHtml was replaced by structured JSON `description`.
 * Usage: pnpm exec tsx src/scripts/find-products-literal-newlines.ts
 */

import { loadEnvConfig } from '@next/env';

function loadEnv(): void {
  loadEnvConfig(process.cwd());
}

async function main(): Promise<void> {
  loadEnv();
  process.stdout.write(
    'descriptionHtml column was removed. Use product_translations.description JSON instead.\n',
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
