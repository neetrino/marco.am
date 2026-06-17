'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Button, Card } from '@shop/ui';
import { apiClient, getApiOrErrorMessage } from '../../../lib/api-client';
import { useTranslation } from '../../../lib/i18n-client';
import { AdminPageLayout } from '../components/AdminPageLayout';
import type { BannerManagementStorage } from '../../../lib/schemas/banner-management.schema';
import { ADMIN_CACHE_KEYS } from '@/lib/admin/admin-cache-keys';
import { beginAdminDataFetch } from '@/lib/admin/admin-fetch-helpers';
import { dedupedAdminRequest } from '@/lib/admin/admin-request-dedup';
import {
  ADMIN_SESSION_CACHE_TTL_MS,
  readAdminSessionCache,
  writeAdminSessionCache,
} from '@/lib/admin/admin-session-cache';
import { ADMIN_IMAGE_ACCEPT } from '@/lib/constants/admin-image-upload';
import { processAdminImageFile } from '@/lib/utils/process-admin-image-file';
import {
  HOME_APP_DOWNLOAD_BANNER_ID,
  HOME_APP_DOWNLOAD_DEFAULT_IMAGE_URL,
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
import { HOME_BANNERS_TWO_COL_GRID_CLASS } from '../../../components/home/home-secondary-banner.constants';

type HeroBannerPlatformTab = 'desktop' | 'mobile';

/** Matches `HeroCarousel` outer box — `aspect-[141/68]`. */
const HERO_DESKTOP_LAYOUT_ASPECT_CLASS = 'aspect-[141/68]';
/** Matches mobile hero — Figma 399×288. */
const HERO_MOBILE_PREVIEW_CLASS = 'aspect-[399/288] w-full';
/** Matches `HomeGradientBanner` — `56 / 34`. */
const PROMO_DESKTOP_LEFT_PREVIEW_CLASS = 'aspect-[56/34] w-full';
const PROMO_STRIP_GRID_CLASS = `grid w-full grid-cols-1 ${HOME_BANNERS_TWO_COL_GRID_CLASS} items-stretch gap-4`;
/** Figma radii — both promo tiles use 16px on desktop (`HomeGradientBanner`, `HomeSecondaryBanner`). */
const PROMO_TILE_RADIUS_CLASS = 'rounded-2xl';
/** Matches `HomeMobileBannerProductShowcase` — Figma 522×372. */
const MOBILE_FLOOR_PREVIEW_CLASS = 'aspect-[522/372] w-full';

/** Matches `HomeAppBanner` raster — 2306×861. */
const APP_DOWNLOAD_PREVIEW_CLASS = 'aspect-[2306/861] w-full';

type HeroBannerFormState = {
  primaryTopDesktopUrl: string;
  primaryBottomDesktopUrl: string;
  secondaryDesktopUrl: string;
  appDownloadDesktopUrl: string;
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
      banner.id !== HOME_PROMO_SECONDARY_BANNER_ID &&
      banner.id !== HOME_APP_DOWNLOAD_BANNER_ID,
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
  const appDownload = mergedStorage.banners.find(
    (banner) => banner.id === HOME_APP_DOWNLOAD_BANNER_ID,
  );

  return {
    primaryTopDesktopUrl:
      primaryTop?.imageDesktopUrl ?? HOME_HERO_PRIMARY_TOP_DEFAULT_IMAGE_URL,
    primaryBottomDesktopUrl:
      primaryBottom?.imageDesktopUrl ?? HOME_HERO_PRIMARY_BOTTOM_DEFAULT_IMAGE_URL,
    secondaryDesktopUrl:
      secondary?.imageDesktopUrl ?? HOME_HERO_SECONDARY_DEFAULT_IMAGE_URL,
    appDownloadDesktopUrl:
      appDownload?.imageDesktopUrl ?? HOME_APP_DOWNLOAD_DEFAULT_IMAGE_URL,
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

      if (banner.id === HOME_APP_DOWNLOAD_BANNER_ID) {
        return {
          ...banner,
          imageDesktopUrl:
            normalizeOptionalUrl(form.appDownloadDesktopUrl) ??
            HOME_APP_DOWNLOAD_DEFAULT_IMAGE_URL,
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


function ImageLightbox({ url, label, onClose, onReplace }: { url: string; label: string; onClose: () => void; onReplace: () => void }) {
  const { t } = useTranslation();

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
          {t('admin.heroBanner.changeImage')}
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
  previewClassName: string;
  previewRadiusClassName?: string;
  /** Fills grid cell edge-to-edge like the storefront hero tiles. */
  fillCell?: boolean;
};

function heroBannerTabClass(isActive: boolean): string {
  return isActive
    ? 'border-amber-500 bg-amber-50 text-amber-950 shadow-sm ring-1 ring-amber-200/80'
    : 'border-slate-200 bg-white text-slate-600 hover:border-amber-200 hover:bg-amber-50/60 hover:text-slate-900';
}

function HeroBannerSectionHeader({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="mb-4 space-y-1">
      <h2 className="text-base font-semibold text-slate-900">{title}</h2>
      {hint ? <p className="text-sm text-slate-500">{hint}</p> : null}
    </div>
  );
}

function HeroBannerPlatformTabs({
  activeTab,
  onTabChange,
}: {
  activeTab: HeroBannerPlatformTab;
  onTabChange: (tab: HeroBannerPlatformTab) => void;
}) {
  const { t } = useTranslation();

  return (
    <div
      className="flex flex-wrap gap-2"
      role="tablist"
      aria-label={t('admin.heroBanner.viewTabsLabel')}
    >
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'desktop'}
        id="admin-hero-banner-tab-desktop"
        aria-controls="admin-hero-banner-panel-desktop"
        className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${heroBannerTabClass(activeTab === 'desktop')}`}
        onClick={() => onTabChange('desktop')}
      >
        <svg className="h-4 w-4 shrink-0 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        {t('admin.heroBanner.tabDesktop')}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'mobile'}
        id="admin-hero-banner-tab-mobile"
        aria-controls="admin-hero-banner-panel-mobile"
        className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${heroBannerTabClass(activeTab === 'mobile')}`}
        onClick={() => onTabChange('mobile')}
      >
        <svg className="h-4 w-4 shrink-0 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        {t('admin.heroBanner.tabMobile')}
      </button>
    </div>
  );
}

function HeroBannerPromoStripRow({
  form,
  uploadingField,
  onUpload,
  t,
}: {
  form: HeroBannerFormState;
  uploadingField: UploadingField;
  onUpload: (fieldKey: keyof HeroBannerFormState, file: File) => Promise<void>;
  t: (key: string) => string;
}) {
  return (
    <div className={PROMO_STRIP_GRID_CLASS}>
      <div className="min-w-0">
        <ImageUploadField
          label={t('admin.heroBanner.promoCardLeft')}
          fieldKey="promoPrimaryDesktopUrl"
          currentUrl={form.promoPrimaryDesktopUrl}
          uploadingField={uploadingField}
          onUpload={onUpload}
          previewClassName={PROMO_DESKTOP_LEFT_PREVIEW_CLASS}
          previewRadiusClassName={PROMO_TILE_RADIUS_CLASS}
        />
      </div>
      <div className="relative min-h-0 min-w-0 max-md:aspect-[820/328] md:h-full">
        <ImageUploadField
          label={t('admin.heroBanner.promoCardRight')}
          fieldKey="promoSecondaryDesktopUrl"
          currentUrl={form.promoSecondaryDesktopUrl}
          uploadingField={uploadingField}
          onUpload={onUpload}
          previewClassName="h-full w-full"
          previewRadiusClassName={PROMO_TILE_RADIUS_CLASS}
          fillCell
        />
      </div>
    </div>
  );
}

function ImageUploadField({
  label,
  fieldKey,
  currentUrl,
  uploadingField,
  onUpload,
  onRemove,
  removeLabel,
  previewClassName,
  previewRadiusClassName = 'rounded-[30px]',
  fillCell = false,
}: ImageUploadFieldProps) {
  const { t } = useTranslation();
  const resolvedRemoveLabel = removeLabel ?? t('admin.heroBanner.removeImage');
  const inputRef = useRef<HTMLInputElement>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const isUploading = uploadingField === fieldKey;
  const isDisabled = uploadingField !== null;
  const hasImage = currentUrl.trim().length > 0;

  function openFilePicker() {
    inputRef.current?.click();
  }

  const frameClassName = fillCell
    ? `relative h-full min-h-0 w-full overflow-hidden ${previewRadiusClassName}`
    : `group relative w-full overflow-hidden ${previewRadiusClassName} ${previewClassName}`;

  const imageClassName = fillCell
    ? `absolute inset-0 h-full w-full object-cover transition duration-200 group-hover:scale-[1.02] group-hover:brightness-[0.92] ${previewRadiusClassName}`
    : `w-full object-cover transition duration-200 group-hover:scale-[1.01] group-hover:brightness-[0.92] ${previewClassName} ${previewRadiusClassName}`;

  const overlayClassName = `absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-black/45 px-4 opacity-0 backdrop-blur-[2px] transition duration-200 group-hover:opacity-100 group-focus-within:opacity-100 ${previewRadiusClassName} ${isUploading ? 'opacity-100' : ''}`;

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

      <div className={`group ${fillCell ? 'h-full min-h-0' : 'w-full'}`} aria-label={label}>
        <div className={frameClassName}>
          {hasImage ? (
            <>
              <img src={currentUrl} alt={label} className={imageClassName} />
              <div className={overlayClassName} aria-hidden={!isUploading}>
                {isUploading ? (
                  <div className="flex flex-col items-center gap-2 text-white">
                    <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-amber-400" />
                    <span className="text-sm font-medium">{t('admin.heroBanner.uploading')}</span>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={isDisabled}
                      onClick={(event) => {
                        event.stopPropagation();
                        openFilePicker();
                      }}
                      className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-5 py-2.5 text-sm font-bold text-slate-900 shadow-lg shadow-amber-500/30 transition hover:bg-amber-300 hover:shadow-amber-400/40 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      {t('admin.heroBanner.changeImage')}
                    </button>
                    <button
                      type="button"
                      disabled={isDisabled}
                      onClick={(event) => {
                        event.stopPropagation();
                        setLightboxOpen(true);
                      }}
                      className="text-xs font-medium text-white/90 underline-offset-2 transition hover:text-white hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {t('admin.heroBanner.viewFullSize')}
                    </button>
                    {onRemove ? (
                      <button
                        type="button"
                        disabled={isDisabled}
                        onClick={(event) => {
                          event.stopPropagation();
                          void onRemove(fieldKey);
                        }}
                        className="text-xs font-medium text-red-200 transition hover:text-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {resolvedRemoveLabel}
                      </button>
                    ) : null}
                  </>
                )}
              </div>
            </>
          ) : (
            <button
              type="button"
              disabled={isDisabled}
              onClick={openFilePicker}
              className={`flex w-full cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-slate-300/80 bg-slate-100/60 text-slate-500 transition hover:border-amber-300 hover:bg-amber-50/50 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 ${fillCell ? `absolute inset-0 h-full ${previewRadiusClassName}` : `${previewClassName} ${previewRadiusClassName} min-h-[120px]`}`}
            >
              {isUploading ? (
                <>
                  <span className="inline-block h-7 w-7 animate-spin rounded-full border-2 border-slate-300 border-t-amber-500" />
                  <span className="text-sm font-medium">{t('admin.heroBanner.uploading')}</span>
                </>
              ) : (
                <>
                  <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span className="text-sm font-medium">{t('admin.heroBanner.clickToUpload')}</span>
                </>
              )}
            </button>
          )}

          <input
            ref={inputRef}
            type="file"
            accept={ADMIN_IMAGE_ACCEPT}
            className="hidden"
            disabled={isDisabled}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onUpload(fieldKey, file);
              e.target.value = '';
            }}
          />
        </div>
      </div>
    </>
  );
}

export default function HeroBannerPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const currentPath = pathname || '/supersudo/hero-banner';

  const cachedBanners = readAdminSessionCache<BannerManagementStorage>(
    ADMIN_CACHE_KEYS.banners,
    ADMIN_SESSION_CACHE_TTL_MS,
  );
  const hadCacheRef = useRef(cachedBanners !== null);
  const [loading, setLoading] = useState(cachedBanners === null);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<UploadingField>(null);
  const [storage, setStorage] = useState<BannerManagementStorage | null>(
    buildHeroBannerStorage(cachedBanners),
  );
  const [form, setForm] = useState<HeroBannerFormState>(() => buildFormState(cachedBanners));
  const [activeTab, setActiveTab] = useState<HeroBannerPlatformTab>('desktop');

  useEffect(() => {
    void fetchHeroBanner();
  }, []);

  async function fetchHeroBanner(options?: { force?: boolean }) {
    const cached = readAdminSessionCache<BannerManagementStorage>(
      ADMIN_CACHE_KEYS.banners,
      ADMIN_SESSION_CACHE_TTL_MS,
    );
    if (!options?.force && cached !== null) {
      setStorage(buildHeroBannerStorage(cached));
      setForm(buildFormState(cached));
      setLoading(false);
      hadCacheRef.current = true;
      return;
    }

    try {
      beginAdminDataFetch(hadCacheRef.current, setLoading);
      const data = await dedupedAdminRequest(ADMIN_CACHE_KEYS.banners, () =>
        apiClient.get<BannerManagementStorage>('/api/v1/supersudo/banners'),
      );
      setStorage(buildHeroBannerStorage(data));
      setForm(buildFormState(data));
      writeAdminSessionCache(ADMIN_CACHE_KEYS.banners, data);
      hadCacheRef.current = true;
    } catch (error: unknown) {
      if (!hadCacheRef.current) {
        alert(
          t('admin.heroBanner.errorLoading').replace(
            '{message}',
            getApiOrErrorMessage(error, 'Failed to load hero banner'),
          ),
        );
        setStorage(buildHeroBannerStorage(null));
        setForm(buildFormState(null));
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(fieldKey: keyof HeroBannerFormState, file: File) {
    try {
      setUploadingField(fieldKey);
      const dataUrl = await processAdminImageFile(file, 'banner');
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('admin.common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <AdminPageLayout
      currentPath={currentPath}
      router={router}
      t={t}
      title={t('admin.heroBanner.title')}
      subtitle={t('admin.heroBanner.subtitle')}
    >
      <div className="space-y-5">
        <HeroBannerPlatformTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === 'desktop' ? (
          <div
            id="admin-hero-banner-panel-desktop"
            role="tabpanel"
            aria-labelledby="admin-hero-banner-tab-desktop"
            className="space-y-5"
          >
            <Card className="admin-card border border-slate-100 bg-white/95 p-4 shadow-sm sm:p-6">
              <HeroBannerSectionHeader title={t('admin.heroBanner.sectionHeroCarousel')} />
              <div className={`w-full min-w-0 ${HERO_DESKTOP_LAYOUT_ASPECT_CLASS}`}>
                <div className="grid h-full min-h-0 grid-cols-[minmax(0,1.24fr)_minmax(0,0.96fr)] gap-3 lg:gap-4">
                  <div className="grid min-h-0 grid-rows-2 gap-3 lg:gap-4">
                    <ImageUploadField
                      label={t('admin.heroBanner.desktopCard1')}
                      fieldKey="primaryTopDesktopUrl"
                      currentUrl={form.primaryTopDesktopUrl}
                      uploadingField={uploadingField}
                      onUpload={handleUpload}
                      previewClassName="h-full w-full"
                      previewRadiusClassName="rounded-[30px]"
                      fillCell
                    />
                    <ImageUploadField
                      label={t('admin.heroBanner.desktopCard2')}
                      fieldKey="primaryBottomDesktopUrl"
                      currentUrl={form.primaryBottomDesktopUrl}
                      uploadingField={uploadingField}
                      onUpload={handleUpload}
                      previewClassName="h-full w-full"
                      previewRadiusClassName="rounded-[30px]"
                      fillCell
                    />
                  </div>
                  <ImageUploadField
                    label={t('admin.heroBanner.desktopCard3')}
                    fieldKey="secondaryDesktopUrl"
                    currentUrl={form.secondaryDesktopUrl}
                    uploadingField={uploadingField}
                    onUpload={handleUpload}
                    previewClassName="h-full w-full"
                    previewRadiusClassName="rounded-[30px]"
                    fillCell
                  />
                </div>
              </div>
            </Card>

            <Card className="admin-card border border-slate-100 bg-white/95 p-4 shadow-sm sm:p-6">
              <HeroBannerSectionHeader title={t('admin.heroBanner.sectionAppDownload')} />
              <ImageUploadField
                label={t('admin.heroBanner.appDownloadBanner')}
                fieldKey="appDownloadDesktopUrl"
                currentUrl={form.appDownloadDesktopUrl}
                uploadingField={uploadingField}
                onUpload={handleUpload}
                previewClassName={APP_DOWNLOAD_PREVIEW_CLASS}
                previewRadiusClassName="rounded-[32px]"
              />
              <div className="mt-4 border-t border-slate-100 pt-4">
                <HeroBannerSectionHeader title={t('admin.heroBanner.sectionPromoStrip')} />
                <HeroBannerPromoStripRow
                  form={form}
                  uploadingField={uploadingField}
                  onUpload={handleUpload}
                  t={t}
                />
              </div>
            </Card>
          </div>
        ) : (
          <div
            id="admin-hero-banner-panel-mobile"
            role="tabpanel"
            aria-labelledby="admin-hero-banner-tab-mobile"
            className="mx-auto w-full max-w-md space-y-5"
          >
            <Card className="admin-card border border-slate-100 bg-white/95 p-4 shadow-sm sm:p-6">
              <HeroBannerSectionHeader
                title={t('admin.heroBanner.sectionMobileHero')}
                hint={t('admin.heroBanner.sectionMobileHeroHint')}
              />
              <ImageUploadField
                label={t('admin.heroBanner.mobileHeroImage')}
                fieldKey="mobileImageUrl"
                currentUrl={form.mobileImageUrl}
                uploadingField={uploadingField}
                onUpload={handleUpload}
                previewClassName={HERO_MOBILE_PREVIEW_CLASS}
                previewRadiusClassName="rounded-[24px]"
              />
            </Card>

            <Card className="admin-card border border-slate-100 bg-white/95 p-4 shadow-sm sm:p-6">
              <HeroBannerSectionHeader
                title={t('admin.heroBanner.sectionMobileFloor')}
                hint={t('admin.heroBanner.sectionMobileFloorHint')}
              />
              <ImageUploadField
                label={t('admin.heroBanner.mobileFloorBannerImage')}
                fieldKey="promoPrimaryMobileUrl"
                currentUrl={form.promoPrimaryMobileUrl}
                uploadingField={uploadingField}
                onUpload={handleUpload}
                onRemove={handleRemove}
                removeLabel={t('admin.heroBanner.removeMobileFloorImage')}
                previewClassName={MOBILE_FLOOR_PREVIEW_CLASS}
                previewRadiusClassName="rounded-[20px]"
              />
            </Card>
          </div>
        )}

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
