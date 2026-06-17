import { getProducts, getProductById, getProductEditorSection } from "./admin-products-read/product-operations";
import type { ProductFilters } from "./admin-products-read/types";
import type { ProductEditorSection } from "@/lib/admin/product-editor-section";

/**
 * Service for admin product read operations
 */
class AdminProductsReadService {
  /**
   * Get products for admin
   */
  async getProducts(filters: ProductFilters) {
    return getProducts(filters);
  }

  /**
   * Get product by ID
   */
  async getProductById(productId: string) {
    return getProductById(productId);
  }

  async getProductEditorSection(productId: string, section: ProductEditorSection) {
    return getProductEditorSection(productId, section);
  }
}

export const adminProductsReadService = new AdminProductsReadService();
