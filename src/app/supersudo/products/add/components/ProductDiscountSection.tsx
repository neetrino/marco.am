'use client';

import { useEffect, useState } from 'react';
import { Button, Input } from '@shop/ui';
import { apiClient, getApiOrErrorMessage } from '@/lib/api-client';
import { DiscountExpiresPicker } from '@/components/admin/DiscountExpiresPicker';
import { useTranslation } from '@/lib/i18n-client';

type ProductDiscountSectionProps = {
  productId: string;
  initialDiscountPercent?: number;
  initialDiscountExpiresAt?: string | null;
};

export function ProductDiscountSection({
  productId,
  initialDiscountPercent = 0,
  initialDiscountExpiresAt = null,
}: ProductDiscountSectionProps) {
  const { t } = useTranslation();
  const [discountPercent, setDiscountPercent] = useState(initialDiscountPercent);
  const [discountExpiresAt, setDiscountExpiresAt] = useState<string | null>(
    initialDiscountExpiresAt,
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDiscountPercent(initialDiscountPercent);
    setDiscountExpiresAt(initialDiscountExpiresAt ?? null);
  }, [initialDiscountExpiresAt, initialDiscountPercent, productId]);

  const handleSave = async () => {
    if (Number.isNaN(discountPercent) || discountPercent < 0 || discountPercent > 100) {
      alert(t('admin.quickSettings.discountMustBeValid'));
      return;
    }

    setSaving(true);
    try {
      await apiClient.patch(`/api/v1/supersudo/products/${productId}/discount`, {
        discountPercent,
        discountExpiresAt,
      });
      alert(t('admin.quickSettings.productDiscountSaved'));
    } catch (err: unknown) {
      alert(t('admin.quickSettings.errorSavingProduct').replace('{message}', getApiOrErrorMessage(err, 'Failed to save')));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-rose-100/80 bg-gradient-to-r from-rose-50/40 to-white px-4 py-3">
      <div className="mb-2">
        <p className="text-sm font-semibold text-slate-900">{t('admin.products.discountTitle')}</p>
        <p className="text-xs text-slate-500">{t('admin.products.discountHint')}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="number"
          min="0"
          max="100"
          step="0.1"
          value={discountPercent}
          onChange={(event) => {
            const value = event.target.value;
            setDiscountPercent(value === '' ? 0 : parseFloat(value) || 0);
          }}
          className="w-24 border-slate-300 bg-white"
          placeholder="0"
        />
        <span className="text-sm font-semibold text-slate-700">%</span>
        <DiscountExpiresPicker value={discountExpiresAt} onChange={setDiscountExpiresAt} />
        <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
          {saving ? t('admin.quickSettings.saving') : t('admin.quickSettings.save')}
        </Button>
      </div>
    </div>
  );
}
