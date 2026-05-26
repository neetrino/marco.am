'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { useTranslation } from '@/lib/i18n-client';
import { OrderDetailPageContent } from './OrderDetailPageContent';

export default function AdminOrderDetailPage() {
  const { t } = useTranslation();
  const { isLoggedIn, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const orderId = typeof params.id === 'string' ? params.id : undefined;

  useEffect(() => {
    if (!isLoading && (!isLoggedIn || !isAdmin)) {
      router.push('/supersudo');
    }
  }, [isLoggedIn, isAdmin, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-white">
        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-7 text-center shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900" />
          <p className="font-medium text-gray-600">{t('admin.orders.loading')}</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !isAdmin) {
    return null;
  }

  if (!orderId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-white">
        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-7 text-center shadow-sm">
          <p className="text-gray-700">{t('admin.orders.orderDetails.orderNotFound')}</p>
        </div>
      </div>
    );
  }

  return <OrderDetailPageContent orderId={orderId} />;
}
