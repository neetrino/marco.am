'use client';

import type { CurrencyCode } from '@/lib/currency';
import { OrderDetailsSummaryBar } from './OrderDetailsSummaryBar';
import { OrderDetailsDelivery } from './OrderDetailsDelivery';
import { OrderDetailsCustomer } from './OrderDetailsCustomer';
import { OrderDetailsItems } from './OrderDetailsItems';
import { OrderDetailsNotes } from './OrderDetailsNotes';
import type { OrderDetails } from '../useOrders';

interface OrderDetailsBodyProps {
  orderDetails: OrderDetails;
  savingAdminNotes: boolean;
  onSaveAdminNotes: (adminNotes: string) => Promise<void>;
  formatCurrency: (amount: number, orderCurrency?: string, fromCurrency?: CurrencyCode) => string;
  onStatusChange?: (status: string) => void;
  onPaymentStatusChange?: (paymentStatus: string) => void;
  updatingStatus?: boolean;
  updatingPaymentStatus?: boolean;
}

export function OrderDetailsBody({
  orderDetails,
  savingAdminNotes,
  onSaveAdminNotes,
  formatCurrency,
  onStatusChange,
  onPaymentStatusChange,
  updatingStatus,
  updatingPaymentStatus,
}: OrderDetailsBodyProps) {
  return (
    <div className="space-y-4">
      <OrderDetailsSummaryBar
        orderDetails={orderDetails}
        formatCurrency={formatCurrency}
        onStatusChange={onStatusChange}
        onPaymentStatusChange={onPaymentStatusChange}
        updatingStatus={updatingStatus}
        updatingPaymentStatus={updatingPaymentStatus}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <OrderDetailsDelivery orderDetails={orderDetails} />
        <OrderDetailsCustomer orderDetails={orderDetails} />
      </div>

      <OrderDetailsItems orderDetails={orderDetails} formatCurrency={formatCurrency} />

      <OrderDetailsNotes
        orderDetails={orderDetails}
        saving={savingAdminNotes}
        onSaveAdminNotes={onSaveAdminNotes}
      />
    </div>
  );
}
