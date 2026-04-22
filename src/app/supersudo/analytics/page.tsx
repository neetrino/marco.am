'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth/AuthContext';
import { Card } from '@shop/ui';
import { useTranslation } from '../../../lib/i18n-client';
import { useAnalytics } from './hooks/useAnalytics';
import { useStockAnalytics } from './hooks/useStockAnalytics';
import { AdminPageLayout } from '../components/AdminPageLayout';
import { PeriodSelector } from './components/PeriodSelector';
import { StatsCards } from './components/StatsCards';
import { TopProducts } from './components/TopProducts';
import { LeastSellingProducts } from './components/LeastSellingProducts';
import { TopCategories } from './components/TopCategories';
import { OrdersByDayChart } from './components/OrdersByDayChart';
import { OrderStatusBreakdown } from './components/OrderStatusBreakdown';
import { CustomerAnalytics } from './components/CustomerAnalytics';
import { StockAnalyticsSection } from './components/StockAnalyticsSection';

export default function AnalyticsPage() {
  const { t, lang } = useTranslation();
  const { isLoggedIn, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const currentPath = pathname || '/supersudo/analytics';
  const [period, setPeriod] = useState<string>('week');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const {
    analytics,
    orderStatusBreakdown,
    orderStatusBreakdownFailed,
    totalUsers,
    loading,
  } = useAnalytics({
    period,
    startDate,
    endDate,
    isLoggedIn: isLoggedIn ?? false,
    isAdmin: isAdmin ?? false,
  });

  const {
    stockAnalytics,
    loading: stockLoading,
    failed: stockFailed,
  } = useStockAnalytics({
    isLoggedIn: isLoggedIn ?? false,
    isAdmin: isAdmin ?? false,
    locale: lang,
  });

  useEffect(() => {
    if (!isLoading) {
      if (!isLoggedIn || !isAdmin) {
        router.push('/supersudo');
        return;
      }
    }
  }, [isLoggedIn, isAdmin, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('admin.common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !isAdmin) {
    return null;
  }

  return (
    <AdminPageLayout
      currentPath={currentPath}
      router={router}
      t={t}
      title={t('admin.analytics.title')}
      subtitle={t('admin.analytics.subtitle')}
      backLabel={t('admin.analytics.backToAdmin')}
      onBack={() => router.push('/supersudo')}
    >
      <div className="space-y-6 pb-8">
        <PeriodSelector
          period={period}
          startDate={startDate}
          endDate={endDate}
          analytics={analytics}
          onPeriodChange={setPeriod}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
        />

        {loading ? (
          <Card className="admin-card border-marco-border/70 bg-white/95 py-12 text-center shadow-sm">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-marco-black"></div>
            <p className="text-marco-text/75">{t('admin.analytics.loadingAnalytics')}</p>
          </Card>
        ) : (
          <>
            {analytics ? (
              <>
                <StatsCards analytics={analytics} totalUsers={totalUsers} />

                {orderStatusBreakdownFailed ? (
                  <Card className="admin-card border-amber-200/80 bg-amber-50/80 p-4 shadow-sm">
                    <p className="text-sm text-amber-950">
                      {t('admin.analytics.orderStatusBreakdownLoadFailed')}
                    </p>
                  </Card>
                ) : null}

                {orderStatusBreakdown ? <OrderStatusBreakdown data={orderStatusBreakdown} /> : null}

                <CustomerAnalytics data={analytics.customerAnalytics} />

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <TopProducts products={analytics.topProducts} />
                  <LeastSellingProducts products={analytics.leastSellingProducts} />
                </div>

                <TopCategories categories={analytics.topCategories} />

                <OrdersByDayChart ordersByDay={analytics.ordersByDay} />
              </>
            ) : (
              <Card className="admin-card border-marco-border/70 bg-white/95 py-12 shadow-sm">
                <p className="text-center text-marco-text/75">{t('admin.analytics.noAnalyticsData')}</p>
              </Card>
            )}

            <StockAnalyticsSection
              data={stockAnalytics}
              loading={stockLoading}
              failed={stockFailed}
            />
          </>
        )}
      </div>
    </AdminPageLayout>
  );
}
