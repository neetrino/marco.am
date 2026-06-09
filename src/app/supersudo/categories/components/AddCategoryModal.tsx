'use client';

import { useMemo, useState, type ChangeEvent } from 'react';
import { Button, Input } from '@shop/ui';
import { useTranslation } from '../../../../lib/i18n-client';
import { t as translateByLocale } from '../../../../lib/i18n';
import { processImageFile, toDomSafeImgSrcString, toSafeImgAttributeSrc } from '../../../../lib/utils/image-utils';
import { showToast } from '../../../../components/Toast';
import { logger } from '../../../../lib/utils/logger';
import { getStoredLanguage } from '../../../../lib/language';
import { getLocalizedCategoryTitle } from '../utils';
import type { Category, CategoryFormData } from '../types';

type CategoryLocale = 'hy' | 'en' | 'ru';

function normalizeCategoryLocale(locale: string): CategoryLocale {
  if (locale === 'en' || locale === 'ru' || locale === 'hy') {
    return locale;
  }
  return 'hy';
}

export type AddCategoryModalMode = 'root' | 'subcategory';

interface AddCategoryModalProps {
  isOpen: boolean;
  mode: AddCategoryModalMode;
  formData: CategoryFormData;
  categories: Category[];
  saving: boolean;
  onClose: () => void;
  onFormDataChange: (data: CategoryFormData) => void;
  onSubmit: () => Promise<void>;
}

export function AddCategoryModal({
  isOpen,
  mode,
  formData,
  categories,
  saving,
  onClose,
  onFormDataChange,
  onSubmit,
}: AddCategoryModalProps) {
  const { lang } = useTranslation();
  const initialLocaleTab = normalizeCategoryLocale(lang ?? getStoredLanguage());
  const [activeTitleLocaleTab, setActiveTitleLocaleTab] = useState<CategoryLocale>(initialLocaleTab);
  const mt = (path: string) => translateByLocale(activeTitleLocaleTab, path);
  const rootCategories = categories.filter((category) => !category.parentId);
  const isSubcategoryMode = mode === 'subcategory';
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
      showToast(mt('admin.categories.imageUploadFailed'), 'error');
    } finally {
      setImageUploading(false);
      event.target.value = '';
    }
  };

  if (!isOpen) return null;

  const titleLocaleTabs: Array<{ code: CategoryLocale; label: string }> = [
    { code: 'hy', label: 'HY' },
    { code: 'en', label: 'EN' },
    { code: 'ru', label: 'RU' },
  ];
  const activeTitleLabelByLocale: Record<CategoryLocale, string> = {
    hy: mt('admin.categories.categoryTitleHy'),
    en: mt('admin.categories.categoryTitleEn'),
    ru: mt('admin.categories.categoryTitleRu'),
  };
  const activeTitlePlaceholderByLocale: Record<CategoryLocale, string> = {
    hy: mt('admin.categories.categoryTitlePlaceholderHy'),
    en: mt('admin.categories.categoryTitlePlaceholderEn'),
    ru: mt('admin.categories.categoryTitlePlaceholderRu'),
  };

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label={mt('admin.common.close')}
        className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
        onClick={() => {
          if (!saving) {
            onClose();
          }
        }}
      />
      <div
        className="absolute inset-y-0 right-0 flex w-full justify-end"
        onClick={(event) => {
          if (event.target === event.currentTarget && !saving) {
            onClose();
          }
        }}
      >
        <div
          className="flex h-full w-full max-w-xl flex-col border-l border-gray-200 bg-white shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 sm:px-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {isSubcategoryMode ? mt('admin.categories.addSubcategory') : mt('admin.categories.addCategory')}
            </h3>
            <Button variant="ghost" size="sm" disabled={saving} onClick={onClose}>
              {mt('admin.common.close')}
            </Button>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6">
            <div>
              <div className="mb-2 flex items-center gap-2">
                {titleLocaleTabs.map((tab) => (
                  <button
                    key={tab.code}
                    type="button"
                    onClick={() => setActiveTitleLocaleTab(tab.code)}
                    className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      activeTitleLocaleTab === tab.code
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                    }`}
                    aria-pressed={activeTitleLocaleTab === tab.code}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {activeTitleLabelByLocale[activeTitleLocaleTab]} *
              </label>
              <Input
                type="text"
                value={formData.titles[activeTitleLocaleTab]}
                onChange={(e) =>
                  onFormDataChange({
                    ...formData,
                    titles: { ...formData.titles, [activeTitleLocaleTab]: e.target.value },
                  })
                }
                placeholder={activeTitlePlaceholderByLocale[activeTitleLocaleTab]}
                className="w-full"
              />
            </div>
            {isSubcategoryMode ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {mt('admin.categories.parentCategory')} *
                </label>
                <select
                  value={formData.parentId}
                  onChange={(e) => onFormDataChange({ ...formData, parentId: e.target.value })}
                  className="admin-field"
                  required
                >
                  <option value="">
                    {mt('admin.categories.selectParentCategory')}
                  </option>
                  {rootCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {getLocalizedCategoryTitle(category, activeTitleLocaleTab)}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {mt('admin.categories.imageLabel')}
              </label>
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
                    ? mt('admin.categories.imageUploading')
                    : mt('admin.categories.imageUploadButton')}
                </label>
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
                <span className="text-sm text-gray-700">{mt('admin.categories.requiresSizes')}</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 border-t border-gray-200 px-5 py-4 sm:px-6">
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
              {saving ? mt('admin.categories.creating') : mt('admin.categories.createCategory')}
            </Button>
            <Button variant="ghost" onClick={onClose} disabled={saving}>
              {mt('admin.common.cancel')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}




