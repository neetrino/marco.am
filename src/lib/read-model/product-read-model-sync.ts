import { db } from '@white-shop/db';
import { Prisma } from '@white-shop/db/prisma';
import {
  buildProductFacetCountRows,
  type CategoryFacetLabel,
  type ProductFacetScopeFilter,
} from '@/lib/read-model/product-facet-count-builder';
import {
  buildProductListingRowsForLocales,
  type ProductListingReadModelDiscountSettings,
} from '@/lib/read-model/product-listing-row-builder';

export const PRODUCT_LISTING_READ_MODEL_DEFAULT_LOCALES = ['en', 'hy', 'ru', 'ka'] as const;

const DEFAULT_LISTING_BATCH_SIZE = 100;
const DEFAULT_AFFECTED_LISTING_BATCH_SIZE = 500;
const DEFAULT_FACET_BATCH_SIZE = 1_000;
const DISCOUNT_KEYS = ['globalDiscount', 'categoryDiscounts', 'brandDiscounts'] as const;

export type ProductListingReadModelRebuildOptions = {
  locales?: readonly string[];
  batchSize?: number;
  logProgress?: (message: string) => void;
};

export type ProductFacetCountsRebuildOptions = {
  batchSize?: number;
  logProgress?: (message: string) => void;
};

export type ProductListingReadModelBatchSyncOptions = Pick<
  ProductListingReadModelRebuildOptions,
  'locales' | 'batchSize' | 'logProgress'
>;

type AffectedFacetScopes = {
  includeCatalog: boolean;
  categoryScopeKeys: string[];
};

function normalizeLocales(locales: readonly string[] | undefined): string[] {
  const source = locales?.length ? locales : PRODUCT_LISTING_READ_MODEL_DEFAULT_LOCALES;
  return [...new Set(source.map((locale) => locale.trim().toLowerCase()).filter(Boolean))];
}

function normalizeBatchSize(value: number | undefined, fallback: number, max: number): number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
    ? Math.min(value, max)
    : fallback;
}

function parseJsonRecord(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  const out: Record<string, number> = {};
  for (const [key, raw] of Object.entries(value)) {
    const numeric = Number(raw);
    if (Number.isFinite(numeric) && numeric > 0) {
      out[key] = numeric;
    }
  }
  return out;
}

function collectCategoryScopeKeysFromListingRows(
  rows: ReadonlyArray<{ categorySlugs: readonly string[] }>,
): string[] {
  return [
    ...new Set(
      rows.flatMap((row) => row.categorySlugs.map((slug) => slug.trim()).filter(Boolean)),
    ),
  ];
}

function collectCategoryScopeKeysFromCreateRows(rows: readonly Prisma.ProductListingRowCreateManyInput[]): string[] {
  return [
    ...new Set(
      rows.flatMap((row) =>
        Array.isArray(row.categorySlugs)
          ? row.categorySlugs.map((slug) => slug.trim()).filter(Boolean)
          : [],
      ),
    ),
  ];
}

async function loadDiscountSettings(): Promise<ProductListingReadModelDiscountSettings> {
  const rows = await db.settings.findMany({
    where: { key: { in: [...DISCOUNT_KEYS] } },
  });

  return {
    globalDiscount: Number(rows.find((row) => row.key === 'globalDiscount')?.value) || 0,
    categoryDiscounts: parseJsonRecord(rows.find((row) => row.key === 'categoryDiscounts')?.value),
    brandDiscounts: parseJsonRecord(rows.find((row) => row.key === 'brandDiscounts')?.value),
  };
}

function productReadModelSelect(locales: readonly string[]) {
  return {
    id: true,
    brandId: true,
    primaryCategoryId: true,
    categoryIds: true,
    media: true,
    discountPercent: true,
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
        compareAtPrice: true,
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
      published: true,
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
  const [discountSettings, product, previousRows] = await Promise.all([
    loadDiscountSettings(),
    fetchProductForReadModel(productId, locales),
    db.productListingRow.findMany({
      where: { productId },
      select: { categorySlugs: true },
    }),
  ]);
  const previousCategoryScopeKeys = collectCategoryScopeKeysFromListingRows(previousRows);

  if (!product || product.published === false || product.deletedAt) {
    const deleted = await db.productListingRow.deleteMany({ where: { productId } });
    return {
      productId,
      rowsDeleted: deleted.count,
      rowsWritten: 0,
      durationMs: Date.now() - startedAt,
      locales,
      affectedFacetScopes: {
        includeCatalog: deleted.count > 0,
        categoryScopeKeys: previousCategoryScopeKeys,
      },
    };
  }

  const rows = buildProductListingRowsForLocales({
    product,
    locales,
    discountSettings,
    rebuiltAt: new Date(),
  });

  const deleted = await replaceProductListingRows({ productId, rows });

  return {
    productId,
    rowsDeleted: deleted.count,
    rowsWritten: rows.length,
    durationMs: Date.now() - startedAt,
    locales,
    affectedFacetScopes: {
      includeCatalog: deleted.count > 0 || rows.length > 0,
      categoryScopeKeys: [
        ...new Set([
          ...previousCategoryScopeKeys,
          ...collectCategoryScopeKeysFromCreateRows(rows),
        ]),
      ],
    },
  };
}

export async function syncProductListingReadModelBatch(
  productIds: readonly string[],
  options: ProductListingReadModelBatchSyncOptions = {},
) {
  const startedAt = Date.now();
  const uniqueProductIds = [...new Set(productIds.filter(Boolean))];
  const locales = normalizeLocales(options.locales);
  const batchSize = normalizeBatchSize(options.batchSize, DEFAULT_AFFECTED_LISTING_BATCH_SIZE, 500);
  const discountSettings = await loadDiscountSettings();
  let rowsDeleted = 0;
  let rowsWritten = 0;
  let productsSynced = 0;
  const affectedCategoryScopeKeys = new Set<string>();

  for (let index = 0; index < uniqueProductIds.length; index += batchSize) {
    const chunkIds = uniqueProductIds.slice(index, index + batchSize);
    const [products, previousRows] = await Promise.all([
      db.product.findMany({
        where: { id: { in: chunkIds } },
        select: productReadModelSelect(locales),
      }),
      db.productListingRow.findMany({
        where: { productId: { in: chunkIds } },
        select: { categorySlugs: true },
      }),
    ]);
    for (const scopeKey of collectCategoryScopeKeysFromListingRows(previousRows)) {
      affectedCategoryScopeKeys.add(scopeKey);
    }
    const rebuiltAt = new Date();
    const rows = products
      .filter((product) => product.published !== false && !product.deletedAt)
      .flatMap((product) =>
        buildProductListingRowsForLocales({
          product,
          locales,
          discountSettings,
          rebuiltAt,
        }),
      );
    for (const scopeKey of collectCategoryScopeKeysFromCreateRows(rows)) {
      affectedCategoryScopeKeys.add(scopeKey);
    }

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

  return {
    productsSynced,
    rowsDeleted,
    rowsWritten,
    durationMs: Date.now() - startedAt,
    locales,
    affectedFacetScopes: {
      includeCatalog: uniqueProductIds.length > 0,
      categoryScopeKeys: [...affectedCategoryScopeKeys],
    },
  };
}

export async function deleteProductListingReadModel(productId: string) {
  const startedAt = Date.now();
  const previousRows = await db.productListingRow.findMany({
    where: { productId },
    select: { categorySlugs: true },
  });
  const deleted = await db.productListingRow.deleteMany({ where: { productId } });
  return {
    productId,
    rowsDeleted: deleted.count,
    durationMs: Date.now() - startedAt,
    affectedFacetScopes: {
      includeCatalog: deleted.count > 0,
      categoryScopeKeys: collectCategoryScopeKeysFromListingRows(previousRows),
    },
  };
}

export async function rebuildProductListingReadModel(
  options: ProductListingReadModelRebuildOptions = {},
) {
  const startedAt = Date.now();
  const locales = normalizeLocales(options.locales);
  const batchSize = normalizeBatchSize(options.batchSize, DEFAULT_LISTING_BATCH_SIZE, 500);
  const discountSettings = await loadDiscountSettings();
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
        discountSettings,
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

  return {
    productsRead,
    rowsWritten,
    durationMs: Date.now() - startedAt,
    locales,
  };
}

async function loadCategoryLabels(): Promise<CategoryFacetLabel[]> {
  const categories = await db.category.findMany({
    where: {
      published: true,
      deletedAt: null,
    },
    select: {
      id: true,
      parentId: true,
      position: true,
      translations: {
        select: {
          locale: true,
          slug: true,
          title: true,
        },
      },
    },
  });

  return categories.flatMap((category) =>
    category.translations.map((translation) => ({
      id: category.id,
      parentId: category.parentId,
      locale: translation.locale,
      slug: translation.slug,
      title: translation.title,
      position: category.position,
    })),
  );
}

async function loadListingRowsForFacets() {
  return db.productListingRow.findMany({
    where: {
      isPublished: true,
      deletedAt: null,
    },
    select: {
      productId: true,
      locale: true,
      brandId: true,
      brandSlug: true,
      brandName: true,
      brandLogoUrl: true,
      categoryIds: true,
      colors: true,
      sizeTokens: true,
      technicalSpecs: true,
      priceSort: true,
    },
  });
}

export async function rebuildProductFacetCountsFromReadModel(
  options: ProductFacetCountsRebuildOptions = {},
) {
  const startedAt = Date.now();
  const batchSize = normalizeBatchSize(options.batchSize, DEFAULT_FACET_BATCH_SIZE, 5_000);
  const [rows, categoryLabels] = await Promise.all([
    loadListingRowsForFacets(),
    loadCategoryLabels(),
  ]);
  const facetRows = buildProductFacetCountRows({
    rows,
    categoryLabels,
    rebuiltAt: new Date(),
  });

  await db.productFacetCount.deleteMany({});

  let written = 0;
  for (let index = 0; index < facetRows.length; index += batchSize) {
    const batch = facetRows.slice(index, index + batchSize);
    await db.productFacetCount.createMany({ data: batch });
    written += batch.length;
    options.logProgress?.(`[product-facet-counts] written rows=${written}/${facetRows.length}`);
  }

  return {
    sourceRows: rows.length,
    facetRows: written,
    durationMs: Date.now() - startedAt,
  };
}

export async function rebuildProductFacetCountsForScopesFromReadModel(
  scopeFilter: ProductFacetScopeFilter,
  options: ProductFacetCountsRebuildOptions = {},
) {
  const startedAt = Date.now();
  const batchSize = normalizeBatchSize(options.batchSize, DEFAULT_FACET_BATCH_SIZE, 5_000);
  const categoryScopeKeys = [...new Set(scopeFilter.categoryScopeKeys ?? [])];
  const normalizedScopeFilter: ProductFacetScopeFilter = {
    includeCatalog: scopeFilter.includeCatalog !== false,
    categoryScopeKeys,
  };
  const [rows, categoryLabels] = await Promise.all([
    loadListingRowsForFacets(),
    loadCategoryLabels(),
  ]);
  const facetRows = buildProductFacetCountRows({
    rows,
    categoryLabels,
    rebuiltAt: new Date(),
    scopeFilter: normalizedScopeFilter,
  });

  await db.productFacetCount.deleteMany({
    where: {
      OR: [
        ...(normalizedScopeFilter.includeCatalog
          ? [{ scopeType: 'catalog', scopeKey: 'default' }]
          : []),
        ...categoryScopeKeys.map((scopeKey) => ({
          scopeType: 'category',
          scopeKey,
        })),
      ],
    },
  });

  let written = 0;
  for (let index = 0; index < facetRows.length; index += batchSize) {
    const batch = facetRows.slice(index, index + batchSize);
    await db.productFacetCount.createMany({ data: batch });
    written += batch.length;
    options.logProgress?.(`[product-facet-counts] written scoped rows=${written}/${facetRows.length}`);
  }

  return {
    sourceRows: rows.length,
    facetRows: written,
    durationMs: Date.now() - startedAt,
    scopeFilter: normalizedScopeFilter,
  };
}

async function rebuildProductFacetCountsForAffectedScopes(
  affectedFacetScopes: AffectedFacetScopes,
) {
  if (!affectedFacetScopes.includeCatalog && affectedFacetScopes.categoryScopeKeys.length === 0) {
    return {
      sourceRows: 0,
      facetRows: 0,
      durationMs: 0,
      scopeFilter: {
        includeCatalog: false,
        categoryScopeKeys: [],
      },
    };
  }

  return rebuildProductFacetCountsForScopesFromReadModel(affectedFacetScopes);
}

async function loadCategoryScopeKeysForCategoryIds(categoryIds: readonly string[]): Promise<string[]> {
  const uniqueCategoryIds = [...new Set(categoryIds.filter(Boolean))];
  if (uniqueCategoryIds.length === 0) {
    return [];
  }

  const [categoryTranslations, existingFacetRows] = await Promise.all([
    db.categoryTranslation.findMany({
      where: { categoryId: { in: uniqueCategoryIds } },
      select: { slug: true },
    }),
    db.productFacetCount.findMany({
      where: {
        facetType: 'category',
        OR: uniqueCategoryIds.map((categoryId) => ({
          meta: {
            path: ['categoryId'],
            equals: categoryId,
          },
        })),
      },
      select: {
        value: true,
      },
    }),
  ]);

  return [
    ...new Set([
      ...categoryTranslations.map((row) => row.slug),
      ...existingFacetRows.map((row) => row.value),
    ].filter(Boolean)),
  ];
}

export async function syncProductReadModelAndFacetCounts(productId: string) {
  const listing = await syncProductListingReadModel(productId);
  const facets = await rebuildProductFacetCountsForAffectedScopes(listing.affectedFacetScopes);
  return { listing, facets };
}

export async function syncProductListingReadModelBatchAndFacetCounts(
  productIds: readonly string[],
  options: ProductListingReadModelBatchSyncOptions = {},
) {
  const listing = await syncProductListingReadModelBatch(productIds, options);
  const facets = await rebuildProductFacetCountsForAffectedScopes(listing.affectedFacetScopes);
  return { listing, facets };
}

export async function syncProductsReadModelByBrandAndFacetCounts(brandId: string) {
  const products = await db.product.findMany({
    where: {
      brandId,
      deletedAt: null,
    },
    select: { id: true },
  });
  return syncProductListingReadModelBatchAndFacetCounts(products.map((product) => product.id));
}

export async function syncProductsReadModelByCategoryIdsAndFacetCounts(categoryIds: readonly string[]) {
  const uniqueCategoryIds = [...new Set(categoryIds.filter(Boolean))];
  if (uniqueCategoryIds.length === 0) {
    const facets = await rebuildProductFacetCountsForAffectedScopes({
      includeCatalog: false,
      categoryScopeKeys: [],
    });
    return {
      listing: {
        productsSynced: 0,
        rowsDeleted: 0,
        rowsWritten: 0,
        durationMs: 0,
        locales: normalizeLocales(undefined),
      },
      facets,
    };
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
  const [listing, extraCategoryScopeKeys] = await Promise.all([
    syncProductListingReadModelBatch(products.map((product) => product.id)),
    loadCategoryScopeKeysForCategoryIds(uniqueCategoryIds),
  ]);
  const facets = await rebuildProductFacetCountsForAffectedScopes({
    includeCatalog: listing.affectedFacetScopes.includeCatalog || extraCategoryScopeKeys.length > 0,
    categoryScopeKeys: [
      ...new Set([
        ...listing.affectedFacetScopes.categoryScopeKeys,
        ...extraCategoryScopeKeys,
      ]),
    ],
  });
  return { listing, facets };
}

export async function syncProductsReadModelByAttributeIdAndFacetCounts(attributeId: string) {
  const [productAttributes, variantOptions] = await Promise.all([
    db.productAttribute.findMany({
      where: { attributeId },
      select: { productId: true },
    }),
    db.productVariantOption.findMany({
      where: {
        OR: [
          { attributeId },
          {
            attributeValue: {
              attributeId,
            },
          },
        ],
      },
      select: {
        variant: {
          select: { productId: true },
        },
      },
    }),
  ]);

  return syncProductListingReadModelBatchAndFacetCounts([
    ...productAttributes.map((row) => row.productId),
    ...variantOptions.map((row) => row.variant.productId),
  ]);
}

export async function syncProductsReadModelByAttributeValueIdAndFacetCounts(attributeValueId: string) {
  const variantOptions = await db.productVariantOption.findMany({
    where: { valueId: attributeValueId },
    select: {
      variant: {
        select: { productId: true },
      },
    },
  });

  return syncProductListingReadModelBatchAndFacetCounts(
    variantOptions.map((row) => row.variant.productId),
  );
}

export async function deleteProductReadModelAndRebuildFacetCounts(productId: string) {
  const listing = await deleteProductListingReadModel(productId);
  const facets = await rebuildProductFacetCountsForAffectedScopes(listing.affectedFacetScopes);
  return { listing, facets };
}

export async function rebuildStorefrontReadModel(options: ProductListingReadModelRebuildOptions = {}) {
  const listing = await rebuildProductListingReadModel(options);
  const facets = await rebuildProductFacetCountsFromReadModel();
  return { listing, facets };
}
