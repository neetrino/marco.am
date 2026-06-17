'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Card, Button, Input } from '@shop/ui';
import { apiClient, getApiOrErrorMessage } from '../../../lib/api-client';
import { useTranslation } from '../../../lib/i18n-client';
import { AdminPageLayout } from '../components/AdminPageLayout';
import { logger } from "@/lib/utils/logger";
import { ADMIN_CACHE_KEYS } from '@/lib/admin/admin-cache-keys';
import { beginAdminDataFetch } from '@/lib/admin/admin-fetch-helpers';
import { dedupedAdminRequest } from '@/lib/admin/admin-request-dedup';
import {
  ADMIN_SESSION_CACHE_TTL_MS,
  readAdminSessionCache,
  writeAdminSessionCache,
} from '@/lib/admin/admin-session-cache';

const currencyFields = [
  {
    key: 'USD',
    labelKey: 'admin.priceFilter.stepSizeUsd',
    hintKey: 'admin.priceFilter.currencyHintUsd',
    placeholder: '100',
  },
  {
    key: 'AMD',
    labelKey: 'admin.priceFilter.stepSizeAmd',
    hintKey: 'admin.priceFilter.currencyHintAmd',
    placeholder: '5000',
  },
  {
    key: 'RUB',
    labelKey: 'admin.priceFilter.stepSizeRub',
    hintKey: 'admin.priceFilter.currencyHintRub',
    placeholder: '500',
  },
  {
    key: 'GEL',
    labelKey: 'admin.priceFilter.stepSizeGel',
    hintKey: 'admin.priceFilter.currencyHintGel',
    placeholder: '10',
  },
] as const;

type PriceFilterSettingsResponse = {
  minPrice?: number;
  maxPrice?: number;
  stepSize?: number;
  stepSizePerCurrency?: {
    USD?: number;
    AMD?: number;
    RUB?: number;
    GEL?: number;
  };
};

function mapPriceFilterResponse(response: PriceFilterSettingsResponse) {
  const minPriceStr = response.minPrice?.toString() || '';
  const maxPriceStr = response.maxPrice?.toString() || '';
  const per = response.stepSizePerCurrency || {};
  const fallbackStep = response.stepSize?.toString() || '';
  return {
    minPrice: minPriceStr,
    maxPrice: maxPriceStr,
    stepSizeUSD: per.USD !== undefined ? per.USD.toString() : fallbackStep,
    stepSizeAMD: per.AMD !== undefined ? per.AMD.toString() : '',
    stepSizeRUB: per.RUB !== undefined ? per.RUB.toString() : '',
    stepSizeGEL: per.GEL !== undefined ? per.GEL.toString() : '',
    prevStepSize: fallbackStep,
  };
}

export default function PriceFilterSettingsPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const cachedPriceFilter = readAdminSessionCache<PriceFilterSettingsResponse>(
    ADMIN_CACHE_KEYS.priceFilter,
    ADMIN_SESSION_CACHE_TTL_MS,
  );
  const initialPriceFilter = cachedPriceFilter ? mapPriceFilterResponse(cachedPriceFilter) : null;
  const hadCacheRef = useRef(cachedPriceFilter !== null);
  const [minPrice, setMinPrice] = useState<string>(initialPriceFilter?.minPrice ?? '');
  const [maxPrice, setMaxPrice] = useState<string>(initialPriceFilter?.maxPrice ?? '');
  const [stepSizeUSD, setStepSizeUSD] = useState<string>(initialPriceFilter?.stepSizeUSD ?? '');
  const [stepSizeAMD, setStepSizeAMD] = useState<string>(initialPriceFilter?.stepSizeAMD ?? '');
  const [stepSizeRUB, setStepSizeRUB] = useState<string>(initialPriceFilter?.stepSizeRUB ?? '');
  const [stepSizeGEL, setStepSizeGEL] = useState<string>(initialPriceFilter?.stepSizeGEL ?? '');
  const [loading, setLoading] = useState(cachedPriceFilter === null);
  const [saving, setSaving] = useState(false);
  
  // Храним предыдущее значение stepSize для расчета разницы
  const prevStepSizeRef = useRef<string>(initialPriceFilter?.prevStepSize ?? '');
  const isUpdatingRef = useRef<boolean>(false);

  const fetchSettings = useCallback(async (options?: { force?: boolean }) => {
    const cached = readAdminSessionCache<PriceFilterSettingsResponse>(
      ADMIN_CACHE_KEYS.priceFilter,
      ADMIN_SESSION_CACHE_TTL_MS,
    );
    if (!options?.force && cached !== null) {
      const mapped = mapPriceFilterResponse(cached);
      setMinPrice(mapped.minPrice);
      setMaxPrice(mapped.maxPrice);
      setStepSizeUSD(mapped.stepSizeUSD);
      setStepSizeAMD(mapped.stepSizeAMD);
      setStepSizeRUB(mapped.stepSizeRUB);
      setStepSizeGEL(mapped.stepSizeGEL);
      prevStepSizeRef.current = mapped.prevStepSize;
      setLoading(false);
      hadCacheRef.current = true;
      return;
    }

    try {
      logger.devLog('⚙️ [PRICE FILTER SETTINGS] Fetching settings...');
      beginAdminDataFetch(hadCacheRef.current, setLoading);
      const response = await dedupedAdminRequest(ADMIN_CACHE_KEYS.priceFilter, () =>
        apiClient.get<PriceFilterSettingsResponse>('/api/v1/supersudo/settings/price-filter'),
      );
      const mapped = mapPriceFilterResponse(response);
      setMinPrice(mapped.minPrice);
      setMaxPrice(mapped.maxPrice);
      setStepSizeUSD(mapped.stepSizeUSD);
      setStepSizeAMD(mapped.stepSizeAMD);
      setStepSizeRUB(mapped.stepSizeRUB);
      setStepSizeGEL(mapped.stepSizeGEL);
      prevStepSizeRef.current = mapped.prevStepSize;
      writeAdminSessionCache(ADMIN_CACHE_KEYS.priceFilter, response);
      hadCacheRef.current = true;
      
      logger.devLog('✅ [PRICE FILTER SETTINGS] Settings loaded:', response);
    } catch (err: unknown) {
      console.error('❌ [PRICE FILTER SETTINGS] Error fetching settings:', err);
      if (!hadCacheRef.current) {
        setMinPrice('');
        setMaxPrice('');
        setStepSizeUSD('');
        setStepSizeAMD('');
        setStepSizeRUB('');
        setStepSizeGEL('');
        prevStepSizeRef.current = '';
      }
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
    fetchSettings();
  }, [fetchSettings]);

  const currentPath = pathname || '/supersudo/price-filter-settings';

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
    >
      <div className="space-y-6 pb-8">
          <Card className="admin-card overflow-hidden border-marco-border/70 bg-white/95 p-0 shadow-sm">
            <div className="border-b border-marco-border/70 bg-gradient-to-r from-white via-marco-gray/40 to-white px-6 py-5">
              <div className="mb-4 h-1 w-14 rounded-full bg-gradient-to-r from-marco-yellow to-marco-black/30" />
              <h3 className="text-xl font-semibold text-marco-black">
                {t('admin.priceFilter.configureFilterRange')}
              </h3>
              <p className="mt-1 text-sm text-marco-text/70">
                {t('admin.priceFilter.configureFilterRangeDescription')}
              </p>
            </div>

            {loading ? (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-marco-black"></div>
                <p className="text-marco-text/75">{t('admin.priceFilter.loadingSettings')}</p>
              </div>
            ) : (
              <div className="space-y-8 p-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-marco-black">{t('admin.priceFilter.stepSizeByCurrency')}</p>
                    <p className="mt-1 text-sm text-marco-text/70">
                      {t('admin.priceFilter.stepSizeByCurrencyHint')}
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
                              {t(field.hintKey)}
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
      </div>
    </AdminPageLayout>
  );
}

