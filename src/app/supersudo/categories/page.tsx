'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Card, Button } from '@shop/ui';
import { useTranslation } from '../../../lib/i18n-client';
import { apiClient, getApiOrErrorMessage } from '../../../lib/api-client';
import { useCategories } from './hooks/useCategories';
import { useCategoryActions } from './hooks/useCategoryActions';
import { AdminPageLayout } from '../components/AdminPageLayout';
import { CategoriesList } from './components/CategoriesList';
import { BulkCategorySelectionControls } from './components/BulkCategorySelectionControls';
import { AddCategoryModal, type AddCategoryModalMode } from './components/AddCategoryModal';
import { EditCategoryModal } from './components/EditCategoryModal';
import { ConvertCategoryTypeModal } from './components/ConvertCategoryTypeModal';
import type { Category } from './types';
import { getDescendantIds, getLocalizedCategoryTitle, type AdminCategoryView } from './utils';
import { showToast } from '../../../components/Toast';
import { notifyShopCategoryTreeUpdated } from '../../../lib/shop-category-tree-sync';
import { getStoredLanguage } from '../../../lib/language';

export default function CategoriesPage() {
  const { t, lang } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const currentPath = pathname || '/supersudo/categories';
  const activeLocale = lang ?? getStoredLanguage();
  const {
    categories,
    loading,
    fetchCategories,
    syncCategoriesCache,
    applyOptimisticCategories,
    reorderCategoriesOptimistically,
    setCategoryHeaderVisibilityOptimistically,
  } = useCategories(activeLocale);
  const {
    showAddModal,
    showEditModal,
    editingCategory,
    formData,
    saving,
    setShowAddModal,
    setShowEditModal,
    setFormData,
    handleAddCategory,
    handleEditCategory,
    handleUpdateCategory,
    handleDeleteCategory,
    handleDeleteCategories,
    resetForm,
    deletingBulk,
  } = useCategoryActions();
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [categorySearch, setCategorySearch] = useState('');
  const [activeView] = useState<'roots' | 'subcategories'>('roots');
  const [addModalMode, setAddModalMode] = useState<AddCategoryModalMode>('root');
  const [movingCategoryId, setMovingCategoryId] = useState<string | null>(null);
  const [convertingCategoryId, setConvertingCategoryId] = useState<string | null>(null);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [convertingCategory, setConvertingCategory] = useState<Category | null>(null);
  const [conversionParentId, setConversionParentId] = useState('');
  const [conversionSubcategoryIds, setConversionSubcategoryIds] = useState<string[]>([]);
  const [draggingCategoryId, setDraggingCategoryId] = useState<string | null>(null);
  const [dragOverCategoryId, setDragOverCategoryId] = useState<string | null>(null);
  const reorderInFlightRef = useRef(false);
  const filteredCategories = useMemo((): Category[] => {
    const raw = categorySearch.trim().toLowerCase();
    if (!raw) {
      return categories;
    }
    const tokens = raw.split(/\s+/).filter(Boolean);
    return categories.filter((c) => {
      const title = getLocalizedCategoryTitle(c, activeLocale).toLowerCase();
      const slug = c.slug.toLowerCase();
      const parent = c.parentId ? categories.find((p) => p.id === c.parentId) : null;
      const parentTitle = getLocalizedCategoryTitle(parent, activeLocale).toLowerCase();
      const haystack = `${title} ${slug} ${parentTitle}`;
      return tokens.every((token) => haystack.includes(token));
    });
  }, [activeLocale, categories, categorySearch]);
  const selectedCategories = useMemo(
    () => categories.filter((category) => selectedCategoryIds.includes(category.id)),
    [categories, selectedCategoryIds]
  );

  useEffect(() => {
    setSelectedCategoryIds([]);
  }, [activeView]);

  useEffect(() => {
    setSelectedCategoryIds((prevIds) =>
      prevIds.filter((categoryId) => categories.some((category) => category.id === categoryId))
    );
  }, [categories]);

  const handleToggleSelect = (categoryId: string, checked: boolean) => {
    setSelectedCategoryIds((prevIds) => {
      if (checked) {
        return prevIds.includes(categoryId) ? prevIds : [...prevIds, categoryId];
      }

      return prevIds.filter((id) => id !== categoryId);
    });
  };

  const handleTogglePageSelection = (categoryIds: string[], checked: boolean) => {
    setSelectedCategoryIds((prevIds) => {
      if (checked) {
        const nextIds = [...prevIds];
        categoryIds.forEach((id) => {
          if (!nextIds.includes(id)) {
            nextIds.push(id);
          }
        });
        return nextIds;
      }

      return prevIds.filter((id) => !categoryIds.includes(id));
    });
  };

  const handleBulkDelete = async () => {
    const deleted = await handleDeleteCategories(
      selectedCategories.map((category) => category.id),
      selectedCategories.map((category) => getLocalizedCategoryTitle(category, activeLocale)),
      fetchCategories
    );

    if (deleted) {
      setSelectedCategoryIds([]);
    }
  };

  const handleStartDrag = (categoryId: string) => {
    setDraggingCategoryId(categoryId);
  };

  const handleDragEnter = (categoryId: string | null) => {
    setDragOverCategoryId(categoryId);
  };

  const handleEndDrag = () => {
    setDraggingCategoryId(null);
    setDragOverCategoryId(null);
  };

  const handleReorderCategory = async (
    categoryId: string,
    targetCategoryId: string,
    scope: AdminCategoryView,
    parentId?: string | null,
  ) => {
    if (reorderInFlightRef.current) {
      handleEndDrag();
      return;
    }

    if (categoryId === targetCategoryId) {
      handleEndDrag();
      return;
    }

    const sourceCategory = categories.find((category) => category.id === categoryId);
    const targetCategory = categories.find((category) => category.id === targetCategoryId);
    if (!sourceCategory || !targetCategory) {
      handleEndDrag();
      return;
    }

    if (scope === 'roots') {
      const bothRoots = !sourceCategory.parentId && !targetCategory.parentId;
      if (!bothRoots) {
        handleEndDrag();
        return;
      }
    } else {
      const sourceParentId = sourceCategory.parentId ?? null;
      const targetParentId = targetCategory.parentId ?? null;
      const requestedParentId = parentId ?? targetParentId;
      const sameSiblingScope =
        Boolean(sourceParentId) &&
        sourceParentId === targetParentId &&
        sourceParentId === requestedParentId;
      if (!sameSiblingScope) {
        handleEndDrag();
        return;
      }
    }

    try {
      reorderInFlightRef.current = true;
      setMovingCategoryId(categoryId);
      reorderCategoriesOptimistically(categoryId, targetCategoryId, scope, parentId ?? null);
      await apiClient.post('/api/v1/supersudo/categories/reorder', {
        categoryId,
        targetCategoryId,
        scope,
        parentId: parentId ?? null,
      });
      notifyShopCategoryTreeUpdated();
    } catch (error: unknown) {
      const message = getApiOrErrorMessage(error, t('admin.common.unknownErrorFallback'));
      showToast(message, 'error');
      await fetchCategories();
    } finally {
      reorderInFlightRef.current = false;
      setMovingCategoryId(null);
      handleEndDrag();
    }
  };

  const handleToggleCategoryHeaderVisibility = async (
    category: Category,
    nextVisible: boolean,
  ) => {
    setCategoryHeaderVisibilityOptimistically(category.id, nextVisible);
    try {
      await apiClient.put(`/api/v1/supersudo/categories/${category.id}`, {
        showInHeader: nextVisible,
      });
      notifyShopCategoryTreeUpdated();
    } catch (error: unknown) {
      setCategoryHeaderVisibilityOptimistically(category.id, Boolean(category.showInHeader));
      const message = getApiOrErrorMessage(error, t('admin.common.unknownErrorFallback'));
      showToast(message, 'error');
    }
  };

  const handleToggleCategoryKind = async (category: Category) => {
    setConvertingCategory(category);
    const descendants = getDescendantIds(categories, category.id);
    const defaultSubcategoryIds = categories
      .filter((item) => item.parentId === category.id)
      .map((item) => item.id);
    setConversionSubcategoryIds(defaultSubcategoryIds);

    const isSubcategory = Boolean(category.parentId);
    if (isSubcategory) {
      setConversionParentId('');
      setShowConvertModal(true);
      return;
    }

    const parentCandidates = categories.filter(
      (item) => !item.parentId && item.id !== category.id && !descendants.has(item.id),
    );
    if (parentCandidates.length === 0) {
      setConvertingCategory(null);
      showToast(t('admin.categories.noAvailableParentForConversion'), 'warning');
      return;
    }
    setConversionParentId(parentCandidates[0]?.id ?? '');
    setShowConvertModal(true);
  };

  const resetConvertModalState = () => {
    setShowConvertModal(false);
    setConvertingCategory(null);
    setConversionParentId('');
    setConversionSubcategoryIds([]);
  };

  const handleSubmitCategoryConversion = async () => {
    if (!convertingCategory) {
      return;
    }
    const isSubcategory = Boolean(convertingCategory.parentId);
    const nextParentId = isSubcategory ? null : conversionParentId || null;
    const normalizedSubcategoryIds = Array.from(new Set(conversionSubcategoryIds)).sort();
    const currentSubcategoryIds = categories
      .filter((item) => item.parentId === convertingCategory.id)
      .map((item) => item.id)
      .sort();
    const subcategorySelectionChanged =
      normalizedSubcategoryIds.length !== currentSubcategoryIds.length ||
      normalizedSubcategoryIds.some((id, index) => id !== currentSubcategoryIds[index]);
    const payload: { parentId: string | null; subcategoryIds?: string[] } = {
      parentId: nextParentId,
    };
    if (subcategorySelectionChanged) {
      payload.subcategoryIds = normalizedSubcategoryIds;
    }
    if (!isSubcategory && !payload.parentId) {
      showToast(t('admin.categories.parentRequired'), 'warning');
      return;
    }

    let rollback: (() => void) | null = null;
    const convertingCategoryId = convertingCategory.id;
    try {
      setConvertingCategoryId(convertingCategoryId);
      rollback = applyOptimisticCategories((previous) => {
        if (isSubcategory) {
          return previous.map((item) => {
            if (item.id === convertingCategoryId) {
              return { ...item, parentId: null };
            }
            if (normalizedSubcategoryIds.includes(item.id)) {
              return { ...item, parentId: convertingCategoryId };
            }
            return item;
          });
        }

        const nextParentId = conversionParentId || null;
        return previous.map((item) => {
          if (item.id === convertingCategoryId) {
            return { ...item, parentId: nextParentId };
          }
          if (normalizedSubcategoryIds.includes(item.id)) {
            return { ...item, parentId: convertingCategoryId };
          }
          return item;
        });
      });
      resetConvertModalState();
      setConvertingCategoryId(null);
      await apiClient.put(`/api/v1/supersudo/categories/${convertingCategoryId}`, payload);
      notifyShopCategoryTreeUpdated();
      showToast(
        isSubcategory
          ? t('admin.categories.convertToRootSuccess')
          : t('admin.categories.convertToSubcategorySuccess'),
        'success',
      );
    } catch (error: unknown) {
      rollback?.();
      showToast(getApiOrErrorMessage(error, t('admin.common.unknownErrorFallback')), 'error');
    } finally {
      setConvertingCategoryId(null);
    }
  };

  const addCategoryHeaderActions = (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
      <Button
        variant="outline"
        size="md"
        className="w-full shrink-0 border-slate-300 bg-white shadow-sm transition-transform hover:-translate-y-0.5 sm:w-auto"
        onClick={() => {
          resetForm();
          setAddModalMode('subcategory');
          setShowAddModal(true);
        }}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        {t('admin.categories.addSubcategory')}
      </Button>
      <Button
        variant="primary"
        size="md"
        className="w-full shrink-0 shadow-sm transition-transform hover:-translate-y-0.5 sm:w-auto"
        onClick={() => {
          resetForm();
          setAddModalMode('root');
          setShowAddModal(true);
        }}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        {t('admin.categories.addCategory')}
      </Button>
    </div>
  );

  return (
    <>
      <AdminPageLayout
        currentPath={currentPath}
        router={router}
        t={t}
        title={t('admin.categories.title')}
        backLabel={t('admin.categories.backToAdmin')}
        onBack={() => router.push('/supersudo')}
        headerActions={addCategoryHeaderActions}
      >
        <div className="space-y-5">
          <Card className="admin-card border-amber-300/70 bg-gradient-to-b from-amber-50/90 via-white to-white shadow-[0_12px_40px_rgba(217,119,6,0.12)] ring-1 ring-amber-200/50">
            <div className="p-3 sm:p-4">
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <div className="min-w-0">
                  <label
                    htmlFor="category-admin-search"
                    className="block text-sm font-semibold tracking-tight text-slate-900"
                  >
                    {t('admin.categories.searchLabel')}
                  </label>
                </div>
                {categorySearch.trim() !== '' && (
                  <p className="shrink-0 rounded-md bg-amber-100/90 px-2.5 py-1 text-xs font-semibold tabular-nums text-amber-950 ring-1 ring-amber-200/80">
                    {t('admin.categories.searchMatchCount')
                      .replace('{matched}', String(filteredCategories.length))
                      .replace('{total}', String(categories.length))}
                  </p>
                )}
              </div>
              <div className="relative mt-2.5">
                <svg
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  id="category-admin-search"
                  type="search"
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  placeholder={t('admin.categories.searchPlaceholder')}
                  autoComplete="off"
                  className={`admin-field h-10 w-full rounded-lg border border-slate-200 bg-white !pl-10 text-sm shadow-sm transition-[border-color,box-shadow] duration-200 placeholder:text-slate-400 focus:border-amber-500 focus:shadow-[0_0_0_3px_rgba(245,158,11,0.18)] ${categorySearch.length > 0 ? '!pr-10' : '!pr-3'}`}
                  aria-label={t('admin.categories.searchLabel')}
                />
                {categorySearch.length > 0 ? (
                  <button
                    type="button"
                    className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                    onClick={() => setCategorySearch('')}
                    aria-label={t('admin.categories.clearSearch')}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                ) : null}
              </div>
            </div>
          </Card>

          <BulkCategorySelectionControls
            selectedCount={selectedCategoryIds.length}
            deletingBulk={deletingBulk}
            onBulkDelete={handleBulkDelete}
          />

          <Card className="admin-card border-slate-200/80 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.07)]">
            {loading ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 py-10 text-center">
                <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-b-2 border-slate-800" />
                <p className="text-sm font-medium text-slate-600">{t('admin.categories.loadingCategories')}</p>
              </div>
            ) : (
              <CategoriesList
                categories={filteredCategories}
                categoryLookupList={categories}
                viewMode={activeView}
                searchQuery={categorySearch}
                selectedCategoryIds={selectedCategoryIds}
                onToggleSelect={handleToggleSelect}
                onTogglePageSelection={handleTogglePageSelection}
                onEdit={handleEditCategory}
                onDelete={(categoryId, categoryTitle) =>
                  handleDeleteCategory(categoryId, categoryTitle, fetchCategories, categories)
                }
                onToggleHeaderVisibility={handleToggleCategoryHeaderVisibility}
                onToggleCategoryKind={handleToggleCategoryKind}
                onReorder={handleReorderCategory}
                movingCategoryId={movingCategoryId}
                convertingCategoryId={convertingCategoryId}
                draggingCategoryId={draggingCategoryId}
                dragOverCategoryId={dragOverCategoryId}
                onDragStart={handleStartDrag}
                onDragEnter={handleDragEnter}
                onDragEnd={handleEndDrag}
              />
            )}
          </Card>
        </div>
      </AdminPageLayout>

      <AddCategoryModal
        isOpen={showAddModal}
        mode={addModalMode}
        formData={formData}
        categories={categories}
        saving={saving}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        onFormDataChange={setFormData}
        onSubmit={async () => {
          if (addModalMode === 'subcategory' && !formData.parentId.trim()) {
            showToast(t('admin.categories.parentRequired'), 'warning');
            return;
          }
          await handleAddCategory(fetchCategories);
        }}
      />

      <EditCategoryModal
        isOpen={showEditModal}
        editingCategory={editingCategory}
        formData={formData}
        categories={categories}
        saving={saving}
        onClose={() => {
          setShowEditModal(false);
          resetForm();
        }}
        onFormDataChange={setFormData}
        onSubmit={() => handleUpdateCategory(syncCategoriesCache, applyOptimisticCategories)}
      />

      <ConvertCategoryTypeModal
        isOpen={showConvertModal}
        category={convertingCategory}
        categories={categories}
        targetParentId={conversionParentId}
        targetSubcategoryIds={conversionSubcategoryIds}
        saving={convertingCategoryId !== null}
        onClose={resetConvertModalState}
        onTargetParentIdChange={setConversionParentId}
        onTargetSubcategoryIdsChange={setConversionSubcategoryIds}
        onSubmit={handleSubmitCategoryConversion}
      />
    </>
  );
}
