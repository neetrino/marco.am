'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth/AuthContext';
import { Card, Button } from '@shop/ui';
import { apiClient, getApiOrErrorMessage } from '../../../lib/api-client';
import { useTranslation } from '../../../lib/i18n-client';
import { clearCurrencyRatesCache } from '../../../lib/currency';
import { AdminPageLayout } from '../components/AdminPageLayout';
import { logger } from '@/lib/utils/logger';

interface Settings {
  defaultCurrency?: string;
  globalDiscount?: number;
  categoryDiscounts?: Record<string, number>;
  brandDiscounts?: Record<string, number>;
  currencyRates?: Record<string, number | undefined>;
}

interface CurrencyField {
  code: 'USD' | 'AMD' | 'EUR' | 'RUB' | 'GEL';
  label: string;
  placeholder: string;
  disabled?: boolean;
  defaultValue: number;
}

const DEFAULT_CURRENCY_RATES: Record<CurrencyField['code'], number> = {
  USD: 1,
  AMD: 400,
  EUR: 0.92,
  RUB: 90,
  GEL: 2.7,
};

const CURRENCY_FIELDS: CurrencyField[] = [
  { code: 'USD', label: 'US Dollar', placeholder: '1', disabled: true, defaultValue: 1 },
  { code: 'AMD', label: 'Armenian Dram', placeholder: '400', defaultValue: 400 },
  { code: 'EUR', label: 'Euro', placeholder: '0.92', defaultValue: 0.92 },
  { code: 'RUB', label: 'Russian Ruble', placeholder: '90', defaultValue: 90 },
  { code: 'GEL', label: 'Georgian Lari', placeholder: '2.7', defaultValue: 2.7 },
];

export default function SettingsPage() {
  const { t } = useTranslation();
  const { isLoggedIn, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const currentPath = pathname || '/supersudo/settings';
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Settings>({
    defaultCurrency: 'AMD',
    currencyRates: DEFAULT_CURRENCY_RATES,
  });

  useEffect(() => {
    if (!isLoading) {
      if (!isLoggedIn || !isAdmin) {
        router.push('/supersudo');
      }
    }
  }, [isLoggedIn, isAdmin, isLoading, router]);

  useEffect(() => {
    if (isLoggedIn && isAdmin) {
      void fetchSettings();
    }
  }, [isLoggedIn, isAdmin]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      logger.devLog('[ADMIN] Fetching settings...');
      const data = await apiClient.get<Settings>('/api/v1/supersudo/settings');
      setSettings({
        defaultCurrency: data.defaultCurrency || 'AMD',
        globalDiscount: data.globalDiscount,
        categoryDiscounts: data.categoryDiscounts,
        brandDiscounts: data.brandDiscounts,
        currencyRates: {
          ...DEFAULT_CURRENCY_RATES,
          ...data.currencyRates,
        },
      });
      logger.devLog('[ADMIN] Settings loaded:', data);
    } catch (err: unknown) {
      console.error('[ADMIN] Error fetching settings:', err);
      setSettings({
        defaultCurrency: 'AMD',
        currencyRates: DEFAULT_CURRENCY_RATES,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCurrencyChange = (code: CurrencyField['code'], value: string) => {
    if (value === '') {
      setSettings((prev) => ({
        ...prev,
        currencyRates: {
          ...prev.currencyRates,
          [code]: undefined,
        },
      }));
      return;
    }

    const numericValue = parseFloat(value);
    if (!isNaN(numericValue) && numericValue > 0) {
      setSettings((prev) => ({
        ...prev,
        currencyRates: {
          ...prev.currencyRates,
          [code]: numericValue,
        },
      }));
    }
  };

  const handleCurrencyBlur = (code: CurrencyField['code']) => {
    setSettings((prev) => ({
      ...prev,
      currencyRates: {
        ...prev.currencyRates,
        [code]: prev.currencyRates?.[code] ?? DEFAULT_CURRENCY_RATES[code],
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      logger.devLog('[ADMIN] Saving settings...', settings);

      const currencyRatesToSave = {
        USD: 1,
        AMD: settings.currencyRates?.AMD ?? DEFAULT_CURRENCY_RATES.AMD,
        EUR: settings.currencyRates?.EUR ?? DEFAULT_CURRENCY_RATES.EUR,
        RUB: settings.currencyRates?.RUB ?? DEFAULT_CURRENCY_RATES.RUB,
        GEL: settings.currencyRates?.GEL ?? DEFAULT_CURRENCY_RATES.GEL,
      };

      await apiClient.put('/api/v1/supersudo/settings', {
        defaultCurrency: settings.defaultCurrency,
        currencyRates: currencyRatesToSave,
      });

      logger.devLog('[ADMIN] Clearing currency rates cache...');
      clearCurrencyRatesCache();

      setTimeout(() => {
        if (typeof window !== 'undefined') {
          logger.devLog('[ADMIN] Dispatching currency-rates-updated event...');
          window.dispatchEvent(new Event('currency-rates-updated'));
        }
      }, 100);

      alert(t('admin.settings.savedSuccess'));
      logger.devLog('[ADMIN] Settings saved, currency rates:', currencyRatesToSave);
    } catch (err: unknown) {
      console.error('[ADMIN] Error saving settings:', err);
      const errorMessage = getApiOrErrorMessage(err, 'Failed to save settings');
      alert(t('admin.settings.errorSaving').replace('{message}', errorMessage));
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,#fff8d6_0%,#f8fafc_32%,#f8fafc_100%)]">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-marco-black" />
          <p className="text-sm font-medium text-marco-text">{t('admin.common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !isAdmin) {
    return null;
  }

  const configuredCurrenciesCount = CURRENCY_FIELDS.filter(
    ({ code }) => typeof settings.currencyRates?.[code] === 'number',
  ).length;
  const highlightedCurrency = settings.defaultCurrency || 'AMD';

  return (
    <AdminPageLayout
      currentPath={currentPath}
      router={router}
      t={t}
      title={t('admin.settings.title')}
      backLabel={t('admin.settings.backToAdmin')}
      onBack={() => router.push('/supersudo')}
    >
      <section className="relative mb-6 overflow-hidden rounded-[28px] border border-marco-border/80 bg-gradient-to-br from-white via-[#fffdf5] to-marco-yellow/20 p-6 shadow-[0_18px_44px_rgba(16,16,16,0.08)]">
        <div className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-marco-yellow/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-8 h-40 w-40 rounded-full bg-marco-black/5 blur-3xl" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full border border-marco-yellow/50 bg-marco-yellow/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-marco-black">
              {t('admin.settings.title')}
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-marco-black sm:text-[2.1rem]">
              {t('admin.settings.title')}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-marco-text/75 sm:text-[15px]">
              {t('admin.settings.generalSettings')} • {t('admin.settings.paymentSettings')} • {t('admin.settings.currencyRates')}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:min-w-[420px]">
            <div className="rounded-2xl border border-marco-border/70 bg-white/85 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-marco-text/55">
                {t('admin.settings.defaultCurrency')}
              </p>
              <p className="mt-2 text-2xl font-bold text-marco-black">{highlightedCurrency}</p>
            </div>
            <div className="rounded-2xl border border-marco-border/70 bg-white/85 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-marco-text/55">
                {t('admin.settings.currencyRates')}
              </p>
              <p className="mt-2 text-2xl font-bold text-marco-black">{configuredCurrenciesCount}</p>
            </div>
            <div className="rounded-2xl border border-marco-border/70 bg-white/85 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-marco-text/55">
                {t('admin.settings.paymentSettings')}
              </p>
              <p className="mt-2 text-sm font-semibold text-marco-black">{t('admin.settings.enableOnlinePayments')}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="space-y-6">
          <Card className="admin-card overflow-hidden border-marco-border/70 bg-white/95 p-0 shadow-[0_12px_30px_rgba(16,16,16,0.08)]">
            <div className="border-b border-marco-border/70 bg-gradient-to-r from-white via-marco-gray/40 to-white px-6 py-5">
              <div className="mb-4 h-1 w-14 rounded-full bg-gradient-to-r from-marco-yellow to-marco-black/25" />
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-marco-yellow/25 text-marco-black">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-marco-black">
                    {t('admin.settings.generalSettings')}
                  </h2>
                  <p className="mt-1 text-sm text-marco-text/70">{t('admin.settings.siteDescription')}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-5 p-6 md:grid-cols-2">
              <div className="rounded-3xl border border-marco-border/70 bg-gradient-to-br from-white to-marco-gray/30 p-5 shadow-sm md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-marco-black">
                  {t('admin.settings.siteName')}
                </label>
                <input
                  type="text"
                  className="admin-field border-marco-border/80 bg-white/95 shadow-sm focus:border-marco-yellow focus:shadow-[0_0_0_3px_rgba(247,206,63,0.18)]"
                  defaultValue={t('admin.settings.siteNamePlaceholder')}
                />
              </div>

              <div className="rounded-3xl border border-marco-border/70 bg-gradient-to-br from-white to-marco-gray/30 p-5 shadow-sm md:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-marco-black">
                  {t('admin.settings.siteDescription')}
                </label>
                <textarea
                  className="admin-field min-h-[132px] resize-y border-marco-border/80 bg-white/95 shadow-sm focus:border-marco-yellow focus:shadow-[0_0_0_3px_rgba(247,206,63,0.18)]"
                  rows={4}
                  defaultValue={t('admin.settings.siteDescriptionPlaceholder')}
                />
              </div>
            </div>
          </Card>

          <Card className="admin-card overflow-hidden border-marco-border/70 bg-white/95 p-0 shadow-[0_12px_30px_rgba(16,16,16,0.08)]">
            <div className="border-b border-marco-border/70 bg-gradient-to-r from-white via-marco-gray/40 to-white px-6 py-5">
              <div className="mb-4 h-1 w-14 rounded-full bg-gradient-to-r from-marco-yellow to-marco-black/25" />
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-marco-yellow/25 text-marco-black">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-marco-black">
                    {t('admin.settings.paymentSettings')}
                  </h2>
                  <p className="mt-1 text-sm text-marco-text/70">{t('admin.settings.defaultCurrency')}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-5 p-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="rounded-3xl border border-marco-border/70 bg-gradient-to-br from-white to-marco-gray/30 p-5 shadow-sm">
                <label className="mb-2 block text-sm font-semibold text-marco-black">
                  {t('admin.settings.defaultCurrency')}
                </label>
                <select
                  value={settings.defaultCurrency || 'AMD'}
                  onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value })}
                  className="admin-field border-marco-border/80 bg-white/95 shadow-sm focus:border-marco-yellow focus:shadow-[0_0_0_3px_rgba(247,206,63,0.18)]"
                >
                  <option value="AMD">{t('admin.settings.amd')}</option>
                  <option value="USD">{t('admin.settings.usd')}</option>
                  <option value="EUR">{t('admin.settings.eur')}</option>
                </select>
              </div>

              <div className="rounded-3xl border border-marco-yellow/35 bg-gradient-to-br from-white via-[#fffdf6] to-marco-yellow/20 p-5 shadow-[0_14px_32px_rgba(247,206,63,0.14)]">
                <label className="flex items-start gap-3">
                  <input type="checkbox" defaultChecked className="mt-1 h-4 w-4 accent-marco-black" />
                  <span>
                    <span className="block text-sm font-semibold text-marco-black">
                      {t('admin.settings.enableOnlinePayments')}
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-marco-text/70">
                      {t('admin.settings.paymentSettings')}
                    </span>
                  </span>
                </label>
              </div>
            </div>
          </Card>

          <Card className="admin-card overflow-hidden border-marco-yellow/40 bg-gradient-to-br from-white via-[#fffdf6] to-marco-yellow/20 p-5 shadow-[0_16px_36px_rgba(247,206,63,0.16)]">
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-marco-text/55">
                  {t('admin.settings.title')}
                </p>
                <h3 className="mt-2 text-xl font-semibold text-marco-black">
                  {t('admin.settings.saveSettings')}
                </h3>
                <p className="mt-2 text-sm leading-6 text-marco-text/75">
                  {t('admin.settings.currencyRatesDescription')}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleSave}
                  disabled={saving}
                  className="h-11 flex-1 rounded-xl shadow-[0_10px_24px_rgba(247,206,63,0.26)]"
                >
                  {saving ? t('admin.settings.saving') : t('admin.settings.saveSettings')}
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => router.push('/supersudo')}
                  disabled={saving}
                  className="h-11 flex-1 rounded-xl border border-marco-border bg-white/90 text-marco-text hover:bg-white hover:text-marco-black"
                >
                  {t('admin.settings.cancel')}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <div>
          <Card className="admin-card overflow-hidden border-marco-border/70 bg-white/95 p-0 shadow-[0_12px_30px_rgba(16,16,16,0.08)]">
            <div className="border-b border-marco-border/70 bg-gradient-to-r from-white via-marco-gray/40 to-white px-6 py-5">
              <div className="mb-4 h-1 w-14 rounded-full bg-gradient-to-r from-marco-yellow to-marco-black/25" />
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-marco-yellow/25 text-marco-black">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M3 5h12M9 3v2m1 13h11m-5-2v2M4 12h16m-4-2v2"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-marco-black">
                    {t('admin.settings.currencyRates')}
                  </h2>
                  <p className="mt-1 text-sm text-marco-text/70">
                    {t('admin.settings.currencyRatesDescription')}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-6">
              {CURRENCY_FIELDS.map((field) => {
                const currentValue = settings.currencyRates?.[field.code];
                const isBaseCurrency = field.code === 'USD';

                return (
                  <div
                    key={field.code}
                    className={`rounded-3xl border p-4 shadow-sm transition-all duration-200 ${
                      isBaseCurrency
                        ? 'border-marco-yellow/40 bg-gradient-to-br from-white to-marco-yellow/15'
                        : 'border-marco-border/70 bg-gradient-to-br from-white to-marco-gray/25 hover:border-marco-yellow/50'
                    }`}
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex min-w-[52px] justify-center rounded-full bg-marco-black px-2.5 py-1 text-xs font-bold tracking-[0.14em] text-marco-yellow">
                            {field.code}
                          </span>
                          {isBaseCurrency ? (
                            <span className="rounded-full border border-marco-yellow/40 bg-marco-yellow/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-marco-black">
                              {t('admin.settings.baseCurrency')}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-3 text-sm font-semibold text-marco-black">{field.label}</p>
                      </div>

                      <div className="rounded-2xl border border-marco-border/70 bg-white/85 px-3 py-2 text-right shadow-sm">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-marco-text/50">1 USD</p>
                        <p className="mt-1 text-sm font-semibold text-marco-black">
                          {typeof currentValue === 'number' ? currentValue : field.defaultValue}
                        </p>
                      </div>
                    </div>

                    <input
                      type="number"
                      step="0.01"
                      value={currentValue ?? ''}
                      onChange={(e) => handleCurrencyChange(field.code, e.target.value)}
                      onBlur={() => handleCurrencyBlur(field.code)}
                      className={`admin-field ${
                        field.disabled
                          ? 'cursor-not-allowed border-marco-yellow/40 bg-white/80 text-marco-text/65'
                          : 'border-marco-border/80 bg-white/95 shadow-sm focus:border-marco-yellow focus:shadow-[0_0_0_3px_rgba(247,206,63,0.18)]'
                      }`}
                      disabled={field.disabled}
                      placeholder={field.placeholder}
                    />

                    <p className="mt-2 text-xs leading-5 text-marco-text/60">
                      {isBaseCurrency ? t('admin.settings.baseCurrency') : t('admin.settings.rateToUSD')}
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </AdminPageLayout>
  );
}
