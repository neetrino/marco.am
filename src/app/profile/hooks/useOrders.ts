import { useState, useEffect, useCallback, type MouseEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiClient } from '../../../lib/api-client';
import { postCustomerReorder } from '@/lib/orders/post-customer-reorder';
import { isAdminOrderListStatus } from '@/lib/constants/admin-order-list-status';
import { useTranslation } from '../../../lib/i18n-client';
import type { OrderDetails, OrderListItem, ProfileTab } from '../types';
import { logger } from "@/lib/utils/logger";

interface OrdersMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface UseOrdersProps {
  isLoggedIn: boolean;
  authLoading: boolean;
  activeTab: ProfileTab;
  onError: (error: string) => void;
  onSuccess: (message: string) => void;
}

export function useOrders({
  isLoggedIn,
  authLoading,
  activeTab,
  onError,
  onSuccess,
}: UseOrdersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();

  const [ordersStatusFilter, setOrdersStatusFilter] = useState(() => {
    const raw = searchParams.get('status');
    return raw && isAdminOrderListStatus(raw) ? raw : '';
  });
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersMeta, setOrdersMeta] = useState<OrdersMeta | null>(null);

  // Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null);
  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);
  const [orderDetailsError, setOrderDetailsError] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);

  // Lock body scroll when order modal is open
  useEffect(() => {
    if (selectedOrder) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedOrder]);

  useEffect(() => {
    const raw = searchParams.get('status');
    const next = raw && isAdminOrderListStatus(raw) ? raw : '';
    setOrdersStatusFilter((prev) => (prev === next ? prev : next));
  }, [searchParams]);

  useEffect(() => {
    setOrdersPage(1);
  }, [ordersStatusFilter]);

  const loadOrders = useCallback(async () => {
    try {
      setOrdersLoading(true);
      onError('');
      const response = await apiClient.get<{
        data: OrderListItem[];
        meta: OrdersMeta;
      }>('/api/v1/orders', {
        params: {
          page: ordersPage.toString(),
          limit: '20',
          ...(ordersStatusFilter ? { status: ordersStatusFilter } : {}),
        },
      });
      setOrders(response.data || []);
      setOrdersMeta(response.meta || null);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error('Error loading orders', { error: err });
      onError(errorMessage || t('profile.orders.failedToLoad'));
    } finally {
      setOrdersLoading(false);
    }
  }, [ordersPage, ordersStatusFilter, t, onError]);

  const handleOrdersStatusFilterChange = useCallback(
    (value: string) => {
      setOrdersPage(1);
      const next = value && isAdminOrderListStatus(value) ? value : '';
      setOrdersStatusFilter(next);
      const params = new URLSearchParams(searchParams.toString());
      params.set('tab', 'orders');
      if (next) {
        params.set('status', next);
      } else {
        params.delete('status');
      }
      const qs = params.toString();
      router.push(qs ? `/profile?${qs}` : '/profile?tab=orders', {
        scroll: false,
      });
    },
    [router, searchParams]
  );

  // Load orders when orders tab is active
  useEffect(() => {
    if (isLoggedIn && !authLoading && activeTab === 'orders') {
      loadOrders();
    }
  }, [isLoggedIn, authLoading, activeTab, loadOrders]);

  const loadOrderDetails = async (orderNumber: string) => {
    try {
      setOrderDetailsLoading(true);
      setOrderDetailsError(null);
      const data = await apiClient.get<OrderDetails>(`/api/v1/orders/${orderNumber}`);
      setSelectedOrder(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error('Error loading order details', { error: err });
      setOrderDetailsError(errorMessage || t('profile.orderDetails.failedToLoad'));
    } finally {
      setOrderDetailsLoading(false);
    }
  };

  const handleOrderClick = (orderNumber: string, e: MouseEvent<HTMLAnchorElement>) => {
    if (window.innerWidth >= 1024) {
      e.preventDefault();
      loadOrderDetails(orderNumber);
    }
  };

  const handleReOrder = async () => {
    if (!selectedOrder || !isLoggedIn) {
      router.push('/login?redirect=/profile?tab=orders');
      return;
    }

    setIsReordering(true);
    try {
      logger.devLog('[Profile][ReOrder] POST reorder via API', {
        orderNumber: selectedOrder.number,
      });

      const result = await postCustomerReorder(selectedOrder.number, selectedOrder.links);

      window.dispatchEvent(new Event('cart-updated'));

      const addedCount = result.added.length;
      const skippedCount = result.skipped.length;

      if (addedCount > 0) {
        const skippedText =
          skippedCount > 0 ? `, ${skippedCount} ${t('profile.orderDetails.skipped')}` : '';
        onSuccess(`${addedCount} ${t('profile.orderDetails.itemsAdded')}${skippedText}`);
        setTimeout(() => {
          router.push('/cart');
        }, 1500);
      } else {
        onError(t('profile.orderDetails.failedToAdd'));
      }
    } catch (error: unknown) {
      logger.error('[Profile][ReOrder] reorder API failed', { error });
      onError(t('profile.orderDetails.failedToAdd'));
    } finally {
      setIsReordering(false);
    }
  };

  return {
    orders,
    ordersLoading,
    ordersPage,
    setOrdersPage,
    ordersMeta,
    ordersStatusFilter,
    handleOrdersStatusFilterChange,
    selectedOrder,
    setSelectedOrder,
    orderDetailsLoading,
    orderDetailsError,
    isReordering,
    handleOrderClick,
    handleReOrder,
  };
}

