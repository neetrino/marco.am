/**
 * Utilities for building product form data
 */

import type { ProductDescriptionEntry } from '@/lib/products/product-description';
import type { ProductData, Variant, ProductLabel } from '../types';
import type { ProductClass } from '@/lib/constants/product-class';

/** Full add/edit product form state (shared across hooks). */
export interface AddProductFormState {
  title: string;
  slug: string;
  description: ProductDescriptionEntry[];
  productClass: ProductClass;
  brandIds: string[];
  primaryCategoryId: string;
  categoryIds: string[];
  published: boolean;
  featured: boolean;
  imageUrls: string[];
  featuredImageIndex: number;
  mainProductImage: string;
  variants: Variant[];
  labels: ProductLabel[];
  warrantyYears: number | null;
}

/**
 * Builds form data from product data
 */
export function buildFormData(
  product: ProductData,
  normalizedMedia: string[],
  featuredIndexFromApi: number,
  mainProductImage: string,
  mergedVariant: Variant
): AddProductFormState {
  const brandIds = product.brandId ? [product.brandId] : [];

  return {
    title: product.title || '',
    slug: product.slug || '',
    description: product.description ?? [],
    productClass: product.productClass || 'retail',
    brandIds: brandIds,
    primaryCategoryId: product.primaryCategoryId || '',
    categoryIds: product.categoryIds || [],
    published: product.published || false,
    featured: product.featured || false,
    imageUrls: normalizedMedia,
    featuredImageIndex:
      featuredIndexFromApi >= 0 && featuredIndexFromApi < normalizedMedia.length
        ? featuredIndexFromApi
        : 0,
    mainProductImage:
      normalizedMedia.length > 0 &&
      normalizedMedia[featuredIndexFromApi >= 0 && featuredIndexFromApi < normalizedMedia.length ? featuredIndexFromApi : 0]
        ? normalizedMedia[featuredIndexFromApi >= 0 && featuredIndexFromApi < normalizedMedia.length ? featuredIndexFromApi : 0]
        : mainProductImage || '',
    variants: [mergedVariant],
    labels: (product.labels || []).map((label) => ({
      id: label.id || '',
      type: label.type || 'text',
      value: label.value || '',
      position: label.position || 'top-left',
      color: label.color || null,
    })),
    warrantyYears:
      product.warrantyYears === 1 || product.warrantyYears === 2 || product.warrantyYears === 3
        ? product.warrantyYears
        : null,
  };
}

