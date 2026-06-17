'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useTranslation } from '../../../lib/i18n-client';
import { AdminPageLayout } from '../components/AdminPageLayout';
import { AttributesPageContent } from './AttributesPageContent';
import { useAttributes } from './useAttributes';

export default function AttributesPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const currentPath = pathname || '/supersudo/attributes';
  const attributeState = useAttributes();

  const totalValues = attributeState.attributes.reduce(
    (sum, attribute) => sum + attribute.values.length,
    0,
  );

  const headerStats = attributeState.loading ? (
    <div
      className="grid min-w-[200px] grid-cols-2 gap-2"
      aria-busy="true"
      aria-label={t('admin.attributes.loadingAttributes')}
    >
      <div className="h-[68px] animate-pulse rounded-xl bg-gray-100" />
      <div className="h-[68px] animate-pulse rounded-xl bg-gray-100" />
    </div>
  ) : (
    <div className="grid min-w-[210px] grid-cols-2 gap-3">
      <div className="rounded-xl border border-gray-200/90 bg-white p-3 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {t('admin.attributes.statAttributes')}
        </p>
        <p className="mt-1 text-2xl font-semibold text-gray-900">{attributeState.attributes.length}</p>
      </div>
      <div className="rounded-xl border border-gray-200/90 bg-white p-3 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {t('admin.attributes.statValues')}
        </p>
        <p className="mt-1 text-2xl font-semibold text-gray-900">{totalValues}</p>
      </div>
    </div>
  );

  return (
    <AdminPageLayout
      currentPath={currentPath}
      router={router}
      t={t}
      title={t('admin.attributes.title')}
      subtitle={t('admin.attributes.subtitle')}
      headerActions={headerStats}
    >
      <AttributesPageContent {...attributeState} />
    </AdminPageLayout>
  );
}

