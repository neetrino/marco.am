import { parseProductDescriptionJson } from "@/lib/products/product-description";
import { logger } from "../../../utils/logger";
import { expandCategoryIdsWithDescendants } from "../../category-subtree.service";
import type { ProductFilters } from "./types";
import {
  buildAdminListingRowOrderBy,
  buildAdminListingRowWhere,
} from "./admin-listing-row-query";
import {
  executeAdminProductListViaListingRows,
  executeProductDetailQuery,
} from "./query-executor";
import { findProductIdsBySkuSearch } from "@/lib/product-search/find-product-ids-by-sku";
import { formatProductForList } from "./product-formatter";
import { formatVariantForAdmin } from "./variant-formatter";

async function withExpandedCategoryFilters(filters: ProductFilters): Promise<ProductFilters> {
  const selectedCategoryIds =
    filters.categories && filters.categories.length > 0
      ? filters.categories
      : filters.category
        ? [filters.category]
        : [];

  if (selectedCategoryIds.length === 0) {
    return filters;
  }

  const expandedCategoryIds = await expandCategoryIdsWithDescendants(selectedCategoryIds);

  return {
    ...filters,
    categories: expandedCategoryIds,
    category: undefined,
  };
}

/**
 * Get products for admin
 */
export async function getProducts(filters: ProductFilters) {
  logger.info('getProducts called with filters', { filters });
  const startTime = Date.now();
  
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const locale = filters.lang?.trim().toLowerCase() || "en";
  const skip = (page - 1) * limit;

  const resolvedFilters = await withExpandedCategoryFilters(filters);
  const productIdsFromSku = resolvedFilters.search?.trim()
    ? await findProductIdsBySkuSearch(resolvedFilters.search.trim())
    : [];
  const listingWhere = buildAdminListingRowWhere(
    resolvedFilters,
    locale,
    productIdsFromSku,
  );
  const listingOrderBy = buildAdminListingRowOrderBy(resolvedFilters.sort);

  logger.debug('Executing admin listing-row query...', {
    sort: resolvedFilters.sort,
    locale,
  });

  const { products, total } = await executeAdminProductListViaListingRows(
    listingWhere,
    listingOrderBy,
    skip,
    limit,
    locale,
  );

  const data = products.map((product) => formatProductForList(product, locale));

  const totalTime = Date.now() - startTime;
  logger.info(`getProducts completed in ${totalTime}ms. Returning ${data.length} products`);

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get product by ID
 */
export async function getProductById(productId: string) {
  const product = await executeProductDetailQuery(productId);

  if (!product) {
    throw {
      status: 404,
      type: "https://api.shop.am/problems/not-found",
      title: "Product not found",
      detail: `Product with id '${productId}' does not exist`,
    };
  }

  // Безопасное получение translation с проверкой на существование массива
  const productWithRelations = product as typeof product & {
    translations?: Array<{ locale: string; title?: string; slug?: string; subtitle?: string | null; description?: unknown }>;
    labels?: Array<{ id: string; type: string; value: string; position: string; color: string | null }>;
    variants?: Array<unknown>;
    attributeValues?: Array<{ attributeId?: string; attributeValueId?: string }>;
  };
  const translations = Array.isArray(productWithRelations.translations) ? productWithRelations.translations : [];
  const translation = translations.find((t: { locale: string }) => t.locale === "en") || translations[0] || null;

  // Безопасное получение labels с проверкой на существование массива
  const labels = Array.isArray(productWithRelations.labels) ? productWithRelations.labels : [];
  
  // Безопасное получение variants с проверкой на существование массива
  const variants = Array.isArray(productWithRelations.variants) ? productWithRelations.variants : [];
  
  // Get all attribute IDs from productAttributes relation
  const productAttributes = Array.isArray((product as { productAttributes?: unknown[] }).productAttributes)
    ? (product as unknown as { productAttributes: Array<{ attributeId?: string; attribute?: { id: string } }> }).productAttributes
    : [];
  const attributeIds = productAttributes
    .map((pa) => pa.attributeId || pa.attribute?.id)
    .filter((id): id is string => !!id);
  
  // Also include attributeIds from product.attributeIds if available (backward compatibility)
  const legacyAttributeIds = Array.isArray((product as { attributeIds?: unknown[] }).attributeIds)
    ? (product as { attributeIds: string[] }).attributeIds
    : [];
  
  // Merge both sources and remove duplicates
  const allAttributeIds = Array.from(new Set([...attributeIds, ...legacyAttributeIds]));
  const productAttributeValues = Array.isArray(productWithRelations.attributeValues)
    ? productWithRelations.attributeValues
    : [];
  const attributeValueIds = productAttributeValues
    .map((row) => row.attributeValueId)
    .filter((id): id is string => Boolean(id));

  return {
    id: product.id,
    title: translation?.title || "",
    slug: translation?.slug || "",
    subtitle: translation?.subtitle || null,
    description: parseProductDescriptionJson(translation?.description),
    brandId: product.brandId || null,
    productClass: product.productClass || "retail",
    primaryCategoryId: product.primaryCategoryId || null,
    categoryIds: product.categoryIds || [],
    attributeIds: allAttributeIds, // All attribute IDs that this product has
    attributeValueIds,
    published: product.published,
    featured: Boolean(product.featured),
    warrantyYears:
      product.warrantyYears === 1 || product.warrantyYears === 2 || product.warrantyYears === 3
        ? product.warrantyYears
        : null,
    media: Array.isArray(product.media) ? product.media : [],
    labels: labels.map((label: { id: string; type: string; value: string; position: string; color: string | null }) => ({
      id: label.id,
      type: label.type,
      value: label.value,
      position: label.position,
      color: label.color,
    })),
    variants: variants.map((v) => formatVariantForAdmin(v as Parameters<typeof formatVariantForAdmin>[0])),
  };
}
