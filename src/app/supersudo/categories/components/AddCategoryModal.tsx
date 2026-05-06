'use client';

import { useMemo, useState, type ChangeEvent } from 'react';
import { Button, Input } from '@shop/ui';
import { useTranslation } from '../../../../lib/i18n-client';
import { processImageFile, toDomSafeImgSrcString, toSafeImgAttributeSrc } from '../../../../lib/utils/image-utils';
import { showToast } from '../../../../components/Toast';
import { logger } from '../../../../lib/utils/logger';
import { buildCategoryTree } from '../utils';
import type { Category, CategoryFormData } from '../types';

interface AddCategoryModalProps {
  isOpen: boolean;
  formData: CategoryFormData;
  categories: Category[];
  saving: boolean;
  onClose: () => void;
  onFormDataChange: (data: CategoryFormData) => void;
  onSubmit: () => Promise<void>;
}

export function AddCategoryModal({
  isOpen,
  formData,
  categories,
  saving,
  onClose,
  onFormDataChange,
  onSubmit,
}: AddCategoryModalProps) {
  const { t } = useTranslation();
  const categoryTree = buildCategoryTree(categories);
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
      const preferredType =
        imageFile.type === 'image/png' || imageFile.type === 'image/webp'
          ? imageFile.type
          : 'image/jpeg';
      const base64 = await processImageFile(imageFile, {
        maxSizeMB: 1.5,
        maxWidthOrHeight: 800,
        useWebWorker: true,
        fileType: preferredType,
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-md rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('admin.categories.addCategory')}</h3>
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
              {categoryTree.map((category) => (
                <option key={category.id} value={category.id}>
                  {`${'— '.repeat(category.level)}${category.title}`}
                </option>
              ))}
            </select>
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
        </div>
        <div className="flex gap-3 mt-6">
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
            {saving ? t('admin.categories.creating') : t('admin.categories.createCategory')}
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




