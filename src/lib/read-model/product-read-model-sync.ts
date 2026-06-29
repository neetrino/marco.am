import { db } from '@white-shop/db';
import { Prisma } from '@white-shop/db/prisma';
import {
  buildProductListingRowsForLocales,
  type CategoryAncestry,
} from '@/lib/read-model/product-listing-row-builder';
import {
  deleteProductPdpReadModel,
  rebuildProductPdpReadModel,
  syncProductPdpReadModel,
  syncProductPdpReadModelBatch,
} from '@/lib/read-model/product-pdp-read-model-sync';
import { invalidateProductReadCaches } from '@/lib/services/read-through-json-cache';
import {
  loadListingDiscountSettingsUncached,
  toActiveListingDiscountSettings,
  type ListingDiscountSettings,
} from '@/lib/services/listing-discount-settings';

export const PRODUCT_LISTING_READ_MODEL_DEFAULT_LOCALES = ['en', 'hy', 'ru', 'ka'] as const;

const DEFAULT_LISTING_BATCH_SIZE = 100;
const DEFAULT_AFFECTED_LISTING_BATCH_SIZE = 500;

type ProductListingReadModelRebuildOptions = {
  locales?: readonly string[];
  batchSize?: number;
  logProgress?: (message: string) => void;
};

type ProductListingReadModelBatchSyncOptions = Pick<
  ProductListingReadModelRebuildOptions,
  'locales' | 'batchSize' | 'logProgress'
>;

function normalizeLocales(locales: readonly string[] | undefined): string[] {
  const source = locales?.length ? locales : PRODUCT_LISTING_READ_MODEL_DEFAULT_LOCALES;
  return [...new Set(source.map((locale) => locale.trim().toLowerCase()).filter(Boolean))];
}

function normalizeBatchSize(value: number | undefined, fallback: number, max: number): number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
    ? Math.min(value, max)
    : fallback;
}

/**
 * Raw discount settings. The listing builder consumes the active (expiry-resolved) form,
 * while the PDP sync re-resolves them itself, so this returns the raw settings.
 */
async function loadDiscountSettings(): Promise<ListingDiscountSettings> {
  return loadListingDiscountSettingsUncached();
}

/** Category parent map + per-locale slugs, used to denormalize ancestor categories into rows. */
async function loadCategoryAncestry(): Promise<CategoryAncestry> {
  const categories = await db.category.findMany({
    where: { published: true, deletedAt: null },
    select: {
      id: true,
      parentId: true,
      translations: { select: { locale: true, slug: true } },
    },
  });

  const parentById = new Map<string, string | null>();
  const slugByIdLocale = new Map<string, string>();
  for (const category of categories) {
    parentById.set(category.id, category.parentId ?? null);
    for (const translation of category.translations) {
      const slug = translation.slug?.trim();
      if (slug) {
        slugByIdLocale.set(`${category.id}:${translation.locale}`, slug);
      }
    }
  }
  return { parentById, slugByIdLocale };
}

function productReadModelSelect(locales: readonly string[]) {
  return {
    id: true,
    brandId: true,
    primaryCategoryId: true,
    categoryIds: true,
    media: true,
    discountType: true,
    discountValue: true,
    discountExpiresAt: true,
    warrantyYears: true,
    published: true,
    publishedAt: true,
    deletedAt: true,
    createdAt: true,
    updatedAt: true,
    translations: {
      where: { locale: { in: [...locales] } },
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
          where: { locale: { in: [...locales] } },
          select: { locale: true, name: true },
        },
      },
    },
    variants: {
      where: { published: true },
      orderBy: [{ price: 'asc' }, { position: 'asc' }],
      select: {
        id: true,
        imageUrl: true,
        price: true,
        discountType: true,
        discountValue: true,
        discountExpiresAt: true,
        stock: true,
        published: true,
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
                translations: {
                  where: { locale: { in: [...locales] } },
                  select: { locale: true, label: true },
                },
                attribute: {
                  select: {
                    key: true,
                    type: true,
                    filterable: true,
                    translations: {
                      where: { locale: { in: [...locales] } },
                      select: { locale: true, name: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    attributeValues: {
      select: {
        attributeValue: {
          select: {
            value: true,
            imageUrl: true,
            colors: true,
            translations: {
              where: { locale: { in: [...locales] } },
              select: { locale: true, label: true },
            },
            attribute: {
              select: {
                key: true,
                type: true,
                filterable: true,
                translations: {
                  where: { locale: { in: [...locales] } },
                  select: { locale: true, name: true },
                },
              },
            },
          },
        },
      },
    },
    labels: {
      select: {
        id: true,
        type: true,
        value: true,
        position: true,
        color: true,
      },
    },
    categories: {
      select: {
        id: true,
        translations: {
          where: { locale: { in: [...locales] } },
          select: { locale: true, title: true, slug: true },
        },
      },
    },
  } satisfies Prisma.ProductSelect;
}

async function fetchProductBatch(args: {
  cursorId?: string;
  batchSize: number;
  locales: readonly string[];
}) {
  return db.product.findMany({
    where: {
      deletedAt: null,
    },
    orderBy: { id: 'asc' },
    take: args.batchSize,
    ...(args.cursorId ? { cursor: { id: args.cursorId }, skip: 1 } : {}),
    select: productReadModelSelect(args.locales),
  });
}

async function fetchProductForReadModel(productId: string, locales: readonly string[]) {
  return db.product.findUnique({
    where: { id: productId },
    select: productReadModelSelect(locales),
  });
}

async function replaceProductListingRows(args: {
  productId: string;
  rows: Prisma.ProductListingRowCreateManyInput[];
}) {
  return db.$transaction(async (tx) => {
    const deleteResult = await tx.productListingRow.deleteMany({
      where: { productId: args.productId },
    });
    if (args.rows.length > 0) {
      await tx.productListingRow.createMany({ data: args.rows });
    }
    return deleteResult;
  });
}

export async function syncProductListingReadModel(
  productId: string,
  options: Pick<ProductListingReadModelRebuildOptions, 'locales'> = {},
) {
  const startedAt = Date.now();
  const locales = normalizeLocales(options.locales);
  const [discountSettings, categoryAncestry, product] = await Promise.all([
    loadDiscountSettings(),
    loadCategoryAncestry(),
    fetchProductForReadModel(productId, locales),
  ]);

  if (!product || product.deletedAt) {
    const deleted = await db.productListingRow.deleteMany({ where: { productId } });
    await syncProductPdpReadModel(productId, { locales, discountSettings });
    await invalidateProductReadCaches();
    return {
      productId,
      rowsDeleted: deleted.count,
      rowsWritten: 0,
      durationMs: Date.now() - startedAt,
      locales,
    };
  }

  const rows = buildProductListingRowsForLocales({
    product,
    locales,
    discountSettings: toActiveListingDiscountSettings(discountSettings),
    categoryAncestry,
    rebuiltAt: new Date(),
  });

  const deleted = await replaceProductListingRows({ productId, rows });
  await syncProductPdpReadModel(productId, { locales, discountSettings });
  await invalidateProductReadCaches();

  return {
    productId,
    rowsDeleted: deleted.count,
    rowsWritten: rows.length,
    durationMs: Date.now() - startedAt,
    locales,
  };
}

export async function syncProductListingReadModelBatch(
  productIds: readonly string[],
  options: ProductListingReadModelBatchSyncOptions = {},
) {
  const startedAt = Date.now();
  const uniqueProductIds = [...new Set(productIds.filter(Boolean))];
  if (uniqueProductIds.length === 0) {
    return {
      productsSynced: 0,
      rowsDeleted: 0,
      rowsWritten: 0,
      durationMs: Date.now() - startedAt,
      locales: normalizeLocales(options.locales),
    };
  }

  const locales = normalizeLocales(options.locales);
  const batchSize = normalizeBatchSize(options.batchSize, DEFAULT_AFFECTED_LISTING_BATCH_SIZE, 500);
  const [discountSettings, categoryAncestry] = await Promise.all([
    loadDiscountSettings(),
    loadCategoryAncestry(),
  ]);
  const activeDiscountSettings = toActiveListingDiscountSettings(discountSettings);
  let rowsDeleted = 0;
  let rowsWritten = 0;
  let productsSynced = 0;

  for (let index = 0; index < uniqueProductIds.length; index += batchSize) {
    const chunkIds = uniqueProductIds.slice(index, index + batchSize);
    const products = await db.product.findMany({
      where: { id: { in: chunkIds } },
      select: productReadModelSelect(locales),
    });
    const rebuiltAt = new Date();
    const rows = products
      .filter((product) => !product.deletedAt)
      .flatMap((product) =>
        buildProductListingRowsForLocales({
          product,
          locales,
          discountSettings: activeDiscountSettings,
          categoryAncestry,
          rebuiltAt,
        }),
      );

    const deleted = await db.$transaction(async (tx) => {
      const deleteResult = await tx.productListingRow.deleteMany({
        where: { productId: { in: chunkIds } },
      });
      if (rows.length > 0) {
        await tx.productListingRow.createMany({ data: rows });
      }
      return deleteResult;
    });

    rowsDeleted += deleted.count;
    rowsWritten += rows.length;
    productsSynced += chunkIds.length;
    options.logProgress?.(
      `[product-listing-read-model] synced product=${productsSynced}/${uniqueProductIds.length} rows=${rowsWritten}`,
    );
  }

  await syncProductPdpReadModelBatch(uniqueProductIds, {
    locales,
    discountSettings,
    batchSize,
    logProgress: options.logProgress,
  });
  await invalidateProductReadCaches();

  return {
    productsSynced,
    rowsDeleted,
    rowsWritten,
    durationMs: Date.now() - startedAt,
    locales,
  };
}

export async function deleteProductListingReadModel(productId: string) {
  const startedAt = Date.now();
  const deleted = await db.productListingRow.deleteMany({ where: { productId } });
  await deleteProductPdpReadModel(productId);
  await invalidateProductReadCaches();
  return {
    productId,
    rowsDeleted: deleted.count,
    durationMs: Date.now() - startedAt,
  };
}

export async function rebuildProductListingReadModel(
  options: ProductListingReadModelRebuildOptions = {},
) {
  const startedAt = Date.now();
  const locales = normalizeLocales(options.locales);
  const batchSize = normalizeBatchSize(options.batchSize, DEFAULT_LISTING_BATCH_SIZE, 500);
  const [discountSettings, categoryAncestry] = await Promise.all([
    loadDiscountSettings(),
    loadCategoryAncestry(),
  ]);
  const activeDiscountSettings = toActiveListingDiscountSettings(discountSettings);
  await db.productListingRow.deleteMany({});

  let cursorId: string | undefined;
  let productsRead = 0;
  let rowsWritten = 0;

  for (;;) {
    const products = await fetchProductBatch({
      cursorId,
      batchSize,
      locales,
    });
    if (products.length === 0) {
      break;
    }

    const rebuiltAt = new Date();
    const rows = products.flatMap((product) =>
      buildProductListingRowsForLocales({
        product,
        locales,
        discountSettings: activeDiscountSettings,
        categoryAncestry,
        rebuiltAt,
      }),
    );

    if (rows.length > 0) {
      await db.productListingRow.createMany({ data: rows });
      rowsWritten += rows.length;
    }

    productsRead += products.length;
    cursorId = products[products.length - 1]?.id;
    options.logProgress?.(
      `[product-listing-read-model] processed products=${productsRead} rows=${rowsWritten}`,
    );
  }

  const pdpResult = await rebuildProductPdpReadModel({
    locales,
    discountSettings,
    logProgress: options.logProgress,
  });
  await invalidateProductReadCaches();

  return {
    productsRead,
    rowsWritten,
    pdpRowsWritten: pdpResult.rowsWritten,
    durationMs: Date.now() - startedAt,
    locales,
  };
}

export async function syncProductListingReadModelByBrand(brandId: string) {
  const linkedProductCount = await db.product.count({
    where: { brandId, deletedAt: null },
  });
  if (linkedProductCount === 0) {
    return {
      productsSynced: 0,
      rowsDeleted: 0,
      rowsWritten: 0,
      durationMs: 0,
      locales: [],
    };
  }

  const products = await db.product.findMany({
    where: { brandId, deletedAt: null },
    select: { id: true },
  });
  return syncProductListingReadModelBatch(products.map((product) => product.id));
}

export async function syncProductListingReadModelByCategoryIds(categoryIds: readonly string[]) {
  const uniqueCategoryIds = [...new Set(categoryIds.filter(Boolean))];
  if (uniqueCategoryIds.length === 0) {
    return syncProductListingReadModelBatch([]);
  }

  const products = await db.product.findMany({
    where: {
      deletedAt: null,
      OR: [
        { primaryCategoryId: { in: uniqueCategoryIds } },
        { categoryIds: { hasSome: uniqueCategoryIds } },
        { categories: { some: { id: { in: uniqueCategoryIds } } } },
      ],
    },
    select: { id: true },
  });
  return syncProductListingReadModelBatch(products.map((product) => product.id));
}

export async function syncProductListingReadModelByAttributeId(attributeId: string) {
  const [productAttributes, productAttributeValues, variantOptions] = await Promise.all([
    db.productAttribute.findMany({
      where: { attributeId },
      select: { productId: true },
    }),
    db.productAttributeValue.findMany({
      where: { attributeId },
      select: { productId: true },
    }),
    db.productVariantOption.findMany({
      where: {
        OR: [{ attributeId }, { attributeValue: { attributeId } }],
      },
      select: {
        variant: {
          select: { productId: true },
        },
      },
    }),
  ]);

  return syncProductListingReadModelBatch([
    ...productAttributes.map((row) => row.productId),
    ...productAttributeValues.map((row) => row.productId),
    ...variantOptions.map((row) => row.variant.productId),
  ]);
}

export async function syncProductListingReadModelByAttributeValueId(attributeValueId: string) {
  const [productAttributeValues, variantOptions] = await Promise.all([
    db.productAttributeValue.findMany({
      where: { attributeValueId },
      select: { productId: true },
    }),
    db.productVariantOption.findMany({
      where: { valueId: attributeValueId },
      select: {
        variant: {
          select: { productId: true },
        },
      },
    }),
  ]);

  return syncProductListingReadModelBatch([
    ...productAttributeValues.map((row) => row.productId),
    ...variantOptions.map((row) => row.variant.productId),
  ]);
}
