'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth/AuthContext';
import { Card, Button } from '@shop/ui';
import { apiClient } from '../../../lib/api-client';
import { AdminMenuDrawer } from '../../../components/AdminMenuDrawer';
import { getAdminMenuTABS } from '../admin-menu.config';
import { useTranslation } from '../../../lib/i18n-client';

interface PromoCode {
  id: string;
  code: string;
  type: string;
  value: number;
  active: boolean;
  usedCount: number;
  maxUses: number | null;
  validFrom: string | null;
  validTo: string | null;
  minOrderAmount: number | null;
}

export default function PromoCodesPage() {
  const { t } = useTranslation();
  const { isLoggedIn, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [list, setList] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && (!isLoggedIn || !isAdmin)) {
      router.push('/admin');
      return;
    }
  }, [isLoggedIn, isAdmin, isLoading, router]);

  useEffect(() => {
    if (!isLoggedIn || !isAdmin) return;
    apiClient.get<{ data: PromoCode[] }>('/api/v1/admin/promo-codes')
      .then((res) => setList(res.data || []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [isLoggedIn, isAdmin]);

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(t('admin.common.delete') + ' ' + code + '?')) return;
    try {
      await apiClient.delete(`/api/v1/admin/promo-codes/${id}`);
      setList((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      console.error(e);
      alert(t('admin.common.error'));
    }
  };

  if (isLoading || !isLoggedIn || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AdminMenuDrawer tabs={getAdminMenuTABS(t)} currentPath="/admin/promo-codes" />
        <div className="lg:pl-64">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">{t('admin.menu.promoCodes')}</h1>
          {loading ? (
            <p className="text-gray-600">{t('admin.common.loading')}</p>
          ) : (
            <Card className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Create and manage promo codes in the database. Apply at checkout via cart coupon or checkout form.
              </p>
              <div className="space-y-2">
                {list.length === 0 ? (
                  <p className="text-gray-500 py-2">No promo codes yet.</p>
                ) : (
                  list.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <span className="font-mono font-medium">{p.code}</span>
                        <span className="ml-2 text-sm text-gray-600">
                          {p.type === 'percent' ? `${p.value}%` : `${p.value} AMD`} • used {p.usedCount}
                          {p.maxUses != null ? ` / ${p.maxUses}` : ''} • {p.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(p.id, p.code)}>
                        {t('admin.common.delete')}
                      </Button>
                    </div>
                  ))
                )}
              </div>
              <p className="text-xs text-gray-400 mt-4">
                To add new promo codes, use the API: POST /api/v1/admin/promo-codes with body: code, type (percent|fixed), value, active, validFrom, validTo, maxUses, minOrderAmount.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
