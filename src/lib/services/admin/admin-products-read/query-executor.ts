import { Prisma } from "@white-shop/db/prisma";
import { db } from "@white-shop/db";
import { logger } from "../../../utils/logger";

/**
 * Admin products list always loads English title/slug, independent of UI language.
 * Listing-row filters still use the request locale for pagination/search.
 */
export const ADMIN_LIST_PRODUCT_TITLE_LOCALE = "en" as const;

/**
 * Base include configuration for product list queries.
 * Loads all published variants (lean select) so list images can fall back across variants.
 */
const getProductListInclude = () => ({
  translations: {
    where: { locale: ADMIN_LIST_PRODUCT_TITLE_LOCALE },
    take: 1,
    select: { slug: true, title: true },
  },
  variants: {
    where: { published: true },
    orderBy: { price: "asc" as const },
    select: {
      price: true,
      stock: true,
      sku: true,
      imageUrl: true,
      published: true,
      discountType: true,
      discountValue: true,
      discountExpiresAt: true,
    },
  },
});

/**
 * Base include configuration for product detail queries
 */
const getProductDetailInclude = () => ({
  translations: true,
  brand: {
    include: {
      translations: true,
    },
  },
  categories: {
    include: {
      translations: true,
    },
  },
  variants: {
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
    orderBy: {
      position: "asc" as const,
    },
  },
  labels: true,
});

/**
 * ProductAttributes include configuration
 */
const getProductAttributesInclude = () => ({
  productAttributes: {
    include: {
      attribute: true,
    },
  },
  attributeValues: {
    select: {
      attributeId: true,
      attributeValueId: true,
    },
  },
});

/**
 * Check if error is related to productAttributes table
 */
export function isProductAttributesError(error: unknown): boolean {
  const errorObj = error as { code?: string; message?: string };
  const errorMessage = error instanceof Error ? error.message : String(error);
  const mentionsAttributeRelations =
    errorMessage.includes("productAttributes") ||
    errorMessage.includes("product_attribute_values") ||
    errorMessage.includes("attributeValues");

  return (
    (typeof errorObj.code === "string" && errorObj.code === "P2021") ||
    mentionsAttributeRelations ||
    errorMessage.includes("does not exist")
  );
}

/**
 * Execute admin product list via listing read model (correct global sort/pagination).
 * Product title/slug always come from the English translation include.
 * Listing-row `image` is selected in the same batch for thumbnail fallback.
 */
export async function executeAdminProductListViaListingRows(
  where: Prisma.ProductListingRowWhereInput,
  orderBy: Prisma.ProductListingRowOrderByWithRelationInput[],
  skip: number,
  take: number,
) {
  const queryStartTime = Date.now();
  const listInclude = getProductListInclude();

  const [rows, total] = await Promise.all([
    db.productListingRow.findMany({
      where,
      orderBy,
      skip,
      take,
      select: { productId: true, image: true },
    }),
    db.productListingRow.count({ where }),
  ]);

  if (rows.length === 0) {
    return { products: [], total };
  }

  const productIds = rows.map((row) => row.productId);
  const listingImageByProductId = new Map(
    rows.map((row) => [row.productId, row.image ?? null] as const),
  );

  const products = await db.product.findMany({
    where: { id: { in: productIds }, deletedAt: null },
    include: listInclude,
  });

  const byId = new Map(products.map((product) => [product.id, product]));
  const ordered = productIds
    .map((id) => {
      const product = byId.get(id);
      if (!product) {
        return undefined;
      }
      return {
        ...product,
        listingRowImage: listingImageByProductId.get(id) ?? null,
      };
    })
    .filter(
      (product): product is NonNullable<typeof product> => product !== undefined,
    );

  const queryTime = Date.now() - queryStartTime;
  logger.debug(`Admin listing-row query completed in ${queryTime}ms`, {
    found: ordered.length,
    total,
  });

  return { products: ordered, total };
}

/**
 * Execute product detail query with error handling
 */
export async function executeProductDetailQuery(productId: string) {
  try {
    const product = await db.product.findUnique({
      where: { id: productId },
      include: {
        ...getProductDetailInclude(),
        ...getProductAttributesInclude(),
      },
    });
    return product;
  } catch (error: unknown) {
    // If productAttributes table doesn't exist, retry without it
    if (isProductAttributesError(error)) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.warn('productAttributes table not found, fetching without it', { error: errorMessage });
      const product = await db.product.findUnique({
        where: { id: productId },
        include: getProductDetailInclude(),
      });
      return product;
    }
    throw error;
  }
}
