/**
 * Products Service - Combined service that delegates to specialized services
 * This file combines all product-related services for backward compatibility
 */

import { productsSlugService } from "./products-slug.service";

// Re-export types for backward compatibility
export type { ProductFilters, ProductWithRelations } from "./products-find-query/types";

class ProductsService {
  // Slug methods
  findBySlug = productsSlugService.findBySlug.bind(productsSlugService);
}

export const productsService = new ProductsService();
