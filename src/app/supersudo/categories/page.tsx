'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth/AuthContext';
import { Card, Button } from '@shop/ui';
import { useTranslation } from '../../../lib/i18n-client';
import { useCategories } from './hooks/useCategories';
import { useCategoryActions } from './hooks/useCategoryActions';
import { AdminPageLayout } from '../components/AdminPageLayout';
import { CategoriesList } from './components/CategoriesList';
import { BulkCategorySelectionControls } from './components/BulkCategorySelectionControls';
import { AddCategoryModal } from './components/AddCategoryModal';
import { EditCategoryModal } from './components/EditCategoryModal';
import type { Category } from './types';

export default function CategoriesPage() {
  const { t } = useTranslation();
  const { isLoggedIn, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const currentPath = pathname || '/supersudo/categories';
  const { categories, loading, fetchCategories } = useCategories();
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
  const filteredCategories = useMemo((): Category[] => {
    const raw = categorySearch.trim().toLowerCase();
    if (!raw) {
      return categories;
    }
    const tokens = raw.split(/\s+/).filter(Boolean);
    return categories.filter((c) => {
      const title = c.title.toLowerCase();
      const slug = c.slug.toLowerCase();
      const parent = c.parentId ? categories.find((p) => p.id === c.parentId) : null;
      const parentTitle = (parent?.title ?? '').toLowerCase();
      const haystack = `${title} ${slug} ${parentTitle}`;
      return tokens.every((token) => haystack.includes(token));
    });
  }, [categories, categorySearch]);
  const selectedCategories = useMemo(
    () => categories.filter((category) => selectedCategoryIds.includes(category.id)),
    [categories, selectedCategoryIds]
  );

  useEffect(() => {
    if (!isLoading) {
      if (!isLoggedIn || !isAdmin) {
        router.push('/supersudo');
        return;
      }
    }
  }, [isLoggedIn, isAdmin, isLoading, router]);

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
      selectedCategories.map((category) => category.title),
      fetchCategories
    );

    if (deleted) {
      setSelectedCategoryIds([]);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('admin.common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !isAdmin) {
    return null;
  }

  return (
    <>
      <AdminPageLayout
        currentPath={currentPath}
        router={router}
        t={t}
        title={t('admin.categories.title')}
        backLabel={t('admin.categories.backToAdmin')}
        onBack={() => router.push('/supersudo')}
      >
        <div className="space-y-5">
          <Card className="admin-card border-slate-200/80 bg-white/95 shadow-[0_10px_30px_rgba(2,6,23,0.06)] backdrop-blur">
            <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                  {t('admin.categories.title')}
                </h2>
                <Button
                  variant="primary"
                  size="md"
                  className="w-full shrink-0 shadow-sm transition-transform hover:-translate-y-0.5 sm:w-auto"
                  onClick={() => {
                    resetForm();
                    setShowAddModal(true);
                  }}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {t('admin.categories.addCategory')}
                </Button>
              </div>
            </div>
          </Card>

          <Card className="admin-card border-amber-300/70 bg-gradient-to-b from-amber-50/90 via-white to-white shadow-[0_12px_40px_rgba(217,119,6,0.12)] ring-1 ring-amber-200/50">
            <div className="p-4 sm:p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="min-w-0">
                  <label
                    htmlFor="category-admin-search"
                    className="block text-lg font-semibold tracking-tight text-slate-900"
                  >
                    {t('admin.categories.searchLabel')}
                  </label>
                  <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-600">
                    {t('admin.categories.searchHint')}
                  </p>
                </div>
                {categorySearch.trim() !== '' && (
                  <p className="shrink-0 rounded-lg bg-amber-100/90 px-3 py-1.5 text-sm font-semibold tabular-nums text-amber-950 ring-1 ring-amber-200/80">
                    {t('admin.categories.searchMatchCount')
                      .replace('{matched}', String(filteredCategories.length))
                      .replace('{total}', String(categories.length))}
                  </p>
                )}
              </div>
              <div className="relative mt-4">
                <svg
                  className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
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
                  className={`admin-field h-12 w-full rounded-xl border-2 border-slate-200 bg-white pl-12 text-base shadow-sm transition-[border-color,box-shadow] duration-200 placeholder:text-slate-400 focus:border-amber-500 focus:shadow-[0_0_0_4px_rgba(245,158,11,0.2)] sm:h-14 sm:pl-14 sm:text-lg ${categorySearch.length > 0 ? 'pr-12 sm:pr-14' : 'pr-4'}`}
                  aria-label={t('admin.categories.searchLabel')}
                />
                {categorySearch.length > 0 ? (
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 sm:right-3"
                    onClick={() => setCategorySearch('')}
                    aria-label={t('admin.categories.clearSearch')}
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                searchQuery={categorySearch}
                selectedCategoryIds={selectedCategoryIds}
                onToggleSelect={handleToggleSelect}
                onTogglePageSelection={handleTogglePageSelection}
                onEdit={handleEditCategory}
                onDelete={(categoryId, categoryTitle) =>
                  handleDeleteCategory(categoryId, categoryTitle, fetchCategories)
                }
              />
            )}
          </Card>
        </div>
      </AdminPageLayout>

      <AddCategoryModal
        isOpen={showAddModal}
        formData={formData}
        categories={categories}
        saving={saving}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        onFormDataChange={setFormData}
        onSubmit={() => handleAddCategory(fetchCategories)}
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
        onSubmit={() => handleUpdateCategory(fetchCategories)}
      />
    </>
  );
}
