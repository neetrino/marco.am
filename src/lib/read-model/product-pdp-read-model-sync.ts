import { db } from '@white-shop/db';
import {
  getBaseInclude,
  getProductAttributesInclude,
} from '@/lib/services/products-slug/product-query-builder';
import type { ProductWithFullRelations } from '@/lib/services/products-slug/types';
import {
  loadListingDiscountSettingsUncached,
  type ListingDiscountSettings,
} from '@/lib/services/listing-discount-settings';
import { buildProductPdpRows } from './product-pdp-row-builder';

export const PRODUCT_PDP_READ_MODEL_DEFAULT_LOCALES = ['en', 'hy', 'ru', 'ka'] as const;

const DEFAULT_PDP_BATCH_SIZE = 50;
const MAX_PDP_BATCH_SIZE = 200;

export type ProductPdpReadModelOptions = {
  locales?: readonly string[];
  discountSettings?: ListingDiscountSettings;
  batchSize?: number;
  logProgress?: (message: string) => void;
};

function normalizeLocales(locales: readonly string[] | undefined): string[] {
  const source = locales?.length ? locales : PRODUCT_PDP_READ_MODEL_DEFAULT_LOCALES;
  return [...new Set(source.map((locale) => locale.trim().toLowerCase()).filter(Boolean))];
}

function normalizeBatchSize(value: number | undefined): number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
    ? Math.min(value, MAX_PDP_BATCH_SIZE)
    : DEFAULT_PDP_BATCH_SIZE;
}

/** Operational include reused from the slug query — exactly what `transformProduct` consumes. */
function pdpProductInclude() {
  return { ...getBaseInclude(), ...getProductAttributesInclude() };
}

async function loadProductsForPdp(productIds: readonly string[]): Promise<ProductWithFullRelations[]> {
  const products = await db.product.findMany({
    where: { id: { in: [...productIds] } },
    include: pdpProductInclude(),
  });
  return products as unknown as ProductWithFullRelations[];
}

async function replacePdpRows(productIds: readonly string[], product: ProductWithFullRelations[], settings: ListingDiscountSettings, locales: string[]): Promise<number> {
  const rebuiltAt = new Date();
  const rowGroups = await Promise.all(
    product.map((entry) => buildProductPdpRows({ product: entry, locales, discountSettings: settings, rebuiltAt })),
  );
  const rows = rowGroups.flat();
  await db.$transaction(async (tx) => {
    await tx.productPdpRow.deleteMany({ where: { productId: { in: [...productIds] } } });
    if (rows.length > 0) {
      await tx.productPdpRow.createMany({ data: rows });
    }
  });
  return rows.length;
}

export async function syncProductPdpReadModel(productId: string, options: ProductPdpReadModelOptions = {}) {
  const locales = normalizeLocales(options.locales);
  const settings = options.discountSettings ?? (await loadListingDiscountSettingsUncached());
  const [product] = await loadProductsForPdp([productId]);

  if (!product || product.published === false || product.deletedAt) {
    const deleted = await db.productPdpRow.deleteMany({ where: { productId } });
    return { productId, rowsDeleted: deleted.count, rowsWritten: 0 };
  }

  const rowsWritten = await replacePdpRows([productId], [product], settings, locales);
  return { productId, rowsWritten };
}

export async function syncProductPdpReadModelBatch(
  productIds: readonly string[],
  options: ProductPdpReadModelOptions = {},
) {
  const uniqueIds = [...new Set(productIds.filter(Boolean))];
  const locales = normalizeLocales(options.locales);
  const batchSize = normalizeBatchSize(options.batchSize);
  const settings = options.discountSettings ?? (await loadListingDiscountSettingsUncached());
  let rowsWritten = 0;
  let productsSynced = 0;

  for (let index = 0; index < uniqueIds.length; index += batchSize) {
    const chunkIds = uniqueIds.slice(index, index + batchSize);
    const products = (await loadProductsForPdp(chunkIds)).filter(
      (product) => product.published !== false && !product.deletedAt,
    );
    rowsWritten += await replacePdpRows(chunkIds, products, settings, locales);
    productsSynced += chunkIds.length;
    options.logProgress?.(
      `[product-pdp-read-model] synced product=${productsSynced}/${uniqueIds.length} rows=${rowsWritten}`,
    );
  }

  return { productsSynced, rowsWritten };
}

export async function deleteProductPdpReadModel(productId: string) {
  const deleted = await db.productPdpRow.deleteMany({ where: { productId } });
  return { productId, rowsDeleted: deleted.count };
}

export async function rebuildProductPdpReadModel(options: ProductPdpReadModelOptions = {}) {
  const startedAt = Date.now();
  const locales = normalizeLocales(options.locales);
  const batchSize = normalizeBatchSize(options.batchSize);
  const settings = options.discountSettings ?? (await loadListingDiscountSettingsUncached());
  await db.productPdpRow.deleteMany({});

  let cursorId: string | undefined;
  let productsRead = 0;
  let rowsWritten = 0;

  for (;;) {
    const products = (await db.product.findMany({
      where: { published: true, deletedAt: null },
      orderBy: { id: 'asc' },
      take: batchSize,
      ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
      include: pdpProductInclude(),
    })) as unknown as ProductWithFullRelations[];

    if (products.length === 0) {
      break;
    }

    const rebuiltAt = new Date();
    const rowGroups = await Promise.all(
      products.map((product) =>
        buildProductPdpRows({ product, locales, discountSettings: settings, rebuiltAt }),
      ),
    );
    const rows = rowGroups.flat();
    if (rows.length > 0) {
      await db.productPdpRow.createMany({ data: rows });
      rowsWritten += rows.length;
    }

    productsRead += products.length;
    cursorId = products[products.length - 1]?.id;
    options.logProgress?.(
      `[product-pdp-read-model] processed products=${productsRead} rows=${rowsWritten}`,
    );
  }

  return { productsRead, rowsWritten, durationMs: Date.now() - startedAt, locales };
}
