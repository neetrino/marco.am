'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Card, Button } from '@shop/ui';
import { apiClient, getApiOrErrorMessage, getErrorHttpStatus } from '../../../lib/api-client';
import { useTranslation } from '../../../lib/i18n-client';
import { AdminPageLayout } from '../components/AdminPageLayout';
import { AdminTablePagination } from '../components/AdminTablePagination';
import { logger } from '@/lib/utils/logger';
import { beginAdminDataFetch } from '@/lib/admin/admin-fetch-helpers';
import {
  readAdminBrandsCache,
  fetchAdminBrands,
} from '@/lib/admin/admin-reference-data-cache';
import { ADMIN_IMAGE_ACCEPT } from '@/lib/constants/admin-image-upload';
import { processAdminImageFile, validateAdminImageFile } from '@/lib/utils/process-admin-image-file';
import { toDomSafeImgSrcString, toSafeImgAttributeSrc } from '@/lib/utils/image-utils';
import { showPopupConfirm } from '@/components/popup-service';
import { showToast } from '../../../components/Toast';

interface Brand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
}

const ITEMS_PER_PAGE = 20;

export default function BrandsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const currentPath = pathname || '/supersudo/brands';

  const cachedBrands = readAdminBrandsCache<Brand>();
  const hadCacheRef = useRef(cachedBrands !== null);
  const [brands, setBrands] = useState<Brand[]>(cachedBrands ?? []);
  const [loading, setLoading] = useState(cachedBrands === null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [formData, setFormData] = useState({ name: '', logoUrl: '' });
  const [saving, setSaving] = useState(false);
  const [deletingBulk, setDeletingBulk] = useState(false);
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [brandSearch, setBrandSearch] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);
  const [localLogoPreviewUrl, setLocalLogoPreviewUrl] = useState<string | null>(null);
  const logoObjectUrlRef = useRef<string | null>(null);
  const logoUploadRequestIdRef = useRef(0);
  const logoUploadPromiseRef = useRef<Promise<string> | null>(null);

  const filteredBrands = useMemo((): Brand[] => {
    const raw = brandSearch.trim().toLowerCase();
    if (!raw) {
      return brands;
    }
    const tokens = raw.split(/\s+/).filter(Boolean);
    return brands.filter((b) => {
      const name = b.name.toLowerCase();
      const slug = b.slug.toLowerCase();
      const haystack = `${name} ${slug}`;
      return tokens.every((token) => haystack.includes(token));
    });
  }, [brands, brandSearch]);

  const fetchBrands = useCallback(async (options?: { force?: boolean }) => {
    const cached = readAdminBrandsCache<Brand>();
    if (!options?.force && cached !== null) {
      setBrands(cached);
      setLoading(false);
      hadCacheRef.current = true;
      return;
    }

    try {
      beginAdminDataFetch(hadCacheRef.current, setLoading);
      const rows = await fetchAdminBrands<Brand & { logoUrl?: string | null }>(options);
      setBrands(
        rows.map((b) => ({
          id: b.id,
          name: b.name,
          slug: b.slug,
          logoUrl: b.logoUrl ?? null,
        })),
      );
      hadCacheRef.current = true;
      logger.devLog('[ADMIN] Brands loaded:', rows.length);
    } catch (err: unknown) {
      logger.error('Error fetching brands', { error: err });
      if (!hadCacheRef.current) {
        setBrands([]);
      }
      showToast(t('admin.brands.loading'), 'error');
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  useEffect(() => {
    setSelectedBrandIds((prevIds) => prevIds.filter((brandId) => brands.some((brand) => brand.id === brandId)));
  }, [brands]);

  useEffect(() => {
    setCurrentPage(1);
  }, [brandSearch]);

  const totalPages = Math.max(1, Math.ceil(filteredBrands.length / ITEMS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedBrands = filteredBrands.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const selectedOnPage = paginatedBrands.filter((brand) => selectedBrandIds.includes(brand.id)).length;
  const allOnPageSelected = paginatedBrands.length > 0 && selectedOnPage === paginatedBrands.length;
  const selectedBrands = useMemo(
    () => brands.filter((brand) => selectedBrandIds.includes(brand.id)),
    [brands, selectedBrandIds]
  );

  const clearLocalLogoPreview = useCallback(() => {
    if (logoObjectUrlRef.current) {
      URL.revokeObjectURL(logoObjectUrlRef.current);
      logoObjectUrlRef.current = null;
    }
    setLocalLogoPreviewUrl(null);
  }, []);

  const showLocalLogoPreview = useCallback((file: File) => {
    const objectUrl = URL.createObjectURL(file);
    if (logoObjectUrlRef.current) {
      URL.revokeObjectURL(logoObjectUrlRef.current);
    }
    logoObjectUrlRef.current = objectUrl;
    setLocalLogoPreviewUrl(objectUrl);
  }, []);

  const safeFormLogoPreviewUrl = useMemo(
    () => localLogoPreviewUrl ?? toSafeImgAttributeSrc(formData.logoUrl.trim()),
    [formData.logoUrl, localLogoPreviewUrl],
  );

  useEffect(() => () => clearLocalLogoPreview(), [clearLocalLogoPreview]);

  const resetForm = () => {
    logoUploadRequestIdRef.current += 1;
    logoUploadPromiseRef.current = null;
    setLogoUploading(false);
    clearLocalLogoPreview();
    setFormData({ name: '', logoUrl: '' });
  };

  const resolveLogoUrlForSave = async (fallbackLogoUrl: string): Promise<string> => {
    const pendingLogoUpload = logoUploadPromiseRef.current;
    if (!pendingLogoUpload) {
      return fallbackLogoUrl.trim();
    }

    return (await pendingLogoUpload).trim();
  };

  const handleLogoFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFile = files[0];
    if (!imageFile) {
      return;
    }

    const validationError = validateAdminImageFile(imageFile, 'logo');
    if (validationError) {
      showToast(validationError || t('admin.brands.logoInvalidFile'), 'warning');
      if (event.target) {
        event.target.value = '';
      }
      return;
    }

    const brandName = formData.name.trim();
    if (!brandName) {
      showToast(t('admin.brands.nameRequired'), 'warning');
      if (event.target) {
        event.target.value = '';
      }
      return;
    }

    showLocalLogoPreview(imageFile);
    const uploadRequestId = logoUploadRequestIdRef.current + 1;
    logoUploadRequestIdRef.current = uploadRequestId;

    setLogoUploading(true);
    const uploadPromise = (async (): Promise<string> => {
      const image = await processAdminImageFile(imageFile, 'logo');
      const result = await apiClient.post<{ url: string }>('/api/v1/supersudo/brands/upload-logo', {
        image,
        name: brandName,
        slug: editingBrand?.slug,
        brandId: editingBrand?.id,
      });
      return result.url;
    })();
    logoUploadPromiseRef.current = uploadPromise;

    try {
      const uploadedLogoUrl = await uploadPromise;
      if (logoUploadRequestIdRef.current === uploadRequestId) {
        setFormData((prev) => ({ ...prev, logoUrl: uploadedLogoUrl }));
      }
    } catch (err: unknown) {
      logger.error('Brand logo upload failed', { error: err });
      showToast(getApiOrErrorMessage(err, t('admin.brands.errorSaving')), 'error');
      if (logoUploadRequestIdRef.current === uploadRequestId) {
        clearLocalLogoPreview();
      }
    } finally {
      if (logoUploadRequestIdRef.current === uploadRequestId) {
        logoUploadPromiseRef.current = null;
        setLogoUploading(false);
      }
      if (event.target) {
        event.target.value = '';
      }
    }
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
    if (!(await showPopupConfirm(t('admin.brands.deleteConfirm').replace('{name}', brandName)))) {
      return;
    }

    try {
      logger.devLog(`[ADMIN] Deleting brand: ${brandName} (${brandId})`);
      await apiClient.delete(`/api/v1/supersudo/brands/${brandId}`);
      await fetchBrands({ force: true });
      showToast(t('admin.brands.deletedSuccess'), 'success');
    } catch (err: unknown) {
      const status = getErrorHttpStatus(err);
      if (status === 422) {
        logger.warn('Cannot delete brand due to associated products', { brandId, brandName, error: err });
      } else {
        logger.error('Error deleting brand', { error: err });
      }
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

    if (!(await showPopupConfirm(t('admin.brands.deleteConfirm').replace('{name}', previewName)))) {
      return;
    }

    setDeletingBulk(true);
    try {
      const results = await Promise.allSettled(
        selectedBrands.map((brand) => apiClient.delete(`/api/v1/supersudo/brands/${brand.id}`))
      );
      const failedCount = results.filter((result) => result.status === 'rejected').length;

      await fetchBrands({ force: true });
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
    clearLocalLogoPreview();
    setEditingBrand(brand);
    setFormData({ name: brand.name, logoUrl: brand.logoUrl ?? '' });
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
      const trimmedLogo = await resolveLogoUrlForSave(formData.logoUrl);
      await apiClient.post('/api/v1/supersudo/brands', {
        name: formData.name.trim(),
        ...(trimmedLogo ? { logoUrl: trimmedLogo } : {}),
      });
      await fetchBrands({ force: true });
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
      const trimmedLogo = await resolveLogoUrlForSave(formData.logoUrl);
      await apiClient.put(`/api/v1/supersudo/brands/${editingBrand.id}`, {
        name: formData.name.trim(),
        logoUrl: trimmedLogo.length > 0 ? trimmedLogo : null,
      });
      await fetchBrands({ force: true });
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

  const addBrandHeaderAction = (
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
  );

  return (
    <AdminPageLayout
      currentPath={currentPath}
      router={router}
      t={t}
      title={t('admin.brands.title')}
      headerActions={addBrandHeaderAction}
    >
      <div className="space-y-5">
        <Card className="admin-card border-amber-300/70 bg-gradient-to-b from-amber-50/90 via-white to-white shadow-[0_12px_40px_rgba(217,119,6,0.12)] ring-1 ring-amber-200/50">
          <div className="p-4 sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="min-w-0">
                <label
                  htmlFor="brand-admin-search"
                  className="block text-lg font-semibold tracking-tight text-slate-900"
                >
                  {t('admin.brands.searchLabel')}
                </label>
              </div>
              {brandSearch.trim() !== '' && (
                <p className="shrink-0 rounded-lg bg-amber-100/90 px-3 py-1.5 text-sm font-semibold tabular-nums text-amber-950 ring-1 ring-amber-200/80">
                  {t('admin.brands.searchMatchCount')
                    .replace('{matched}', String(filteredBrands.length))
                    .replace('{total}', String(brands.length))}
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
                id="brand-admin-search"
                type="search"
                value={brandSearch}
                onChange={(e) => setBrandSearch(e.target.value)}
                placeholder={t('admin.brands.searchPlaceholder')}
                autoComplete="off"
                className={`admin-field h-12 w-full rounded-xl border-2 border-slate-200 bg-white pl-12 text-base shadow-sm transition-[border-color,box-shadow] duration-200 placeholder:text-slate-400 focus:border-amber-500 focus:shadow-[0_0_0_4px_rgba(245,158,11,0.2)] sm:h-14 sm:pl-14 sm:text-lg ${brandSearch.length > 0 ? 'pr-12 sm:pr-14' : 'pr-4'}`}
                aria-label={t('admin.brands.searchLabel')}
              />
              {brandSearch.length > 0 ? (
                <button
                  type="button"
                  className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 sm:right-3"
                  onClick={() => setBrandSearch('')}
                  aria-label={t('admin.brands.clearSearch')}
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ) : null}
            </div>
          </div>
        </Card>

        {selectedBrandIds.length > 0 ? (
          <div className="mb-1">
            <Card className="h-full border border-amber-200/80 bg-amber-50/80 p-4 shadow-sm transition-all duration-200">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm font-medium text-amber-900">
                  {t('admin.brands.selectedBrandsCount').replace('{count}', String(selectedBrandIds.length))}
                </div>
                <Button
                  variant="outline"
                  onClick={handleBulkDeleteBrands}
                  disabled={deletingBulk}
                  className="border-amber-300 bg-white text-amber-900 hover:bg-amber-100"
                >
                  {deletingBulk ? t('admin.common.loading') : t('admin.brands.deleteSelected')}
                </Button>
              </div>
            </Card>
          </div>
        ) : null}

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
          ) : filteredBrands.length === 0 ? (
            <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50/50 px-4 py-8 text-center">
              <p className="text-sm font-medium text-amber-950">{t('admin.brands.searchNoMatches')}</p>
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] table-fixed divide-y divide-slate-200 bg-white">
                    <colgroup>
                      <col className="w-12" />
                      <col className="w-[88px]" />
                      <col className="w-[28%]" />
                      <col className="w-[28%]" />
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
                            aria-label={t('admin.brands.selectPage')}
                          />
                        </th>
                        <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {t('admin.brands.logo')}
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {t('admin.brands.tableName')}
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {t('admin.brands.tableSlug')}
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {t('admin.brands.tableActions')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedBrands.map((brand) => {
                        const safeBrandLogoUrl = toSafeImgAttributeSrc(brand.logoUrl);
                        return (
                        <tr key={brand.id} className="group border-b border-slate-100 transition-colors hover:bg-amber-50/50">
                          <td className="px-3 py-3">
                            <input
                              type="checkbox"
                              checked={selectedBrandIds.includes(brand.id)}
                              onChange={(event) => handleToggleSelect(brand.id, event.target.checked)}
                              className="h-4 w-4 cursor-pointer rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                              aria-label={t('admin.brands.selectItem').replace('{name}', brand.name)}
                            />
                          </td>
                          <td className="px-2 py-2 align-middle">
                            {safeBrandLogoUrl ? (
                              <img
                                src={toDomSafeImgSrcString(safeBrandLogoUrl)}
                                alt=""
                                className="h-12 w-12 rounded-lg border border-slate-200 bg-white object-contain p-0.5"
                              />
                            ) : (
                              <div
                                className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-[10px] font-medium uppercase tracking-wide text-slate-400"
                                aria-hidden
                              >
                                —
                              </div>
                            )}
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
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {totalPages > 1 && (
                <AdminTablePagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredBrands.length}
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
                  onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                  className="admin-field"
                  placeholder={t('admin.brands.enterBrandName')}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {t('admin.brands.logoLabel')}
                </label>
                <div className="space-y-2">
                  <label className="group flex min-h-36 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-center transition-colors hover:border-amber-400 hover:bg-amber-50/50">
                    <input
                      type="file"
                      accept={ADMIN_IMAGE_ACCEPT}
                      className="sr-only"
                      disabled={logoUploading || saving}
                      onChange={handleLogoFile}
                    />
                    {safeFormLogoPreviewUrl ? (
                      <img
                        src={toDomSafeImgSrcString(safeFormLogoPreviewUrl)}
                        alt=""
                        className="max-h-24 max-w-full object-contain"
                      />
                    ) : (
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl font-semibold text-slate-400 ring-1 ring-slate-200">
                        +
                      </span>
                    )}
                    <span className="text-sm font-semibold text-slate-800 group-hover:text-amber-900">
                      {logoUploading ? t('admin.brands.logoUploading') : t('admin.brands.logoUpload')}
                    </span>
                  </label>
                  {safeFormLogoPreviewUrl ? (
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={saving || logoUploading}
                        onClick={() => {
                          clearLocalLogoPreview();
                          setFormData((prev) => ({ ...prev, logoUrl: '' }));
                        }}
                      >
                        {t('admin.brands.logoRemove')}
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3">
                <Button type="button" variant="outline" onClick={handleCloseAddModal} disabled={saving}>
                  {t('admin.brands.cancel')}
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  disabled={saving}
                  onClick={handleCreateBrand}
                >
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
                  onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                  className="admin-field"
                  placeholder={t('admin.brands.enterBrandName')}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  {t('admin.brands.logoLabel')}
                </label>
                <div className="space-y-2">
                  <label className="group flex min-h-36 w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-center transition-colors hover:border-amber-400 hover:bg-amber-50/50">
                    <input
                      type="file"
                      accept={ADMIN_IMAGE_ACCEPT}
                      className="sr-only"
                      disabled={logoUploading || saving}
                      onChange={handleLogoFile}
                    />
                    {safeFormLogoPreviewUrl ? (
                      <img
                        src={toDomSafeImgSrcString(safeFormLogoPreviewUrl)}
                        alt=""
                        className="max-h-24 max-w-full object-contain"
                      />
                    ) : (
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl font-semibold text-slate-400 ring-1 ring-slate-200">
                        +
                      </span>
                    )}
                    <span className="text-sm font-semibold text-slate-800 group-hover:text-amber-900">
                      {logoUploading ? t('admin.brands.logoUploading') : t('admin.brands.logoUpload')}
                    </span>
                  </label>
                  {safeFormLogoPreviewUrl ? (
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={saving || logoUploading}
                        onClick={() => {
                          clearLocalLogoPreview();
                          setFormData((prev) => ({ ...prev, logoUrl: '' }));
                        }}
                      >
                        {t('admin.brands.logoRemove')}
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3">
                <Button type="button" variant="outline" onClick={handleCloseEditModal} disabled={saving}>
                  {t('admin.brands.cancel')}
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  disabled={saving}
                  onClick={handleUpdateBrand}
                >
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

