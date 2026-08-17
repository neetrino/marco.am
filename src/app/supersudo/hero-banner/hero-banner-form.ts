import { HERO_MOBILE_PRIMARY_IMAGE_SRC } from '../../../components/hero.constants';
import type { BannerManagementStorage } from '../../../lib/schemas/banner-management.schema';
import {
  HOME_APP_DOWNLOAD_BANNER_ID,
  HOME_APP_DOWNLOAD_DEFAULT_IMAGE_URL,
  HOME_HERO_DEFAULT_BANNER_ITEMS,
  HOME_HERO_PRIMARY_BOTTOM_BANNER_ID,
  HOME_HERO_PRIMARY_BOTTOM_DEFAULT_IMAGE_URL,
  HOME_HERO_PRIMARY_TOP_BANNER_ID,
  HOME_HERO_PRIMARY_TOP_DEFAULT_IMAGE_URL,
  HOME_HERO_SECONDARY_BANNER_ID,
  HOME_HERO_SECONDARY_DEFAULT_IMAGE_URL,
  HOME_PROMO_PRIMARY_BANNER_ID,
  HOME_PROMO_PRIMARY_DEFAULT_IMAGE_URL,
  HOME_PROMO_PRIMARY_MOBILE_DEFAULT_IMAGE_URL,
  HOME_PROMO_SECONDARY_BANNER_ID,
  HOME_PROMO_SECONDARY_DEFAULT_IMAGE_URL,
} from '../../../lib/constants/home-hero-admin-banners';
import {
  buildHomeHeroMobileSlideId,
  HOME_HERO_MOBILE_SLIDES_MAX,
} from '../../../lib/constants/home-hero-mobile-slides';
import { resolveHeroMobileImageUrl } from '../../../lib/utils/resolve-hero-mobile-image-url';

export type HeroBannerFormState = {
  primaryTopDesktopUrl: string;
  primaryBottomDesktopUrl: string;
  secondaryDesktopUrl: string;
  appDownloadDesktopUrl: string;
  promoPrimaryDesktopUrl: string;
  promoPrimaryMobileUrl: string;
  promoSecondaryDesktopUrl: string;
  /** Ordered mobile hero carousel slides. */
  mobileSlideUrls: string[];
};

export type HeroBannerUploadingField =
  | keyof HeroBannerFormState
  | `mobileSlide:${number}`
  | null;

const HERO_MANAGED_BANNER_IDS = new Set([
  HOME_HERO_PRIMARY_TOP_BANNER_ID,
  HOME_HERO_PRIMARY_BOTTOM_BANNER_ID,
  HOME_HERO_SECONDARY_BANNER_ID,
  HOME_PROMO_PRIMARY_BANNER_ID,
  HOME_PROMO_SECONDARY_BANNER_ID,
  HOME_APP_DOWNLOAD_BANNER_ID,
]);

function normalizeOptionalUrl(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function isHomeHeroMobileBanner(
  banner: BannerManagementStorage['banners'][number],
): boolean {
  return (
    banner.slot === 'home.hero.mobile' ||
    banner.id.startsWith('home-hero-mobile-slide-')
  );
}

function readMobileSlideUrls(storage: BannerManagementStorage): string[] {
  const fromSlot = storage.banners
    .filter((banner) => banner.slot === 'home.hero.mobile')
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id))
    .map((banner) => banner.imageMobileUrl ?? banner.imageDesktopUrl)
    .filter((url): url is string => typeof url === 'string' && url.trim().length > 0)
    .map((url) => resolveHeroMobileImageUrl(url));

  if (fromSlot.length > 0) {
    return fromSlot.slice(0, HOME_HERO_MOBILE_SLIDES_MAX);
  }

  const primaryTop = storage.banners.find(
    (banner) => banner.id === HOME_HERO_PRIMARY_TOP_BANNER_ID,
  );
  return [resolveHeroMobileImageUrl(primaryTop?.imageMobileUrl ?? HERO_MOBILE_PRIMARY_IMAGE_SRC)];
}

export function buildHeroBannerStorage(
  storage: BannerManagementStorage | null,
): BannerManagementStorage {
  const baseStorage: BannerManagementStorage = storage ?? {
    version: 1,
    banners: [],
  };
  const heroDefaults = [...HOME_HERO_DEFAULT_BANNER_ITEMS];
  const nonHeroBanners = baseStorage.banners.filter(
    (banner) =>
      !HERO_MANAGED_BANNER_IDS.has(banner.id) && !isHomeHeroMobileBanner(banner),
  );
  const mobileBanners = baseStorage.banners.filter(isHomeHeroMobileBanner);

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
    banners: [...nonHeroBanners, ...mergedHeroBanners, ...mobileBanners],
  };
}

export function buildFormState(storage: BannerManagementStorage | null): HeroBannerFormState {
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
    mobileSlideUrls: readMobileSlideUrls(mergedStorage),
  };
}

function buildMobileSlotBanners(
  urls: string[],
): BannerManagementStorage['banners'] {
  return urls
    .map((url) => url.trim())
    .filter((url) => url.length > 0)
    .slice(0, HOME_HERO_MOBILE_SLIDES_MAX)
    .map((url, index) => ({
      id: buildHomeHeroMobileSlideId(index),
      slot: 'home.hero.mobile' as const,
      title: {
        hy: `Mobile hero slide ${index + 1}`,
        ru: `Mobile hero slide ${index + 1}`,
        en: `Mobile hero slide ${index + 1}`,
      },
      imageDesktopUrl: null,
      imageMobileUrl: resolveHeroMobileImageUrl(url),
      link: {
        href: '/products',
        openInNewTab: false,
      },
      schedule: {
        startsAt: null,
        endsAt: null,
      },
      active: true,
      sortOrder: index,
    }));
}

export function buildNextHeroBannerStorageFromForm(
  storage: BannerManagementStorage | null,
  form: HeroBannerFormState,
): BannerManagementStorage {
  const mergedStorage = buildHeroBannerStorage(storage);
  const mobileSlideUrls =
    form.mobileSlideUrls.length > 0
      ? form.mobileSlideUrls
      : [HERO_MOBILE_PRIMARY_IMAGE_SRC];
  const firstMobileUrl = resolveHeroMobileImageUrl(
    mobileSlideUrls[0] ?? HERO_MOBILE_PRIMARY_IMAGE_SRC,
  );

  const withoutMobile = mergedStorage.banners.filter(
    (banner) => !isHomeHeroMobileBanner(banner),
  );

  const updatedCore = withoutMobile.map((banner) => {
    if (banner.id === HOME_HERO_PRIMARY_TOP_BANNER_ID) {
      return {
        ...banner,
        imageDesktopUrl:
          normalizeOptionalUrl(form.primaryTopDesktopUrl) ??
          HOME_HERO_PRIMARY_TOP_DEFAULT_IMAGE_URL,
        // Keep legacy field in sync with the first mobile slide.
        imageMobileUrl: firstMobileUrl,
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
  });

  return {
    ...mergedStorage,
    banners: [...updatedCore, ...buildMobileSlotBanners(mobileSlideUrls)],
  };
}
