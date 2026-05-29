'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Button, Card } from '@shop/ui';
import { Copy, Pencil, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useTranslation } from '@/lib/i18n-client';
import { logger } from '@/lib/utils/logger';
import { AdminPageLayout } from '../components/AdminPageLayout';
import { PromoCodeFormModal } from './components/PromoCodeFormModal';
import { usePromoCodesAdmin } from './usePromoCodesAdmin';

const actionButtonClass =
  '!h-8 !min-h-8 !w-8 !max-w-none shrink-0 !px-0 !py-0 gap-0 rounded-md border border-transparent';

function formatDiscount(
  discountType: 'percentage' | 'fixed',
  discountValue: number,
  t: (key: string) => string
): string {
  if (discountType === 'percentage') {
    return `${discountValue}%`;
  }
  return `${discountValue.toLocaleString('en-US')} ${t('admin.promoCodes.amd')}`;
}

export default function PromoCodesPage() {
  const { t } = useTranslation();
  const { isLoggedIn, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const currentPath = pathname || '/supersudo/promo-codes';

  const {
    records,
    loading,
    saving,
    modalOpen,
    form,
    setForm,
    openCreateModal,
    openEditModal,
    closeModal,
    savePromoCode,
    deletePromoCode,
  } = usePromoCodesAdmin({ isLoggedIn, isAdmin, isLoading, t });

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch (error: unknown) {
      logger.warn('Failed to copy promo code', { code, error });
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-gray-900" />
          <p className="text-gray-600">{t('admin.common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn || !isAdmin) {
    return null;
  }

  return (
    <AdminPageLayout
      currentPath={currentPath}
      router={router}
      t={t}
      title={t('admin.promoCodes.title')}
      subtitle={t('admin.promoCodes.subtitle')}
      headerActions={
        <Button type="button" variant="primary" onClick={openCreateModal}>
          {t('admin.promoCodes.add')}
        </Button>
      }
    >
      <Card className="overflow-hidden p-0">
        {records.length === 0 ? (
          <p className="p-6 text-sm text-[var(--app-text-muted)]">{t('admin.promoCodes.empty')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-marco-border bg-gray-50 text-left dark:border-white/10 dark:bg-white/5">
                <tr>
                  <th className="px-4 py-3 font-medium">{t('admin.promoCodes.code')}</th>
                  <th className="px-4 py-3 font-medium">{t('admin.promoCodes.discount')}</th>
                  <th className="px-4 py-3 font-medium">{t('admin.promoCodes.status')}</th>
                  <th className="px-4 py-3 font-medium">{t('admin.promoCodes.usage')}</th>
                  <th className="px-4 py-3 font-medium">{t('admin.promoCodes.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className="border-b border-marco-border/70 dark:border-white/10">
                    <td className="px-4 py-3 font-mono font-semibold">{record.code}</td>
                    <td className="px-4 py-3">
                      {formatDiscount(record.discountType, record.discountValue, t)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          record.isActive
                            ? 'rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800'
                            : 'rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700'
                        }
                      >
                        {record.isActive
                          ? t('admin.promoCodes.active')
                          : t('admin.promoCodes.inactive')}
                      </span>
                    </td>
                    <td className="px-4 py-3 tabular-nums">{record.usageCount ?? 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-nowrap items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => void handleCopyCode(record.code)}
                          aria-label={t('admin.promoCodes.copy')}
                          title={t('admin.promoCodes.copy')}
                          className={`${actionButtonClass} text-slate-700 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900`}
                        >
                          <Copy className="h-4 w-4 shrink-0" aria-hidden="true" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(record)}
                          aria-label={t('admin.promoCodes.edit')}
                          title={t('admin.promoCodes.edit')}
                          className={`${actionButtonClass} text-slate-700 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900`}
                        >
                          <Pencil className="h-4 w-4 shrink-0" aria-hidden="true" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => void deletePromoCode(record)}
                          aria-label={t('admin.promoCodes.delete')}
                          title={t('admin.promoCodes.delete')}
                          className={`${actionButtonClass} text-red-600 hover:border-red-100 hover:bg-red-50 hover:text-red-700`}
                        >
                          <Trash2 className="h-4 w-4 shrink-0" aria-hidden="true" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <PromoCodeFormModal
        open={modalOpen}
        form={form}
        saving={saving}
        t={t}
        onClose={closeModal}
        onChange={setForm}
        onSave={() => void savePromoCode()}
      />
    </AdminPageLayout>
  );
}
