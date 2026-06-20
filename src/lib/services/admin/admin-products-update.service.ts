import { updateProduct } from "./admin-products-update/product-update-operations";
import { revalidateProductCache } from "./admin-products-update/cache-revalidator";
import type { UpdateProductData } from "./admin-products-update/types";
import { syncProductReadModelAndFacetCounts } from "@/lib/read-model/product-read-model-sync";

/**
 * Service for admin product update operations
 */
class AdminProductsUpdateService {
  /**
   * Update product
   */
  async updateProduct(
    productId: string,
    data: UpdateProductData
  ) {
    const result = await updateProduct(productId, data);
    await syncProductReadModelAndFacetCounts(productId);
    
    // Revalidate cache for this product and related pages
    const productSlug = result.translations[0]?.slug;
    await revalidateProductCache(productId, productSlug);
    
    return result;
  }
}

export const adminProductsUpdateService = new AdminProductsUpdateService();
