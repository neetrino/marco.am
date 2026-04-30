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




