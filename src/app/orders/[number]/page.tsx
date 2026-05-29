'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@shop/ui';
import { apiClient } from '../../../lib/api-client';
import { postCustomerReorder } from '@/lib/orders/post-customer-reorder';
import { dispatchOpenCartDrawer } from '@/lib/cart/cart-drawer-context';
import { logger } from '@/lib/utils/logger';
import { getStoredCurrency } from '../../../lib/currency';
import { useAuth } from '../../../lib/auth/AuthContext';
import { useTranslation } from '../../../lib/i18n-client';
import { LoadingState } from './components/LoadingState';
import { ErrorState } from './components/ErrorState';
import { OrderStatus } from './components/OrderStatus';
import { OrderItems } from './components/OrderItems';
import { ShippingAddress } from './components/ShippingAddress';
import { OrderSummary } from './components/OrderSummary';
import { isCourierShipping } from '../../../lib/constants/shipping-method';
import type { Order } from './types';

export default function OrderPage() {
  const params = useParams();
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { t } = useTranslation();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState(getStoredCurrency());
  const [calculatedShipping, setCalculatedShipping] = useState<number | null>(null);
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [reorderError, setReorderError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    fetchOrder();

    const handleCurrencyUpdate = () => {
      setCurrency(getStoredCurrency());
    };

    window.addEventListener('currency-updated', handleCurrencyUpdate);

    return () => {
      window.removeEventListener('currency-updated', handleCurrencyUpdate);
    };
  }, [isLoggedIn, params.number, router]);

  async function fetchOrder() {
    try {
      setLoading(true);
      const response = await apiClient.get<Order>(`/api/v1/orders/${params.number}`);
      setOrder(response);
      
      if (isCourierShipping(response.shippingMethod) && response.shippingAddress?.city) {
        fetchShippingPrice(response.shippingAddress.city);
      } else {
        setCalculatedShipping(null);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : t('orders.notFound.description');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function handleReorder() {
    if (!order) {
      return;
    }
    setReorderError(null);
    setReordering(true);
    try {
      const result = await postCustomerReorder(order.number, order.links);
      window.dispatchEvent(new Event('cart-updated'));
      if (result.added.length > 0) {
        dispatchOpenCartDrawer();
      } else {
        setReorderError(t('orders.buttons.reorderFailed'));
      }
    } catch (err: unknown) {
      logger.error('Order page reorder failed', { error: err });
      setReorderError(t('orders.buttons.reorderFailed'));
    } finally {
      setReordering(false);
    }
  }

  async function fetchShippingPrice(city: string) {
    if (!city || city.trim().length === 0) {
      setCalculatedShipping(0);
      return;
    }

    setLoadingShipping(true);
    try {
      const response = await apiClient.get<{ price: number }>('/api/v1/delivery/price', {
        params: {
          city: city.trim(),
          country: 'Armenia',
        },
      });
      setCalculatedShipping(response.price);
    } catch {
      setCalculatedShipping(0);
    } finally {
      setLoadingShipping(false);
    }
  }

  if (loading) {
    return <LoadingState />;
  }

  if (error || !order) {
    return <ErrorState error={error} />;
  }

  return (
    <div className="page-shell py-12">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('orders.title').replace('{number}', order.number)}
          </h1>
          <p className="text-gray-600">
            {t('orders.placedOn').replace('{date}', new Date(order.createdAt).toLocaleDateString())}
          </p>
        </div>
        <Button type="button" variant="primary" onClick={handleReorder} disabled={reordering}>
          {reordering ? t('orders.buttons.reordering') : t('orders.buttons.reorder')}
        </Button>
      </div>
      {reorderError ? (
        <p className="text-sm text-red-600 mb-4" role="alert">
          {reorderError}
        </p>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <OrderStatus
            status={order.status}
            paymentStatus={order.paymentStatus}
            fulfillmentStatus={order.fulfillmentStatus}
          />
          <OrderItems items={order.items} currency={currency} />
          {order.shippingAddress && (
            <ShippingAddress shippingAddress={order.shippingAddress} />
          )}
        </div>

        <OrderSummary
          order={order}
          currency={currency}
          calculatedShipping={calculatedShipping}
          loadingShipping={loadingShipping}
        />
      </div>
    </div>
  );
}
