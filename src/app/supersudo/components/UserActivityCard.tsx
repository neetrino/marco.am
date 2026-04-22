'use client';

import { Card } from '@shop/ui';
import { useTranslation } from '../../../lib/i18n-client';
import { formatCurrency, formatDate } from '../utils/dashboardUtils';

interface UserActivity {
  recentRegistrations: Array<{
    id: string;
    email?: string;
    phone?: string;
    name: string;
    registeredAt: string;
    lastLoginAt?: string;
  }>;
  activeUsers: Array<{
    id: string;
    email?: string;
    phone?: string;
    name: string;
    orderCount: number;
    totalSpent: number;
    lastOrderDate: string;
    lastLoginAt?: string;
  }>;
}

interface UserActivityCardProps {
  userActivity: UserActivity | null;
  userActivityLoading: boolean;
}

const MAX_VISIBLE_USERS = 5;

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || parts[0] === '') {
    return 'U';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

interface SectionHeaderProps {
  title: string;
  subtitle: string;
}

function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  return (
    <div className="mb-4 flex items-start justify-between">
      <div>
        <h3 className="text-lg font-semibold text-marco-black">{title}</h3>
        <p className="mt-1 text-xs text-marco-text/60">{subtitle}</p>
      </div>
      <span className="h-2.5 w-2.5 rounded-full bg-marco-yellow shadow-[0_0_0_4px_rgba(247,206,63,0.24)]" />
    </div>
  );
}

interface RegistrationRowProps {
  name: string;
  contact: string;
  registeredAt: string;
}

function RegistrationRow({ name, contact, registeredAt }: RegistrationRowProps) {
  return (
    <div className="group rounded-2xl border border-marco-border/80 bg-white/85 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-marco-yellow/60 hover:bg-marco-yellow/10">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-marco-yellow/30 text-xs font-bold text-marco-black">
            {getInitials(name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-marco-black">{name}</p>
            <p className="truncate text-xs text-marco-text/70">{contact}</p>
          </div>
        </div>
        <span className="rounded-full bg-marco-gray px-2 py-1 text-[11px] font-medium text-marco-text/65">
          {formatDate(registeredAt)}
        </span>
      </div>
    </div>
  );
}

interface ActiveUserRowProps {
  name: string;
  contact: string;
  orderCount: number;
  totalSpent: number;
}

function ActiveUserRow({ name, contact, orderCount, totalSpent }: ActiveUserRowProps) {
  return (
    <div className="group rounded-2xl border border-marco-border/80 bg-white/85 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-marco-yellow/60 hover:bg-marco-yellow/10">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-marco-black text-xs font-bold text-white">
            {getInitials(name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-marco-black">{name}</p>
            <p className="truncate text-xs text-marco-text/70">{contact}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-marco-black">{formatCurrency(totalSpent, 'USD')}</p>
          <p className="text-[11px] text-marco-text/60">{orderCount} orders</p>
        </div>
      </div>
    </div>
  );
}

function LoadingSection() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {[1, 2].map((item) => (
        <div key={item} className="rounded-2xl border border-marco-border/70 bg-white/70 p-4">
          <div className="mb-4 h-5 w-40 animate-pulse rounded bg-marco-gray" />
          <div className="space-y-3">
            {[1, 2, 3].map((row) => (
              <div key={row} className="h-14 animate-pulse rounded-xl bg-marco-gray" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function UserActivityCard({ userActivity, userActivityLoading }: UserActivityCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="admin-card relative mb-2 overflow-hidden border-marco-border/70 bg-gradient-to-br from-white via-white to-marco-gray/35 p-6 shadow-[0_12px_34px_rgba(16,16,16,0.08)]">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-marco-yellow/20 blur-3xl" />
      <div className="relative mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-marco-black">{t('admin.dashboard.userActivity')}</h2>
        <span className="rounded-full border border-marco-border bg-white/80 px-3 py-1 text-xs font-medium text-marco-text/65">
          {t('admin.dashboard.recentRegistrations')} & {t('admin.dashboard.mostActiveUsers')}
        </span>
      </div>
      {userActivityLoading ? (
        <LoadingSection />
      ) : userActivity ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-marco-border/80 bg-white/75 p-4 shadow-sm">
            <SectionHeader
              title={t('admin.dashboard.recentRegistrations')}
              subtitle={t('admin.dashboard.userActivity')}
            />
            <div className="space-y-3">
              {userActivity.recentRegistrations.length === 0 ? (
                <div className="rounded-xl border border-dashed border-marco-border bg-white/70 px-4 py-6 text-center text-sm text-marco-text/65">
                  {t('admin.dashboard.noRecentRegistrations')}
                </div>
              ) : (
                userActivity.recentRegistrations.slice(0, MAX_VISIBLE_USERS).map((user) => (
                  <RegistrationRow
                    key={user.id}
                    name={user.name}
                    contact={user.email || user.phone || 'N/A'}
                    registeredAt={user.registeredAt}
                  />
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-marco-border/80 bg-white/75 p-4 shadow-sm">
            <SectionHeader
              title={t('admin.dashboard.mostActiveUsers')}
              subtitle={t('admin.dashboard.orders').replace('{count}', userActivity.activeUsers.length.toString())}
            />
            <div className="space-y-3">
              {userActivity.activeUsers.length === 0 ? (
                <div className="rounded-xl border border-dashed border-marco-border bg-white/70 px-4 py-6 text-center text-sm text-marco-text/65">
                  {t('admin.dashboard.noActiveUsers')}
                </div>
              ) : (
                userActivity.activeUsers.slice(0, MAX_VISIBLE_USERS).map((user) => (
                  <ActiveUserRow
                    key={user.id}
                    name={user.name}
                    contact={user.email || user.phone || 'N/A'}
                    orderCount={user.orderCount}
                    totalSpent={user.totalSpent}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-marco-border bg-white/70 px-4 py-6 text-center text-sm text-marco-text/65">
          {t('admin.dashboard.noUserActivityData')}
        </div>
      )}
    </Card>
  );
}

