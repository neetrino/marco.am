'use client';

import { useMemo, useState } from 'react';
import { Card, Button, Input } from '@shop/ui';
import { useTranslation } from '../../../../lib/i18n-client';

interface AdminBrand {
  id: string;
  name: string;
  logoUrl?: string;
}

interface BrandDiscountsCardProps {
  brands: AdminBrand[];
  brandsLoading: boolean;
  brandDiscounts: Record<string, number>;
  updateBrandDiscountValue: (brandId: string, value: string) => void;
  clearBrandDiscount: (brandId: string) => void;
  handleBrandDiscountSave: () => void;
  brandSaving: boolean;
}

export function BrandDiscountsCard({
  brands,
  brandsLoading,
  brandDiscounts,
  updateBrandDiscountValue,
  clearBrandDiscount,
  handleBrandDiscountSave,
  brandSaving,
}: BrandDiscountsCardProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBrands = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return brands;
    }

    return brands.filter((brand) => {
      const brandName = (brand.name || '').toLowerCase();
      const brandId = brand.id.toLowerCase();
      return brandName.includes(normalizedQuery) || brandId.includes(normalizedQuery);
    });
  }, [brands, searchQuery]);

  return (
    <Card className="admin-card mb-6 border-slate-200/80 bg-white/95 shadow-[0_12px_28px_rgba(15,23,42,0.07)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">{t('admin.quickSettings.brandDiscounts')}</h2>
          <p className="text-sm text-slate-600">{t('admin.quickSettings.brandDiscountsSubtitle')}</p>
        </div>
        <Button
          variant="primary"
          onClick={handleBrandDiscountSave}
          disabled={brandSaving || brands.length === 0}
          className="shadow-sm"
        >
          {brandSaving ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>{t('admin.quickSettings.saving')}</span>
            </div>
          ) : (
            t('admin.quickSettings.save')
          )}
        </Button>
      </div>

      <div className="mb-4 flex gap-2">
        <Input
          type="text"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder={t('admin.brands.searchPlaceholder')}
          className="border-slate-300 bg-white"
        />
        <Button
          variant="ghost"
          onClick={() => setSearchQuery('')}
          disabled={searchQuery.length === 0}
          className="shrink-0 text-slate-700 hover:bg-slate-100"
        >
          {t('admin.quickSettings.clear')}
        </Button>
      </div>

      {brandsLoading ? (
        <div className="py-8 text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-slate-900"></div>
          <p className="text-slate-600">{t('admin.quickSettings.loadingBrands')}</p>
        </div>
      ) : brands.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 py-6 text-center text-slate-600">
          {t('admin.quickSettings.noBrands')}
        </div>
      ) : filteredBrands.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 py-6 text-center text-slate-600">
          {t('admin.brands.searchNoMatches')}
        </div>
      ) : (
        <div className="max-h-[440px] overflow-y-auto rounded-xl border border-slate-100 bg-slate-50/50 p-2">
          {filteredBrands.map((brand) => {
            const currentValue = brandDiscounts[brand.id];
            return (
              <div
                key={brand.id}
                className="mb-2 flex items-center gap-4 rounded-lg border border-transparent bg-white px-4 py-3 shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition-all duration-200 last:mb-0 hover:-translate-y-0.5 hover:border-slate-200 hover:shadow-[0_8px_22px_rgba(15,23,42,0.08)]"
              >
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {brand.name || t('admin.quickSettings.untitledBrand')}
                  </p>
                  <p className="text-xs text-slate-500">
                    {t('admin.quickSettings.brandId').replace('{id}', brand.id)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={currentValue === undefined ? '' : currentValue}
                    onChange={(e) => updateBrandDiscountValue(brand.id, e.target.value)}
                    className="w-24 border-slate-300 bg-white"
                    placeholder="0"
                  />
                  <span className="text-sm font-semibold text-slate-700">%</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => clearBrandDiscount(brand.id)}
                    disabled={currentValue === undefined}
                    className="text-slate-600 hover:bg-slate-100"
                  >
                    {t('admin.quickSettings.clear')}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

