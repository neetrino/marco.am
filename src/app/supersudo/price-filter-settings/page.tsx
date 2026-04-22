'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../../lib/auth/AuthContext';
import { Card, Button, Input } from '@shop/ui';
import { apiClient, getApiOrErrorMessage } from '../../../lib/api-client';
import { useTranslation } from '../../../lib/i18n-client';
import { AdminPageLayout } from '../components/AdminPageLayout';
import { logger } from "@/lib/utils/logger";

const currencyFields = [
  {
    key: 'USD',
    labelKey: 'admin.priceFilter.stepSizeUsd',
    placeholder: '100',
    hint: 'Base currency',
  },
  {
    key: 'AMD',
    labelKey: 'admin.priceFilter.stepSizeAmd',
    placeholder: '5000',
    hint: 'Armenian dram',
  },
  {
    key: 'RUB',
    labelKey: 'admin.priceFilter.stepSizeRub',
    placeholder: '500',
    hint: 'Russian ruble',
  },
  {
    key: 'GEL',
    labelKey: 'admin.priceFilter.stepSizeGel',
    placeholder: '10',
    hint: 'Georgian lari',
  },
] as const;

export default function PriceFilterSettingsPage() {
  const { t } = useTranslation();
  const { isLoggedIn, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [stepSizeUSD, setStepSizeUSD] = useState<string>('');
  const [stepSizeAMD, setStepSizeAMD] = useState<string>('');
  const [stepSizeRUB, setStepSizeRUB] = useState<string>('');
  const [stepSizeGEL, setStepSizeGEL] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Храним предыдущее значение stepSize для расчета разницы
  const prevStepSizeRef = useRef<string>('');
  const isUpdatingRef = useRef<boolean>(false);

  const fetchSettings = useCallback(async () => {
    try {
      logger.devLog('⚙️ [PRICE FILTER SETTINGS] Fetching settings...');
      setLoading(true);
      const response = await apiClient.get<{
        minPrice?: number;
        maxPrice?: number;
        stepSize?: number;
        stepSizePerCurrency?: {
          USD?: number;
          AMD?: number;
          RUB?: number;
          GEL?: number;
        };
      }>('/api/v1/supersudo/settings/price-filter');
      const minPriceStr = response.minPrice?.toString() || '';
      const maxPriceStr = response.maxPrice?.toString() || '';
      const per = response.stepSizePerCurrency || {};
      const fallbackStep = response.stepSize?.toString() || '';
      
      setMinPrice(minPriceStr);
      setMaxPrice(maxPriceStr);
      setStepSizeUSD(per.USD !== undefined ? per.USD.toString() : fallbackStep);
      setStepSizeAMD(per.AMD !== undefined ? per.AMD.toString() : '');
      setStepSizeRUB(per.RUB !== undefined ? per.RUB.toString() : '');
      setStepSizeGEL(per.GEL !== undefined ? per.GEL.toString() : '');
      prevStepSizeRef.current = fallbackStep;
      
      logger.devLog('✅ [PRICE FILTER SETTINGS] Settings loaded:', response);
    } catch (err: unknown) {
      console.error('❌ [PRICE FILTER SETTINGS] Error fetching settings:', err);
      // If settings don't exist, use empty values
      setMinPrice('');
      setMaxPrice('');
      setStepSizeUSD('');
      setStepSizeAMD('');
      setStepSizeRUB('');
      setStepSizeGEL('');
      prevStepSizeRef.current = '';
    } finally {
      setLoading(false);
    }
  }, []);

  // Обработчик изменения базового Step Size (USD) - синхронизирует minPrice и maxPrice
  const handleStepSizeChange = (newValue: string) => {
    if (isUpdatingRef.current) return;
    
    const prevStep = prevStepSizeRef.current;
    
    // Если предыдущее значение пустое, просто обновляем
    if (!prevStep) {
      prevStepSizeRef.current = newValue;
      setStepSizeUSD(newValue);
      return;
    }
    
    const prevStepNum = parseFloat(prevStep);
    const newStepNum = parseFloat(newValue);
    
    // Если новое значение невалидно, просто обновляем stepSize
    if (isNaN(newStepNum) || newValue.trim() === '') {
      prevStepSizeRef.current = newValue;
      setStepSizeUSD(newValue);
      return;
    }
    
    // Вычисляем разницу
    const difference = newStepNum - prevStepNum;
    
    // Применяем разницу к minPrice и maxPrice, если они заполнены
    const prevMin = minPrice.trim();
    const prevMax = maxPrice.trim();
    
    if (prevMin && prevMax) {
      const prevMinNum = parseFloat(prevMin);
      const prevMaxNum = parseFloat(prevMax);
      
      if (!isNaN(prevMinNum) && !isNaN(prevMaxNum)) {
        const newMinNum = prevMinNum + difference;
        const newMaxNum = prevMaxNum + difference;
        
        // Обновляем все значения
        isUpdatingRef.current = true;
        setStepSizeUSD(newValue);
        setMinPrice(newMinNum > 0 ? newMinNum.toString() : '');
        setMaxPrice(newMaxNum > 0 ? newMaxNum.toString() : '');
        prevStepSizeRef.current = newValue;
        
        logger.devLog('🔄 [PRICE FILTER] StepSize changed:', {
          prevStep: prevStepNum,
          newStep: newStepNum,
          difference,
          prevMin: prevMinNum,
          newMin: newMinNum,
          prevMax: prevMaxNum,
          newMax: newMaxNum
        });
        
        // Сбрасываем флаг после небольшой задержки
        setTimeout(() => {
          isUpdatingRef.current = false;
        }, 0);
        return;
      }
    }
    
    // Если min/max не заполнены, просто обновляем stepSize
    prevStepSizeRef.current = newValue;
    setStepSizeUSD(newValue);
  };

  const handleSave = async () => {
    const minValue = minPrice.trim() ? parseFloat(minPrice) : null;
    const maxValue = maxPrice.trim() ? parseFloat(maxPrice) : null;
    const stepValueUSD = stepSizeUSD.trim() ? parseFloat(stepSizeUSD) : null;
    const stepValueAMD = stepSizeAMD.trim() ? parseFloat(stepSizeAMD) : null;
    const stepValueRUB = stepSizeRUB.trim() ? parseFloat(stepSizeRUB) : null;
    const stepValueGEL = stepSizeGEL.trim() ? parseFloat(stepSizeGEL) : null;

    if (minValue !== null && (isNaN(minValue) || minValue < 0)) {
      alert(t('admin.priceFilter.minPriceInvalid'));
      return;
    }

    if (maxValue !== null && (isNaN(maxValue) || maxValue < 0)) {
      alert(t('admin.priceFilter.maxPriceInvalid'));
      return;
    }

    const validateStep = (value: number | null, label: string) => {
      if (value !== null && (isNaN(value) || value <= 0)) {
        alert(t('admin.priceFilter.stepSizeInvalid').replace('{label}', label));
        return false;
      }
      return true;
    };

    if (!validateStep(stepValueUSD, t('admin.priceFilter.stepSizeUsd'))) return;
    if (!validateStep(stepValueAMD, t('admin.priceFilter.stepSizeAmd'))) return;
    if (!validateStep(stepValueRUB, t('admin.priceFilter.stepSizeRub'))) return;
    if (!validateStep(stepValueGEL, t('admin.priceFilter.stepSizeGel'))) return;

    if (minValue !== null && maxValue !== null && minValue >= maxValue) {
      alert(t('admin.priceFilter.minMustBeLess'));
      return;
    }

    setSaving(true);
    try {
      logger.devLog('⚙️ [PRICE FILTER SETTINGS] Saving settings...', {
        minValue,
        maxValue,
        stepValueUSD,
        stepValueAMD,
        stepValueRUB,
        stepValueGEL,
      });

      const stepSizePerCurrency: {
        USD?: number;
        AMD?: number;
        RUB?: number;
        GEL?: number;
      } = {};

      if (stepValueUSD !== null) stepSizePerCurrency.USD = stepValueUSD;
      if (stepValueAMD !== null) stepSizePerCurrency.AMD = stepValueAMD;
      if (stepValueRUB !== null) stepSizePerCurrency.RUB = stepValueRUB;
      if (stepValueGEL !== null) stepSizePerCurrency.GEL = stepValueGEL;
      await apiClient.put('/api/v1/supersudo/settings/price-filter', {
        minPrice: minValue,
        maxPrice: maxValue,
        stepSize: stepValueUSD, // keep legacy field for backwards compatibility (USD as base)
        stepSizePerCurrency: Object.keys(stepSizePerCurrency).length ? stepSizePerCurrency : null,
      });
      
      alert(t('admin.priceFilter.savedSuccess'));
      logger.devLog('✅ [PRICE FILTER SETTINGS] Settings saved');
    } catch (err: unknown) {
      console.error('❌ [PRICE FILTER SETTINGS] Error saving settings:', err);
      const errorMessage = getApiOrErrorMessage(err, 'Failed to save');
      alert(t('admin.priceFilter.errorSaving').replace('{message}', errorMessage));
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!isLoading && isLoggedIn && isAdmin) {
      fetchSettings();
    }
  }, [isLoading, isLoggedIn, isAdmin, fetchSettings]);

  useEffect(() => {
    if (!isLoading) {
      if (!isLoggedIn) {
        logger.devLog('❌ [PRICE FILTER SETTINGS] User not logged in, redirecting to login...');
        router.push('/login');
        return;
      }
      if (!isAdmin) {
        logger.devLog('❌ [PRICE FILTER SETTINGS] User is not admin, redirecting to home...');
        router.push('/');
        return;
      }
    }
  }, [isLoggedIn, isAdmin, isLoading, router]);

  const currentPath = pathname || '/supersudo/price-filter-settings';

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
    return null; // Will redirect
  }

  const rangeIsConfigured = minPrice.trim() !== '' && maxPrice.trim() !== '';
  const configuredCurrencies = [
    stepSizeUSD,
    stepSizeAMD,
    stepSizeRUB,
    stepSizeGEL,
  ].filter((value) => value.trim() !== '').length;

  const stepValues: Record<(typeof currencyFields)[number]['key'], string> = {
    USD: stepSizeUSD,
    AMD: stepSizeAMD,
    RUB: stepSizeRUB,
    GEL: stepSizeGEL,
  };

  const setStepValue: Record<(typeof currencyFields)[number]['key'], (value: string) => void> = {
    USD: handleStepSizeChange,
    AMD: setStepSizeAMD,
    RUB: setStepSizeRUB,
    GEL: setStepSizeGEL,
  };

  return (
    <AdminPageLayout
      currentPath={currentPath}
      router={router}
      t={t}
      title={t('admin.priceFilter.title')}
      subtitle={t('admin.priceFilter.subtitle')}
      backLabel={t('admin.common.backToAdmin')}
      onBack={() => router.push('/supersudo')}
    >
      <div className="space-y-6 pb-8">
        <section className="overflow-hidden rounded-[28px] border border-marco-border/80 bg-gradient-to-br from-white via-marco-gray/50 to-marco-yellow/15 shadow-[0_18px_45px_rgba(16,16,16,0.08)]">
          <div className="grid gap-6 p-5 sm:p-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-marco-yellow/50 bg-marco-yellow/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-marco-black">
                <span className="h-2 w-2 rounded-full bg-marco-yellow" />
                Price Filter Studio
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold text-marco-black sm:text-3xl">
                  {t('admin.priceFilter.priceFilterDefaultRange')}
                </h2>
                <p className="max-w-2xl text-sm leading-6 text-marco-text/75 sm:text-base">
                  {t('admin.priceFilter.stepSizeDescription')}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-marco-border/80 bg-white/85 p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-marco-text/60">
                    Default Range
                  </p>
                  <p className="mt-2 text-lg font-semibold text-marco-black">
                    {rangeIsConfigured ? `${minPrice} - ${maxPrice}` : 'Not configured'}
                  </p>
                </div>
                <div className="rounded-2xl border border-marco-border/80 bg-white/85 p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-marco-text/60">
                    Active Currencies
                  </p>
                  <p className="mt-2 text-lg font-semibold text-marco-black">
                    {configuredCurrencies}/4
                  </p>
                </div>
                <div className="rounded-2xl border border-marco-border/80 bg-white/85 p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-marco-text/60">
                    Base Step
                  </p>
                  <p className="mt-2 text-lg font-semibold text-marco-black">
                    {stepSizeUSD.trim() || 'Not set'}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-marco-yellow/40 bg-gradient-to-br from-white via-[#fffdf4] to-marco-yellow/20 p-5 text-marco-black shadow-[0_16px_40px_rgba(247,206,63,0.18)]">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-marco-text/60">
                    Live Preview
                  </p>
                  <h3 className="mt-2 text-xl font-semibold">Customer filter feel</h3>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-marco-yellow/50 bg-marco-yellow text-marco-black shadow-[0_10px_24px_rgba(247,206,63,0.3)]">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-marco-yellow/30 bg-white/90 p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between text-sm">
                    <span className="text-marco-text/70">Range</span>
                    <span className="font-semibold text-marco-black">
                      {rangeIsConfigured ? `${minPrice} - ${maxPrice}` : 'Flexible'}
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-marco-gray">
                    <div className="h-3 w-2/3 rounded-full bg-marco-yellow" />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {currencyFields.map((field) => (
                    <div key={field.key} className="rounded-2xl border border-marco-yellow/25 bg-white/85 p-3 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-marco-text/55">
                        {field.key}
                      </p>
                      <p className="mt-2 text-base font-semibold text-marco-black">
                        {stepValues[field.key].trim() || '--'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="admin-card overflow-hidden border-marco-border/70 bg-white/95 p-0 shadow-sm">
            <div className="border-b border-marco-border/70 bg-gradient-to-r from-white via-marco-gray/40 to-white px-6 py-5">
              <div className="mb-4 h-1 w-14 rounded-full bg-gradient-to-r from-marco-yellow to-marco-black/30" />
              <h3 className="text-xl font-semibold text-marco-black">
                Configure Filter Range
              </h3>
              <p className="mt-1 text-sm text-marco-text/70">
                Set the public-facing default range and step sizes for every supported currency.
              </p>
            </div>

            {loading ? (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-marco-black"></div>
                <p className="text-marco-text/75">{t('admin.priceFilter.loadingSettings')}</p>
              </div>
            ) : (
              <div className="space-y-8 p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-marco-border/80 bg-white/90 p-4 shadow-sm">
                    <label className="mb-2 block text-sm font-medium text-marco-text/80">
                      Minimum Price
                    </label>
                    <Input
                      type="number"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      placeholder="0"
                      min="0"
                      step="1"
                      className="w-full"
                    />
                    <p className="mt-2 text-xs text-marco-text/60">
                      Lower boundary shown when shoppers first open the price filter.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-marco-border/80 bg-white/90 p-4 shadow-sm">
                    <label className="mb-2 block text-sm font-medium text-marco-text/80">
                      Maximum Price
                    </label>
                    <Input
                      type="number"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder="1000"
                      min="0"
                      step="1"
                      className="w-full"
                    />
                    <p className="mt-2 text-xs text-marco-text/60">
                      Upper boundary used to build the initial customer filter range.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-marco-black">Step Size By Currency</p>
                    <p className="mt-1 text-sm text-marco-text/70">
                      Use a smaller step for denser filters and a bigger step for faster browsing.
                    </p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {currencyFields.map((field) => (
                      <div
                        key={field.key}
                        className="group rounded-2xl border border-marco-border/80 bg-gradient-to-br from-white to-marco-gray/35 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-marco-yellow/60 hover:shadow-[0_12px_28px_rgba(16,16,16,0.08)]"
                      >
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div>
                            <label className="block text-sm font-medium text-marco-black">
                              {t(field.labelKey)}
                            </label>
                            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-marco-text/55">
                              {field.hint}
                            </p>
                          </div>
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-marco-yellow/25 text-sm font-semibold text-marco-black transition-colors group-hover:bg-marco-yellow/40">
                            {field.key}
                          </div>
                        </div>
                        <Input
                          type="number"
                          value={stepValues[field.key]}
                          onChange={(e) => setStepValue[field.key](e.target.value)}
                          placeholder={field.placeholder}
                          min="1"
                          step="1"
                          className="w-full"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 border-t border-marco-border/70 pt-2">
                  <Button
                    variant="primary"
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex h-11 items-center rounded-xl bg-marco-yellow px-5 text-sm font-semibold text-marco-black transition-all hover:-translate-y-0.5 hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-marco-black"></div>
                        <span>{t('admin.priceFilter.saving')}</span>
                      </div>
                    ) : (
                      t('admin.priceFilter.saveSettings')
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setMinPrice('');
                      setMaxPrice('');
                      setStepSizeUSD('');
                      setStepSizeAMD('');
                      setStepSizeRUB('');
                      setStepSizeGEL('');
                      prevStepSizeRef.current = '';
                    }}
                    className="inline-flex h-11 items-center rounded-xl border border-marco-border bg-white px-5 text-sm font-medium text-marco-text transition-colors hover:bg-marco-gray hover:text-marco-black"
                  >
                    {t('admin.priceFilter.clear')}
                  </Button>
                </div>
              </div>
            )}
          </Card>

          <div className="space-y-6">
            <Card className="admin-card overflow-hidden border-marco-border/70 bg-white/95 p-6 shadow-sm">
              <div className="mb-4 h-1 w-14 rounded-full bg-gradient-to-r from-marco-yellow to-marco-black/30" />
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-marco-yellow/25 text-marco-black">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-marco-black">{t('admin.priceFilter.howItWorks')}</h3>
                  <p className="mt-1 text-sm text-marco-text/70">
                    These settings shape the first impression of your storefront filters.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {[
                  t('admin.priceFilter.stepSizeControls'),
                  t('admin.priceFilter.differentStepSizes'),
                  t('admin.priceFilter.defaultRange'),
                  t('admin.priceFilter.usersCanAdjust'),
                  t('admin.priceFilter.changesTakeEffect'),
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-2xl border border-marco-border/70 bg-marco-gray/30 px-4 py-3"
                  >
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-marco-yellow" />
                    <p className="text-sm leading-6 text-marco-text/85">{item}</p>
                  </div>
                ))}
              </div>
            </Card>

          </div>
        </div>
      </div>
    </AdminPageLayout>
  );
}

