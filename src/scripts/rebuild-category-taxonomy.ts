/**
 * Rebuild category taxonomy + product links from the target tree in `cotegory.md`.
 *
 * Strategy (evidence-based): `primaryCategoryId` is the reliable per-product
 * signal. We rebuild the parent/child tree to match the target, then re-derive
 * every product's `categoryIds` + M2M as the ancestor chain of its primary
 * category in the corrected tree. This drops all catch-all over-links.
 *
 * Dry-run by default. Pass `--apply` to write. Pass `--create-leaves` to also
 * create the empty target leaves that do not exist yet.
 *
 * Usage:
 *   pnpm exec tsx src/scripts/rebuild-category-taxonomy.ts            # dry-run
 *   pnpm exec tsx src/scripts/rebuild-category-taxonomy.ts --apply
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { loadEnvConfig } from "@next/env";
import { db } from "@white-shop/db";

const HY_LOCALE = "hy";
const MAX_DEPTH = 64;
const CHUNK = 50;

/** Target file typo `Չորանոցներր` maps to the existing `Չորանոցներ`. */
const TITLE_ALIASES: Record<string, string> = { "չորանոցներր": "չորանոցներ" };
/** Extra category hy title -> target parent hy title (kept, just reparented). */
const REPARENT_EXTRAS: Record<string, string> = { "պիցցա պատրաստող սարքեր": "խոհանոցային տեխնիկա" };
/** Extra category hy title -> merge into this target leaf hy title. */
const MERGE_INTO: Record<string, string> = { "փայտատաշեղային սալ օսպ": "օսբ" };
/** Extra categories to soft-delete (no real products). */
const DELETE_TITLES = new Set(["կահույք և ինտերիեր"]);

type TargetNode = { title: string; level: 1 | 2 | 3; parentTitle: string | null };

function normalizeTitle(value: string): string {
  return value.normalize("NFKC").replace(/\s+/g, " ").trim().toLowerCase();
}

function parseTarget(markdown: string): TargetNode[] {
  const nodes: TargetNode[] = [];
  let l1: string | null = null;
  let l2: string | null = null;
  for (const raw of markdown.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line === "Կատեգորիաներ") continue;
    if (line.startsWith("•")) {
      l1 = line.replace(/^•\s*/, "").trim();
      l2 = null;
      nodes.push({ title: l1, level: 1, parentTitle: null });
    } else if (line.startsWith("—") || line.startsWith("-")) {
      l2 = line.replace(/^[—-]\s*/, "").trim();
      nodes.push({ title: l2, level: 2, parentTitle: l1 });
    } else {
      nodes.push({ title: line, level: 3, parentTitle: l2 });
    }
  }
  return nodes;
}

type CatRow = { id: string; parentId: string | null; hy: string };

function buildAncestorChain(
  categoryId: string,
  parentMap: Map<string, string | null>,
): string[] {
  const chain: string[] = [];
  let current: string | null = categoryId;
  let guard = 0;
  while (current && guard < MAX_DEPTH) {
    guard += 1;
    chain.push(current);
    current = parentMap.get(current) ?? null;
  }
  return chain.reverse();
}

async function main(): Promise<void> {
  loadEnvConfig(process.cwd());
  const apply = process.argv.includes("--apply");

  const target = parseTarget(readFileSync(join(process.cwd(), "cotegory.md"), "utf8"));
  const categories = await db.category.findMany({
    where: { deletedAt: null },
    select: { id: true, parentId: true, translations: { select: { locale: true, title: true } } },
  });

  const rows: CatRow[] = categories.map((c) => ({
    id: c.id,
    parentId: c.parentId,
    hy: c.translations.find((t) => t.locale === HY_LOCALE)?.title ?? "",
  }));
  const idByTitle = new Map<string, string>();
  for (const row of rows) {
    if (row.hy) idByTitle.set(normalizeTitle(row.hy), row.id);
  }
  const resolveId = (hyTitle: string): string | undefined => {
    const key = normalizeTitle(hyTitle);
    return idByTitle.get(TITLE_ALIASES[key] ?? key);
  };

  // Desired parent for every category id after restructure.
  const desiredParent = new Map<string, string | null>();
  const missingLeaves: string[] = [];
  for (const node of target) {
    const id = resolveId(node.title);
    if (!id) {
      missingLeaves.push(node.title);
      continue;
    }
    const parentId = node.parentTitle ? resolveId(node.parentTitle) ?? null : null;
    desiredParent.set(id, parentId);
  }
  for (const [extra, parent] of Object.entries(REPARENT_EXTRAS)) {
    const id = resolveId(extra);
    const parentId = resolveId(parent);
    if (id && parentId) desiredParent.set(id, parentId);
  }

  // Merge + delete sets resolved to ids.
  const mergeMap = new Map<string, string>(); // sourceId -> targetLeafId
  for (const [src, dst] of Object.entries(MERGE_INTO)) {
    const srcId = resolveId(src);
    const dstId = resolveId(dst);
    if (srcId && dstId) mergeMap.set(srcId, dstId);
  }
  const deleteIds = new Set<string>();
  for (const t of DELETE_TITLES) {
    const id = resolveId(t);
    if (id) deleteIds.add(id);
  }

  // Effective parent map for ancestor computation: start from desired, fall
  // back to current parent for untouched categories; skip deleted/merged.
  const effectiveParent = new Map<string, string | null>();
  for (const row of rows) {
    if (deleteIds.has(row.id) || mergeMap.has(row.id)) continue;
    effectiveParent.set(row.id, desiredParent.has(row.id) ? desiredParent.get(row.id)! : row.parentId);
  }

  const remapPrimary = (id: string | null): string | null => {
    if (!id) return id;
    return mergeMap.get(id) ?? id;
  };

  // ---- Product relink plan ----
  const products = await db.product.findMany({
    where: { deletedAt: null },
    select: { id: true, primaryCategoryId: true, categoryIds: true },
  });

  let relinkChanged = 0;
  let primaryRemapped = 0;
  let orphanPrimary = 0;
  const updates: Array<{ id: string; primaryCategoryId: string | null; categoryIds: string[] }> = [];
  for (const p of products) {
    const newPrimary = remapPrimary(p.primaryCategoryId);
    if (newPrimary !== p.primaryCategoryId) primaryRemapped += 1;
    const chain = newPrimary && effectiveParent.has(newPrimary)
      ? buildAncestorChain(newPrimary, effectiveParent)
      : newPrimary
        ? [newPrimary]
        : [];
    if (newPrimary && !effectiveParent.has(newPrimary)) orphanPrimary += 1;
    const same =
      newPrimary === p.primaryCategoryId &&
      chain.length === p.categoryIds.length &&
      chain.every((id, i) => id === p.categoryIds[i]);
    if (!same) {
      relinkChanged += 1;
      updates.push({ id: p.id, primaryCategoryId: newPrimary, categoryIds: chain });
    }
  }

  // ---- Tree change plan (parent moves) ----
  const parentMoves = rows.filter(
    (r) => !deleteIds.has(r.id) && !mergeMap.has(r.id) &&
      desiredParent.has(r.id) && (desiredParent.get(r.id) ?? null) !== r.parentId,
  );

  const report = [
    `MODE: ${apply ? "APPLY" : "DRY-RUN"}`,
    `Categories: ${rows.length} | Products: ${products.length}`,
    `Parent moves (reparent to match target): ${parentMoves.length}`,
    `Merge categories: ${mergeMap.size} | Soft-delete categories: ${deleteIds.size}`,
    `Missing target leaves (NOT created here): ${missingLeaves.length}`,
    `  ${missingLeaves.join(", ") || "—"}`,
    `Products with categoryIds/primary changes: ${relinkChanged}`,
    `  primary remapped (merge): ${primaryRemapped} | primary not in tree (kept as-is): ${orphanPrimary}`,
  ];
  process.stdout.write(report.join("\n") + "\n");

  if (!apply) {
    process.stdout.write("\nDry-run only. Re-run with --apply to write changes.\n");
    return;
  }

  // ---- APPLY ----
  for (const move of parentMoves) {
    await db.category.update({ where: { id: move.id }, data: { parentId: desiredParent.get(move.id) ?? null } });
  }
  for (const [srcId] of mergeMap) {
    await db.category.update({ where: { id: srcId }, data: { deletedAt: new Date(), published: false } });
  }
  for (const id of deleteIds) {
    await db.category.update({ where: { id }, data: { deletedAt: new Date(), published: false } });
  }
  const sorted = [...updates].sort((a, b) => a.id.localeCompare(b.id));
  for (let i = 0; i < sorted.length; i += CHUNK) {
    const chunk = sorted.slice(i, i + CHUNK);
    await db.$transaction(
      chunk.map((u) =>
        db.product.update({
          where: { id: u.id },
          data: {
            primaryCategoryId: u.primaryCategoryId,
            categoryIds: u.categoryIds,
            categories: { set: u.categoryIds.map((id) => ({ id })) },
          },
        }),
      ),
    );
  }
  process.stdout.write(`\nApplied: ${parentMoves.length} moves, ${updates.length} product relinks.\n`);
}

main()
  .catch((e: unknown) => {
    process.stderr.write(`${String(e)}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
