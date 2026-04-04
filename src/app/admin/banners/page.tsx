'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/auth/AuthContext';
import { Card, Button } from '@shop/ui';
import { apiClient } from '../../../lib/api-client';
import { AdminMenuDrawer } from '../../../components/AdminMenuDrawer';
import { getAdminMenuTABS } from '../admin-menu.config';
import { useTranslation } from '../../../lib/i18n-client';

interface Banner {
  id: string;
  title: string | null;
  imageUrl: string;
  linkUrl: string | null;
  position: number;
  active: boolean;
}

export default function BannersPage() {
  const { t } = useTranslation();
  const { isLoggedIn, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [list, setList] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && (!isLoggedIn || !isAdmin)) {
      router.push('/admin');
      return;
    }
  }, [isLoggedIn, isAdmin, isLoading, router]);

  useEffect(() => {
    if (!isLoggedIn || !isAdmin) return;
    apiClient.get<{ data: Banner[] }>('/api/v1/admin/banners')
      .then((res) => setList(res.data || []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [isLoggedIn, isAdmin]);

  const handleDelete = async (id: string) => {
    if (!confirm(t('admin.common.delete') + '?')) return;
    try {
      await apiClient.delete(`/api/v1/admin/banners/${id}`);
      setList((prev) => prev.filter((b) => b.id !== id));
    } catch (e) {
      console.error(e);
      alert(t('admin.common.error'));
    }
  };

  if (isLoading || !isLoggedIn || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AdminMenuDrawer tabs={getAdminMenuTABS(t)} currentPath="/admin/banners" />
        <div className="lg:pl-64">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">{t('admin.menu.banners')}</h1>
          {loading ? (
            <p className="text-gray-600">{t('admin.common.loading')}</p>
          ) : (
            <Card className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Banners are used on the homepage. Add via API: POST /api/v1/admin/banners with imageUrl, title, linkUrl, position, active.
              </p>
              <div className="space-y-4">
                {list.length === 0 ? (
                  <p className="text-gray-500 py-2">No banners yet.</p>
                ) : (
                  list.map((b) => (
                    <div key={b.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      {b.imageUrl && (
                        <img src={b.imageUrl} alt={b.title || ''} className="w-24 h-14 object-cover rounded" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{b.title || b.imageUrl}</p>
                        <p className="text-xs text-gray-500">Position: {b.position} • {b.active ? 'Active' : 'Inactive'}</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(b.id)}>
                        {t('admin.common.delete')}
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
