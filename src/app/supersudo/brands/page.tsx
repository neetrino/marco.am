'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../../lib/auth/AuthContext';
import { Card, Button } from '@shop/ui';
import { apiClient, getApiOrErrorMessage } from '../../../lib/api-client';
import { useTranslation } from '../../../lib/i18n-client';
import { AdminPageLayout } from '../components/AdminPageLayout';
import { AdminTablePagination } from '../components/AdminTablePagination';
import { logger } from '@/lib/utils/logger';
import { showToast } from '../../../components/Toast';

interface Brand {
  id: string;
  name: string;
  slug: string;
}

const ITEMS_PER_PAGE = 20;

export default function BrandsPage() {
  const { t } = useTranslation();
  const { isLoggedIn, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const currentPath = pathname || '/supersudo/brands';

  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [formData, setFormData] = useState({ name: '' });
  const [saving, setSaving] = useState(false);
  const [deletingBulk, setDeletingBulk] = useState(false);
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchBrands = useCallback(async () => {
    try {
      setLoading(true);
      logger.devLog('[ADMIN] Fetching brands...');
      const response = await apiClient.get<{ data: Brand[] }>('/api/v1/supersudo/brands');
      setBrands(response.data || []);
      logger.devLog('[ADMIN] Brands loaded:', response.data?.length || 0);
    } catch (err: unknown) {
      logger.error('Error fetching brands', { error: err });
      setBrands([]);
      showToast(t('admin.brands.loading'), 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  useEffect(() => {
    if (!isLoading) {
      if (!isLoggedIn || !isAdmin) {
        router.push('/supersudo');
        return;
      }
    }
  }, [isLoggedIn, isAdmin, isLoading, router]);

  useEffect(() => {
    setSelectedBrandIds((prevIds) => prevIds.filter((brandId) => brands.some((brand) => brand.id === brandId)));
  }, [brands]);

  useEffect(() => {
    setCurrentPage(1);
  }, [brands.length]);

  const totalPages = Math.ceil(brands.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedBrands = brands.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const selectedOnPage = paginatedBrands.filter((brand) => selectedBrandIds.includes(brand.id)).length;
  const allOnPageSelected = paginatedBrands.length > 0 && selectedOnPage === paginatedBrands.length;
  const selectedBrands = useMemo(
    () => brands.filter((brand) => selectedBrandIds.includes(brand.id)),
    [brands, selectedBrandIds]
  );

  const resetForm = () => {
    setFormData({ name: '' });
  };

  const handleToggleSelect = (brandId: string, checked: boolean) => {
    setSelectedBrandIds((prevIds) => {
      if (checked) {
        return prevIds.includes(brandId) ? prevIds : [...prevIds, brandId];
      }

      return prevIds.filter((id) => id !== brandId);
    });
  };

  const handleTogglePageSelection = (checked: boolean) => {
    const pageIds = paginatedBrands.map((brand) => brand.id);
    setSelectedBrandIds((prevIds) => {
      if (checked) {
        const nextIds = [...prevIds];
        pageIds.forEach((id) => {
          if (!nextIds.includes(id)) {
            nextIds.push(id);
          }
        });
        return nextIds;
      }

      return prevIds.filter((id) => !pageIds.includes(id));
    });
  };

  const handleDeleteBrand = async (brandId: string, brandName: string) => {
    if (!confirm(t('admin.brands.deleteConfirm').replace('{name}', brandName))) {
      return;
    }

    try {
      logger.devLog(`[ADMIN] Deleting brand: ${brandName} (${brandId})`);
      await apiClient.delete(`/api/v1/supersudo/brands/${brandId}`);
      await fetchBrands();
      showToast(t('admin.brands.deletedSuccess'), 'success');
    } catch (err: unknown) {
      logger.error('Error deleting brand', { error: err });
      const errorMessage = getApiOrErrorMessage(err, 'Unknown error occurred');
      showToast(t('admin.brands.errorDeleting') + `: ${errorMessage}`, 'error');
    }
  };

  const handleBulkDeleteBrands = async () => {
    if (selectedBrands.length === 0) {
      return;
    }

    const previewName =
      selectedBrands.length > 1
        ? `${selectedBrands[0].name} (+${selectedBrands.length - 1})`
        : selectedBrands[0].name;

    if (!confirm(t('admin.brands.deleteConfirm').replace('{name}', previewName))) {
      return;
    }

    setDeletingBulk(true);
    try {
      const results = await Promise.allSettled(
        selectedBrands.map((brand) => apiClient.delete(`/api/v1/supersudo/brands/${brand.id}`))
      );
      const failedCount = results.filter((result) => result.status === 'rejected').length;

      await fetchBrands();
      if (failedCount === 0) {
        setSelectedBrandIds([]);
        showToast(t('admin.brands.deletedSuccess'), 'success');
      } else {
        showToast(t('admin.brands.errorDeleting') + `: ${failedCount} failed`, 'error');
      }
    } finally {
      setDeletingBulk(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingBrand(null);
    resetForm();
    setShowAddModal(true);
  };

  const handleOpenEditModal = (brand: Brand) => {
    setEditingBrand(brand);
    setFormData({ name: brand.name });
    setShowEditModal(true);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    resetForm();
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingBrand(null);
    resetForm();
  };

  const handleCreateBrand = async () => {
    if (!formData.name.trim()) {
      showToast(t('admin.brands.nameRequired'), 'warning');
      return;
    }

    setSaving(true);
    try {
      await apiClient.post('/api/v1/supersudo/brands', {
        name: formData.name.trim(),
      });
      await fetchBrands();
      handleCloseAddModal();
      showToast(t('admin.brands.createdSuccess'), 'success');
    } catch (err: unknown) {
      logger.error('Error creating brand', { error: err });
      const errorMessage = getApiOrErrorMessage(err, 'Unknown error occurred');
      showToast(t('admin.brands.errorSaving') + `: ${errorMessage}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateBrand = async () => {
    if (!editingBrand || !formData.name.trim()) {
      showToast(t('admin.brands.nameRequired'), 'warning');
      return;
    }

    setSaving(true);
    try {
      await apiClient.put(`/api/v1/supersudo/brands/${editingBrand.id}`, {
        name: formData.name.trim(),
      });
      await fetchBrands();
      handleCloseEditModal();
      showToast(t('admin.brands.updatedSuccess'), 'success');
    } catch (err: unknown) {
      logger.error('Error updating brand', { error: err });
      const errorMessage = getApiOrErrorMessage(err, 'Unknown error occurred');
      showToast(t('admin.brands.errorSaving') + `: ${errorMessage}`, 'error');
    } finally {
      setSaving(false);
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
    <AdminPageLayout
      currentPath={currentPath}
      router={router}
      t={t}
      title={t('admin.brands.title')}
      backLabel={t('admin.common.backToAdmin')}
      onBack={() => router.push('/supersudo')}
    >
      <div className="space-y-5">
        <Card className="admin-card border-slate-200/80 bg-white/95 shadow-[0_10px_30px_rgba(2,6,23,0.06)] backdrop-blur">
          <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">{t('admin.brands.title')}</h2>
              <Button
                variant="primary"
                size="md"
                className="shadow-sm transition-transform hover:-translate-y-0.5"
                onClick={handleOpenAddModal}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t('admin.brands.addNew')}
              </Button>
            </div>
          </div>
        </Card>

        <div className="mb-1 min-h-[72px]">
          <Card
            className={`h-full p-4 transition-all duration-200 ${
              selectedBrandIds.length > 0
                ? 'border border-amber-200/80 bg-amber-50/80 shadow-sm'
                : 'border border-slate-200 bg-slate-50/70 shadow-sm'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className={`text-sm font-medium ${selectedBrandIds.length > 0 ? 'text-amber-900' : 'text-slate-600'}`}>
                {`Selected brands: ${selectedBrandIds.length}`}
              </div>
              <Button
                variant="outline"
                onClick={handleBulkDeleteBrands}
                disabled={deletingBulk || selectedBrandIds.length === 0}
                className={`${
                  selectedBrandIds.length > 0
                    ? 'border-amber-300 bg-white text-amber-900 hover:bg-amber-100'
                    : 'border-slate-200 bg-white text-slate-400'
                }`}
              >
                {deletingBulk ? t('admin.common.loading') : 'Delete Selected'}
              </Button>
            </div>
          </Card>
        </div>

        <Card className="admin-card border-slate-200/80 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.07)]">
          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 py-10 text-center">
              <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-b-2 border-slate-800" />
              <p className="text-sm font-medium text-slate-600">{t('admin.brands.loading')}</p>
            </div>
          ) : brands.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-8 text-center">
              <p className="text-sm font-medium text-slate-600">{t('admin.brands.noBrands')}</p>
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] table-fixed divide-y divide-slate-200 bg-white">
                    <colgroup>
                      <col className="w-12" />
                      <col className="w-[34%]" />
                      <col className="w-[34%]" />
                      <col className="w-[32%]" />
                    </colgroup>
                    <thead className="bg-slate-50/90">
                      <tr>
                        <th className="px-3 py-2 text-left">
                          <input
                            type="checkbox"
                            checked={allOnPageSelected}
                            onChange={(event) => handleTogglePageSelection(event.target.checked)}
                            className="h-4 w-4 cursor-pointer rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                            aria-label="Select page brands"
                          />
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Name
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Slug
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedBrands.map((brand) => (
                        <tr key={brand.id} className="group border-b border-slate-100 transition-colors hover:bg-amber-50/50">
                          <td className="px-3 py-3">
                            <input
                              type="checkbox"
                              checked={selectedBrandIds.includes(brand.id)}
                              onChange={(event) => handleToggleSelect(brand.id, event.target.checked)}
                              className="h-4 w-4 cursor-pointer rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                              aria-label={`Select ${brand.name}`}
                            />
                          </td>
                          <td className="px-3 py-3 text-sm font-semibold text-slate-900 group-hover:text-amber-900">
                            {brand.name}
                          </td>
                          <td className="px-3 py-3 text-sm text-slate-600">{brand.slug}</td>
                          <td className="px-3 py-3">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEditModal(brand)}
                                className="border border-slate-200 bg-white text-slate-700 hover:border-amber-300 hover:bg-amber-100 hover:text-amber-900"
                              >
                                {t('admin.brands.edit')}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteBrand(brand.id, brand.name)}
                                className="border border-red-100 bg-red-50/70 text-red-600 hover:border-amber-300 hover:bg-amber-100 hover:text-red-700"
                              >
                                {t('admin.brands.delete')}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {totalPages > 1 && (
                <AdminTablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={brands.length}
                  onPageChange={setCurrentPage}
                />
              )}
            </>
          )}
        </Card>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{t('admin.brands.addNewBrand')}</h3>
              <button onClick={handleCloseAddModal} className="text-gray-400 transition-colors hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label htmlFor="add-brand-name" className="mb-1 block text-sm font-medium text-gray-700">
                  {t('admin.brands.brandName')}
                </label>
                <input
                  id="add-brand-name"
                  type="text"
                  value={formData.name}
                  onChange={(event) => setFormData({ name: event.target.value })}
                  className="admin-field"
                  placeholder={t('admin.brands.enterBrandName')}
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3">
                <Button type="button" variant="outline" onClick={handleCloseAddModal} disabled={saving}>
                  {t('admin.brands.cancel')}
                </Button>
                <Button type="button" variant="primary" disabled={saving} onClick={handleCreateBrand}>
                  {saving ? t('admin.brands.saving') : t('admin.brands.create')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingBrand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">{t('admin.brands.editBrand')}</h3>
              <button onClick={handleCloseEditModal} className="text-gray-400 transition-colors hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label htmlFor="edit-brand-name" className="mb-1 block text-sm font-medium text-gray-700">
                  {t('admin.brands.brandName')}
                </label>
                <input
                  id="edit-brand-name"
                  type="text"
                  value={formData.name}
                  onChange={(event) => setFormData({ name: event.target.value })}
                  className="admin-field"
                  placeholder={t('admin.brands.enterBrandName')}
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3">
                <Button type="button" variant="outline" onClick={handleCloseEditModal} disabled={saving}>
                  {t('admin.brands.cancel')}
                </Button>
                <Button type="button" variant="primary" disabled={saving} onClick={handleUpdateBrand}>
                  {saving ? t('admin.brands.saving') : t('admin.brands.update')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminPageLayout>
  );
}

