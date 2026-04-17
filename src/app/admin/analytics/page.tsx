'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth/AuthContext';
import { Card } from '@shop/ui';
import { useTranslation } from '../../../lib/i18n-client';
import { useAnalytics } from './hooks/useAnalytics';
import { useStockAnalytics } from './hooks/useStockAnalytics';
import { AnalyticsHeader } from './components/AnalyticsHeader';
import { AdminSidebar } from './components/AdminSidebar';
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
        router.push('/admin');
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="page-shell">
        <AnalyticsHeader />

        <div className="flex flex-col lg:flex-row gap-8">
          <AdminSidebar t={t} />

          {/* Main Content */}
          <div className="flex-1 min-w-0">
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
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p className="text-gray-600">{t('admin.analytics.loadingAnalytics')}</p>
              </div>
            ) : (
              <>
                {analytics ? (
                  <>
                    <StatsCards analytics={analytics} totalUsers={totalUsers} />

                    {orderStatusBreakdownFailed ? (
                      <Card className="p-4 mb-6 border border-amber-200 bg-amber-50">
                        <p className="text-sm text-amber-950">
                          {t('admin.analytics.orderStatusBreakdownLoadFailed')}
                        </p>
                      </Card>
                    ) : null}

                    {orderStatusBreakdown ? (
                      <OrderStatusBreakdown data={orderStatusBreakdown} />
                    ) : null}

                    <CustomerAnalytics data={analytics.customerAnalytics} />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                      <TopProducts products={analytics.topProducts} />
                      <LeastSellingProducts products={analytics.leastSellingProducts} />
                    </div>

                    <div className="mb-6">
                      <TopCategories categories={analytics.topCategories} />
                    </div>

                    <OrdersByDayChart ordersByDay={analytics.ordersByDay} />
                  </>
                ) : (
                  <Card className="p-6 mb-6">
                    <p className="text-gray-600 text-center">{t('admin.analytics.noAnalyticsData')}</p>
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
        </div>
      </div>
    </div>
  );
}
