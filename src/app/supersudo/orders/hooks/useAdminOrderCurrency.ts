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
    fromCurrency: CurrencyCode = 'USD'
  ): string => {
    const displayCurrency = currency;

    if (displayCurrency === 'AMD') {
      if (fromCurrency === 'USD') {
        return formatPriceInCurrency(convertPrice(amount, 'USD', 'AMD'), 'AMD');
      }
      return formatPriceInCurrency(amount, 'AMD');
    }

    if (fromCurrency === 'USD') {
      const amdAmount = convertPrice(amount, 'USD', 'AMD');
      return formatPriceInCurrency(convertPrice(amdAmount, 'AMD', displayCurrency), displayCurrency);
    }

    return formatPriceInCurrency(convertPrice(amount, 'AMD', displayCurrency), displayCurrency);
  };

  return { currency, formatCurrency };
}
