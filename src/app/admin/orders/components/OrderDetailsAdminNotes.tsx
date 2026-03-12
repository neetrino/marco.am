'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from '../../../../lib/i18n-client';
import { Card } from '@shop/ui';

interface OrderDetailsAdminNotesProps {
  orderId: string;
  adminNotes: string | null | undefined;
  onUpdate: (orderId: string, adminNotes: string | null) => Promise<void>;
}

export function OrderDetailsAdminNotes({
  orderId,
  adminNotes,
  onUpdate,
}: OrderDetailsAdminNotesProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState(adminNotes ?? '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(adminNotes ?? '');
  }, [adminNotes]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate(orderId, value.trim() || null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-4 md:p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-2">
        {t('admin.orders.orderDetails.adminNotes')}
      </h3>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={3}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 mb-2"
        placeholder={t('admin.orders.orderDetails.adminNotesPlaceholder')}
      />
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 text-sm"
      >
        {saving ? t('admin.common.saving') : t('admin.orders.orderDetails.saveAdminNotes')}
      </button>
    </Card>
  );
}
