'use client';

import { Card, Button } from '@shop/ui';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../../../lib/i18n-client';

export function QuickActionsCard() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Card className="admin-card mb-6 overflow-hidden border-marco-border/70 bg-white/95 p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-marco-black">{t('admin.dashboard.quickActions')}</h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Button
          variant="outline"
          onClick={() => router.push('/supersudo/products/add')}
          className="group h-auto justify-start rounded-2xl border-marco-border bg-white/80 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-marco-yellow/60 hover:bg-marco-yellow/10"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-marco-yellow/30 text-marco-black transition-colors group-hover:bg-marco-yellow/45">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-medium text-marco-black">{t('admin.dashboard.addProduct')}</p>
              <p className="text-xs text-marco-text/60">{t('admin.dashboard.createNewProduct')}</p>
            </div>
          </div>
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push('/supersudo/orders')}
          className="group h-auto justify-start rounded-2xl border-marco-border bg-white/80 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-marco-yellow/60 hover:bg-marco-yellow/10"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-marco-yellow/30 text-marco-black transition-colors group-hover:bg-marco-yellow/45">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-medium text-marco-black">{t('admin.dashboard.manageOrders')}</p>
              <p className="text-xs text-marco-text/60">{t('admin.dashboard.viewAllOrders')}</p>
            </div>
          </div>
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push('/supersudo/users')}
          className="group h-auto justify-start rounded-2xl border-marco-border bg-white/80 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-marco-yellow/60 hover:bg-marco-yellow/10"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-marco-yellow/30 text-marco-black transition-colors group-hover:bg-marco-yellow/45">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-medium text-marco-black">{t('admin.dashboard.manageUsers')}</p>
              <p className="text-xs text-marco-text/60">{t('admin.dashboard.viewAllUsers')}</p>
            </div>
          </div>
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push('/supersudo/settings')}
          className="group h-auto justify-start rounded-2xl border-marco-border bg-white/80 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-marco-yellow/60 hover:bg-marco-yellow/10"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-marco-yellow/30 text-marco-black transition-colors group-hover:bg-marco-yellow/45">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="font-medium text-marco-black">{t('admin.dashboard.settings')}</p>
              <p className="text-xs text-marco-text/60">{t('admin.dashboard.configureSystem')}</p>
            </div>
          </div>
        </Button>
      </div>
    </Card>
  );
}

