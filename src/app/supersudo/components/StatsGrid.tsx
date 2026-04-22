'use client';

import { Card } from '@shop/ui';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../../../lib/i18n-client';
import { formatCurrency } from '../utils/dashboardUtils';

interface Stats {
  users: { total: number };
  products: { total: number; lowStock: number };
  orders: { total: number; recent: number; pending: number };
  revenue: { total: number; currency: string };
  salesWidgets: {
    todaySales: {
      revenue: number;
      paidOrders: number;
      currency: string;
    };
    monthlySales: {
      revenue: number;
      paidOrders: number;
      currency: string;
    };
    topProduct: {
      productId: string;
      title: string;
      totalQuantity: number;
      totalRevenue: number;
      currency: string;
    } | null;
  };
}

interface StatsGridProps {
  stats: Stats | null;
  statsLoading: boolean;
}

export function StatsGrid({ stats, statsLoading }: StatsGridProps) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card
          className="admin-card group cursor-pointer overflow-hidden border-marco-border/70 bg-white/90 p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-marco-yellow/60 hover:shadow-[0_14px_36px_rgba(16,16,16,0.12)]"
          onClick={() => router.push('/supersudo/users')}
        >
          <div className="mb-4 h-1 w-14 rounded-full bg-gradient-to-r from-marco-yellow to-marco-black/30" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-marco-text/70">{t('admin.dashboard.totalUsers')}</p>
              {statsLoading ? (
                <div className="animate-pulse h-8 w-16 bg-gray-200 rounded mt-1"></div>
              ) : (
                <p className="mt-1 text-2xl font-bold text-marco-black">
                  {stats?.users.total ?? 0}
                </p>
              )}
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-marco-yellow/30 text-marco-black transition-colors group-hover:bg-marco-yellow/45">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card
          className="admin-card group cursor-pointer overflow-hidden border-marco-border/70 bg-white/90 p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-marco-yellow/60 hover:shadow-[0_14px_36px_rgba(16,16,16,0.12)]"
          onClick={() => router.push('/supersudo/products')}
        >
          <div className="mb-4 h-1 w-14 rounded-full bg-gradient-to-r from-marco-yellow to-marco-black/30" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-marco-text/70">{t('admin.dashboard.totalProducts')}</p>
              {statsLoading ? (
                <div className="animate-pulse h-8 w-16 bg-gray-200 rounded mt-1"></div>
              ) : (
                <p className="mt-1 text-2xl font-bold text-marco-black">
                  {stats?.products.total ?? 0}
                </p>
              )}
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-marco-yellow/30 text-marco-black transition-colors group-hover:bg-marco-yellow/45">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </Card>

        <Card
          className="admin-card group cursor-pointer overflow-hidden border-marco-border/70 bg-white/90 p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-marco-yellow/60 hover:shadow-[0_14px_36px_rgba(16,16,16,0.12)]"
          onClick={() => router.push('/supersudo/orders')}
        >
          <div className="mb-4 h-1 w-14 rounded-full bg-gradient-to-r from-marco-yellow to-marco-black/30" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-marco-text/70">{t('admin.dashboard.totalOrders')}</p>
              {statsLoading ? (
                <div className="animate-pulse h-8 w-16 bg-gray-200 rounded mt-1"></div>
              ) : (
                <p className="mt-1 text-2xl font-bold text-marco-black">
                  {stats?.orders.total ?? 0}
                </p>
              )}
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-marco-yellow/30 text-marco-black transition-colors group-hover:bg-marco-yellow/45">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </Card>

        <Card
          className="admin-card group cursor-pointer overflow-hidden border-marco-border/70 bg-white/90 p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-marco-yellow/60 hover:shadow-[0_14px_36px_rgba(16,16,16,0.12)]"
          onClick={() => router.push('/supersudo/orders?filter=paid')}
        >
          <div className="mb-4 h-1 w-14 rounded-full bg-gradient-to-r from-marco-yellow to-marco-black/30" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-marco-text/70">{t('admin.dashboard.revenue')}</p>
              {statsLoading ? (
                <div className="animate-pulse h-8 w-24 bg-gray-200 rounded mt-1"></div>
              ) : (
                <p className="mt-1 text-2xl font-bold text-marco-black">
                  {stats ? formatCurrency(stats.revenue.total, stats.revenue.currency) : '0 USD'}
                </p>
              )}
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-marco-yellow/30 text-marco-black transition-colors group-hover:bg-marco-yellow/45">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="overflow-hidden rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-white to-emerald-50/60 p-6 shadow-sm">
          <p className="text-sm font-medium text-emerald-800">{t('admin.dashboard.todaySales')}</p>
          {statsLoading ? (
            <div className="animate-pulse h-8 w-24 bg-gray-200 rounded mt-2"></div>
          ) : (
            <>
              <p className="text-2xl font-bold text-emerald-900 mt-1">
                {stats
                  ? formatCurrency(
                      stats.salesWidgets.todaySales.revenue,
                      stats.salesWidgets.todaySales.currency
                    )
                  : "0 AMD"}
              </p>
              <p className="text-xs text-emerald-700 mt-1">
                {t('admin.dashboard.orders').replace(
                  '{count}',
                  (stats?.salesWidgets.todaySales.paidOrders ?? 0).toString()
                )}
              </p>
            </>
          )}
        </Card>

        <Card className="overflow-hidden rounded-2xl border border-cyan-200/80 bg-gradient-to-br from-white to-cyan-50/60 p-6 shadow-sm">
          <p className="text-sm font-medium text-cyan-800">{t('admin.dashboard.monthlySales')}</p>
          {statsLoading ? (
            <div className="animate-pulse h-8 w-24 bg-gray-200 rounded mt-2"></div>
          ) : (
            <>
              <p className="text-2xl font-bold text-cyan-900 mt-1">
                {stats
                  ? formatCurrency(
                      stats.salesWidgets.monthlySales.revenue,
                      stats.salesWidgets.monthlySales.currency
                    )
                  : "0 AMD"}
              </p>
              <p className="text-xs text-cyan-700 mt-1">
                {t('admin.dashboard.orders').replace(
                  '{count}',
                  (stats?.salesWidgets.monthlySales.paidOrders ?? 0).toString()
                )}
              </p>
            </>
          )}
        </Card>

        <Card className="overflow-hidden rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-white to-indigo-50/60 p-6 shadow-sm">
          <p className="text-sm font-medium text-indigo-800">{t('admin.dashboard.topProduct')}</p>
          {statsLoading ? (
            <div className="animate-pulse h-8 w-40 bg-gray-200 rounded mt-2"></div>
          ) : stats?.salesWidgets.topProduct ? (
            <>
              <p className="text-base font-semibold text-indigo-900 mt-1 truncate">
                {stats.salesWidgets.topProduct.title}
              </p>
              <p className="text-sm text-indigo-800 mt-1">
                {formatCurrency(
                  stats.salesWidgets.topProduct.totalRevenue,
                  stats.salesWidgets.topProduct.currency
                )}
              </p>
              <p className="text-xs text-indigo-700 mt-1">
                {t('admin.dashboard.sold').replace(
                  '{count}',
                  stats.salesWidgets.topProduct.totalQuantity.toString()
                )}
              </p>
            </>
          ) : (
            <p className="text-sm text-indigo-800 mt-2">{t('admin.dashboard.topProductNone')}</p>
          )}
        </Card>
      </div>
    </>
  );
}

