'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../../lib/auth/AuthContext';
import { useTranslation } from '../../../lib/i18n-client';
import { AdminPageLayout } from '../components/AdminPageLayout';
import { AttributesPageContent } from './AttributesPageContent';
import { useAttributes } from './useAttributes';

function AttributesPageAuthenticated() {
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
      backLabel={t('admin.common.backToAdmin')}
      onBack={() => router.push('/supersudo')}
      headerActions={headerStats}
    >
      <AttributesPageContent {...attributeState} />
    </AdminPageLayout>
  );
}

export default function AttributesPage() {
  const { t } = useTranslation();
  const { isLoggedIn, isAdmin, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isLoggedIn || !isAdmin) {
        router.push('/supersudo');
      }
    }
  }, [isLoggedIn, isAdmin, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">{t('admin.common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !isAdmin) {
    return null; // Will redirect
  }

  return <AttributesPageAuthenticated />;
}

