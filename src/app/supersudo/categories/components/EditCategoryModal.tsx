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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.categories.editCategory')}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('admin.categories.categoryTitleHy')} *
            </label>
            <Input
              type="text"
              value={formData.titles.hy}
              onChange={(e) =>
                onFormDataChange({ ...formData, titles: { ...formData.titles, hy: e.target.value } })
              }
              placeholder={t('admin.categories.categoryTitlePlaceholderHy')}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('admin.categories.categoryTitleEn')} *
            </label>
            <Input
              type="text"
              value={formData.titles.en}
              onChange={(e) =>
                onFormDataChange({ ...formData, titles: { ...formData.titles, en: e.target.value } })
              }
              placeholder={t('admin.categories.categoryTitlePlaceholderEn')}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('admin.categories.categoryTitleRu')} *
            </label>
            <Input
              type="text"
              value={formData.titles.ru}
              onChange={(e) =>
                onFormDataChange({ ...formData, titles: { ...formData.titles, ru: e.target.value } })
              }
              placeholder={t('admin.categories.categoryTitlePlaceholderRu')}
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
              className="admin-field"
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
              className="admin-field resize-y"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.requiresSizes}
                onChange={(e) => onFormDataChange({ ...formData, requiresSizes: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
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
            <div className="max-h-60 space-y-2 overflow-y-auto rounded-md border border-gray-300 p-3">
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
                        className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
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
            disabled={
              saving ||
              !formData.titles.hy.trim() ||
              !formData.titles.en.trim() ||
              !formData.titles.ru.trim()
            }
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




