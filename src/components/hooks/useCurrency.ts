'use client';

import { useState, useEffect } from 'react';
import { getStoredCurrency, type CurrencyCode } from '../../lib/currency';

/**
 * Hook for managing currency state
 * @returns Current currency code
 */
export function useCurrency() {
  // Keep SSR and first client render identical; hydrate real value after mount.
  const [currency, setCurrency] = useState<CurrencyCode>('AMD');

  useEffect(() => {
    setCurrency(getStoredCurrency());
    const handleCurrencyUpdate = () => {
      setCurrency(getStoredCurrency());
    };
    
    const handleCurrencyRatesUpdate = () => {
      setCurrency(getStoredCurrency());
    };

    window.addEventListener('currency-updated', handleCurrencyUpdate);
    window.addEventListener('currency-rates-updated', handleCurrencyRatesUpdate);
    
    return () => {
      window.removeEventListener('currency-updated', handleCurrencyUpdate);
      window.removeEventListener('currency-rates-updated', handleCurrencyRatesUpdate);
    };
  }, []);

  return currency;
}




