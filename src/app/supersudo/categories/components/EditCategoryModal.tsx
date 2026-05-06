'use client';

import { useMemo, useState, type ChangeEvent } from 'react';
import { Button, Input } from '@shop/ui';
import { useTranslation } from '../../../../lib/i18n-client';
import { processImageFile, toDomSafeImgSrcString, toSafeImgAttributeSrc } from '../../../../lib/utils/image-utils';
import { showToast } from '../../../../components/Toast';
import { logger } from '../../../../lib/utils/logger';
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
  const [imageUploading, setImageUploading] = useState(false);
  const safeImagePreviewUrl = useMemo(
    () => toSafeImgAttributeSrc(formData.imageUrl.trim()),
    [formData.imageUrl],
  );

  const handleImageFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const imageFile = event.target.files?.[0];
    if (!imageFile) {
      return;
    }

    try {
      setImageUploading(true);
      const base64 = await processImageFile(imageFile, {
        maxSizeMB: 1.5,
        maxWidthOrHeight: 800,
        useWebWorker: true,
        fileType: 'image/jpeg',
        initialQuality: 0.85,
      });
      onFormDataChange({ ...formData, imageUrl: base64 });
    } catch (err: unknown) {
      logger.error('Category image upload failed', { error: err });
      showToast(t('admin.categories.imageUploadFailed'), 'error');
    } finally {
      setImageUploading(false);
      event.target.value = '';
    }
  };

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
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:items-center">
      <div className="my-4 flex w-full max-w-md flex-col rounded-xl border border-gray-200 bg-white p-4 sm:p-5 max-h-[90vh]">
        <h3 className="mb-3 text-lg font-semibold text-gray-900">{t('admin.categories.editCategory')}</h3>
        <div className="space-y-3 overflow-y-auto pr-1">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('admin.categories.imageLabel')}
            </label>
            <Input
              type="text"
              value={formData.imageUrl}
              onChange={(e) => onFormDataChange({ ...formData, imageUrl: e.target.value })}
              placeholder={t('admin.categories.imagePlaceholder')}
              className="w-full mb-2"
            />
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  disabled={imageUploading || saving}
                  onChange={handleImageFile}
                />
                {imageUploading
                  ? t('admin.categories.imageUploading')
                  : t('admin.categories.imageUploadButton')}
              </label>
              {formData.imageUrl.trim() ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={saving}
                  onClick={() => onFormDataChange({ ...formData, imageUrl: '' })}
                >
                  {t('admin.categories.imageRemoveButton')}
                </Button>
              ) : null}
            </div>
            {safeImagePreviewUrl ? (
              <div className="mt-3 flex justify-center rounded-lg border border-slate-200 bg-slate-50 p-3">
                <img
                  src={toDomSafeImgSrcString(safeImagePreviewUrl)}
                  alt=""
                  className="max-h-28 max-w-full object-contain"
                />
              </div>
            ) : null}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.categories.subcategories')}
            </label>
            <div className="max-h-44 space-y-2 overflow-y-auto rounded-md border border-gray-300 p-3">
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
        <div className="flex gap-3 mt-4 border-t border-gray-200 pt-3">
          <Button
            variant="primary"
            onClick={onSubmit}
            disabled={
              saving ||
              imageUploading ||
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




