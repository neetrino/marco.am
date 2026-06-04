'use client';

import { useTranslation } from '../../lib/i18n-client';

export default function AdminLoading() {
  const { t } = useTranslation();

  return (
    <div
      className="h-1 w-full shrink-0 animate-pulse bg-[var(--app-text)]/15"
      aria-busy="true"
      aria-label={t('common.ariaLabels.loadingAdmin')}
    />
  );
}
