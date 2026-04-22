'use client';

import { Card, Button } from '@shop/ui';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../../../lib/i18n-client';
import { formatCurrency, formatDate } from '../utils/dashboardUtils';

interface RecentOrder {
  id: string;
  number: string;
  status: string;
  paymentStatus: string;
  total: number;
  currency: string;
  customerEmail?: string;
  customerPhone?: string;
  itemsCount: number;
  createdAt: string;
}

interface RecentOrdersCardProps {
  recentOrders: RecentOrder[];
  recentOrdersLoading: boolean;
}

export function RecentOrdersCard({ recentOrders, recentOrdersLoading }: RecentOrdersCardProps) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Card className="admin-card overflow-hidden border-marco-border/70 bg-white/95 p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-marco-black">{t('admin.dashboard.recentOrders')}</h2>
        <Button
          variant="ghost"
          size="sm"
          className="rounded-xl border border-marco-border bg-white px-3 py-1.5 text-marco-text/80 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-marco-yellow/60 hover:bg-marco-yellow/15 hover:text-marco-black hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marco-yellow/45"
          onClick={() => router.push('/supersudo/orders')}
        >
          {t('admin.dashboard.viewAll')}
        </Button>
      </div>
      <div className="space-y-3">
        {recentOrdersLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="py-8 text-center text-sm text-marco-text/65">
            <p>{t('admin.dashboard.noRecentOrders')}</p>
          </div>
        ) : (
          recentOrders.map((order) => (
            <div
              key={order.id}
              className="group cursor-pointer rounded-2xl border border-marco-border/80 bg-white/80 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-marco-yellow/60 hover:bg-marco-yellow/10"
              onClick={() => router.push(`/supersudo/orders?search=${order.number}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <p className="text-sm font-semibold text-marco-black">#{order.number}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        order.paymentStatus === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.paymentStatus === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {order.paymentStatus}
                    </span>
                  </div>
                  <p className="text-xs text-marco-text/70">
                    {order.customerEmail || order.customerPhone || t('admin.dashboard.guest')}
                  </p>
                  <p className="mt-1 text-xs text-marco-text/55">
                    {order.itemsCount === 1
                      ? t('admin.dashboard.items').replace('{count}', order.itemsCount.toString())
                      : t('admin.dashboard.itemsPlural').replace('{count}', order.itemsCount.toString())}{' '}
                    • {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-marco-black group-hover:text-marco-black">
                    {formatCurrency(order.total, order.currency)}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

