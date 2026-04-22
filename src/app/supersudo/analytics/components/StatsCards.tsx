'use client';

import { useRouter } from 'next/navigation';
import { Card } from '@shop/ui';
import { useTranslation } from '../../../../lib/i18n-client';
import { formatCurrency } from '../utils';
import type { AnalyticsData } from '../types';

interface StatsCardsProps {
  analytics: AnalyticsData;
  totalUsers: number | null;
}

export function StatsCards({ analytics, totalUsers }: StatsCardsProps) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card 
        className="admin-card group cursor-pointer overflow-hidden border-marco-border/70 bg-white/95 p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-marco-yellow/60 hover:shadow-[0_14px_36px_rgba(16,16,16,0.12)]"
        onClick={() => router.push('/supersudo/orders')}
        title={t('admin.analytics.clickToViewAllOrders')}
      >
        <div className="mb-4 h-1 w-14 rounded-full bg-gradient-to-r from-marco-yellow to-marco-black/30" />
        <div className="mb-3 flex items-center justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-marco-yellow/30 text-marco-black transition-colors group-hover:bg-marco-yellow/45">
            <svg className="h-5 w-5 text-marco-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <svg className="h-4 w-4 text-gray-500 opacity-0 transition-opacity group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
        <p className="mb-1 text-sm font-medium text-marco-text/70">{t('admin.analytics.totalOrders')}</p>
        <p className="text-3xl font-bold text-marco-black">
          {analytics.orders.totalOrders}
        </p>
      </Card>

      <Card 
        className="admin-card group cursor-pointer overflow-hidden border-marco-border/70 bg-white/95 p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-marco-yellow/60 hover:shadow-[0_14px_36px_rgba(16,16,16,0.12)]"
        onClick={() => router.push('/supersudo/orders?paymentStatus=paid')}
        title={t('admin.analytics.clickToViewPaidOrders')}
      >
        <div className="mb-4 h-1 w-14 rounded-full bg-gradient-to-r from-marco-yellow to-marco-black/30" />
        <div className="mb-3 flex items-center justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-marco-yellow/30 text-marco-black transition-colors group-hover:bg-marco-yellow/45">
            <svg className="h-5 w-5 text-marco-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <svg className="h-4 w-4 text-gray-500 opacity-0 transition-opacity group-hover:opacity-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
        <p className="mb-1 text-sm font-medium text-marco-text/70">{t('admin.analytics.totalRevenue')}</p>
        <p className="text-2xl font-bold text-marco-black">
          {formatCurrency(analytics.orders.totalRevenue)}
        </p>
      </Card>

      <Card 
        className="admin-card group overflow-hidden border-marco-border/70 bg-white/95 p-4 shadow-sm"
        title={t('admin.analytics.averageOrderValue')}
      >
        <div className="mb-4 h-1 w-14 rounded-full bg-gradient-to-r from-marco-yellow to-marco-black/30" />
        <div className="mb-3 flex items-center justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-marco-yellow/30 text-marco-black">
            <svg className="h-5 w-5 text-marco-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 1v8m0 0v1m0-1a3.49 3.49 0 01-2.604-1.095M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <p className="mb-1 text-sm font-medium text-marco-text/70">{t('admin.analytics.averageOrderValue')}</p>
        <p className="text-2xl font-bold text-marco-black">
          {formatCurrency(analytics.orders.averageOrderValue)}
        </p>
      </Card>

      <Card
        className="admin-card group overflow-hidden border-marco-border/70 bg-white/95 p-4 shadow-sm"
        title={t('admin.analytics.totalRegisteredUsers')}
      >
        <div className="mb-4 h-1 w-14 rounded-full bg-gradient-to-r from-marco-yellow to-marco-black/30" />
        <div className="mb-3 flex items-center justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-marco-yellow/30 text-marco-black">
            <svg className="h-5 w-5 text-marco-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-1a4 4 0 00-4-4h-1M7 20H2v-1a4 4 0 014-4h1m4-9a3 3 0 110 6 3 3 0 010-6zm6 3a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        </div>
        <p className="mb-1 text-sm font-medium text-marco-text/70">{t('admin.analytics.totalUsers')}</p>
        <p className="text-3xl font-bold text-marco-black">
          {totalUsers !== null ? totalUsers : '—'}
        </p>
      </Card>
    </div>
  );
}




