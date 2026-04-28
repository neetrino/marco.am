import { db } from "@white-shop/db";
import {
  HOME_HERO_BANNER_SETTINGS_KEY,
} from "@/lib/constants/home-hero-banner";
import { HERO_FALLBACK_DESKTOP_IMAGE_SRC } from "@/lib/constants/hero-fallback-images";
import { resolveHeroMobileImageUrl } from "@/lib/utils/resolve-hero-mobile-image-url";
import {
  homeHeroBannerStorageSchema,
  type HomeHeroBannerStorage,
} from "@/lib/schemas/home-hero-banner.schema";
/** Locales with hero copy in storage (AM/RU/EN). */
type HeroLocale = "en" | "hy" | "ru";
import { logger } from "@/lib/utils/logger";

export type HomeHeroPublicCta = {
  id: string;
  label: string;
  href: string;
  sortOrder: number;
};

export type HomeHeroPublicPayload = {
  headlineEmphasis: string;
  headlineAccent: string;
  imageDesktopUrl: string;
  imageMobileUrl: string;
  ctas: HomeHeroPublicCta[];
};

const DEFAULT_HOME_HERO_BANNER_STORAGE: HomeHeroBannerStorage = {
  version: 1,
  headline: {
    en: { emphasis: "FREE ", accent: "DELIVERY" },
    hy: { emphasis: "ԱՆՎՃԱՐ", accent: "ԱՌԱՔՈՒՄ" },
    ru: { emphasis: "БЕСПЛАТНАЯ", accent: "ДОСТАВКА" },
  },
  imageDesktopUrl: null,
  imageMobileUrl: null,
  ctas: [
    {
      id: "default-shop",
      label: {
        en: "SHOP NOW",
        hy: "ԳՆԵԼ ՀԻՄԱ",
        ru: "КУПИТЬ СЕЙЧАС",
      },
      href: "/products",
      active: true,
      sortOrder: 0,
    },
  ],
};

function normalizeLocale(raw: string | undefined): HeroLocale {
  if (raw === "en" || raw === "hy" || raw === "ru") {
    return raw;
  }
  return "en";
}

function parseStored(raw: unknown): HomeHeroBannerStorage | null {
  const parsed = homeHeroBannerStorageSchema.safeParse(raw);
  if (!parsed.success) {
    logger.warn("[homeHeroBanner] Invalid stored payload", parsed.error.flatten());
    return null;
  }
  return parsed.data;
}

async function loadStorage(): Promise<HomeHeroBannerStorage> {
  const row = await db.settings.findUnique({
    where: { key: HOME_HERO_BANNER_SETTINGS_KEY },
  });
  if (!row) {
    return DEFAULT_HOME_HERO_BANNER_STORAGE;
  }
  const valid = parseStored(row.value);
  return valid ?? DEFAULT_HOME_HERO_BANNER_STORAGE;
}

function headlineForLocale(
  storage: HomeHeroBannerStorage,
  locale: HeroLocale,
): { emphasis: string; accent: string } {
  return storage.headline[locale];
}

function resolveImageUrl(
  stored: string | null,
  fallback: string,
): string {
  if (stored === null || stored.trim() === "") {
    return fallback;
  }
  return stored.trim();
}

function publicCtas(
  storage: HomeHeroBannerStorage,
  locale: HeroLocale,
): HomeHeroPublicCta[] {
  const labelKey = locale;
  const active = storage.ctas
    .filter((c) => c.active)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
  if (active.length === 0) {
    return publicCtas(DEFAULT_HOME_HERO_BANNER_STORAGE, locale);
  }
  return active.map((c) => ({
    id: c.id,
    label: c.label[labelKey],
    href: c.href,
    sortOrder: c.sortOrder,
  }));
}

export const homeHeroBannerService = {
  getDefaultStorage(): HomeHeroBannerStorage {
    return DEFAULT_HOME_HERO_BANNER_STORAGE;
  },

  async getPublicPayload(localeRaw: string | undefined): Promise<HomeHeroPublicPayload> {
    const locale = normalizeLocale(localeRaw);
    const storage = await loadStorage();
    const h = headlineForLocale(storage, locale);
    return {
      headlineEmphasis: h.emphasis,
      headlineAccent: h.accent,
      imageDesktopUrl: resolveImageUrl(
        storage.imageDesktopUrl,
        HERO_FALLBACK_DESKTOP_IMAGE_SRC,
      ),
      imageMobileUrl: resolveHeroMobileImageUrl(storage.imageMobileUrl),
      ctas: publicCtas(storage, locale),
    };
  },

  async getAdminStorage(): Promise<HomeHeroBannerStorage> {
    return loadStorage();
  },

  async updateAdminStorage(
    payload: HomeHeroBannerStorage,
  ): Promise<HomeHeroBannerStorage> {
    const parsed = homeHeroBannerStorageSchema.parse(payload);
    await db.settings.upsert({
      where: { key: HOME_HERO_BANNER_SETTINGS_KEY },
      update: {
        value: parsed as object,
        updatedAt: new Date(),
        description: "Home page hero banner, background images, CTAs (locales, active, order)",
      },
      create: {
        key: HOME_HERO_BANNER_SETTINGS_KEY,
        value: parsed as object,
        description: "Home page hero banner, background images, CTAs (locales, active, order)",
      },
    });
    return parsed;
  },
};
