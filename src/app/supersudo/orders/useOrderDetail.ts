'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, getApiOrErrorMessage } from '@/lib/api-client';
import { getErrorHttpStatus } from '@/lib/api-client/types';
import { useTranslation } from '@/lib/i18n-client';
import { logger } from '@/lib/utils/logger';
import { buildAdminOrderDetailCacheKey } from '@/lib/admin/admin-cache-keys';
import { dedupedAdminRequest } from '@/lib/admin/admin-request-dedup';
import { useAdminOrderCurrency } from './hooks/useAdminOrderCurrency';
import {
  persistAdminOrderDetailCache,
  readAdminOrderDetailCache,
} from './utils/order-detail-cache';
import type { OrderDetails } from './useOrders';

type UpdateMessage = { type: 'success' | 'error'; text: string } | null;

export function useOrderDetail(orderId: string | undefined) {
  const { t } = useTranslation();
  const router = useRouter();
  const { formatCurrency } = useAdminOrderCurrency();

  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [savingAdminNotes, setSavingAdminNotes] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<UpdateMessage>(null);

  const fetchOrder = useCallback(async (options?: { force?: boolean }) => {
    if (!orderId) {
      setLoading(false);
      setNotFound(false);
      setOrderDetails(null);
      return;
    }

    const cacheKey = buildAdminOrderDetailCacheKey(orderId);
    const cachedDetails = readAdminOrderDetailCache(orderId);

    if (!options?.force && cachedDetails) {
      setOrderDetails(cachedDetails);
      setLoading(false);
      setNotFound(false);
      return;
    }

    setLoading(!cachedDetails);
    setNotFound(false);
    if (!cachedDetails) {
      setOrderDetails(null);
    }

    try {
      const response = await dedupedAdminRequest(cacheKey, () =>
        apiClient.get<OrderDetails>(`/api/v1/supersudo/orders/${orderId}`),
      );
      setOrderDetails(response);
      persistAdminOrderDetailCache(orderId, response);
    } catch (err: unknown) {
      logger.error('Admin order detail fetch failed', { orderId, error: err });
      const message = getApiOrErrorMessage(err, t('admin.orders.orderDetails.failedToLoad'));
      if (getErrorHttpStatus(err) === 404 || message.toLowerCase().includes('not found')) {
        setNotFound(true);
      }
      if (!cachedDetails) {
        setOrderDetails(null);
      }
    } finally {
      setLoading(false);
    }
  }, [orderId, t]);

  useEffect(() => {
    void fetchOrder();
  }, [fetchOrder]);

  const handleAdminNotesSave = async (adminNotes: string) => {
    if (!orderId) {
      return;
    }

    try {
      setSavingAdminNotes(true);
      setUpdateMessage(null);
      const updated = await apiClient.put<OrderDetails>(`/api/v1/supersudo/orders/${orderId}`, {
        adminNotes,
      });
      setOrderDetails(updated);
      persistAdminOrderDetailCache(orderId, updated);
      setUpdateMessage({
        type: 'success',
        text: t('admin.orders.orderDetails.internalNotesSaved'),
      });
      setTimeout(() => setUpdateMessage(null), 3000);
    } catch (err: unknown) {
      logger.error('Admin order internal notes update failed', { orderId, error: err });
      setUpdateMessage({
        type: 'error',
        text: t('admin.orders.orderDetails.internalNotesSaveFailed'),
      });
      setTimeout(() => setUpdateMessage(null), 5000);
      throw err;
    } finally {
      setSavingAdminNotes(false);
    }
  };

  return {
    orderDetails,
    loading,
    notFound,
    savingAdminNotes,
    updateMessage,
    formatCurrency,
    handleAdminNotesSave,
    router,
    refetch: () => fetchOrder({ force: true }),
  };
}
