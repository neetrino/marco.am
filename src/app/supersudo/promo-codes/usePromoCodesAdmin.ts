import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, getApiOrErrorMessage } from '@/lib/api-client';
import { logger } from '@/lib/utils/logger';
import { showPopupConfirm } from '@/components/popup-service';
import { showToast } from '@/components/Toast';
import type { AdminPromoCode, PromoCodeFormState } from './types';
import { createEmptyPromoCodeForm, normalizePromoCodeInput } from './promo-code-form.utils';

type UsePromoCodesAdminOptions = {
  isLoggedIn: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  t: (key: string) => string;
};

export function usePromoCodesAdmin({
  isLoggedIn,
  isAdmin,
  isLoading,
  t,
}: UsePromoCodesAdminOptions) {
  const router = useRouter();
  const [records, setRecords] = useState<AdminPromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<PromoCodeFormState>(createEmptyPromoCodeForm());

  useEffect(() => {
    if (!isLoading && (!isLoggedIn || !isAdmin)) {
      router.push('/supersudo');
    }
  }, [isLoggedIn, isAdmin, isLoading, router]);

  const fetchPromoCodes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ promoCodes: AdminPromoCode[] }>(
        '/api/v1/supersudo/promo-codes'
      );
      setRecords(response.promoCodes ?? []);
    } catch (err: unknown) {
      logger.error('Admin promo codes fetch failed', { error: err });
      setRecords([]);
      showToast(t('admin.promoCodes.loadFailed'), 'error');
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (isLoggedIn && isAdmin) {
      void fetchPromoCodes();
    }
  }, [isLoggedIn, isAdmin, fetchPromoCodes]);

  const openCreateModal = () => {
    setForm(createEmptyPromoCodeForm());
    setModalOpen(true);
  };

  const openEditModal = (record: AdminPromoCode) => {
    setForm({ ...record });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const savePromoCode = async () => {
    const payload: PromoCodeFormState = {
      ...form,
      code: normalizePromoCodeInput(form.code),
      // Hidden fields are normalized to keep checkout promo flow predictable.
      isActive: true,
      scope: 'all',
      usageLimitTotal: null,
      usageLimitPerUser: null,
    };
    if (!/^[A-Z0-9_-]{3,64}$/.test(payload.code)) {
      showToast(t('admin.promoCodes.invalidCode'), 'error');
      return;
    }

    setSaving(true);
    try {
      await apiClient.put('/api/v1/supersudo/promo-codes', payload);
      showToast(t('admin.promoCodes.savedSuccess'), 'success');
      setModalOpen(false);
      await fetchPromoCodes();
    } catch (err: unknown) {
      const message = getApiOrErrorMessage(err, t('admin.promoCodes.saveFailed'));
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const deletePromoCode = async (record: AdminPromoCode) => {
    if (!(await showPopupConfirm(t('admin.promoCodes.deleteConfirm').replace('{code}', record.code)))) {
      return;
    }
    try {
      await apiClient.delete(`/api/v1/supersudo/promo-codes/${record.id}`);
      showToast(t('admin.promoCodes.deletedSuccess'), 'success');
      await fetchPromoCodes();
    } catch (err: unknown) {
      const message = getApiOrErrorMessage(err, t('admin.promoCodes.deleteFailed'));
      showToast(message, 'error');
    }
  };

  return {
    records,
    loading,
    saving,
    modalOpen,
    form,
    setForm,
    openCreateModal,
    openEditModal,
    closeModal,
    savePromoCode,
    deletePromoCode,
  };
}
