import { useState } from 'react';
import { apiClient, getApiOrErrorMessage } from '../../../../lib/api-client';
import { logger } from '../../../../lib/utils/logger';
import { showPopupConfirm } from '@/components/popup-service';
import { showToast } from '../../../../components/Toast';
import { useTranslation } from '../../../../lib/i18n-client';
import { getStoredLanguage, type LanguageCode } from '../../../../lib/language';
import { notifyShopCategoryTreeUpdated } from '../../../../lib/shop-category-tree-sync';
import { getDescendantIds } from '../utils';
import type { Category, CategoryFormData } from '../types';

/** Category translations in DB use shop locales; Georgian UI maps to `en` like storefront. */
function categoryWriteLocale(lang: LanguageCode): LanguageCode {
  return lang === 'ka' ? 'en' : lang;
}

type CategoryLocale = 'hy' | 'en' | 'ru';

interface UseCategoryActionsReturn {
  showAddModal: boolean;
  showEditModal: boolean;
  editingCategory: Category | null;
  formData: CategoryFormData;
  saving: boolean;
  deletingBulk: boolean;
  setShowAddModal: (show: boolean) => void;
  setShowEditModal: (show: boolean) => void;
  setFormData: (data: CategoryFormData) => void;
  handleAddCategory: (fetchCategories: () => Promise<void>) => Promise<void>;
  handleEditCategory: (category: Category) => Promise<void>;
  handleUpdateCategory: (
    fetchCategories: () => Promise<void>,
    applyOptimisticCategories?: (updater: (previous: Category[]) => Category[]) => () => void,
  ) => Promise<void>;
  handleDeleteCategory: (
    categoryId: string,
    categoryTitle: string,
    fetchCategories: () => Promise<void>,
    allCategories: Category[],
  ) => Promise<void>;
  handleDeleteCategories: (
    categoryIds: string[],
    categoryTitles: string[],
    fetchCategories: () => Promise<void>
  ) => Promise<boolean>;
  resetForm: () => void;
}

type CategoryTreeSelectionSnapshot = {
  parentId: string | null;
  subcategoryIds: string[];
};

const initialFormData: CategoryFormData = {
  titles: {
    hy: '',
    en: '',
    ru: '',
  },
  seoTitle: '',
  seoDescription: '',
  imageUrl: '',
  parentId: '',
  requiresSizes: false,
  subcategoryIds: [],
};

const EMPTY_TREE_SELECTION_SNAPSHOT: CategoryTreeSelectionSnapshot = {
  parentId: null,
  subcategoryIds: [],
};

function toSortedUniqueIds(ids: string[]): string[] {
  return [...new Set(ids)].sort();
}

function sameSortedIds(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((id, index) => id === right[index]);
}

/**
 * Hook for category CRUD operations
 */
export function useCategoryActions(): UseCategoryActionsReturn {
  const { t } = useTranslation();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(initialFormData);
  const [saving, setSaving] = useState(false);
  const [deletingBulk, setDeletingBulk] = useState(false);
  const [initialTreeSelection, setInitialTreeSelection] = useState<CategoryTreeSelectionSnapshot>(
    EMPTY_TREE_SELECTION_SNAPSHOT,
  );

  const resetForm = () => {
    setFormData(initialFormData);
    setInitialTreeSelection(EMPTY_TREE_SELECTION_SNAPSHOT);
  };

  const handleAddCategory = async (fetchCategories: () => Promise<void>) => {
    const titles = {
      hy: formData.titles.hy.trim(),
      en: formData.titles.en.trim(),
      ru: formData.titles.ru.trim(),
    };
    if (!titles.hy || !titles.en || !titles.ru) {
      showToast(t('admin.categories.titlesRequiredAllLocales'), 'warning');
      return;
    }

    setSaving(true);
    try {
      const writeLocale = categoryWriteLocale(getStoredLanguage()) as CategoryLocale;
      const localizedTitle = titles[writeLocale] || titles.en;
      await apiClient.post('/api/v1/supersudo/categories', {
        title: localizedTitle,
        translations: titles,
        seoTitle: formData.seoTitle.trim() || undefined,
        seoDescription: formData.seoDescription.trim() || undefined,
        media: formData.imageUrl.trim() ? [formData.imageUrl.trim()] : undefined,
        parentId: formData.parentId || undefined,
        requiresSizes: formData.requiresSizes,
        locale: writeLocale,
      });
      setShowAddModal(false);
      resetForm();
      void fetchCategories();
      notifyShopCategoryTreeUpdated();
      showToast(t('admin.categories.createdSuccess'), 'success');
    } catch (err: unknown) {
      logger.error('Error creating category', { error: err });
      const errorMessage = err && typeof err === 'object' && 'data' in err
        ? (err as { data?: { detail?: string } }).data?.detail
        : err && typeof err === 'object' && 'message' in err
        ? (err as { message?: string }).message
        : t('admin.categories.errorCreating');
      showToast(errorMessage || t('admin.categories.errorCreating'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleEditCategory = async (category: Category) => {
    setEditingCategory(category);
    
    try {
      const response = await apiClient.get<{ data: Category }>(`/api/v1/supersudo/categories/${category.id}`, {
        params: { lang: getStoredLanguage() },
      });
      const categoryWithChildren = response.data;
      
      setFormData({
        titles: {
          hy: categoryWithChildren.translations?.hy || categoryWithChildren.title || '',
          en: categoryWithChildren.translations?.en || categoryWithChildren.title || '',
          ru: categoryWithChildren.translations?.ru || categoryWithChildren.title || '',
        },
        seoTitle: categoryWithChildren.seoTitle || '',
        seoDescription: categoryWithChildren.seoDescription || '',
        imageUrl: categoryWithChildren.media?.[0] || '',
        parentId: category.parentId || '',
        requiresSizes: category.requiresSizes || false,
        subcategoryIds: categoryWithChildren.children?.map(child => child.id) || [],
      });
      setInitialTreeSelection({
        parentId: categoryWithChildren.parentId ?? category.parentId ?? null,
        subcategoryIds: toSortedUniqueIds(
          categoryWithChildren.children?.map((child) => child.id) || [],
        ),
      });
    } catch (err: unknown) {
      logger.error('Error fetching category children', { error: err });
      setFormData({
        titles: {
          hy: category.translations?.hy || category.title || '',
          en: category.translations?.en || category.title || '',
          ru: category.translations?.ru || category.title || '',
        },
        seoTitle: category.seoTitle || '',
        seoDescription: category.seoDescription || '',
        imageUrl: category.media?.[0] || '',
        parentId: category.parentId || '',
        requiresSizes: category.requiresSizes || false,
        subcategoryIds: [],
      });
      setInitialTreeSelection({
        parentId: category.parentId ?? null,
        subcategoryIds: [],
      });
    }
    
    setShowEditModal(true);
  };

  const handleUpdateCategory = async (
    fetchCategories: () => Promise<void>,
    applyOptimisticCategories?: (updater: (previous: Category[]) => Category[]) => () => void,
  ) => {
    const titles = {
      hy: formData.titles.hy.trim(),
      en: formData.titles.en.trim(),
      ru: formData.titles.ru.trim(),
    };
    if (!editingCategory || !titles.hy || !titles.en || !titles.ru) {
      showToast(t('admin.categories.titlesRequiredAllLocales'), 'warning');
      return;
    }

    const editingCategoryId = editingCategory.id;
    setSaving(true);
    let rollback: (() => void) | null = null;
    try {
      const writeLocale = categoryWriteLocale(getStoredLanguage()) as CategoryLocale;
      const localizedTitle = titles[writeLocale] || titles.en;
      const nextParentId = formData.parentId || null;
      const nextSubcategoryIds = toSortedUniqueIds(formData.subcategoryIds);
      const parentChanged = nextParentId !== initialTreeSelection.parentId;
      const subcategoriesChanged = !sameSortedIds(
        nextSubcategoryIds,
        initialTreeSelection.subcategoryIds,
      );

      const payload: Record<string, unknown> = {
        title: localizedTitle,
        translations: titles,
        seoTitle: formData.seoTitle.trim() || null,
        seoDescription: formData.seoDescription.trim() || null,
        media: formData.imageUrl.trim() ? [formData.imageUrl.trim()] : [],
        requiresSizes: formData.requiresSizes,
        locale: writeLocale,
      };

      if (parentChanged) {
        payload.parentId = nextParentId;
      }
      if (subcategoriesChanged) {
        payload.subcategoryIds = nextSubcategoryIds;
      }

      if (applyOptimisticCategories) {
        const initialSubcategoryIds = new Set(initialTreeSelection.subcategoryIds);
        const nextSubcategoryIdSet = new Set(nextSubcategoryIds);
        rollback = applyOptimisticCategories((previous) =>
          previous.map((category) => {
            if (category.id === editingCategoryId) {
              return {
                ...category,
                title: localizedTitle,
                translations: titles,
                seoTitle: formData.seoTitle.trim() || null,
                seoDescription: formData.seoDescription.trim() || null,
                media: formData.imageUrl.trim() ? [formData.imageUrl.trim()] : [],
                requiresSizes: formData.requiresSizes,
                parentId: nextParentId,
              };
            }
            if (!subcategoriesChanged) {
              return category;
            }
            if (nextSubcategoryIdSet.has(category.id)) {
              return {
                ...category,
                parentId: editingCategoryId,
              };
            }
            if (
              initialSubcategoryIds.has(category.id) &&
              !nextSubcategoryIdSet.has(category.id) &&
              category.parentId === editingCategory.id
            ) {
              return {
                ...category,
                parentId: null,
              };
            }
            return category;
          }),
        );
      }

      await apiClient.put(`/api/v1/supersudo/categories/${editingCategoryId}`, payload);
      setShowEditModal(false);
      setEditingCategory(null);
      resetForm();
      notifyShopCategoryTreeUpdated();
      showToast(t('admin.categories.updatedSuccess'), 'success');
    } catch (err: unknown) {
      rollback?.();
      logger.error('Error updating category', { error: err });
      const errorMessage = err && typeof err === 'object' && 'data' in err
        ? (err as { data?: { detail?: string } }).data?.detail
        : err && typeof err === 'object' && 'message' in err
        ? (err as { message?: string }).message
        : t('admin.categories.errorUpdating');
      showToast(errorMessage || t('admin.categories.errorUpdating'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCategory = async (
    categoryId: string,
    categoryTitle: string,
    fetchCategories: () => Promise<void>,
    allCategories: Category[],
  ) => {
    const descendantCount = getDescendantIds(allCategories, categoryId).size;
    const confirmMessage =
      descendantCount > 0
        ? t('admin.categories.deleteWithChildrenConfirm')
            .replace('{name}', categoryTitle)
            .replace('{count}', String(descendantCount))
        : t('admin.categories.deleteConfirm').replace('{name}', categoryTitle);

    if (!(await showPopupConfirm(confirmMessage))) {
      return;
    }

    try {
      logger.info('Deleting category', { categoryId, categoryTitle, descendantCount });
      const deleteOptions =
        descendantCount > 0 ? { params: { cascade: 'true' } as const } : undefined;
      await apiClient.delete(`/api/v1/supersudo/categories/${categoryId}`, deleteOptions);
      logger.info('Category deleted successfully');
      await fetchCategories();
      notifyShopCategoryTreeUpdated();
      const successMessage =
        descendantCount > 0
          ? t('admin.categories.deletedSuccessWithChildren').replace(
              '{count}',
              String(descendantCount),
            )
          : t('admin.categories.deletedSuccess');
      showToast(successMessage, 'success');
    } catch (err: unknown) {
      logger.warn('Category delete rejected', { error: err });
      const errorMessage = getApiOrErrorMessage(err, t('admin.common.unknownErrorFallback'));
      showToast(t('admin.categories.errorDeleting').replace('{message}', errorMessage), 'error');
    }
  };

  const handleDeleteCategories = async (
    categoryIds: string[],
    categoryTitles: string[],
    fetchCategories: () => Promise<void>
  ): Promise<boolean> => {
    if (categoryIds.length === 0) {
      return false;
    }

    const firstTitle = categoryTitles[0] || 'Category';
    const previewTitle =
      categoryIds.length > 1 ? `${firstTitle} (+${categoryIds.length - 1})` : firstTitle;

    if (!(await showPopupConfirm(t('admin.categories.deleteConfirm').replace('{name}', previewTitle)))) {
      return false;
    }

    setDeletingBulk(true);
    try {
      const results = await Promise.allSettled(
        categoryIds.map((categoryId) => apiClient.delete(`/api/v1/supersudo/categories/${categoryId}`))
      );

      const failures = results.filter(
        (result): result is PromiseRejectedResult => result.status === 'rejected',
      );
      const failedCount = failures.length;
      await fetchCategories();
      if (failedCount < categoryIds.length) {
        notifyShopCategoryTreeUpdated();
      }
      if (failedCount === 0) {
        showToast(t('admin.categories.deletedSuccess'), 'success');
      } else {
        const firstDetail = getApiOrErrorMessage(
          failures[0]?.reason,
          t('admin.common.unknownErrorFallback'),
        );
        const failureMessage =
          failedCount === 1
            ? firstDetail
            : `${failedCount} categories failed to delete. ${firstDetail}`;
        showToast(t('admin.categories.errorDeleting').replace('{message}', failureMessage), 'error');
      }

      return failedCount === 0;
    } catch (err: unknown) {
      logger.error('Error deleting multiple categories', { error: err });
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      showToast(t('admin.categories.errorDeleting').replace('{message}', errorMessage), 'error');
      return false;
    } finally {
      setDeletingBulk(false);
    }
  };

  return {
    showAddModal,
    showEditModal,
    editingCategory,
    formData,
    saving,
    deletingBulk,
    setShowAddModal,
    setShowEditModal,
    setFormData,
    handleAddCategory,
    handleEditCategory,
    handleUpdateCategory,
    handleDeleteCategory,
    handleDeleteCategories,
    resetForm,
  };
}




