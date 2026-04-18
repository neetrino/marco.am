'use client';

import { Button, Input } from '@shop/ui';
import { useTranslation } from '../../../../lib/i18n-client';
import { buildCategoryTree, getAncestorIds, getDescendantIds } from '../utils';
import type { Category, CategoryFormData } from '../types';

interface EditCategoryModalProps {
  isOpen: boolean;
  editingCategory: Category | null;
  formData: CategoryFormData;
  categories: Category[];
  saving: boolean;
  onClose: () => void;
  onFormDataChange: (data: CategoryFormData) => void;
  onSubmit: () => Promise<void>;
}

export function EditCategoryModal({
  isOpen,
  editingCategory,
  formData,
  categories,
  saving,
  onClose,
  onFormDataChange,
  onSubmit,
}: EditCategoryModalProps) {
  const { t } = useTranslation();

  if (!isOpen || !editingCategory) return null;

  const descendantIds = getDescendantIds(categories, editingCategory.id);
  const ancestorIds = getAncestorIds(categories, editingCategory.id);
  const parentCandidates = buildCategoryTree(categories).filter(
    (category) =>
      category.id !== editingCategory.id && !descendantIds.has(category.id),
  );
  const subcategoryCandidates = buildCategoryTree(categories).filter(
    (category) =>
      category.id !== editingCategory.id && !ancestorIds.has(category.id),
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.categories.editCategory')}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('admin.categories.categoryTitle')} *
            </label>
            <Input
              type="text"
              value={formData.title}
              onChange={(e) => onFormDataChange({ ...formData, title: e.target.value })}
              placeholder={t('admin.categories.categoryTitlePlaceholder')}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('admin.categories.parentCategory')}
            </label>
            <select
              value={formData.parentId}
              onChange={(e) => onFormDataChange({ ...formData, parentId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('admin.categories.rootCategory')}</option>
              {parentCandidates.map((category) => (
                <option key={category.id} value={category.id}>
                  {`${'— '.repeat(category.level)}${category.title}`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('admin.categories.seoTitle')}
            </label>
            <Input
              type="text"
              value={formData.seoTitle}
              onChange={(e) => onFormDataChange({ ...formData, seoTitle: e.target.value })}
              placeholder={t('admin.categories.seoTitlePlaceholder')}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('admin.categories.seoDescription')}
            </label>
            <textarea
              value={formData.seoDescription}
              onChange={(e) => onFormDataChange({ ...formData, seoDescription: e.target.value })}
              placeholder={t('admin.categories.seoDescriptionPlaceholder')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.requiresSizes}
                onChange={(e) => onFormDataChange({ ...formData, requiresSizes: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                {t('admin.categories.requiresSizes')}
              </span>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.categories.subcategories')}
            </label>
            <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md p-3 space-y-2">
              {subcategoryCandidates.map((category) => {
                  const isChecked = formData.subcategoryIds.includes(category.id);
                  return (
                    <label key={category.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            onFormDataChange({
                              ...formData,
                              subcategoryIds: [...formData.subcategoryIds, category.id],
                            });
                          } else {
                            onFormDataChange({
                              ...formData,
                              subcategoryIds: formData.subcategoryIds.filter(id => id !== category.id),
                            });
                          }
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        {`${'— '.repeat(category.level)}${category.title}`}
                      </span>
                    </label>
                  );
                })}
              {subcategoryCandidates.length === 0 && (
                <p className="text-sm text-gray-500">
                  {t('admin.categories.noSubcategoryCandidates')}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <Button
            variant="primary"
            onClick={onSubmit}
            disabled={saving || !formData.title.trim()}
            className="flex-1"
          >
            {saving ? t('admin.categories.updating') : t('admin.categories.updateCategory')}
          </Button>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={saving}
          >
            {t('admin.common.cancel')}
          </Button>
        </div>
      </div>
    </div>
  );
}




