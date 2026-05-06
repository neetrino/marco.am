'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Button, Card } from '@shop/ui';
import { useAuth } from '../../../lib/auth/AuthContext';
import { apiClient, getApiOrErrorMessage } from '../../../lib/api-client';
import { useTranslation } from '../../../lib/i18n-client';
import { AdminPageLayout } from '../components/AdminPageLayout';
import type { BannerManagementStorage } from '../../../lib/schemas/banner-management.schema';
import {
  HOME_HERO_DEFAULT_BANNER_ITEMS,
  HOME_HERO_PRIMARY_BOTTOM_BANNER_ID,
  HOME_HERO_PRIMARY_BOTTOM_DEFAULT_IMAGE_URL,
  HOME_HERO_PRIMARY_TOP_BANNER_ID,
  HOME_HERO_PRIMARY_TOP_DEFAULT_IMAGE_URL,
  HOME_PROMO_PRIMARY_BANNER_ID,
  HOME_PROMO_PRIMARY_DEFAULT_IMAGE_URL,
  HOME_PROMO_PRIMARY_MOBILE_DEFAULT_IMAGE_URL,
  HOME_PROMO_SECONDARY_BANNER_ID,
  HOME_PROMO_SECONDARY_DEFAULT_IMAGE_URL,
  HOME_HERO_SECONDARY_BANNER_ID,
  HOME_HERO_SECONDARY_DEFAULT_IMAGE_URL,
} from '../../../lib/constants/home-hero-admin-banners';
import { HERO_MOBILE_PRIMARY_IMAGE_SRC } from '../../../components/hero.constants';

type HeroBannerFormState = {
  primaryTopDesktopUrl: string;
  primaryBottomDesktopUrl: string;
  secondaryDesktopUrl: string;
  promoPrimaryDesktopUrl: string;
  promoPrimaryMobileUrl: string;
  promoSecondaryDesktopUrl: string;
  mobileImageUrl: string;
};

type UploadingField = keyof HeroBannerFormState | null;

function normalizeOptionalUrl(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function buildHeroBannerStorage(
  storage: BannerManagementStorage | null,
): BannerManagementStorage {
  const baseStorage: BannerManagementStorage = storage ?? {
    version: 1,
    banners: [],
  };
  const heroDefaults = [...HOME_HERO_DEFAULT_BANNER_ITEMS];
  const nonHeroBanners = baseStorage.banners.filter(
    (banner) =>
      banner.id !== HOME_HERO_PRIMARY_TOP_BANNER_ID &&
      banner.id !== HOME_HERO_PRIMARY_BOTTOM_BANNER_ID &&
      banner.id !== HOME_HERO_SECONDARY_BANNER_ID &&
      banner.id !== HOME_PROMO_PRIMARY_BANNER_ID &&
      banner.id !== HOME_PROMO_SECONDARY_BANNER_ID,
  );

  const mergedHeroBanners = heroDefaults.map((defaultBanner) => {
    const existingBanner = baseStorage.banners.find(
      (banner) => banner.id === defaultBanner.id,
    );

    return existingBanner
      ? {
          ...defaultBanner,
          ...existingBanner,
          title: existingBanner.title ?? defaultBanner.title,
          link: existingBanner.link ?? defaultBanner.link,
          schedule: existingBanner.schedule ?? defaultBanner.schedule,
        }
      : defaultBanner;
  });

  return {
    version: baseStorage.version,
    banners: [...nonHeroBanners, ...mergedHeroBanners],
  };
}

function buildFormState(storage: BannerManagementStorage | null): HeroBannerFormState {
  const mergedStorage = buildHeroBannerStorage(storage);
  const primaryTop = mergedStorage.banners.find(
    (banner) => banner.id === HOME_HERO_PRIMARY_TOP_BANNER_ID,
  );
  const primaryBottom = mergedStorage.banners.find(
    (banner) => banner.id === HOME_HERO_PRIMARY_BOTTOM_BANNER_ID,
  );
  const secondary = mergedStorage.banners.find(
    (banner) => banner.id === HOME_HERO_SECONDARY_BANNER_ID,
  );
  const promoPrimary = mergedStorage.banners.find(
    (banner) => banner.id === HOME_PROMO_PRIMARY_BANNER_ID,
  );
  const promoSecondary = mergedStorage.banners.find(
    (banner) => banner.id === HOME_PROMO_SECONDARY_BANNER_ID,
  );

  return {
    primaryTopDesktopUrl:
      primaryTop?.imageDesktopUrl ?? HOME_HERO_PRIMARY_TOP_DEFAULT_IMAGE_URL,
    primaryBottomDesktopUrl:
      primaryBottom?.imageDesktopUrl ?? HOME_HERO_PRIMARY_BOTTOM_DEFAULT_IMAGE_URL,
    secondaryDesktopUrl:
      secondary?.imageDesktopUrl ?? HOME_HERO_SECONDARY_DEFAULT_IMAGE_URL,
    promoPrimaryDesktopUrl:
      promoPrimary?.imageDesktopUrl ?? HOME_PROMO_PRIMARY_DEFAULT_IMAGE_URL,
    promoPrimaryMobileUrl:
      promoPrimary?.imageMobileUrl ?? HOME_PROMO_PRIMARY_MOBILE_DEFAULT_IMAGE_URL,
    promoSecondaryDesktopUrl:
      promoSecondary?.imageDesktopUrl ?? HOME_PROMO_SECONDARY_DEFAULT_IMAGE_URL,
    mobileImageUrl: primaryTop?.imageMobileUrl ?? HERO_MOBILE_PRIMARY_IMAGE_SRC,
  };
}

function buildNextHeroBannerStorageFromForm(
  storage: BannerManagementStorage | null,
  form: HeroBannerFormState,
): BannerManagementStorage {
  const mergedStorage = buildHeroBannerStorage(storage);
  return {
    ...mergedStorage,
    banners: mergedStorage.banners.map((banner) => {
      if (banner.id === HOME_HERO_PRIMARY_TOP_BANNER_ID) {
        return {
          ...banner,
          imageDesktopUrl:
            normalizeOptionalUrl(form.primaryTopDesktopUrl) ??
            HOME_HERO_PRIMARY_TOP_DEFAULT_IMAGE_URL,
          imageMobileUrl:
            normalizeOptionalUrl(form.mobileImageUrl) ?? HERO_MOBILE_PRIMARY_IMAGE_SRC,
        };
      }

      if (banner.id === HOME_HERO_PRIMARY_BOTTOM_BANNER_ID) {
        return {
          ...banner,
          imageDesktopUrl:
            normalizeOptionalUrl(form.primaryBottomDesktopUrl) ??
            HOME_HERO_PRIMARY_BOTTOM_DEFAULT_IMAGE_URL,
        };
      }

      if (banner.id === HOME_HERO_SECONDARY_BANNER_ID) {
        return {
          ...banner,
          imageDesktopUrl:
            normalizeOptionalUrl(form.secondaryDesktopUrl) ??
            HOME_HERO_SECONDARY_DEFAULT_IMAGE_URL,
        };
      }

      if (banner.id === HOME_PROMO_PRIMARY_BANNER_ID) {
        return {
          ...banner,
          imageDesktopUrl:
            normalizeOptionalUrl(form.promoPrimaryDesktopUrl) ??
            HOME_PROMO_PRIMARY_DEFAULT_IMAGE_URL,
          imageMobileUrl:
            normalizeOptionalUrl(form.promoPrimaryMobileUrl) ??
            HOME_PROMO_PRIMARY_MOBILE_DEFAULT_IMAGE_URL,
        };
      }

      if (banner.id === HOME_PROMO_SECONDARY_BANNER_ID) {
        return {
          ...banner,
          imageDesktopUrl:
            normalizeOptionalUrl(form.promoSecondaryDesktopUrl) ??
            HOME_PROMO_SECONDARY_DEFAULT_IMAGE_URL,
        };
      }

      return banner;
    }),
  };
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function ImageLightbox({ url, label, onClose, onReplace }: { url: string; label: string; onClose: () => void; onReplace: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] max-w-[90vw] flex-col items-center gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-lg hover:bg-slate-100"
        >
          <svg className="h-4 w-4 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <img
          src={url}
          alt={label}
          className="max-h-[75vh] max-w-full rounded-2xl object-contain shadow-2xl"
        />

        <button
          onClick={() => { onClose(); onReplace(); }}
          className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-slate-800 shadow-lg hover:bg-slate-50"
        >
          <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Change image
        </button>
      </div>
    </div>
  );
}

type ImageUploadFieldProps = {
  label: string;
  fieldKey: keyof HeroBannerFormState;
  currentUrl: string;
  uploadingField: UploadingField;
  onUpload: (fieldKey: keyof HeroBannerFormState, file: File) => Promise<void>;
  onRemove?: (fieldKey: keyof HeroBannerFormState) => Promise<void>;
  removeLabel?: string;
  previewHeightClassName: string;
};

function ImageUploadField({
  label,
  fieldKey,
  currentUrl,
  uploadingField,
  onUpload,
  onRemove,
  removeLabel = 'Remove image',
  previewHeightClassName,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const isUploading = uploadingField === fieldKey;
  const isDisabled = uploadingField !== null;
  const hasImage = currentUrl.trim().length > 0;

  function openFilePicker() {
    inputRef.current?.click();
  }

  return (
    <>
      {lightboxOpen && hasImage && (
        <ImageLightbox
          url={currentUrl}
          label={label}
          onClose={() => setLightboxOpen(false)}
          onReplace={openFilePicker}
        />
      )}

      <div className="space-y-3">
        <label className="block text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">
          {label}
        </label>

        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3 space-y-3">
          {hasImage ? (
            <div className="group relative cursor-zoom-in" onClick={() => setLightboxOpen(true)}>
              <img
                src={currentUrl}
                alt={label}
                className={`${previewHeightClassName} w-full rounded-xl border border-slate-200 object-cover shadow-sm transition group-hover:brightness-90`}
              />
              <div className="absolute inset-0 flex items-center justify-center rounded-xl opacity-0 transition group-hover:opacity-100">
                <span className="flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white shadow">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0zm0 0l4 4" />
                  </svg>
                  View full size
                </span>
              </div>
            </div>
          ) : (
            <div
              className={`${previewHeightClassName} flex w-full cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white text-sm text-slate-400 hover:border-slate-400 hover:text-slate-500 transition`}
              onClick={openFilePicker}
            >
              Click to upload
            </div>
          )}

          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            disabled={isDisabled}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onUpload(fieldKey, file);
              e.target.value = '';
            }}
          />

          <button
            type="button"
            disabled={isDisabled}
            onClick={openFilePicker}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUploading ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
                Uploading…
              </>
            ) : (
              <>
                <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {hasImage ? 'Change image' : 'Upload image'}
              </>
            )}
          </button>
          {onRemove ? (
            <button
              type="button"
              disabled={isDisabled}
              onClick={() => {
                void onRemove(fieldKey);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 shadow-sm transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {removeLabel}
            </button>
          ) : null}
        </div>
      </div>
    </>
  );
}

export default function HeroBannerPage() {
  const { t } = useTranslation();
  const { isLoggedIn, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const currentPath = pathname || '/supersudo/hero-banner';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<UploadingField>(null);
  const [storage, setStorage] = useState<BannerManagementStorage | null>(null);
  const [form, setForm] = useState<HeroBannerFormState>({
    primaryTopDesktopUrl: HOME_HERO_PRIMARY_TOP_DEFAULT_IMAGE_URL,
    primaryBottomDesktopUrl: HOME_HERO_PRIMARY_BOTTOM_DEFAULT_IMAGE_URL,
    secondaryDesktopUrl: HOME_HERO_SECONDARY_DEFAULT_IMAGE_URL,
    promoPrimaryDesktopUrl: HOME_PROMO_PRIMARY_DEFAULT_IMAGE_URL,
    promoPrimaryMobileUrl: HOME_PROMO_PRIMARY_MOBILE_DEFAULT_IMAGE_URL,
    promoSecondaryDesktopUrl: HOME_PROMO_SECONDARY_DEFAULT_IMAGE_URL,
    mobileImageUrl: HERO_MOBILE_PRIMARY_IMAGE_SRC,
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
      const data = await apiClient.get<BannerManagementStorage>('/api/v1/supersudo/banners');
      setStorage(buildHeroBannerStorage(data));
      setForm(buildFormState(data));
    } catch (error: unknown) {
      alert(
        t('admin.heroBanner.errorLoading').replace(
          '{message}',
          getApiOrErrorMessage(error, 'Failed to load hero banner'),
        ),
      );
      setStorage(buildHeroBannerStorage(null));
      setForm(buildFormState(null));
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(fieldKey: keyof HeroBannerFormState, file: File) {
    try {
      setUploadingField(fieldKey);
      const dataUrl = await fileToDataUrl(file);
      const result = await apiClient.post<{ url: string }>(
        '/api/v1/supersudo/banners/upload-image',
        { image: dataUrl },
      );
      const nextForm: HeroBannerFormState = { ...form, [fieldKey]: result.url };
      const nextStorage = buildNextHeroBannerStorageFromForm(storage, nextForm);
      const saved = await apiClient.put<BannerManagementStorage>(
        '/api/v1/supersudo/banners',
        nextStorage,
      );
      setStorage(buildHeroBannerStorage(saved));
      setForm(buildFormState(saved));
      alert(t('admin.heroBanner.savedAfterUpload'));
    } catch (error: unknown) {
      alert(
        `${t('admin.heroBanner.uploadOrSaveFailed')}: ${getApiOrErrorMessage(error, 'Unknown error')}`,
      );
    } finally {
      setUploadingField(null);
    }
  }

  async function handleSave() {
    const nextStorage = buildNextHeroBannerStorageFromForm(storage, form);

    try {
      setSaving(true);
      const saved = await apiClient.put<BannerManagementStorage>(
        '/api/v1/supersudo/banners',
        nextStorage,
      );
      setStorage(buildHeroBannerStorage(saved));
      setForm(buildFormState(saved));
      alert(t('admin.heroBanner.savedSuccess'));
    } catch (error: unknown) {
      alert(
        t('admin.heroBanner.errorSaving').replace(
          '{message}',
          getApiOrErrorMessage(error, 'Failed to save hero banner'),
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(fieldKey: keyof HeroBannerFormState) {
    try {
      setUploadingField(fieldKey);
      const nextForm: HeroBannerFormState = { ...form, [fieldKey]: '' };
      const nextStorage = buildNextHeroBannerStorageFromForm(storage, nextForm);
      const saved = await apiClient.put<BannerManagementStorage>(
        '/api/v1/supersudo/banners',
        nextStorage,
      );
      setStorage(buildHeroBannerStorage(saved));
      setForm(buildFormState(saved));
      alert(t('admin.heroBanner.savedSuccess'));
    } catch (error: unknown) {
      alert(
        `${t('admin.heroBanner.uploadOrSaveFailed')}: ${getApiOrErrorMessage(error, 'Unknown error')}`,
      );
    } finally {
      setUploadingField(null);
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
        <Card className="admin-card border border-slate-100 bg-white/95 shadow-sm">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <ImageUploadField
              label="Desktop card 1"
              fieldKey="primaryTopDesktopUrl"
              currentUrl={form.primaryTopDesktopUrl}
              uploadingField={uploadingField}
              onUpload={handleUpload}
              previewHeightClassName="h-48"
            />
            <ImageUploadField
              label="Desktop card 2"
              fieldKey="primaryBottomDesktopUrl"
              currentUrl={form.primaryBottomDesktopUrl}
              uploadingField={uploadingField}
              onUpload={handleUpload}
              previewHeightClassName="h-48"
            />
            <ImageUploadField
              label="Desktop card 3"
              fieldKey="secondaryDesktopUrl"
              currentUrl={form.secondaryDesktopUrl}
              uploadingField={uploadingField}
              onUpload={handleUpload}
              previewHeightClassName="h-[25rem]"
            />
            <ImageUploadField
              label="Mobile hero image"
              fieldKey="mobileImageUrl"
              currentUrl={form.mobileImageUrl}
              uploadingField={uploadingField}
              onUpload={handleUpload}
              previewHeightClassName="h-56 sm:h-72"
            />
            <ImageUploadField
              label="Promo card left (under featured products)"
              fieldKey="promoPrimaryDesktopUrl"
              currentUrl={form.promoPrimaryDesktopUrl}
              uploadingField={uploadingField}
              onUpload={handleUpload}
              previewHeightClassName="h-48"
            />
            <ImageUploadField
              label="Mobile floor banner image"
              fieldKey="promoPrimaryMobileUrl"
              currentUrl={form.promoPrimaryMobileUrl}
              uploadingField={uploadingField}
              onUpload={handleUpload}
              onRemove={handleRemove}
              removeLabel="Remove mobile floor image"
              previewHeightClassName="h-56 sm:h-72"
            />
            <ImageUploadField
              label="Promo card right (under featured products)"
              fieldKey="promoSecondaryDesktopUrl"
              currentUrl={form.promoSecondaryDesktopUrl}
              uploadingField={uploadingField}
              onUpload={handleUpload}
              previewHeightClassName="h-48"
            />
          </div>
        </Card>

        <div className="sticky bottom-4 z-10 rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-lg backdrop-blur">
          <div className="flex flex-wrap justify-end gap-3">
            <Button variant="ghost" onClick={() => router.push('/supersudo')} disabled={saving || uploadingField !== null}>
              {t('admin.heroBanner.cancel')}
            </Button>
            <Button variant="primary" onClick={handleSave} disabled={saving || uploadingField !== null}>
              {saving ? t('admin.heroBanner.saving') : t('admin.heroBanner.save')}
            </Button>
          </div>
        </div>
      </div>
    </AdminPageLayout>
  );
}
