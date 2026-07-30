'use client';

import { useMemo, useState } from 'react';
import { Button, Input } from '@shop/ui';
import { useTranslation } from '../../../../lib/i18n-client';
import { t as translateByLocale } from '../../../../lib/i18n';
import { getStoredLanguage } from '../../../../lib/language';
import { getLocalizedCategoryTitle } from '../utils';
import type { Category, CategoryFormData } from '../types';
import { ADMIN_LOCALE_TAB_ACTIVE_CLASS } from '../../components/admin-button.classes';

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
  const [parentCategorySearch, setParentCategorySearch] = useState('');
  const mt = (path: string) => translateByLocale(activeTitleLocaleTab, path);
  const rootCategories = categories.filter((category) => !category.parentId);
  const isSubcategoryMode = mode === 'subcategory';
  const filteredRootCategories = useMemo(() => {
    const query = parentCategorySearch.trim().toLowerCase();
    if (!query) {
      return rootCategories;
    }

    return rootCategories.filter((category) => {
      const title = getLocalizedCategoryTitle(category, activeTitleLocaleTab).toLowerCase();
      const slug = category.slug.toLowerCase();
      return title.includes(query) || slug.includes(query);
    });
  }, [activeTitleLocaleTab, parentCategorySearch, rootCategories]);

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
                        ? ADMIN_LOCALE_TAB_ACTIVE_CLASS
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
                <input
                  type="search"
                  value={parentCategorySearch}
                  onChange={(event) => setParentCategorySearch(event.target.value)}
                  placeholder={mt('admin.categories.searchPlaceholder')}
                  className="admin-field mb-2"
                  aria-label={mt('admin.categories.searchLabel')}
                />
                <select
                  value={formData.parentId}
                  onChange={(e) => onFormDataChange({ ...formData, parentId: e.target.value })}
                  className="admin-field"
                  required
                >
                  <option value="">
                    {mt('admin.categories.selectParentCategory')}
                  </option>
                  {filteredRootCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {getLocalizedCategoryTitle(category, activeTitleLocaleTab)}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>

          <div className="flex gap-3 border-t border-gray-200 px-5 py-4 sm:px-6">
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




