'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Button, Card } from '@shop/ui';
import { useAuth } from '../../../lib/auth/AuthContext';
import { apiClient, getApiOrErrorMessage } from '../../../lib/api-client';
import { useTranslation } from '../../../lib/i18n-client';
import { AdminPageLayout } from '../components/AdminPageLayout';
import type { HomeHeroBannerStorage } from '../../../lib/schemas/home-hero-banner.schema';

type HeroBannerFormState = {
  desktopImageUrl: string;
  mobileImageUrl: string;
};

function toNullableUrl(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export default function HeroBannerPage() {
  const { t } = useTranslation();
  const { isLoggedIn, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const currentPath = pathname || '/supersudo/hero-banner';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [storage, setStorage] = useState<HomeHeroBannerStorage | null>(null);
  const [form, setForm] = useState<HeroBannerFormState>({
    desktopImageUrl: '',
    mobileImageUrl: '',
  });

  useEffect(() => {
    if (!isLoading && (!isLoggedIn || !isAdmin)) {
      router.push('/supersudo');
    }
  }, [isAdmin, isLoading, isLoggedIn, router]);

  useEffect(() => {
    if (!isLoading && isLoggedIn && isAdmin) {
      void fetchHeroBanner();
    }
  }, [isAdmin, isLoading, isLoggedIn]);

  async function fetchHeroBanner() {
    try {
      setLoading(true);
      const data = await apiClient.get<HomeHeroBannerStorage>('/api/v1/supersudo/home-hero');
      setStorage(data);
      setForm({
        desktopImageUrl: data.imageDesktopUrl ?? '',
        mobileImageUrl: data.imageMobileUrl ?? '',
      });
    } catch (error: unknown) {
      alert(t('admin.heroBanner.errorLoading').replace('{message}', getApiOrErrorMessage(error, 'Failed to load hero banner')));
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!storage) {
      return;
    }

    const payload: HomeHeroBannerStorage = {
      ...storage,
      imageDesktopUrl: toNullableUrl(form.desktopImageUrl),
      imageMobileUrl: toNullableUrl(form.mobileImageUrl),
    };

    try {
      setSaving(true);
      const saved = await apiClient.put<HomeHeroBannerStorage>('/api/v1/supersudo/home-hero', payload);
      setStorage(saved);
      setForm({
        desktopImageUrl: saved.imageDesktopUrl ?? '',
        mobileImageUrl: saved.imageMobileUrl ?? '',
      });
      alert(t('admin.heroBanner.savedSuccess'));
    } catch (error: unknown) {
      alert(t('admin.heroBanner.errorSaving').replace('{message}', getApiOrErrorMessage(error, 'Failed to save hero banner')));
    } finally {
      setSaving(false);
    }
  }

  if (isLoading || loading) {
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
    return null;
  }

  const hasDesktopImage = form.desktopImageUrl.trim().length > 0;
  const hasMobileImage = form.mobileImageUrl.trim().length > 0;

  return (
    <AdminPageLayout
      currentPath={currentPath}
      router={router}
      t={t}
      title={t('admin.heroBanner.title')}
      subtitle={t('admin.heroBanner.subtitle')}
      backLabel={t('admin.heroBanner.backToAdmin')}
      onBack={() => router.push('/supersudo')}
    >
      <div className="space-y-5">
        <Card className="admin-card border border-amber-100/80 bg-gradient-to-r from-amber-50 via-white to-orange-50 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-amber-700/90">
                Home Page Visual
              </p>
              <h2 className="text-lg font-semibold text-slate-900">{t('admin.heroBanner.title')}</h2>
              <p className="mt-1 text-sm text-slate-600">{t('admin.heroBanner.subtitle')}</p>
            </div>
            <span className="rounded-full border border-amber-200 bg-white/90 px-3 py-1 text-xs font-medium text-amber-800 shadow-sm">
              Banner Manager
            </span>
          </div>
        </Card>

        <Card className="admin-card border border-slate-100 bg-white/95 shadow-sm">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">
                {t('admin.heroBanner.desktopImageUrl')}
              </label>
              <input
                type="url"
                value={form.desktopImageUrl}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    desktopImageUrl: event.target.value,
                  }))
                }
                className="admin-field rounded-xl border-slate-200 bg-white shadow-sm transition duration-200 placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                placeholder={t('admin.heroBanner.imageUrlPlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">
                {t('admin.heroBanner.mobileImageUrl')}
              </label>
              <input
                type="url"
                value={form.mobileImageUrl}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    mobileImageUrl: event.target.value,
                  }))
                }
                className="admin-field rounded-xl border-slate-200 bg-white shadow-sm transition duration-200 placeholder:text-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                placeholder={t('admin.heroBanner.imageUrlPlaceholder')}
              />
            </div>
          </div>
        </Card>

        <Card className="admin-card border border-slate-100 bg-white shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">{t('admin.heroBanner.previewTitle')}</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              Live Preview
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
              <p className="mb-2 text-sm font-medium text-slate-700">{t('admin.heroBanner.desktopPreview')}</p>
              {hasDesktopImage ? (
                <img
                  src={form.desktopImageUrl}
                  alt={t('admin.heroBanner.desktopPreview')}
                  className="h-56 w-full rounded-xl border border-slate-200 object-cover shadow-sm"
                />
              ) : (
                <div className="flex h-56 w-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-sm text-slate-500">
                  {t('admin.heroBanner.noImageSelected')}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3">
              <p className="mb-2 text-sm font-medium text-slate-700">{t('admin.heroBanner.mobilePreview')}</p>
              {hasMobileImage ? (
                <img
                  src={form.mobileImageUrl}
                  alt={t('admin.heroBanner.mobilePreview')}
                  className="h-56 w-full rounded-xl border border-slate-200 object-cover shadow-sm"
                />
              ) : (
                <div className="flex h-56 w-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-sm text-slate-500">
                  {t('admin.heroBanner.noImageSelected')}
                </div>
              )}
            </div>
          </div>
        </Card>

        <div className="sticky bottom-4 z-10 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-lg backdrop-blur">
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="ghost" onClick={() => router.push('/supersudo')} disabled={saving}>
              {t('admin.heroBanner.cancel')}
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={saving}>
              {saving ? t('admin.heroBanner.saving') : t('admin.heroBanner.save')}
            </Button>
          </div>
        </div>
      </div>
    </AdminPageLayout>
  );
}
