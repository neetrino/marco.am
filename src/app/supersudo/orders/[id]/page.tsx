'use client';

import { useParams } from 'next/navigation';
import { useTranslation } from '@/lib/i18n-client';
import { OrderDetailPageContent } from './OrderDetailPageContent';

export default function AdminOrderDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const orderId = typeof params.id === 'string' ? params.id : undefined;

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
