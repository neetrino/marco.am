import { Prisma } from "@white-shop/db/prisma";

/**
 * Product filters interface
 */
export interface ProductFilters {
  category?: string;
  search?: string;
  filter?: string;
  minPrice?: number;
  maxPrice?: number;
  colors?: string;
  sizes?: string;
  brand?: string;
  sort?: string;
  page?: number;
  limit?: number;
  cursor?: string;
  lang?: string;
  technicalSpecs?: TechnicalSpecFilters;
  /** Restrict to these product IDs (e.g. wishlist). Applied with other filters as AND. */
  productIds?: string[];
  /**
   * PLP: skip heavy `productAttributes` join on product rows (faster listing; card keySpecs/color extras may be thinner).
   */
  listingOmitProductAttributes?: boolean;
  /** When true, listing API returns only id, slug, image, images for first-paint card shells. */
  cardVisualOnly?: boolean;
  /**
   * Skip `db.product.count` when pagination is DB-backed (no over-fetch). Derives `meta.total`
   * from the page slice so first-screen home strips save one round-trip per listing. Do not use
   * when exact totals matter (e.g. PLP footer); avoid with `cursor` pagination.
   */
  skipExactTotalCount?: boolean;
}

export type TechnicalSpecFilters = Record<string, string[]>;

/**
 * Type for product with all relations needed for find query service
 */
export type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    translations: true;
    brand: {
      include: {
        translations: true;
      };
    };
    variants: {
      include: {
        options: {
          include: {
            attributeValue: {
              include: {
                attribute: true;
                translations: true;
              };
            };
          };
        };
      };
    };
    labels: true;
    categories: {
      include: {
        translations: true;
      };
    };
    productAttributes?: {
      include: {
        attribute: {
          include: {
            translations: true;
            values: {
              include: {
                translations: true;
              };
            };
          };
        };
      };
    };
  };
}>;




