'use client';

import { useEffect } from 'react';
import { useCartDrawer } from '../../lib/cart/cart-drawer-context';
import { useTranslation } from '../../lib/i18n-client';

export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { openCartDrawer } = useCartDrawer();
  const { t } = useTranslation();

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      // e.g. Sentry.captureException(error);
    }
  }, [error]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center px-4">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('common.errors.checkoutTitle')}</h2>
        <p className="text-gray-600 mb-4">{t('common.errors.checkoutDescription')}</p>
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={reset}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium"
          >
            {t('common.errors.tryAgain')}
          </button>
          <button
            type="button"
            onClick={openCartDrawer}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
          >
            {t('common.errors.cart')}
          </button>
        </div>
      </div>
    </div>
  );
}
