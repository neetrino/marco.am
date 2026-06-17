/**
 * Products Service - Combined service that delegates to specialized services
 * This file combines all product-related services for backward compatibility
 */

import { productsFindService } from "./products-find.service";
import { findBySlugVisual as findBySlugVisualImpl } from "./products-pdp-visual.service";
import { productsSlugService } from "./products-slug.service";
import { findBySlugSummary as findBySlugSummaryImpl } from "./products-slug/product-summary.service";

// Re-export types for backward compatibility
export type { ProductFilters, ProductWithRelations } from "./products-find-query.service";

type ProductsFiltersServiceModule = typeof import("./products-filters.service");

let productsFiltersServicePromise: Promise<ProductsFiltersServiceModule["productsFiltersService"]> | null =
  null;

function loadProductsFiltersService(): Promise<
  ProductsFiltersServiceModule["productsFiltersService"]
> {
  if (!productsFiltersServicePromise) {
    productsFiltersServicePromise = import("./products-filters.service").then(
      (module) => module.productsFiltersService,
    );
  }
  return productsFiltersServicePromise;
}

class ProductsService {
  // Delegate to specialized services

  // Find methods
  findAll = productsFindService.findAll.bind(productsFindService);

  // Filters methods — lazy import avoids pulling admin/sharp into listing-only bundles
  async getFilters(
    ...args: Parameters<ProductsFiltersServiceModule["productsFiltersService"]["getFilters"]>
  ) {
    const service = await loadProductsFiltersService();
    return service.getFilters(...args);
  }

  async getFiltersCoreFast(
    ...args: Parameters<ProductsFiltersServiceModule["productsFiltersService"]["getFiltersCoreFast"]>
  ) {
    const service = await loadProductsFiltersService();
    return service.getFiltersCoreFast(...args);
  }

  async getFiltersExtended(
    ...args: Parameters<ProductsFiltersServiceModule["productsFiltersService"]["getFiltersExtended"]>
  ) {
    const service = await loadProductsFiltersService();
    return service.getFiltersExtended(...args);
  }

  async getPriceRange(
    ...args: Parameters<ProductsFiltersServiceModule["productsFiltersService"]["getPriceRange"]>
  ) {
    const service = await loadProductsFiltersService();
    return service.getPriceRange(...args);
  }

  // Slug methods
  findBySlug = productsSlugService.findBySlug.bind(productsSlugService);
  findBySlugSummary = findBySlugSummaryImpl;

  findBySlugVisual = findBySlugVisualImpl;
}

export const productsService = new ProductsService();
