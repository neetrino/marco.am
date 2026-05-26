'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth/AuthContext';
import type { OrderDetails } from '@/app/profile/types';
import { loadCheckoutSuccessSnapshot } from './checkout-success-snapshot';

export function useOrderSuccessDetails(orderNumber: string) {
  const { isLoggedIn } = useAuth();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(Boolean(orderNumber));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderNumber) {
      setOrder(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function loadDetails() {
      setLoading(true);
      setError(null);

      const snapshot = loadCheckoutSuccessSnapshot(orderNumber);
      if (snapshot && !cancelled) {
        setOrder(snapshot);
      }

      if (!isLoggedIn) {
        if (!cancelled) {
          setLoading(false);
          if (!snapshot) {
            setError('missing_snapshot');
          }
        }
        return;
      }

      try {
        const data = await apiClient.get<OrderDetails>(
          `/api/v1/orders/${encodeURIComponent(orderNumber)}`
        );
        if (!cancelled) {
          setOrder(data);
        }
      } catch {
        if (!cancelled && !snapshot) {
          setError('failed_to_load');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDetails();

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, orderNumber]);

  return { order, loading, error };
}
