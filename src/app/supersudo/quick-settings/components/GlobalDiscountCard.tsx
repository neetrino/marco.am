'use client';

import { Button, Input } from '@shop/ui';
import { useTranslation } from '../../../../lib/i18n-client';

interface GlobalDiscountCardProps {
  globalDiscount: number;
  setGlobalDiscount: (value: number) => void;
  discountLoading: boolean;
  discountSaving: boolean;
  handleDiscountSave: () => void;
}

export function GlobalDiscountCard({
  globalDiscount,
  setGlobalDiscount,
  discountLoading,
  discountSaving,
  handleDiscountSave,
}: GlobalDiscountCardProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl border border-rose-100 bg-gradient-to-br from-rose-50/70 via-white to-orange-50/70 p-4 shadow-[0_8px_24px_rgba(244,63,94,0.12)]">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-orange-500 shadow-sm">
          <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-slate-900">{t('admin.quickSettings.globalDiscount')}</h3>
          <p className="text-xs text-slate-500">{t('admin.quickSettings.forAllProducts')}</p>
        </div>
      </div>

      {discountLoading ? (
        <div className="animate-pulse">
          <div className="h-10 rounded-lg bg-slate-200"></div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-lg border border-rose-100/80 bg-white/90 p-3">
            <Input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={globalDiscount}
              onChange={(e) => {
                const value = e.target.value;
                setGlobalDiscount(value === '' ? 0 : parseFloat(value) || 0);
              }}
              className="flex-1 border-slate-300 bg-white"
              placeholder="0"
            />
            <span className="w-8 text-sm font-semibold text-slate-700">%</span>
            <Button
              variant="primary"
              onClick={handleDiscountSave}
              disabled={discountSaving}
              className="px-6 shadow-sm"
            >
              {discountSaving ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{t('admin.quickSettings.saving')}</span>
                </div>
              ) : (
                t('admin.quickSettings.save')
              )}
            </Button>
          </div>

          {globalDiscount > 0 ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-sm text-emerald-800">
                <strong>{t('admin.quickSettings.active')}</strong> {t('admin.quickSettings.discountApplied').replace('{percent}', globalDiscount.toString())}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm text-slate-600">
                {t('admin.quickSettings.noGlobalDiscount')}
              </p>
            </div>
          )}

          <div className="grid grid-cols-5 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setGlobalDiscount(10)}
              className="w-full border-rose-200 text-slate-700 hover:bg-rose-50"
            >
              10%
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setGlobalDiscount(20)}
              className="w-full border-rose-200 text-slate-700 hover:bg-rose-50"
            >
              20%
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setGlobalDiscount(30)}
              className="w-full border-rose-200 text-slate-700 hover:bg-rose-50"
            >
              30%
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setGlobalDiscount(50)}
              className="w-full border-rose-200 text-slate-700 hover:bg-rose-50"
            >
              50%
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setGlobalDiscount(0)}
              className="w-full px-3 text-slate-600 hover:bg-slate-100"
            >
              {t('admin.quickSettings.cancel')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

