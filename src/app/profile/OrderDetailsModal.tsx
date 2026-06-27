import { Button } from '@shop/ui';
import type { CurrencyCode } from '@/lib/currency';
import { OrderDetailsBody } from './components/OrderDetailsBody';
import type { OrderDetails } from './types';
import {
  PROFILE_OUTLINE_BUTTON_CLASS,
  PROFILE_PRIMARY_COMPACT_BUTTON_CLASS,
} from './profile-button.classes';

interface OrderDetailsModalProps {
  selectedOrder: OrderDetails;
  orderDetailsLoading: boolean;
  orderDetailsError: string | null;
  isReordering: boolean;
  currency: CurrencyCode;
  onClose: () => void;
  onReOrder: () => void;
  t: (key: string) => string;
}

export function OrderDetailsModal({
  selectedOrder,
  orderDetailsLoading,
  orderDetailsError,
  isReordering,
  currency,
  onClose,
  onReOrder,
  t,
}: OrderDetailsModalProps) {
  return (
    <div
      className="fixed inset-0 z-[1200] overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative max-h-[90vh] w-full max-w-6xl transform overflow-hidden overflow-y-auto rounded-lg bg-white shadow-xl transition-all">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
            <div>
              <h2 id="modal-title" className="text-2xl font-bold text-gray-900">
                {t('profile.orderDetails.title')}
                {selectedOrder.number}
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                {t('profile.orderDetails.placedOn')}{' '}
                {new Date(selectedOrder.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={onReOrder}
                disabled={isReordering}
                variant="primary"
                size="sm"
                className={PROFILE_PRIMARY_COMPACT_BUTTON_CLASS}
              >
                {isReordering ? t('profile.orderDetails.adding') : t('profile.orderDetails.reorder')}
              </Button>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
                aria-label={t('profile.orderDetails.close')}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="px-6 py-6">
            {orderDetailsLoading ? (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900" />
                <p className="text-gray-600">{t('profile.orderDetails.loading')}</p>
              </div>
            ) : orderDetailsError ? (
              <div className="py-12 text-center">
                <p className="mb-4 text-red-600">{orderDetailsError}</p>
                <Button onClick={onClose} variant="outline" className={PROFILE_OUTLINE_BUTTON_CLASS}>
                  {t('profile.orderDetails.close')}
                </Button>
              </div>
            ) : (
              <OrderDetailsBody order={selectedOrder} currency={currency} t={t} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
