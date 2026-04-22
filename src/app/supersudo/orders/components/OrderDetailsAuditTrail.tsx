'use client';

import { useTranslation } from '../../../../lib/i18n-client';
import type { OrderDetails } from '../useOrders';
import { getAuditDetailLines } from '../utils/audit-trail-lines';

interface OrderDetailsAuditTrailProps {
  orderDetails: OrderDetails;
}

function actorLabel(
  entry: NonNullable<OrderDetails['auditTrail']>[number],
  t: (path: string) => string
): string {
  if (!entry.actor) {
    return t('admin.orders.orderDetails.auditTrail.actorUnknown');
  }
  const { email, firstName, lastName } = entry.actor;
  const name = [firstName, lastName].filter(Boolean).join(' ').trim();
  if (name) {
    return name;
  }
  if (email) {
    return email;
  }
  return t('admin.orders.orderDetails.auditTrail.actorUnknown');
}

export function OrderDetailsAuditTrail({ orderDetails }: OrderDetailsAuditTrailProps) {
  const { t } = useTranslation();
  const trail = orderDetails.auditTrail ?? [];

  return (
    <section className="border border-gray-200 rounded-lg p-4 bg-gray-50">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">
        {t('admin.orders.orderDetails.auditTrail.title')}
      </h3>
      {trail.length === 0 ? (
        <p className="text-sm text-gray-600">{t('admin.orders.orderDetails.auditTrail.empty')}</p>
      ) : (
        <ul className="space-y-4">
          {trail.map((entry) => {
            const lines = getAuditDetailLines(entry, t);
            const when = new Date(entry.createdAt);
            const timeStr = Number.isNaN(when.getTime())
              ? entry.createdAt
              : when.toLocaleString();

            return (
              <li
                key={entry.id}
                className="rounded-r border-l-4 border-gray-300 bg-white py-1 pl-3 text-sm"
              >
                <div className="text-gray-500 text-xs mb-1">
                  {timeStr}
                  <span className="mx-2 text-gray-400">·</span>
                  <span className="text-gray-700">{actorLabel(entry, t)}</span>
                </div>
                <ul className="list-disc list-inside text-gray-800 space-y-0.5">
                  {lines.map((line, lineIdx) => (
                    <li key={`${entry.id}-line-${lineIdx}`}>{line}</li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
