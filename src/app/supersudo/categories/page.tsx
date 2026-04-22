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
            <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                    {t('admin.categories.title')}
                  </h2>
                </div>
                <Button
                  variant="primary"
                  size="md"
                  className="shadow-sm transition-transform hover:-translate-y-0.5"
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
                categories={categories}
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
