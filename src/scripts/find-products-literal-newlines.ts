/**
 * Find products whose descriptionHtml contains legacy literal \\n or /n sequences.
 * Usage: pnpm exec tsx src/scripts/find-products-literal-newlines.ts
 */

import { loadEnvConfig } from "@next/env";
import { db } from "@white-shop/db";

function loadEnv(): void {
  loadEnvConfig(process.cwd());
}

async function main(): Promise<void> {
  loadEnv();

  const translations = await db.productTranslation.findMany({
    where: {
      locale: "hy",
      OR: [{ descriptionHtml: { contains: "\\n" } }, { descriptionHtml: { contains: "/n" } }],
    },
    select: {
      title: true,
      slug: true,
      productId: true,
    },
  });

  process.stdout.write(
    [
      `Հայերեն description-ով product-ներ literal \\n / /n-ով: ${translations.length}`,
      "",
      "Օրինակներ (առաջին 20):",
      ...translations
        .slice(0, 20)
        .map((row) => `- ${row.title} (${row.slug})`),
    ].join("\n") + "\n",
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
