import type { PrismaTransactionClient } from "@/lib/types/prisma";

function normalizeIds(ids: readonly string[] | undefined): string[] | undefined {
  if (ids === undefined) {
    return undefined;
  }
  return [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
}

export async function syncProductAttributeValues(
  productId: string,
  attributeValueIds: readonly string[] | undefined,
  tx: PrismaTransactionClient,
): Promise<string[]> {
  const normalizedValueIds = normalizeIds(attributeValueIds);
  if (normalizedValueIds === undefined) {
    return [];
  }

  await tx.productAttributeValue.deleteMany({ where: { productId } });

  if (normalizedValueIds.length === 0) {
    return [];
  }

  const values = await tx.attributeValue.findMany({
    where: { id: { in: normalizedValueIds } },
    select: { id: true, attributeId: true },
  });
  const foundValueIds = new Set(values.map((value) => value.id));
  const missingValueIds = normalizedValueIds.filter((id) => !foundValueIds.has(id));

  if (missingValueIds.length > 0) {
    throw new Error(`Unknown attribute value id(s): ${missingValueIds.join(", ")}`);
  }

  const attributeIds = [...new Set(values.map((value) => value.attributeId))];

  if (attributeIds.length > 0) {
    await tx.productAttribute.createMany({
      data: attributeIds.map((attributeId) => ({ productId, attributeId })),
      skipDuplicates: true,
    });
  }

  await tx.productAttributeValue.createMany({
    data: values.map((value) => ({
      productId,
      attributeId: value.attributeId,
      attributeValueId: value.id,
    })),
    skipDuplicates: true,
  });

  return attributeIds;
}
