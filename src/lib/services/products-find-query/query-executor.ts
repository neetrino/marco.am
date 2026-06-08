import { Prisma } from "@white-shop/db/prisma";
import { db } from "@white-shop/db";
import { PRODUCT_LISTING_VARIANTS_PER_PRODUCT_LIMIT } from "@/lib/constants/product-listing-query-limits";
import { ensureProductVariantAttributesColumn } from "../../utils/db-ensure";
import { logger } from "../../utils/logger";
import type { ProductWithRelations } from "./types";

export type ExecuteProductQueryOptions = {
  omitProductAttributes?: boolean;
};

export type ExecuteProductListingQueryOptions = {
  omitProductAttributes?: boolean;
  lang?: string;
  orderBy?: Prisma.ProductOrderByWithRelationInput | Prisma.ProductOrderByWithRelationInput[];
};

/**
 * Base include configuration for product queries
 */
const getBaseInclude = () => ({
  translations: true,
  brand: {
    include: {
      translations: true,
    },
  },
  variants: {
    where: {
      published: true,
    },
    include: {
      options: {
        include: {
          attributeValue: {
            include: {
              attribute: true,
              translations: true,
            },
          },
        },
      },
    },
  },
  labels: true,
  categories: {
    include: {
      translations: true,
    },
  },
});

/**
 * Base include without attributeValue relation (fallback)
 */
const getBaseIncludeWithoutAttributeValue = () => ({
  ...getBaseInclude(),
  variants: {
    where: {
      published: true,
    },
    include: {
      options: true, // Include options without attributeValue relation
    },
  },
});

/**
 * ProductAttributes include configuration
 */
const getProductAttributesInclude = () => ({
  productAttributes: {
    include: {
      attribute: {
        include: {
          translations: true,
          values: {
            include: {
              translations: true,
            },
          },
        },
      },
    },
  },
});

/**
 * Check if error is related to product_attributes table
 */
function isProductAttributesError(error: unknown): boolean {
  const errorObj = error as { code?: string; message?: string; meta?: { table?: string } };
  const errorMessage = error instanceof Error ? error.message : String(error);
  return (
    errorObj?.meta?.table === "product_attributes" ||
    (errorObj?.code === "P2021" && errorMessage.includes("product_attributes")) ||
    errorMessage.includes("product_attributes")
  );
}

/**
 * Check if error is related to product_variants.attributes column
 */
function isVariantAttributesError(error: unknown): boolean {
  const errorObj = error as { meta?: { column?: string } };
  const errorMessage = error instanceof Error ? error.message : String(error);
  return (
    errorObj?.meta?.column === "product_variants.attributes" ||
    errorMessage.includes("product_variants.attributes")
  );
}

/**
 * Check if error is related to attribute_values.colors column
 */
function isAttributeValuesColorsError(error: unknown): boolean {
  const errorObj = error as { message?: string; meta?: { column?: string } };
  const errorMessage = error instanceof Error ? error.message : String(error);
  return (
    errorObj?.meta?.column === "attribute_values.colors" ||
    errorMessage.includes("attribute_values.colors")
  );
}

/**
 * Execute product query with comprehensive error handling
 */
export async function executeProductQuery(
  where: Prisma.ProductWhereInput,
  limit: number,
  skip: number = 0,
  options: ExecuteProductQueryOptions = {},
): Promise<ProductWithRelations[]> {
  const { omitProductAttributes = false } = options;
  const baseInclude = getBaseInclude();
  const withOptionalAttrs = () =>
    omitProductAttributes ? baseInclude : { ...baseInclude, ...getProductAttributesInclude() };

  try {
    const products = await db.product.findMany({
      where,
      include: withOptionalAttrs(),
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });
    return products as unknown as ProductWithRelations[];
  } catch (error: unknown) {
    // If productAttributes table doesn't exist, retry without it
    if (isProductAttributesError(error)) {
      logger.warn('product_attributes table not found, fetching without it', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      return executeWithoutProductAttributes(where, limit, skip, options);
    }

    if (isVariantAttributesError(error)) {
      logger.warn('product_variants.attributes column not found, attempting to create it');
      try {
        await ensureProductVariantAttributesColumn();
        const products = await db.product.findMany({
          where,
          include: baseInclude,
          skip,
          take: limit,
        });
        return products as unknown as ProductWithRelations[];
      } catch (attributesError: unknown) {
        return handleAttributesError(attributesError, where, limit, skip, options);
      }
    }

    if (isAttributeValuesColorsError(error)) {
      logger.warn('attribute_values.colors column not found, fetching without attributeValue', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      return executeWithoutAttributeValue(where, limit, skip, options);
    }

    throw error;
  }
}

function buildPreferredLocales(lang: string): string[] {
  const normalized = lang.trim().toLowerCase();
  return normalized === "en" ? ["en"] : [normalized, "en"];
}

/**
 * Lean listing query for PLP/home strips.
 * Uses `select` to keep payload and serialization small.
 */
export async function executeProductListingQuery(
  where: Prisma.ProductWhereInput,
  limit: number,
  skip: number = 0,
  options: ExecuteProductListingQueryOptions = {},
): Promise<ProductWithRelations[]> {
  const locales = buildPreferredLocales(options.lang ?? "en");
  const includeProductAttributes = !options.omitProductAttributes;

  const orderBy = options.orderBy ?? { createdAt: "desc" };

  const products = await db.product.findMany({
    where,
    orderBy,
    skip,
    take: limit,
    select: {
      id: true,
      brandId: true,
      primaryCategoryId: true,
      discountPercent: true,
      warrantyYears: true,
      createdAt: true,
      media: true,
      translations: {
        where: { locale: { in: locales } },
        select: {
          locale: true,
          title: true,
          slug: true,
          subtitle: true,
        },
      },
      brand: {
        select: {
          id: true,
          slug: true,
          logoUrl: true,
          translations: {
            where: { locale: { in: locales } },
            select: {
              locale: true,
              name: true,
            },
          },
        },
      },
      variants: {
        where: { published: true },
        take: PRODUCT_LISTING_VARIANTS_PER_PRODUCT_LIMIT,
        select: {
          id: true,
          price: true,
          compareAtPrice: true,
          stock: true,
          attributes: true,
          options: {
            select: {
              attributeKey: true,
              value: true,
              attributeValue: {
                select: {
                  value: true,
                  imageUrl: true,
                  colors: true,
                  attribute: { select: { key: true } },
                  translations: {
                    where: { locale: { in: locales } },
                    select: { locale: true, label: true },
                  },
                },
              },
            },
          },
        },
      },
      labels: true,
      categories: {
        select: {
          id: true,
          translations: {
            where: { locale: { in: locales } },
            select: { locale: true, slug: true, title: true },
          },
        },
      },
      productAttributes: includeProductAttributes
        ? {
            select: {
              attribute: {
                select: {
                  key: true,
                  translations: {
                    where: { locale: { in: locales } },
                    select: { locale: true, name: true },
                  },
                  values: {
                    select: {
                      value: true,
                      imageUrl: true,
                      colors: true,
                      translations: {
                        where: { locale: { in: locales } },
                        select: { locale: true, label: true },
                      },
                    },
                  },
                },
              },
            },
          }
        : false,
    },
  });

  return products as unknown as ProductWithRelations[];
}

/**
 * Execute query without productAttributes (fallback)
 */
async function executeWithoutProductAttributes(
  where: Prisma.ProductWhereInput,
  limit: number,
  skip: number = 0,
  options: ExecuteProductQueryOptions = {},
): Promise<ProductWithRelations[]> {
  const baseInclude = getBaseInclude();

  try {
    const products = await db.product.findMany({
      where,
      include: baseInclude,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });
    return products as unknown as ProductWithRelations[];
  } catch (retryError: unknown) {
    if (isVariantAttributesError(retryError)) {
      logger.warn('product_variants.attributes column not found, attempting to create it');
      try {
        await ensureProductVariantAttributesColumn();
        const products = await db.product.findMany({
          where,
          include: baseInclude,
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        });
        return products as unknown as ProductWithRelations[];
      } catch (attributesError: unknown) {
        return handleAttributesError(attributesError, where, limit, skip, options);
      }
    }

    if (isAttributeValuesColorsError(retryError)) {
      logger.warn('attribute_values.colors column not found, fetching without attributeValue', { 
        error: retryError instanceof Error ? retryError.message : String(retryError) 
      });
      return executeWithoutAttributeValue(where, limit, skip, options);
    }

    throw retryError;
  }
}

/**
 * Handle attributes-related errors
 */
async function handleAttributesError(
  error: unknown,
  where: Prisma.ProductWhereInput,
  limit: number,
  skip: number = 0,
  options: ExecuteProductQueryOptions = {},
): Promise<ProductWithRelations[]> {
  if (isAttributeValuesColorsError(error)) {
    logger.warn('attribute_values.colors column not found, fetching without attributeValue', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    return executeWithoutAttributeValue(where, limit, skip, options);
  }
  throw error;
}

/**
 * Execute query without attributeValue relation (fallback)
 */
async function executeWithoutAttributeValue(
  where: Prisma.ProductWhereInput,
  limit: number,
  skip: number = 0,
  options: ExecuteProductQueryOptions = {},
): Promise<ProductWithRelations[]> {
  const { omitProductAttributes = false } = options;
  const baseIncludeWithoutAttributeValue = getBaseIncludeWithoutAttributeValue();

  const includeWithAttrs = omitProductAttributes
    ? baseIncludeWithoutAttributeValue
    : {
        ...baseIncludeWithoutAttributeValue,
        ...getProductAttributesInclude(),
      };

  try {
    const products = await db.product.findMany({
      where,
      include: includeWithAttrs,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    });
    return products as unknown as ProductWithRelations[];
  } catch (productAttrError: unknown) {
    // If productAttributes also fails, try without it
    if (isProductAttributesError(productAttrError)) {
      const products = await db.product.findMany({
        where,
        include: baseIncludeWithoutAttributeValue,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      });
      return products as unknown as ProductWithRelations[];
    }
    throw productAttrError;
  }
}

