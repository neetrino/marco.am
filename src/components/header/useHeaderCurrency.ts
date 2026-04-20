'use client';

import { useEffect } from 'react';
import type { CurrencyCode } from '../../lib/currency';
import { getStoredCurrency, initializeCurrencyRates, clearCurrencyRatesCache } from '../../lib/currency';

export function useHeaderCurrency(setSelectedCurrency: (c: CurrencyCode) => void) {
  useEffect(() => {
    setSelectedCurrency(getStoredCurrency());

    const handleCurrencyUpdate = () => {
      setSelectedCurrency(getStoredCurrency());
    };

    window.addEventListener('currency-updated', handleCurrencyUpdate);

    return () => {
      window.removeEventListener('currency-updated', handleCurrencyUpdate);
    };
  }, [setSelectedCurrency]);

  useEffect(() => {
    initializeCurrencyRates().catch(console.error);

    const handleCurrencyRatesUpdate = () => {
      clearCurrencyRatesCache();
      initializeCurrencyRates(true).catch(console.error);
      window.dispatchEvent(new Event('currency-updated'));
    };

    window.addEventListener('currency-rates-updated', handleCurrencyRatesUpdate);

    return () => {
      window.removeEventListener('currency-rates-updated', handleCurrencyRatesUpdate);
    };
  }, []);
}
