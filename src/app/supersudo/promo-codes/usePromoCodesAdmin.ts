import { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient, getApiOrErrorMessage } from '@/lib/api-client';
import { logger } from '@/lib/utils/logger';
import { ADMIN_CACHE_KEYS } from '@/lib/admin/admin-cache-keys';
import { beginAdminDataFetch } from '@/lib/admin/admin-fetch-helpers';
import {
  ADMIN_SESSION_CACHE_TTL_MS,
  readAdminSessionCache,
  writeAdminSessionCache,
} from '@/lib/admin/admin-session-cache';
import { showPopupConfirm } from '@/components/popup-service';
import { showToast } from '@/components/Toast';
import type { AdminPromoCode, PromoCodeFormState } from './types';
import { createEmptyPromoCodeForm, normalizePromoCodeInput } from './promo-code-form.utils';

type UsePromoCodesAdminOptions = {
  t: (key: string) => string;
};

export function usePromoCodesAdmin({ t }: UsePromoCodesAdminOptions) {
  const cachedPromoCodes = readAdminSessionCache<{ promoCodes: AdminPromoCode[] }>(
    ADMIN_CACHE_KEYS.promoCodes,
    ADMIN_SESSION_CACHE_TTL_MS,
  );
  const hadCacheRef = useRef(Boolean(cachedPromoCodes?.promoCodes?.length));
  const [records, setRecords] = useState<AdminPromoCode[]>(cachedPromoCodes?.promoCodes ?? []);
  const [loading, setLoading] = useState(!hadCacheRef.current);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<PromoCodeFormState>(createEmptyPromoCodeForm());

  const fetchPromoCodes = useCallback(async () => {
    try {
      beginAdminDataFetch(hadCacheRef.current, setLoading);
      const response = await apiClient.get<{ promoCodes: AdminPromoCode[] }>(
        '/api/v1/supersudo/promo-codes'
      );
      setRecords(response.promoCodes ?? []);
      writeAdminSessionCache(ADMIN_CACHE_KEYS.promoCodes, response);
      hadCacheRef.current = true;
    } catch (err: unknown) {
      logger.error('Admin promo codes fetch failed', { error: err });
      if (!hadCacheRef.current) {
        setRecords([]);
      }
      showToast(t('admin.promoCodes.loadFailed'), 'error');
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void fetchPromoCodes();
  }, [fetchPromoCodes]);

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
