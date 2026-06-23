import { Prisma } from "@white-shop/db/prisma";
import { db } from "@white-shop/db";
import { logger } from "../../../utils/logger";

export { findProductIdsBySkuSearch } from "@/lib/product-search/find-product-ids-by-sku";

/**
 * Base include configuration for product list queries
 */
const getProductListInclude = (locale: string) => ({
  translations: {
    where: { locale },
    take: 1,
    select: { slug: true, title: true },
  },
  variants: {
    where: { published: true },
    take: 1,
    orderBy: { price: "asc" as const },
    select: { price: true, stock: true, compareAtPrice: true, imageUrl: true },
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
});

/**
 * Check if error is related to productAttributes table
 */
export function isProductAttributesError(error: unknown): boolean {
  const errorObj = error as { code?: string; message?: string };
  const errorMessage = error instanceof Error ? error.message : String(error);
  return (errorObj && typeof errorObj === 'object' && 'code' in errorObj && errorObj.code === 'P2021') || 
         errorMessage.includes('productAttributes') || 
         errorMessage.includes('does not exist');
}

/**
 * Execute admin product list via listing read model (correct global sort/pagination).
 */
export async function executeAdminProductListViaListingRows(
  where: Prisma.ProductListingRowWhereInput,
  orderBy: Prisma.ProductListingRowOrderByWithRelationInput[],
  skip: number,
  take: number,
  locale: string,
) {
  const queryStartTime = Date.now();
  const listInclude = getProductListInclude(locale);

  const [rows, total] = await Promise.all([
    db.productListingRow.findMany({
      where,
      orderBy,
      skip,
      take,
      select: { productId: true },
    }),
    db.productListingRow.count({ where }),
  ]);

  if (rows.length === 0) {
    return { products: [], total };
  }

  const productIds = rows.map((row) => row.productId);
  const products = await db.product.findMany({
    where: { id: { in: productIds }, deletedAt: null },
    include: listInclude,
  });

  const byId = new Map(products.map((product) => [product.id, product]));
  const ordered = productIds
    .map((id) => byId.get(id))
    .filter((product): product is (typeof products)[number] => product !== undefined);

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

