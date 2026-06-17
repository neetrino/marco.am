/**
 * Read-only diagnostic: compare the target taxonomy in `cotegory.md` against the
 * current DB categories and assess product re-link signals.
 *
 * Usage: pnpm exec tsx src/scripts/audit-target-taxonomy.ts
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loadEnvConfig } from "@next/env";
import { db } from "@white-shop/db";

const HY_LOCALE = "hy";

type TargetNode = {
  title: string;
  level: 1 | 2 | 3;
  parentTitle: string | null;
};

function normalizeTitle(value: string): string {
  return value.normalize("NFKC").replace(/\s+/g, " ").trim().toLowerCase();
}

function parseTargetTaxonomy(markdown: string): TargetNode[] {
  const nodes: TargetNode[] = [];
  let currentL1: string | null = null;
  let currentL2: string | null = null;

  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line === "Կատեգորիաներ") {
      continue;
    }
    if (line.startsWith("•")) {
      const title = line.replace(/^•\s*/, "").trim();
      currentL1 = title;
      currentL2 = null;
      nodes.push({ title, level: 1, parentTitle: null });
      continue;
    }
    if (line.startsWith("—") || line.startsWith("-")) {
      const title = line.replace(/^[—-]\s*/, "").trim();
      currentL2 = title;
      nodes.push({ title, level: 2, parentTitle: currentL1 });
      continue;
    }
    nodes.push({ title: line, level: 3, parentTitle: currentL2 });
  }
  return nodes;
}

async function main(): Promise<void> {
  loadEnvConfig(process.cwd());

  const markdown = readFileSync(join(process.cwd(), "cotegory.md"), "utf8");
  const target = parseTargetTaxonomy(markdown);

  const categories = await db.category.findMany({
    where: { deletedAt: null },
    select: {
      id: true,
      parentId: true,
      translations: { select: { locale: true, title: true } },
    },
  });

  const byHyTitle = new Map<string, Array<{ id: string; parentId: string | null }>>();
  for (const cat of categories) {
    const hy = cat.translations.find((t) => t.locale === HY_LOCALE)?.title;
    if (!hy) {
      continue;
    }
    const key = normalizeTitle(hy);
    const list = byHyTitle.get(key) ?? [];
    list.push({ id: cat.id, parentId: cat.parentId });
    byHyTitle.set(key, list);
  }

  const directCounts = await db.$queryRaw<Array<{ categoryId: string; count: bigint }>>`
    SELECT category_id as "categoryId", COUNT(DISTINCT product_id)::bigint as "count"
    FROM (
      SELECT p."id" as product_id, p."primaryCategoryId" as category_id
      FROM "products" p
      WHERE p."deletedAt" IS NULL AND p."primaryCategoryId" IS NOT NULL
      UNION ALL
      SELECT p."id" as product_id, pc."A" as category_id
      FROM "_ProductCategories" pc
      INNER JOIN "products" p ON p."id" = pc."B"
      WHERE p."deletedAt" IS NULL
    ) cp GROUP BY category_id
  `;
  const countById = new Map(directCounts.map((r) => [r.categoryId, Number(r.count)]));

  const primaryCounts = await db.product.groupBy({
    by: ["primaryCategoryId"],
    where: { deletedAt: null },
    _count: { _all: true },
  });
  const primaryCountById = new Map(
    primaryCounts
      .filter((r) => r.primaryCategoryId)
      .map((r) => [r.primaryCategoryId as string, r._count._all]),
  );

  const matchedIds = new Set<string>();
  const lines: string[] = [];
  const missing: string[] = [];
  const duplicates: string[] = [];

  lines.push("=== TARGET TAXONOMY vs DB (count = direct, [primary] = primaryCategoryId) ===");
  for (const node of target) {
    const key = normalizeTitle(node.title);
    const hits = byHyTitle.get(key) ?? [];
    const indent = "  ".repeat(node.level - 1);
    if (hits.length === 0) {
      missing.push(`${indent}L${node.level} ${node.title}`);
      lines.push(`${indent}L${node.level} ${node.title}  → MISSING in DB`);
      continue;
    }
    if (hits.length > 1) {
      duplicates.push(`${node.title} (${hits.length} categories)`);
    }
    for (const hit of hits) {
      matchedIds.add(hit.id);
    }
    const total = hits.reduce((s, h) => s + (countById.get(h.id) ?? 0), 0);
    const totalPrimary = hits.reduce((s, h) => s + (primaryCountById.get(h.id) ?? 0), 0);
    const dupMark = hits.length > 1 ? ` ⚠️x${hits.length}` : "";
    lines.push(`${indent}L${node.level} ${node.title}  count=${total} [primary=${totalPrimary}]${dupMark}`);
  }

  const extras = categories.filter((c) => !matchedIds.has(c.id));
  const productsWithPrimary = primaryCounts
    .filter((r) => r.primaryCategoryId)
    .reduce((s, r) => s + r._count._all, 0);
  const totalProducts = await db.product.count({ where: { deletedAt: null } });

  lines.push("");
  lines.push(`Target nodes: ${target.length} | DB categories: ${categories.length}`);
  lines.push(`Missing in DB: ${missing.length} | Duplicated titles: ${duplicates.length}`);
  lines.push(`Extra DB categories (not in target): ${extras.length}`);
  lines.push(
    `Products: ${totalProducts} | with primaryCategoryId: ${productsWithPrimary} | distinct primary categories: ${primaryCountById.size}`,
  );

  if (duplicates.length > 0) {
    lines.push("");
    lines.push("=== DUPLICATED titles (same hy title in multiple categories) ===");
    lines.push(...duplicates);
  }

  if (extras.length > 0) {
    lines.push("");
    lines.push("=== EXTRA DB categories not present in target (hy title, count, root?) ===");
    for (const cat of extras.sort(
      (a, b) => (countById.get(b.id) ?? 0) - (countById.get(a.id) ?? 0),
    )) {
      const hy = cat.translations.find((t) => t.locale === HY_LOCALE)?.title ?? "(no hy)";
      lines.push(
        `count=${countById.get(cat.id) ?? 0}\tprimary=${primaryCountById.get(cat.id) ?? 0}\t${cat.parentId ? "child" : "ROOT"}\t${hy}`,
      );
    }
  }

  process.stdout.write(lines.join("\n") + "\n");
}

main()
  .catch((e: unknown) => {
    process.stderr.write(`${String(e)}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
