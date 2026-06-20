import { Prisma } from "@white-shop/db/prisma";
import { db } from "@white-shop/db";
import { ensureProductVariantAttributesColumn } from "../../../utils/db-ensure";
import { logger } from "../../../utils/logger";

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
 * Check if error is related to product_variants.attributes column
 */
function isVariantAttributesError(error: unknown): boolean {
  const errorMessage = error instanceof Error ? error.message : String(error);
  return errorMessage.includes('product_variants.attributes') || 
         (errorMessage.includes('attributes') && errorMessage.includes('does not exist'));
}

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

const SKU_SEARCH_PRODUCT_ID_LIMIT = 200;

/** Resolve product IDs whose variant SKU matches the admin search term. */
export async function findProductIdsBySkuSearch(search: string): Promise<string[]> {
  const term = search.trim();
  if (!term) {
    return [];
  }

  const rows = await db.productVariant.findMany({
    where: {
      sku: { contains: term, mode: "insensitive" },
      product: { deletedAt: null },
    },
    select: { productId: true },
    distinct: ["productId"],
    take: SKU_SEARCH_PRODUCT_ID_LIMIT,
  });

  return rows.map((row) => row.productId);
}

/**
 * Execute product list query with error handling
 */
export async function executeProductListQuery(
  where: Prisma.ProductWhereInput,
  orderBy: Prisma.ProductOrderByWithRelationInput,
  skip: number,
  take: number,
  locale: string,
) {
  const queryStartTime = Date.now();
  const listInclude = getProductListInclude(locale);

  try {
    logger.debug('Fetching products and count in parallel...');
    const countPromise = db.product.count({ where });
    const productsPromise = db.product.findMany({
      where,
      skip,
      take,
      orderBy,
      include: listInclude,
    });

    const [products, total] = await Promise.all([productsPromise, countPromise]);

    const queryTime = Date.now() - queryStartTime;
    logger.debug(`Products list query completed in ${queryTime}ms`, {
      found: products.length,
      total,
    });

    return { products, total };
  } catch (error: unknown) {
    // If product_variants.attributes column doesn't exist, try to create it and retry
    if (isVariantAttributesError(error)) {
      logger.warn('product_variants.attributes column not found, attempting to create it...');
      try {
        await ensureProductVariantAttributesColumn();
        const [products, total] = await Promise.all([
          db.product.findMany({
            where,
            skip,
            take,
            orderBy,
            include: listInclude,
          }),
          db.product.count({ where }),
        ]);

        const queryTime = Date.now() - queryStartTime;
        logger.debug(`Products list query completed after retry in ${queryTime}ms`, {
          found: products.length,
          total,
        });

        return { products, total };
      } catch (retryError: unknown) {
        const queryTime = Date.now() - queryStartTime;
        const errorMessage = retryError instanceof Error ? retryError.message : String(retryError);
        logger.error(`Database query error after ${queryTime}ms (after retry)`, { error: errorMessage });
        throw retryError;
      }
    }

    const queryTime = Date.now() - queryStartTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorObj = error as { code?: string; meta?: unknown; stack?: string };
    logger.error(`Database query error after ${queryTime}ms`, {
      error: {
        message: errorMessage,
        code: errorObj?.code,
        meta: errorObj?.meta,
        stack: errorObj?.stack?.substring(0, 500),
      },
    });
    
    throw error;
  }
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

