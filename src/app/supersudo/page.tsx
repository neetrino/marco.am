'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../lib/auth/AuthContext';
import { useTranslation } from '../../lib/i18n-client';
import { AdminPageLayout } from './components/AdminPageLayout';
import { StatsGrid } from './components/StatsGrid';
import { RecentOrdersCard } from './components/RecentOrdersCard';
import { TopProductsCard } from './components/TopProductsCard';
import { UserActivityCard } from './components/UserActivityCard';
import { QuickActionsCard } from './components/QuickActionsCard';
import { useAdminDashboard } from './hooks/useAdminDashboard';

export default function AdminPanel() {
  const { t } = useTranslation();
  const { isLoggedIn, isAdmin, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const {
    stats,
    recentOrders,
    topProducts,
    userActivity,
    statsLoading,
    recentOrdersLoading,
    topProductsLoading,
    userActivityLoading,
  } = useAdminDashboard({
    isLoggedIn,
    isAdmin,
  });

  const [currentPath, setCurrentPath] = useState(pathname || '/supersudo');

  useEffect(() => {
    if (pathname) {
      setCurrentPath(pathname);
    }
  }, [pathname]);

  return (
    <AdminPageLayout
      currentPath={currentPath}
      router={router}
      t={t}
      title={t('admin.dashboard.title')}
      subtitle={t('admin.dashboard.welcome').replace('{name}', user?.firstName || t('admin.dashboard.title'))}
    >
      <div className="space-y-6 pb-8">
        <StatsGrid stats={stats} statsLoading={statsLoading} />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <RecentOrdersCard recentOrders={recentOrders} recentOrdersLoading={recentOrdersLoading} />
          <TopProductsCard topProducts={topProducts} topProductsLoading={topProductsLoading} />
        </div>

        <UserActivityCard userActivity={userActivity} userActivityLoading={userActivityLoading} />
        <QuickActionsCard />
      </div>
    </AdminPageLayout>
  );
}
