import { getProductDiscountsList } from "./admin-products-read/product-discounts-list";
import { getProducts, getProductById } from "./admin-products-read/product-operations";
import { loadProductEditorSection } from "./admin-products-read/product-editor-section-loader";
import type { ProductFilters } from "./admin-products-read/types";
import type { ProductEditorSection } from "@/app/supersudo/products/add/product-editor-tabs";

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

  async getProductDiscountsList(locale?: string) {
    return getProductDiscountsList(locale);
  }

  /**
   * Get product by ID
   */
  async getProductById(productId: string) {
    return getProductById(productId);
  }

  async getProductEditorSection(productId: string, section: ProductEditorSection) {
    return loadProductEditorSection(productId, section);
  }
}

export const adminProductsReadService = new AdminProductsReadService();
