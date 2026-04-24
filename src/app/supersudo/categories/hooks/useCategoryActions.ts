import { useState } from 'react';
import { apiClient } from '../../../../lib/api-client';
import { logger } from '../../../../lib/utils/logger';
import { showToast } from '../../../../components/Toast';
import { useTranslation } from '../../../../lib/i18n-client';
import { notifyShopCategoryTreeUpdated } from '../../../../lib/shop-category-tree-sync';
import type { Category, CategoryFormData } from '../types';

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
  handleUpdateCategory: (fetchCategories: () => Promise<void>) => Promise<void>;
  handleDeleteCategory: (categoryId: string, categoryTitle: string, fetchCategories: () => Promise<void>) => Promise<void>;
  handleDeleteCategories: (
    categoryIds: string[],
    categoryTitles: string[],
    fetchCategories: () => Promise<void>
  ) => Promise<boolean>;
  resetForm: () => void;
}

const initialFormData: CategoryFormData = {
  title: '',
  seoTitle: '',
  seoDescription: '',
  parentId: '',
  requiresSizes: false,
  subcategoryIds: [],
};

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

  const resetForm = () => {
    setFormData(initialFormData);
  };

  const handleAddCategory = async (fetchCategories: () => Promise<void>) => {
    if (!formData.title.trim()) {
      showToast(t('admin.categories.titleRequired'), 'warning');
      return;
    }

    setSaving(true);
    try {
      await apiClient.post('/api/v1/supersudo/categories', {
        title: formData.title.trim(),
        seoTitle: formData.seoTitle.trim() || undefined,
        seoDescription: formData.seoDescription.trim() || undefined,
        parentId: formData.parentId || undefined,
        requiresSizes: formData.requiresSizes,
        locale: 'en',
      });
      setShowAddModal(false);
      resetForm();
      await fetchCategories();
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
      const response = await apiClient.get<{ data: Category }>(`/api/v1/supersudo/categories/${category.id}`);
      const categoryWithChildren = response.data;
      
      setFormData({
        title: category.title,
        seoTitle: categoryWithChildren.seoTitle || '',
        seoDescription: categoryWithChildren.seoDescription || '',
        parentId: category.parentId || '',
        requiresSizes: category.requiresSizes || false,
        subcategoryIds: categoryWithChildren.children?.map(child => child.id) || [],
      });
    } catch (err: unknown) {
      logger.error('Error fetching category children', { error: err });
      setFormData({
        title: category.title,
        seoTitle: category.seoTitle || '',
        seoDescription: category.seoDescription || '',
        parentId: category.parentId || '',
        requiresSizes: category.requiresSizes || false,
        subcategoryIds: [],
      });
    }
    
    setShowEditModal(true);
  };

  const handleUpdateCategory = async (fetchCategories: () => Promise<void>) => {
    if (!editingCategory || !formData.title.trim()) {
      showToast(t('admin.categories.titleRequired'), 'warning');
      return;
    }

    setSaving(true);
    try {
      await apiClient.put(`/api/v1/supersudo/categories/${editingCategory.id}`, {
        title: formData.title.trim(),
        seoTitle: formData.seoTitle.trim() || null,
        seoDescription: formData.seoDescription.trim() || null,
        parentId: formData.parentId || null,
        requiresSizes: formData.requiresSizes,
        subcategoryIds: formData.subcategoryIds,
        locale: 'en',
      });
      setShowEditModal(false);
      setEditingCategory(null);
      resetForm();
      await fetchCategories();
      notifyShopCategoryTreeUpdated();
      showToast(t('admin.categories.updatedSuccess'), 'success');
    } catch (err: unknown) {
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
    fetchCategories: () => Promise<void>
  ) => {
    if (!confirm(t('admin.categories.deleteConfirm').replace('{name}', categoryTitle))) {
      return;
    }

    try {
      logger.info('Deleting category', { categoryId, categoryTitle });
      await apiClient.delete(`/api/v1/supersudo/categories/${categoryId}`);
      logger.info('Category deleted successfully');
      await fetchCategories();
      notifyShopCategoryTreeUpdated();
      showToast(t('admin.categories.deletedSuccess'), 'success');
    } catch (err: unknown) {
      logger.error('Error deleting category', { error: err });
      let errorMessage = 'Unknown error occurred';
      if (err && typeof err === 'object') {
        if ('data' in err && err.data && typeof err.data === 'object' && 'detail' in err.data) {
          errorMessage = String(err.data.detail);
        } else if ('detail' in err) {
          errorMessage = String(err.detail);
        } else if ('message' in err) {
          errorMessage = String(err.message);
        } else if ('response' in err && err.response && typeof err.response === 'object' && 'data' in err.response) {
          const responseData = err.response as { data?: { detail?: string } };
          if (responseData.data?.detail) {
            errorMessage = responseData.data.detail;
          }
        }
      }
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

    if (!confirm(t('admin.categories.deleteConfirm').replace('{name}', previewTitle))) {
      return false;
    }

    setDeletingBulk(true);
    try {
      const results = await Promise.allSettled(
        categoryIds.map((categoryId) => apiClient.delete(`/api/v1/supersudo/categories/${categoryId}`))
      );

      const failedCount = results.filter((result) => result.status === 'rejected').length;
      await fetchCategories();
      if (failedCount < categoryIds.length) {
        notifyShopCategoryTreeUpdated();
      }
      if (failedCount === 0) {
        showToast(t('admin.categories.deletedSuccess'), 'success');
      } else {
        const failureMessage = `${failedCount} categories failed to delete`;
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




