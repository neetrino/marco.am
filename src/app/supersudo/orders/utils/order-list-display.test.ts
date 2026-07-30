import { describe, expect, it } from 'vitest';
import { formatAdminOrderListTotal } from './order-list-display';
import type { CurrencyCode } from '@/lib/currency';

describe('formatAdminOrderListTotal', () => {
  const formatCurrency = (
    amount: number,
    _orderCurrency?: string,
    fromCurrency: CurrencyCode = 'AMD',
  ): string => `${amount}:${fromCurrency}`;

  it('does not treat AMD order totals as USD (10 AMD must stay 10, not × rate)', () => {
    const label = formatAdminOrderListTotal(
      {
        total: 10,
        shippingAmount: 0,
        currency: 'AMD',
      },
      formatCurrency,
    );
    expect(label).toBe('10:AMD');
  });

  it('computes list total from AMD subtotal/discount/tax without USD conversion', () => {
    const label = formatAdminOrderListTotal(
      {
        subtotal: 100,
        discountAmount: 10,
        taxAmount: 0,
        total: 90,
        shippingAmount: 0,
        currency: 'AMD',
      },
      formatCurrency,
    );
    expect(label).toBe('90:AMD');
  });

  it('subtracts shipping already stored in AMD', () => {
    const label = formatAdminOrderListTotal(
      {
        total: 110,
        shippingAmount: 10,
        currency: 'AMD',
      },
      formatCurrency,
    );
    expect(label).toBe('100:AMD');
  });
});
