/**
 * Audit product brand assignments.
 * Usage: pnpm exec tsx src/scripts/audit-product-brands.ts
 */

import { loadEnvConfig } from "@next/env";
import { db } from "@white-shop/db";

function loadEnv(): void {
  loadEnvConfig(process.cwd());
}

async function main(): Promise<void> {
  loadEnv();

  const [total, withBrand, withoutBrand, brandCount] = await Promise.all([
    db.product.count({ where: { deletedAt: null } }),
    db.product.count({ where: { deletedAt: null, brandId: { not: null } } }),
    db.product.count({ where: { deletedAt: null, brandId: null } }),
    db.brand.count({ where: { deletedAt: null } }),
  ]);

  const samples = await db.product.findMany({
    where: { deletedAt: null, brandId: null },
    take: 10,
    select: {
      id: true,
      translations: { where: { locale: "hy" }, select: { title: true } },
      variants: { take: 1, select: { sku: true } },
    },
  });

  process.stdout.write(
    [
      `Products total: ${total}`,
      `With brand: ${withBrand}`,
      `Without brand: ${withoutBrand}`,
      `Brands in DB: ${brandCount}`,
      "",
      "Samples without brand:",
      ...samples.map(
        (p) =>
          `  ${p.variants[0]?.sku ?? "?"} | ${p.translations[0]?.title ?? p.id}`,
      ),
    ].join("\n") + "\n",
  );
}

main()
  .catch((error: unknown) => {
    process.stderr.write(`${String(error)}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
