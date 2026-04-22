'use client';

import { useTranslation } from '../../../../../lib/i18n-client';

export function AddProductPageSuspenseFallback() {
  const { t } = useTranslation();
  return (
    <div className="admin-page min-h-screen">
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-marco-black/20 border-t-marco-black" />
          <p className="text-sm text-marco-text/80">{t('admin.common.loading')}</p>
        </div>
      </div>
    </div>
  );
}
