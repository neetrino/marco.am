'use client';

import { Button } from '@shop/ui';
import { useRouter } from 'next/navigation';
import { useTranslation } from '../../../../lib/i18n-client';

export function QuickInfoCard() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <div className="rounded-xl border border-sky-100 bg-gradient-to-br from-sky-50/60 via-white to-indigo-50/50 p-4 shadow-[0_8px_24px_rgba(56,189,248,0.12)]">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 shadow-sm">
          <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="text-base font-semibold tracking-tight text-slate-900">{t('admin.quickSettings.usefulInformation')}</h3>
          <p className="text-xs text-slate-500">{t('admin.quickSettings.aboutDiscounts')}</p>
        </div>
      </div>

      <div className="space-y-2 rounded-lg border border-sky-100/80 bg-white/80 p-3 text-sm text-slate-600">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 font-semibold text-sky-600">•</span>
          <p>{t('admin.quickSettings.discountApplies')}</p>
        </div>
        <div className="flex items-start gap-2">
          <span className="mt-0.5 font-semibold text-sky-600">•</span>
          <p>{t('admin.quickSettings.discountExample')}</p>
        </div>
        <div className="flex items-start gap-2">
          <span className="mt-0.5 font-semibold text-sky-600">•</span>
          <p>{t('admin.quickSettings.noDiscount')}</p>
        </div>
        <div className="flex items-start gap-2">
          <span className="mt-0.5 font-semibold text-sky-600">•</span>
          <p>{t('admin.quickSettings.changesApplied')}</p>
        </div>
      </div>

      <div className="mt-4 border-t border-sky-100 pt-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/supersudo/settings')}
          className="w-full border border-sky-100 bg-white text-slate-700 hover:bg-sky-50"
        >
          {t('admin.quickSettings.moreSettings')}
        </Button>
      </div>
    </div>
  );
}

