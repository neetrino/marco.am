import { db } from "@white-shop/db";

import {
  BANNER_MANAGEMENT_SETTINGS_KEY,
  type BannerSlotId,
} from "@/lib/constants/banner-management";
import {
  bannerManagementStorageSchema,
  type BannerManagementStorage,
} from "@/lib/schemas/banner-management.schema";
import { resolveApiLocale, type ApiLocale } from "@/lib/i18n/api-locale";
import {
  getCachedJson,
  invalidateBannersPublicCache,
} from "@/lib/services/read-through-json-cache";
import { logger } from "@/lib/utils/logger";

const BANNER_PUBLIC_CACHE_TTL_SEC = 90;

export type PublicBannerItem = {
  id: string;
  slot: BannerSlotId;
  title: string;
  imageDesktopUrl: string | null;
  imageMobileUrl: string | null;
  link: {
    href: string;
    openInNewTab: boolean;
  };
  sortOrder: number;
};

export type PublicBannersPayload = {
  slot: BannerSlotId;
  generatedAt: string;
  items: PublicBannerItem[];
};

const DEFAULT_BANNER_STORAGE: BannerManagementStorage = {
  version: 1,
  banners: [],
};

function normalizeLocale(
  localeRaw: string | undefined,
  acceptLanguageRaw: string | null | undefined,
): ApiLocale {
  return resolveApiLocale({
    localeRaw,
    acceptLanguageRaw,
    fallbackLocale: "hy",
  }).resolvedLocale;
}

function parseStored(raw: unknown): BannerManagementStorage | null {
  const parsed = bannerManagementStorageSchema.safeParse(raw);
  if (!parsed.success) {
    logger.warn("[bannerManagement] Invalid stored payload", parsed.error.flatten());
    return null;
  }
  return parsed.data;
}

async function loadStorage(): Promise<BannerManagementStorage> {
  const row = await db.settings.findUnique({
    where: { key: BANNER_MANAGEMENT_SETTINGS_KEY },
  });
  if (!row) {
    return DEFAULT_BANNER_STORAGE;
  }

  const valid = parseStored(row.value);
  return valid ?? DEFAULT_BANNER_STORAGE;
}

function isScheduledNow(
  startsAt: string | null,
  endsAt: string | null,
  nowMs: number,
): boolean {
  if (startsAt !== null) {
    const startsMs = Date.parse(startsAt);
    if (!Number.isFinite(startsMs) || startsMs > nowMs) {
      return false;
    }
  }

  if (endsAt !== null) {
    const endsMs = Date.parse(endsAt);
    if (!Number.isFinite(endsMs) || endsMs <= nowMs) {
      return false;
    }
  }

  return true;
}

function buildPublicSlotPayload(
  storage: BannerManagementStorage,
  slot: BannerSlotId,
  locale: ApiLocale,
  now: Date,
): PublicBannersPayload {
  const nowMs = now.getTime();
  const items = storage.banners
    .filter((banner) => banner.slot === slot)
    .filter((banner) => banner.active)
    .filter((banner) =>
      isScheduledNow(banner.schedule.startsAt, banner.schedule.endsAt, nowMs),
    )
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id))
    .map((banner) => ({
      id: banner.id,
      slot: banner.slot,
      title: banner.title[locale],
      imageDesktopUrl: banner.imageDesktopUrl,
      imageMobileUrl: banner.imageMobileUrl,
      link: {
        href: banner.link.href,
        openInNewTab: banner.link.openInNewTab,
      },
      sortOrder: banner.sortOrder,
    }));

  return {
    slot,
    generatedAt: now.toISOString(),
    items,
  };
}

export type HomeHeroSlotsPayload = {
  primary: PublicBannersPayload;
  secondary: PublicBannersPayload;
};

export const bannerManagementService = {
  getDefaultStorage(): BannerManagementStorage {
    return DEFAULT_BANNER_STORAGE;
  },

  async getAdminStorage(): Promise<BannerManagementStorage> {
    return loadStorage();
  },

  async updateAdminStorage(
    payload: BannerManagementStorage,
  ): Promise<BannerManagementStorage> {
    const parsed = bannerManagementStorageSchema.parse(payload);

    await db.settings.upsert({
      where: { key: BANNER_MANAGEMENT_SETTINGS_KEY },
      update: {
        value: parsed as object,
        updatedAt: new Date(),
        description:
          "Admin-managed banners: slots, scheduling windows, and destination links",
      },
      create: {
        key: BANNER_MANAGEMENT_SETTINGS_KEY,
        value: parsed as object,
        description:
          "Admin-managed banners: slots, scheduling windows, and destination links",
      },
    });

    await invalidateBannersPublicCache();
    return parsed;
  },

  async getPublicSlotPayload(args: {
    slot: BannerSlotId;
    localeRaw: string | undefined;
    acceptLanguageRaw?: string | null;
    now?: Date;
  }): Promise<PublicBannersPayload> {
    const locale = normalizeLocale(args.localeRaw, args.acceptLanguageRaw);
    const now = args.now ?? new Date();
    const nowMs = now.getTime();
    const cacheKey =
      args.now !== undefined
        ? `banners:public:v1:${args.slot}:${locale}:at:${nowMs}`
        : `banners:public:v1:${args.slot}:${locale}`;

    return getCachedJson(
      cacheKey,
      args.now !== undefined ? 30 : BANNER_PUBLIC_CACHE_TTL_SEC,
      async () => {
        const storage = await loadStorage();
        return buildPublicSlotPayload(storage, args.slot, locale, now);
      },
    );
  },

  /**
   * Home hero: primary + secondary slots in one cache entry / one settings read (faster than two getPublicSlotPayload calls).
   */
  async getPublicHomeHeroSlotsPayload(args: {
    localeRaw: string | undefined;
    acceptLanguageRaw?: string | null;
    now?: Date;
  }): Promise<HomeHeroSlotsPayload> {
    const locale = normalizeLocale(args.localeRaw, args.acceptLanguageRaw);
    const now = args.now ?? new Date();
    const nowMs = now.getTime();
    const cacheKey =
      args.now !== undefined
        ? `banners:public:v1:home-hero-bundle:${locale}:at:${nowMs}`
        : `banners:public:v1:home-hero-bundle:${locale}`;

    return getCachedJson(
      cacheKey,
      args.now !== undefined ? 30 : BANNER_PUBLIC_CACHE_TTL_SEC,
      async () => {
        const storage = await loadStorage();
        return {
          primary: buildPublicSlotPayload(storage, 'home.hero.primary', locale, now),
          secondary: buildPublicSlotPayload(storage, 'home.hero.secondary', locale, now),
        };
      },
    );
  },
};
