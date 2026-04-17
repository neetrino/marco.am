import { apiClient } from '@/lib/api-client';
import { useTranslation } from '@/lib/i18n-client';
import type { Brand, Category } from '../types';
import { logger } from "@/lib/utils/logger";

interface UseBrandAndCategoryCreationProps {
  formData: {
    brandIds: string[];
    primaryCategoryId: string;
  };
  useNewBrand: boolean;
  newBrandName: string;
  useNewCategory: boolean;
  newCategoryName: string;
  setBrands: (updater: (prev: Brand[]) => Brand[]) => void;
  setCategories: (updater: (prev: Category[]) => Category[]) => void;
  setLoading: (loading: boolean) => void;
}

export function useBrandAndCategoryCreation({
  formData,
  useNewBrand,
  newBrandName,
  useNewCategory,
  newCategoryName,
  setBrands,
  setCategories,
  setLoading,
}: UseBrandAndCategoryCreationProps) {
  const { t } = useTranslation();

  const createBrandAndCategory = async (): Promise<{
    finalBrandIds: string[];
    finalPrimaryCategoryId: string;
    creationMessages: string[];
    error: boolean;
  }> => {
    const creationMessages: string[] = [];
    const finalBrandIds = [...formData.brandIds];
    let finalPrimaryCategoryId = formData.primaryCategoryId;

    // Create new brand if provided
    if (useNewBrand && newBrandName.trim()) {
      try {
        logger.devLog('🏷️ [ADMIN] Creating new brand:', newBrandName);
        const brandResponse = await apiClient.post<{ data: Brand }>('/api/v1/supersudo/brands', {
          name: newBrandName.trim(),
          locale: 'en',
        });
        if (brandResponse.data) {
          if (!finalBrandIds.includes(brandResponse.data.id)) {
            finalBrandIds.push(brandResponse.data.id);
          }
          setBrands((prev) => [...prev, brandResponse.data]);
          logger.devLog('✅ [ADMIN] Brand created:', brandResponse.data.id);
          creationMessages.push(t('admin.products.add.brandCreatedSuccess').replace('{name}', newBrandName.trim()));
        }
      } catch (err: unknown) {
        console.error('❌ [ADMIN] Error creating brand:', err);
        setLoading(false);
        return { finalBrandIds, finalPrimaryCategoryId, creationMessages, error: true };
      }
    }

    // Create new category if provided
    if (useNewCategory && newCategoryName.trim()) {
      try {
        logger.devLog('📁 [ADMIN] Creating new category:', newCategoryName);
        const categoryResponse = await apiClient.post<{ data: Category }>('/api/v1/supersudo/categories', {
          title: newCategoryName.trim(),
          locale: 'en',
          requiresSizes: false,
        });
        if (categoryResponse.data) {
          finalPrimaryCategoryId = categoryResponse.data.id;
          setCategories((prev) => [...prev, categoryResponse.data]);
          logger.devLog('✅ [ADMIN] Category created:', categoryResponse.data.id);
          creationMessages.push(
            t('admin.products.add.categoryCreatedSuccess').replace('{name}', newCategoryName.trim())
          );
        }
      } catch (err: unknown) {
        console.error('❌ [ADMIN] Error creating category:', err);
        setLoading(false);
        return { finalBrandIds, finalPrimaryCategoryId, creationMessages, error: true };
      }
    }

    return { finalBrandIds, finalPrimaryCategoryId, creationMessages, error: false };
  };

  return { createBrandAndCategory };
}






