import { apiClient } from '@/lib/api-client';
import type { ProductLabel, Variant } from '../types';
import type { Product } from '../../types';
import type { ProductClass } from '@/lib/constants/product-class';
import type { ProductDescriptionEntry } from '@/lib/products/product-description';
import { filterProductDescriptionForSave } from '@/lib/products/product-description';
import {
  isProductSubtitleHtmlEmpty,
  sanitizeProductSubtitleHtml,
} from '@/lib/security/sanitize-product-html';
import { invalidateProductEditorSectionCaches } from '@/lib/admin/product-editor-section-cache';

interface BuildProductPayloadProps {
  formData: {
    title: string;
    slug: string;
    subtitleHtml: string;
    description: ProductDescriptionEntry[];
    productClass: ProductClass;
    categoryIds: string[];
    published: boolean;
    featured: boolean;
    imageUrls: string[];
    featuredImageIndex: number;
    mainProductImage: string;
    labels: ProductLabel[];
    warrantyYears: number | null;
  };
  finalBrandIds: string[];
  finalPrimaryCategoryId: string;
  finalCategoryIds: string[];
  variants: Variant[];
  attributeIds: string[];
  attributeValueIds: string[];
  finalMedia: string[];
  mainImage: string | null;
  isEditMode: boolean;
}

/** Builds the product create/update request payload. Pure and synchronous. */
export function buildProductPayload({
  formData,
  finalBrandIds,
  finalPrimaryCategoryId,
  finalCategoryIds,
  variants,
  attributeIds,
  attributeValueIds,
  finalMedia,
  mainImage,
  isEditMode,
}: BuildProductPayloadProps): Record<string, unknown> {
  const resolvedCategoryIds =
    finalCategoryIds.length > 0
      ? finalCategoryIds
      : finalPrimaryCategoryId
        ? [finalPrimaryCategoryId]
        : formData.categoryIds;

  const payload: Record<string, unknown> = {
    title: formData.title,
    slug: formData.slug,
    subtitle: isProductSubtitleHtmlEmpty(formData.subtitleHtml)
      ? null
      : sanitizeProductSubtitleHtml(formData.subtitleHtml),
    description: filterProductDescriptionForSave(formData.description),
    productClass: formData.productClass,
    brandId: finalBrandIds.length > 0 ? finalBrandIds[0] : undefined,
    primaryCategoryId: finalPrimaryCategoryId || undefined,
    categoryIds: resolvedCategoryIds.length > 0 ? resolvedCategoryIds : undefined,
    featured: formData.featured,
    locale: 'en',
    variants,
    attributeIds,
    attributeValueIds,
  };

  // Published status is toggled from the products list, not the editor form.
  if (!isEditMode) {
    payload.published = true;
  }

  if (finalMedia.length > 0) {
    payload.media = finalMedia;
  }

  if (mainImage) {
    payload.mainProductImage = mainImage;
  }

  payload.labels = (formData.labels || [])
    .filter((label) => label.value && label.value.trim() !== '')
    .map((label) => ({
      type: label.type,
      value: label.value.trim(),
      position: label.position,
      color: label.color || null,
    }));

  payload.warrantyYears = formData.warrantyYears;

  return payload;
}

/** Optimistic save handoff: the editor builds this, the list page persists it in the background. */
export interface OptimisticSaveRequest {
  isEditMode: boolean;
  productId: string | null;
  payload: Record<string, unknown>;
  /** Row patch (update) or full temp row (create) applied to the list immediately. */
  optimisticRow: Partial<Product> & { id: string };
}

/** Persists a product payload. Resolves with the API response; throws on failure. */
export async function submitProductPayload(args: {
  isEditMode: boolean;
  productId: string | null;
  payload: Record<string, unknown>;
}): Promise<unknown> {
  if (args.isEditMode && args.productId) {
    const product = await apiClient.put(
      `/api/v1/supersudo/products/${args.productId}`,
      args.payload,
    );
    invalidateProductEditorSectionCaches(args.productId);
    return product;
  }

  return apiClient.post('/api/v1/supersudo/products', args.payload);
}
