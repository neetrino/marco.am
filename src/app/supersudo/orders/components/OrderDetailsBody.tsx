'use client';

import type { CurrencyCode } from '@/lib/currency';
import { OrderDetailsMeta } from './OrderDetailsMeta';
import { OrderDetailsItems } from './OrderDetailsItems';
import { OrderDetailsCustomer } from './OrderDetailsCustomer';
import { OrderDetailsPayment } from './OrderDetailsPayment';
import { OrderDetailsTotals } from './OrderDetailsTotals';
import { OrderDetailsNotes } from './OrderDetailsNotes';
import type { OrderDetails } from '../useOrders';

interface OrderDetailsBodyProps {
  orderDetails: OrderDetails;
  savingAdminNotes: boolean;
  onSaveAdminNotes: (adminNotes: string) => Promise<void>;
  formatCurrency: (amount: number, orderCurrency?: string, fromCurrency?: CurrencyCode) => string;
}

export function OrderDetailsBody({
  orderDetails,
  savingAdminNotes,
  onSaveAdminNotes,
  formatCurrency,
}: OrderDetailsBodyProps) {
  return (
    <div className="space-y-6">
      <OrderDetailsMeta orderDetails={orderDetails} formatCurrency={formatCurrency} />
      <OrderDetailsItems orderDetails={orderDetails} formatCurrency={formatCurrency} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OrderDetailsCustomer orderDetails={orderDetails} />
        <OrderDetailsPayment orderDetails={orderDetails} formatCurrency={formatCurrency} />
      </div>
      <OrderDetailsTotals orderDetails={orderDetails} formatCurrency={formatCurrency} />
      <OrderDetailsNotes
        orderDetails={orderDetails}
        saving={savingAdminNotes}
        onSaveAdminNotes={onSaveAdminNotes}
      />
    </div>
  );
}
