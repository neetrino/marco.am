/**
 * Products Service - Combined service that delegates to specialized services
 * This file combines all product-related services for backward compatibility
 */

import { findBySlugVisual as findBySlugVisualImpl } from "./products-pdp-visual.service";
import { productsSlugService } from "./products-slug.service";
import { findBySlugSummary as findBySlugSummaryImpl } from "./products-slug/product-summary.service";

// Re-export types for backward compatibility
export type { ProductFilters, ProductWithRelations } from "./products-find-query/types";

class ProductsService {
  // Delegate to specialized services

  // Slug methods
  findBySlug = productsSlugService.findBySlug.bind(productsSlugService);
  findBySlugSummary = findBySlugSummaryImpl;

  findBySlugVisual = findBySlugVisualImpl;
}

export const productsService = new ProductsService();
