import { apiClient } from '@/lib/api-client';
import { getErrorMessage } from '@/lib/types/errors';
import type { ProductLabel, Variant } from '../types';
import type { ProductClass } from '@/lib/constants/product-class';
import type { ProductDescriptionEntry } from '@/lib/products/product-description';
import { filterProductDescriptionForSave } from '@/lib/products/product-description';
import {
  isProductSubtitleHtmlEmpty,
  sanitizeProductSubtitleHtml,
} from '@/lib/security/sanitize-product-html';
import { t as translateByLocale } from '@/lib/i18n';
import { getStoredLanguage } from '@/lib/language';
import { logger } from "@/lib/utils/logger";
import { invalidateProductEditorSectionCaches } from '@/lib/admin/product-editor-section-cache';

interface CreateAndSubmitPayloadProps {
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
  finalMedia: string[];
  mainImage: string | null;
  isEditMode: boolean;
  productId: string | null;
  creationMessages: string[];
  setLoading: (loading: boolean) => void;
  onSuccess: () => void;
}

export async function createAndSubmitPayload({
  formData,
  finalBrandIds,
  finalPrimaryCategoryId,
  finalCategoryIds,
  variants,
  attributeIds,
  finalMedia,
  mainImage,
  isEditMode,
  productId,
  creationMessages,
  setLoading,
  onSuccess,
}: CreateAndSubmitPayloadProps): Promise<void> {
  const mt = (path: string): string => translateByLocale(getStoredLanguage(), path);
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
      variants: variants,
      attributeIds,
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

    logger.devLog('📤 [ADMIN] Sending payload:', JSON.stringify(payload, null, 2));
    
    try {
      if (isEditMode && productId) {
        const product = await apiClient.put(`/api/v1/supersudo/products/${productId}`, payload);
        invalidateProductEditorSectionCaches(productId);
        logger.devLog('✅ [ADMIN] Product updated:', product);
        const baseMessage = mt('admin.products.add.productUpdatedSuccess');
        const extra = creationMessages.length ? `\n\n${creationMessages.join('\n')}` : '';
        alert(`${baseMessage}${extra}`);
      } else {
        const product = await apiClient.post('/api/v1/supersudo/products', payload);
        logger.devLog('✅ [ADMIN] Product created:', product);
        const baseMessage = mt('admin.products.add.productCreatedSuccess');
        const extra = creationMessages.length ? `\n\n${creationMessages.join('\n')}` : '';
        alert(`${baseMessage}${extra}`);
      }
      
      onSuccess();
    } catch (err: unknown) {
      console.error('❌ [ADMIN] Error saving product:', err);

      let errorMessage = isEditMode
        ? mt('admin.products.add.failedToUpdateProduct')
        : mt('admin.products.add.failedToCreateProduct');
      const raw = getErrorMessage(err);

      if (raw.includes('<!DOCTYPE') || raw.includes('<html')) {
        const mongoErrorMatch = raw.match(/MongoServerError[^<]+/);
        if (mongoErrorMatch) {
          errorMessage = `${mt('admin.products.add.databaseErrorPrefix')} ${mongoErrorMatch[0]}`;
        } else {
          errorMessage = mt('admin.products.add.databaseErrorSkuConflict');
        }
      } else if (raw && raw !== mt('admin.common.unknownErrorFallback')) {
        errorMessage = raw;
      }

      alert(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
}

