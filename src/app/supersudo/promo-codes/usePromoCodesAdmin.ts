import { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient, getApiOrErrorMessage } from '@/lib/api-client';
import { logger } from '@/lib/utils/logger';
import { ADMIN_CACHE_KEYS } from '@/lib/admin/admin-cache-keys';
import { beginAdminDataFetch } from '@/lib/admin/admin-fetch-helpers';
import { dedupedAdminRequest } from '@/lib/admin/admin-request-dedup';
import {
  ADMIN_SESSION_CACHE_TTL_MS,
  readAdminSessionCache,
  writeAdminSessionCache,
} from '@/lib/admin/admin-session-cache';
import { showPopupConfirm } from '@/components/popup-service';
import { showToast } from '@/components/Toast';
import type { AdminPromoCode, PromoCodeFormState } from './types';
import { createEmptyPromoCodeForm, normalizePromoCodeInput } from './promo-code-form.utils';

type PromoCodesCachePayload = { promoCodes: AdminPromoCode[] };

type UsePromoCodesAdminOptions = {
  t: (key: string) => string;
};

export function usePromoCodesAdmin({ t }: UsePromoCodesAdminOptions) {
  const tRef = useRef(t);
  tRef.current = t;

  const cachedPromoCodes = readAdminSessionCache<PromoCodesCachePayload>(
    ADMIN_CACHE_KEYS.promoCodes,
    ADMIN_SESSION_CACHE_TTL_MS,
  );
  const hadCacheRef = useRef(cachedPromoCodes !== null);
  const [records, setRecords] = useState<AdminPromoCode[]>(cachedPromoCodes?.promoCodes ?? []);
  const [loading, setLoading] = useState(cachedPromoCodes === null);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<PromoCodeFormState>(createEmptyPromoCodeForm());

  const fetchPromoCodes = useCallback(async (options?: { force?: boolean }) => {
    const cacheKey = ADMIN_CACHE_KEYS.promoCodes;
    const cached = readAdminSessionCache<PromoCodesCachePayload>(
      cacheKey,
      ADMIN_SESSION_CACHE_TTL_MS,
    );
    if (!options?.force && cached !== null) {
      setRecords(cached.promoCodes ?? []);
      setLoading(false);
      hadCacheRef.current = true;
      return;
    }

    try {
      beginAdminDataFetch(hadCacheRef.current, setLoading);
      const response = await dedupedAdminRequest(cacheKey, () =>
        apiClient.get<PromoCodesCachePayload>('/api/v1/supersudo/promo-codes'),
      );
      const nextRecords = response.promoCodes ?? [];
      setRecords(nextRecords);
      writeAdminSessionCache(cacheKey, { promoCodes: nextRecords });
      hadCacheRef.current = true;
    } catch (err: unknown) {
      logger.error('Admin promo codes fetch failed', { error: err });
      if (!hadCacheRef.current) {
        setRecords([]);
      }
      showToast(tRef.current('admin.promoCodes.loadFailed'), 'error');
    } finally {
      setLoading(false);
    }
  }, []);

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
      await fetchPromoCodes({ force: true });
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
      await fetchPromoCodes({ force: true });
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
