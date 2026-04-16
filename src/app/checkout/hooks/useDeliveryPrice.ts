import { useState, useEffect } from 'react';
import { apiClient } from '../../../lib/api-client';
import { isCourierShipping } from '../../../lib/constants/shipping-method';

export function useDeliveryPrice(
  shippingMethod: string,
  shippingCity: string | undefined
) {
  const [deliveryPrice, setDeliveryPrice] = useState<number | null>(null);
  const [loadingDeliveryPrice, setLoadingDeliveryPrice] = useState(false);

  useEffect(() => {
    const fetchDeliveryPrice = async () => {
      if (isCourierShipping(shippingMethod) && shippingCity && shippingCity.trim().length > 0) {
        setLoadingDeliveryPrice(true);
        try {
          const response = await apiClient.get<{ price: number }>('/api/v1/delivery/price', {
            params: {
              city: shippingCity.trim(),
              country: 'Armenia',
            },
          });
          setDeliveryPrice(response.price);
        } catch {
          setDeliveryPrice(0);
        } finally {
          setLoadingDeliveryPrice(false);
        }
      } else {
        setDeliveryPrice(null);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchDeliveryPrice();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [shippingCity, shippingMethod]);

  return { deliveryPrice, loadingDeliveryPrice };
}




