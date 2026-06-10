'use client';

import { useMemo } from 'react';
import { Button } from '@shop/ui';
import { useTranslation } from '../../../../lib/i18n-client';
import { getStoredLanguage } from '../../../../lib/language';
import { buildCategoryTree, getAncestorIds, getDescendantIds, getLocalizedCategoryTitle } from '../utils';
import type { Category } from '../types';

interface ConvertCategoryTypeModalProps {
  isOpen: boolean;
  category: Category | null;
  categories: Category[];
  targetParentId: string;
  targetSubcategoryIds: string[];
  saving: boolean;
  onClose: () => void;
  onTargetParentIdChange: (parentId: string) => void;
  onTargetSubcategoryIdsChange: (subcategoryIds: string[]) => void;
  onSubmit: () => Promise<void>;
}

export function ConvertCategoryTypeModal({
  isOpen,
  category,
  categories,
  targetParentId,
  targetSubcategoryIds,
  saving,
  onClose,
  onTargetParentIdChange,
  onTargetSubcategoryIdsChange,
  onSubmit,
}: ConvertCategoryTypeModalProps) {
  const { t, lang } = useTranslation();
  const activeLocale = lang ?? getStoredLanguage();

  const conversionContext = useMemo(() => {
    if (!category) {
      return null;
    }
    const isSubcategory = Boolean(category.parentId);
    const descendants = getDescendantIds(categories, category.id);
    const ancestors = getAncestorIds(categories, category.id);
    const parentOptions = categories.filter(
      (item) => !item.parentId && item.id !== category.id && !descendants.has(item.id),
    );
    const childCandidates = buildCategoryTree(categories).filter((item) => {
      if (item.id === category.id || ancestors.has(item.id)) {
        return false;
      }
      if (targetParentId && item.id === targetParentId) {
        return false;
      }
      return true;
    });

    return {
      isSubcategory,
      parentOptions,
      childCandidates,
      title: getLocalizedCategoryTitle(category, activeLocale) || category.slug,
    };
  }, [activeLocale, categories, category, targetParentId]);

  if (!isOpen || !category || !conversionContext) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label={t('admin.common.close')}
        className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <div
        className="absolute inset-y-0 right-0 flex w-full justify-end"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            onClose();
          }
        }}
      >
        <div
          className="flex h-full w-full max-w-xl flex-col border-l border-gray-200 bg-white shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 sm:px-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {conversionContext.isSubcategory
                  ? t('admin.categories.convertToMainCategory')
                  : t('admin.categories.convertToSubcategory')}
              </h3>
              <p className="mt-1 text-sm text-gray-600">{conversionContext.title}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              {t('admin.common.close')}
            </Button>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4 sm:px-6">
            {!conversionContext.isSubcategory ? (
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {t('admin.categories.parentCategory')}
                </label>
                <select
                  value={targetParentId}
                  onChange={(event) => onTargetParentIdChange(event.target.value)}
                  className="admin-field"
                >
                  <option value="">
                    {t('admin.categories.selectParentCategory')}
                  </option>
                  {conversionContext.parentOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {getLocalizedCategoryTitle(option, activeLocale)}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                {t('admin.categories.chooseChildrenOptional')}
              </label>
              <div className="max-h-[56vh] space-y-2 overflow-y-auto rounded-md border border-gray-300 p-3">
                {conversionContext.childCandidates.map((candidate) => {
                  const checked = targetSubcategoryIds.includes(candidate.id);
                  return (
                    <label key={candidate.id} className="flex cursor-pointer items-center gap-2 rounded p-2 hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(event) => {
                          if (event.target.checked) {
                            onTargetSubcategoryIdsChange([...targetSubcategoryIds, candidate.id]);
                            return;
                          }
                          onTargetSubcategoryIdsChange(targetSubcategoryIds.filter((id) => id !== candidate.id));
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                      />
                      <span className="text-sm text-gray-700">
                        {`${'— '.repeat(candidate.level)}${getLocalizedCategoryTitle(candidate, activeLocale)}`}
                      </span>
                    </label>
                  );
                })}
                {conversionContext.childCandidates.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    {t('admin.categories.noSubcategoryCandidates')}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex gap-3 border-t border-gray-200 px-5 py-4 sm:px-6">
            <Button
              variant="primary"
              className="flex-1"
              onClick={() => {
                if (!saving) {
                  void onSubmit();
                }
              }}
            >
              {t('admin.categories.updateCategory')}
            </Button>
            <Button variant="ghost" onClick={onClose}>
              {t('admin.common.cancel')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

