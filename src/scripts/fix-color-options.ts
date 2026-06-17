/**
 * One-off cleanup: normalize product color options to canonical valueId-based AttributeValues.
 *
 * Why: the legacy import left color as old-format string options (attributeKey="color", no valueId,
 * no hex) mixed with valueId-based ones. That pollutes the color filter facet with junk
 * ("1 տարի", "Մանրածախ"), combined values ("Մոխրագույն, Սև"), casing/trailing-comma duplicates,
 * and gray without a hex swatch. JSONB color buckets also hold dangling valueIds.
 *
 * Action (color attribute only):
 *  - map every dirty/legacy color value to canonical color names (see VALUE_MAP);
 *  - drop non-color junk (warranty / product class);
 *  - split combined values into separate colors;
 *  - rewrite options to valueId-based, ensure the gray AttributeValue exists with a hex;
 *  - rebuild each variant's `attributes.color` JSONB bucket (preserving non-color buckets).
 *
 * Usage (repo root):
 *   pnpm exec tsx src/scripts/fix-color-options.ts --dry-run
 *   pnpm exec tsx src/scripts/fix-color-options.ts
 */

import { loadEnvConfig } from "@next/env";
import { db } from "@white-shop/db";
import { logger } from "@/lib/utils/logger";
import type { PrismaTransactionClient } from "@/lib/types/prisma";

const COLOR_KEYS = ["color", "colour", "guyn"];
const GRAY_NAME = "Մոխրագույն";
const GRAY_HEX = "#808080";
const COMMA_VALUE = "Մոխրագույն,";

/** Trimmed legacy/dirty color value → canonical color names ([] means: not a color, drop). */
const VALUE_MAP: Record<string, string[]> = {
  Մոխրագույն: [GRAY_NAME],
  մոխրագույն: [GRAY_NAME],
  "Մոխրագույն,": [GRAY_NAME],
  Nobel: [GRAY_NAME],
  "Մոխրագույն, Սև": [GRAY_NAME, "Սև"],
  "Արծաթագույն, Սև": ["Արծաթագույն", "Սև"],
  "Սև, Սպիտակ": ["Սև", "Սպիտակ"],
  "1 տարի": [],
  Մանրածախ: [],
};

type ColorOption = { id: string; attributeKey: string | null; valueId: string | null; value: string | null };
type VariantRow = { id: string; attributes: unknown; options: ColorOption[] };

type ColorWorld = {
  attrId: string;
  idToValue: Map<string, string>;
  nameToId: Map<string, string>;
  colorValueIds: Set<string>;
  commaValueId: string | null;
};

function isColorOption(option: ColorOption, world: ColorWorld): boolean {
  const key = (option.attributeKey ?? "").trim().toLowerCase();
  if (COLOR_KEYS.includes(key)) return true;
  return option.valueId !== null && world.colorValueIds.has(option.valueId);
}

async function loadColorWorld(): Promise<ColorWorld> {
  const attr = await db.attribute.findFirst({
    where: { key: { in: COLOR_KEYS, mode: "insensitive" } },
    select: { id: true, values: { select: { id: true, value: true } } },
  });
  if (!attr) throw new Error("Color attribute not found");

  const idToValue = new Map<string, string>();
  const nameToId = new Map<string, string>();
  let commaValueId: string | null = null;
  for (const v of attr.values) {
    idToValue.set(v.id, v.value);
    nameToId.set(v.value, v.id);
    if (v.value === COMMA_VALUE) commaValueId = v.id;
  }
  return { attrId: attr.id, idToValue, nameToId, colorValueIds: new Set(idToValue.keys()), commaValueId };
}

async function ensureGrayValue(world: ColorWorld, dryRun: boolean): Promise<boolean> {
  if (world.nameToId.has(GRAY_NAME)) return false;
  if (dryRun) return true;
  const created = await db.attributeValue.create({
    data: {
      attributeId: world.attrId,
      value: GRAY_NAME,
      colors: [GRAY_HEX],
      translations: {
        create: [
          { locale: "hy", label: GRAY_NAME },
          { locale: "en", label: GRAY_NAME },
          { locale: "ru", label: GRAY_NAME },
        ],
      },
    },
    select: { id: true },
  });
  world.nameToId.set(GRAY_NAME, created.id);
  world.idToValue.set(created.id, GRAY_NAME);
  world.colorValueIds.add(created.id);
  return true;
}

/** Final canonical color names for a variant + the option ids that must be deleted. */
function planVariant(
  variant: VariantRow,
  world: ColorWorld,
): { desiredNames: string[]; deleteOptionIds: string[]; unknownValues: string[] } {
  const desired = new Set<string>();
  const deleteOptionIds: string[] = [];
  const unknownValues: string[] = [];

  for (const option of variant.options) {
    if (!isColorOption(option, world)) continue;

    if (option.valueId) {
      if (option.valueId === world.commaValueId) {
        desired.add(GRAY_NAME);
        deleteOptionIds.push(option.id);
        continue;
      }
      const name = world.idToValue.get(option.valueId);
      if (name) desired.add(name);
      continue;
    }

    const trimmed = (option.value ?? "").trim();
    const targets = VALUE_MAP[trimmed];
    if (targets === undefined) {
      unknownValues.push(trimmed);
      continue;
    }
    for (const name of targets) desired.add(name);
    deleteOptionIds.push(option.id);
  }

  return { desiredNames: [...desired], deleteOptionIds, unknownValues };
}

function buildAttributesJson(existing: unknown, colorItems: object[]): object {
  const base: Record<string, unknown> =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? { ...(existing as Record<string, unknown>) }
      : {};
  for (const key of Object.keys(base)) {
    if (COLOR_KEYS.includes(key.trim().toLowerCase())) delete base[key];
  }
  if (colorItems.length > 0) base.color = colorItems;
  return base;
}

async function applyVariant(
  tx: PrismaTransactionClient,
  variant: VariantRow,
  world: ColorWorld,
  plan: { desiredNames: string[]; deleteOptionIds: string[] },
): Promise<void> {
  const keptValueIds = new Set(
    variant.options
      .filter((o) => isColorOption(o, world) && o.valueId && !plan.deleteOptionIds.includes(o.id))
      .map((o) => o.valueId as string),
  );

  if (plan.deleteOptionIds.length > 0) {
    await tx.productVariantOption.deleteMany({ where: { id: { in: plan.deleteOptionIds } } });
  }

  const colorItems: object[] = [];
  for (const name of plan.desiredNames) {
    const valueId = world.nameToId.get(name);
    if (!valueId) continue;
    if (!keptValueIds.has(valueId)) {
      await tx.productVariantOption.create({ data: { variantId: variant.id, valueId } });
    }
    colorItems.push({ valueId, value: name, attributeKey: "color" });
  }

  await tx.productVariant.update({
    where: { id: variant.id },
    data: { attributes: buildAttributesJson(variant.attributes, colorItems) as object },
  });
}

async function main(): Promise<void> {
  loadEnvConfig(process.cwd());
  const dryRun = process.argv.includes("--dry-run");

  const world = await loadColorWorld();
  const grayCreated = await ensureGrayValue(world, dryRun);

  const variants = (await db.productVariant.findMany({
    where: {
      OR: [
        { options: { some: { attributeKey: { in: COLOR_KEYS, mode: "insensitive" }, valueId: null } } },
        ...(world.commaValueId ? [{ options: { some: { valueId: world.commaValueId } } }] : []),
      ],
    },
    select: {
      id: true,
      attributes: true,
      options: { select: { id: true, attributeKey: true, valueId: true, value: true } },
    },
  })) as VariantRow[];

  let optionsDeleted = 0;
  let optionsCreated = 0;
  let junkVariants = 0;
  let splitVariants = 0;
  const unknown = new Map<string, number>();

  for (const variant of variants) {
    const plan = planVariant(variant, world);
    for (const u of plan.unknownValues) unknown.set(u, (unknown.get(u) ?? 0) + 1);
    optionsDeleted += plan.deleteOptionIds.length;
    optionsCreated += plan.desiredNames.length;
    if (plan.desiredNames.length === 0 && plan.deleteOptionIds.length > 0) junkVariants += 1;
    if (plan.desiredNames.length > 1) splitVariants += 1;

    if (!dryRun) {
      await db.$transaction((tx) => applyVariant(tx, variant, world, plan));
    }
  }

  if (!dryRun && world.commaValueId) {
    await db.productVariantOption.deleteMany({ where: { valueId: world.commaValueId } }).catch(() => undefined);
    await db.attributeValue.delete({ where: { id: world.commaValueId } }).catch(() => undefined);
  }

  logger.alwaysInfo("fix-color-options finished", {
    dryRun,
    grayValueCreated: grayCreated,
    variantsAffected: variants.length,
    optionsDeleted,
    optionsCreated,
    junkVariantsClearedOfColor: junkVariants,
    combinedVariantsSplit: splitVariants,
    unknownValuesLeftUntouched: [...unknown.entries()],
  });

  await db.$disconnect();
}

main().catch((error) => {
  logger.error("fix-color-options failed", { error });
  void db.$disconnect();
  process.exit(1);
});
