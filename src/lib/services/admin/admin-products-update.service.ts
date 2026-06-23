import { updateProduct } from "./admin-products-update/product-update-operations";
import { revalidateProductCache } from "./admin-products-update/cache-revalidator";
import type { UpdateProductData } from "./admin-products-update/types";
import { syncProductListingReadModel } from "@/lib/read-model/product-read-model-sync";
import { revalidateStorefrontHome } from "@/lib/revalidate-storefront";
import { logger } from "@/lib/utils/logger";

/**
 * Sync read model + invalidate storefront caches after a product write.
 * Runs after the HTTP response so admin saves feel instant.
 */
export async function runProductUpdateSideEffects(
  productId: string,
  productSlug: string | undefined,
): Promise<void> {
  try {
    await syncProductListingReadModel(productId);
    await revalidateProductCache(productId, productSlug);
    revalidateStorefrontHome();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    logger.error("Product update side effects failed", { productId, error: message });
  }
}

/**
 * Service for admin product update operations
 */
class AdminProductsUpdateService {
  /** Persist product changes only — side effects are scheduled by the API route. */
  async updateProduct(productId: string, data: UpdateProductData) {
    return updateProduct(productId, data);
  }
}

export const adminProductsUpdateService = new AdminProductsUpdateService();
