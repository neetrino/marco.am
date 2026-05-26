'use client';

import { usePathname } from 'next/navigation';
import { useTranslation } from '@/lib/i18n-client';
import { AdminPageLayout } from '../../components/AdminPageLayout';
import { OrderDetailsBody } from '../components/OrderDetailsBody';
import { useOrderDetail } from '../useOrderDetail';

interface OrderDetailPageContentProps {
  orderId: string;
}

export function OrderDetailPageContent({ orderId }: OrderDetailPageContentProps) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const currentPath = pathname || `/supersudo/orders/${orderId}`;

  const {
    orderDetails,
    loading,
    notFound,
    savingAdminNotes,
    updateMessage,
    formatCurrency,
    handleAdminNotesSave,
    router,
  } = useOrderDetail(orderId);

  const title = orderDetails?.number
    ? `${t('admin.orders.orderDetails.title')} #${orderDetails.number}`
    : t('admin.orders.orderDetails.title');

  return (
    <AdminPageLayout
      currentPath={currentPath}
      router={router}
      t={t}
      title={title}
      backLabel={t('admin.orders.orderDetails.backToOrders')}
      onBack={() => router.push('/supersudo/orders')}
    >
      {updateMessage ? (
        <div
          className={`mb-4 rounded-lg px-4 py-3 text-sm ${
            updateMessage.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {updateMessage.text}
        </div>
      ) : null}

      {loading && !orderDetails ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-12 text-center shadow-sm">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900" />
          <p className="text-gray-600">{t('admin.orders.orderDetails.loadingOrderDetails')}</p>
        </div>
      ) : notFound ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-12 text-center shadow-sm">
          <p className="text-gray-700">{t('admin.orders.orderDetails.orderNotFound')}</p>
        </div>
      ) : orderDetails ? (
        <OrderDetailsBody
          orderDetails={orderDetails}
          savingAdminNotes={savingAdminNotes}
          onSaveAdminNotes={handleAdminNotesSave}
          formatCurrency={formatCurrency}
        />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-12 text-center shadow-sm">
          <p className="text-gray-600">{t('admin.orders.orderDetails.failedToLoad')}</p>
        </div>
      )}
    </AdminPageLayout>
  );
}
