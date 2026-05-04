'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../../lib/auth/AuthContext';
import { Card, Button } from '@shop/ui';
import { apiClient, getApiOrErrorMessage } from '../../../lib/api-client';
import { useTranslation } from '../../../lib/i18n-client';
import { AdminPageLayout } from '../components/AdminPageLayout';
import { logger } from "@/lib/utils/logger";

interface DeliveryLocation {
  id?: string;
  country: string;
  city: string;
  price: number;
}

interface DeliverySettings {
  locations: DeliveryLocation[];
}

export default function DeliveryPage() {
  const { t } = useTranslation();
  const { isLoggedIn, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<DeliveryLocation[]>([]);
  const [_editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (!isLoggedIn || !isAdmin) {
        router.push('/supersudo');
        return;
      }
    }
  }, [isLoggedIn, isAdmin, isLoading, router]);

  useEffect(() => {
    if (isLoggedIn && isAdmin) {
      fetchDeliverySettings();
    }
  }, [isLoggedIn, isAdmin]);

  const fetchDeliverySettings = async () => {
    try {
      setLoading(true);
      logger.devLog('🚚 [ADMIN] Fetching delivery settings...');
      const data = await apiClient.get<DeliverySettings>('/api/v1/supersudo/delivery');
      setLocations(data.locations || []);
      logger.devLog('✅ [ADMIN] Delivery settings loaded:', data);
    } catch (err: unknown) {
      logger.error('Admin delivery settings fetch failed', { error: err });
      // Use defaults if error
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      logger.devLog('🚚 [ADMIN] Saving delivery settings...', { locations });
      await apiClient.put('/api/v1/supersudo/delivery', { locations });
      alert(t('admin.delivery.savedSuccess'));
      logger.devLog('✅ [ADMIN] Delivery settings saved');
      setEditingId(null);
      await fetchDeliverySettings();
    } catch (err: unknown) {
      logger.error('Admin delivery settings save failed', { error: err });
      const errorMessage = getApiOrErrorMessage(err, 'Failed to save delivery settings');
      alert(t('admin.delivery.errorSaving').replace('{message}', errorMessage));
    } finally {
      setSaving(false);
    }
  };

  const handleAddLocation = () => {
    setLocations([...locations, { country: '', city: '', price: 1000 }]);
    setEditingId(`new-${Date.now()}`);
  };

  const handleUpdateLocation = (index: number, field: keyof DeliveryLocation, value: string | number) => {
    const updated = [...locations];
    updated[index] = { ...updated[index], [field]: value };
    setLocations(updated);
  };

  const handleDeleteLocation = (index: number) => {
    if (confirm(t('admin.delivery.deleteLocation'))) {
      const updated = locations.filter((_, i) => i !== index);
      setLocations(updated);
    }
  };

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

  const currentPath = pathname || '/supersudo/delivery';
  const formatAmd = (value: number) => new Intl.NumberFormat('en-US').format(value);

  return (
    <AdminPageLayout
      currentPath={currentPath}
      router={router}
      t={t}
      title={t('admin.delivery.title')}
      backLabel={t('admin.delivery.backToAdmin')}
      onBack={() => router.push('/supersudo')}
    >
      <div className="space-y-6 pb-8">
          <Card className="admin-card overflow-hidden border-marco-border/70 bg-white/95 p-0 shadow-sm">
            <div className="border-b border-marco-border/70 bg-gradient-to-r from-white via-marco-gray/40 to-white px-6 py-5">
              <div className="mb-4 h-1 w-14 rounded-full bg-gradient-to-r from-marco-yellow to-marco-black/30" />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold text-marco-black">
                    {t('admin.delivery.deliveryPricesByLocation')}
                  </h3>
                  <p className="mt-1 text-sm text-marco-text/70">
                    Add destinations, adjust pricing, and keep the experience visually aligned with the rest of the admin pages.
                  </p>
                </div>
                <Button
                  variant="primary"
                  onClick={handleAddLocation}
                  disabled={saving}
                  className="inline-flex h-11 items-center rounded-xl bg-marco-yellow px-5 text-sm font-semibold text-marco-black transition-all hover:-translate-y-0.5 hover:brightness-95"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {t('admin.delivery.addLocation')}
                </Button>
              </div>
            </div>

            {locations.length === 0 ? (
              <div className="px-6 py-12">
                <div className="rounded-3xl border border-dashed border-marco-border bg-gradient-to-b from-white to-marco-gray/40 px-6 py-10 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-marco-yellow/20 text-marco-black">
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 17l4 4 4-4m-4-5v9M5 8h14l-1 9H6L5 8zm2-4h10l2 4H5l2-4z" />
                    </svg>
                  </div>
                  <h4 className="mt-5 text-lg font-semibold text-marco-black">
                    {t('admin.delivery.title')}
                  </h4>
                  <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-marco-text/70">
                    {t('admin.delivery.noLocations')}
                  </p>
                  <Button
                    variant="primary"
                    onClick={handleAddLocation}
                    disabled={saving}
                    className="mt-6 inline-flex h-11 items-center rounded-xl bg-marco-yellow px-5 text-sm font-semibold text-marco-black transition-all hover:-translate-y-0.5 hover:brightness-95"
                  >
                    {t('admin.delivery.addLocation')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 p-6">
                {locations.map((location, index) => (
                  <div
                    key={index}
                    className="group rounded-[24px] border border-marco-border/80 bg-gradient-to-br from-white to-marco-gray/35 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-marco-yellow/60 hover:shadow-[0_12px_28px_rgba(16,16,16,0.08)]"
                  >
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-marco-yellow/20 text-sm font-semibold text-marco-black">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-marco-black">
                            {location.city.trim() || location.country.trim() || `${t('admin.delivery.title')} ${index + 1}`}
                          </p>
                          <p className="text-xs uppercase tracking-[0.14em] text-marco-text/55">
                            {location.country.trim() || t('admin.delivery.country')}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-full border border-marco-yellow/40 bg-marco-yellow/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-marco-black">
                        {formatAmd(location.price || 0)} AMD
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-marco-text/80">
                          {t('admin.delivery.country')}
                        </label>
                        <input
                          type="text"
                          value={location.country}
                          onChange={(e) => handleUpdateLocation(index, 'country', e.target.value)}
                          className="admin-field border-marco-border/80 bg-white/95 shadow-sm focus:border-marco-yellow focus:shadow-[0_0_0_3px_rgba(247,206,63,0.18)]"
                          placeholder={t('admin.delivery.countryPlaceholder')}
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-marco-text/80">
                          {t('admin.delivery.city')}
                        </label>
                        <input
                          type="text"
                          value={location.city}
                          onChange={(e) => handleUpdateLocation(index, 'city', e.target.value)}
                          className="admin-field border-marco-border/80 bg-white/95 shadow-sm focus:border-marco-yellow focus:shadow-[0_0_0_3px_rgba(247,206,63,0.18)]"
                          placeholder={t('admin.delivery.cityPlaceholder')}
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-marco-text/80">
                          {t('admin.delivery.price')}
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={location.price}
                            onChange={(e) => handleUpdateLocation(index, 'price', parseFloat(e.target.value) || 0)}
                            className="admin-field flex-1 border-marco-border/80 bg-white/95 shadow-sm focus:border-marco-yellow focus:shadow-[0_0_0_3px_rgba(247,206,63,0.18)]"
                            placeholder={t('admin.delivery.pricePlaceholder')}
                            min="0"
                            step="100"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteLocation(index)}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-red-200 bg-red-50/80 text-red-600 transition-colors hover:border-red-300 hover:bg-red-100"
                            disabled={saving}
                            aria-label={t('admin.delivery.deleteLocation')}
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-marco-border/70 bg-gradient-to-r from-white via-marco-yellow/10 to-white px-6 py-5">
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="primary"
                  onClick={handleSave}
                  disabled={saving || locations.length === 0}
                  className="inline-flex h-11 min-w-[160px] flex-1 items-center justify-center rounded-xl bg-marco-yellow px-5 text-sm font-semibold text-marco-black transition-all hover:-translate-y-0.5 hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
                >
                  {saving ? t('admin.delivery.saving') : t('admin.delivery.saveSettings')}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => router.push('/supersudo')}
                  disabled={saving}
                  className="inline-flex h-11 min-w-[140px] flex-1 items-center justify-center rounded-xl border border-marco-border bg-white text-sm font-medium text-marco-text transition-colors hover:bg-marco-gray hover:text-marco-black sm:flex-none"
                >
                  {t('admin.delivery.cancel')}
                </Button>
              </div>
            </div>
          </Card>
      </div>
    </AdminPageLayout>
  );
}
