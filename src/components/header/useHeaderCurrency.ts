'use client';

import { useEffect } from 'react';
import type { CurrencyCode } from '../../lib/currency';
import { getStoredCurrency, initializeCurrencyRates, clearCurrencyRatesCache } from '../../lib/currency';

export function useHeaderCurrency(
  setSelectedCurrency: (c: CurrencyCode) => void,
  options?: { enabled?: boolean },
) {
  const enabled = options?.enabled ?? true;

  useEffect(() => {
    if (!enabled) {
      return;
    }
    setSelectedCurrency(getStoredCurrency());

    const handleCurrencyUpdate = () => {
      setSelectedCurrency(getStoredCurrency());
    };

    window.addEventListener('currency-updated', handleCurrencyUpdate);

    return () => {
      window.removeEventListener('currency-updated', handleCurrencyUpdate);
    };
  }, [enabled, setSelectedCurrency]);

  useEffect(() => {
    if (!enabled) {
      return;
    }
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
  }, [enabled]);
}
