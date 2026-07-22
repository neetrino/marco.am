'use client';

import { useEffect, useState } from 'react';
import {
  convertPrice,
  formatPriceInCurrency,
  getStoredCurrency,
  initializeCurrencyRates,
  type CurrencyCode,
} from '@/lib/currency';

export function useAdminOrderCurrency() {
  const [currency, setCurrency] = useState<CurrencyCode>(getStoredCurrency);

  useEffect(() => {
    void initializeCurrencyRates();
    const updateCurrency = () => setCurrency(getStoredCurrency());

    window.addEventListener('currency-updated', updateCurrency);
    window.addEventListener('currency-rates-updated', updateCurrency);
    return () => {
      window.removeEventListener('currency-updated', updateCurrency);
      window.removeEventListener('currency-rates-updated', updateCurrency);
    };
  }, []);

  const formatCurrency = (
    amount: number,
    _orderCurrency = 'AMD',
    fromCurrency: CurrencyCode = 'AMD'
  ): string => {
    const displayCurrency = currency;

    if (fromCurrency === displayCurrency) {
      return formatPriceInCurrency(amount, displayCurrency);
    }

    return formatPriceInCurrency(convertPrice(amount, fromCurrency, displayCurrency), displayCurrency);
  };

  return { currency, formatCurrency };
}
