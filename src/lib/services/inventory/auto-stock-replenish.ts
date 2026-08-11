import { AUTO_STOCK_LEVEL, shouldAutoReplenishStock } from "@/lib/constants/auto-stock";
import { logger } from "@/lib/utils/logger";
import type { PrismaTransactionClient } from "@/lib/types/prisma";

/**
 * After an atomic stock decrement, reset to AUTO_STOCK_LEVEL when stock
 * has reached the replenish threshold.
 */
export async function replenishVariantStockIfNeeded(
  tx: PrismaTransactionClient,
  variantId: string,
): Promise<void> {
  const variant = await tx.productVariant.findUnique({
    where: { id: variantId },
    select: { stock: true, sku: true },
  });

  if (!variant || !shouldAutoReplenishStock(variant.stock)) {
    return;
  }

  await tx.productVariant.update({
    where: { id: variantId },
    data: { stock: AUTO_STOCK_LEVEL },
  });

  logger.info("Auto-replenished variant stock", {
    variantId,
    sku: variant.sku,
    from: variant.stock,
    to: AUTO_STOCK_LEVEL,
  });
}
