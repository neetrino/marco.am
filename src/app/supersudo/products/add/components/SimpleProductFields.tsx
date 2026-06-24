'use client';

import { Input } from '@shop/ui';
import { useTranslation } from '../../../../../lib/i18n-client';
import { FormSection } from './FormSection';
import { CURRENCIES, type CurrencyCode } from '../../../../../lib/currency';
import { DiscountControl } from '@/components/admin/DiscountControl';
import type { VariantDiscount } from '../utils/variant-discount';

interface SimpleProductFieldsProps {
  price: string;
  discount: VariantDiscount;
  sku: string;
  quantity: string;
  defaultCurrency: CurrencyCode;
  onPriceChange: (value: string) => void;
  onDiscountChange: (value: VariantDiscount) => void;
  onSkuChange: (value: string) => void;
  onQuantityChange: (value: string) => void;
  embedded?: boolean;
}

export function SimpleProductFields({
  price,
  discount,
  sku,
  quantity,
  defaultCurrency,
  onPriceChange,
  onDiscountChange,
  onSkuChange,
  onQuantityChange,
  embedded,
}: SimpleProductFieldsProps) {
  const { t } = useTranslation();

  const fields = (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('admin.products.add.price')}
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={price}
                onChange={(e) => onPriceChange(e.target.value)}
                placeholder={t('admin.products.add.pricePlaceholder')}
                className="flex-1"
                min="0"
                step="0.01"
              />
              <span className="text-sm text-gray-500 whitespace-nowrap">{CURRENCIES[defaultCurrency].symbol}</span>
            </div>
          </div>

          {/* Discount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('admin.products.add.discount')}
            </label>
            <DiscountControl
              compact
              value={discount}
              onChange={onDiscountChange}
              currencySymbol={CURRENCIES[defaultCurrency].symbol}
            />
          </div>

          {/* SKU */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('admin.products.add.sku')}
            </label>
            <Input
              type="text"
              value={sku}
              onChange={(e) => onSkuChange(e.target.value)}
              placeholder={t('admin.products.add.skuPlaceholder')}
              className="w-full"
            />
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('admin.products.add.quantity')}
            </label>
            <Input
              type="number"
              value={quantity}
              onChange={(e) => onQuantityChange(e.target.value)}
              placeholder={t('admin.products.add.quantityPlaceholder')}
              className="w-full"
              min="0"
            />
          </div>
        </div>
      </div>
  );

  if (embedded) {
    return fields;
  }

  return <FormSection title={t('admin.products.add.pricingAndInventory')}>{fields}</FormSection>;
}


