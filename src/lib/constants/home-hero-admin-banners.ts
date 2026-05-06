import type { BannerManagementStorage } from "@/lib/schemas/banner-management.schema";

import { HERO_MOBILE_PRIMARY_IMAGE_SRC } from "@/components/hero.constants";

export const HOME_HERO_PRIMARY_TOP_BANNER_ID = "home-hero-primary-top";
export const HOME_HERO_PRIMARY_BOTTOM_BANNER_ID = "home-hero-primary-bottom";
export const HOME_HERO_SECONDARY_BANNER_ID = "home-hero-secondary-main";
export const HOME_PROMO_PRIMARY_BANNER_ID = "home-promo-primary";
export const HOME_PROMO_SECONDARY_BANNER_ID = "home-promo-secondary";

/**
 * Same-origin defaults only. Figma MCP URLs (`/api/mcp/asset/...`) are not public image
 * endpoints — browsers get 404, so production (e.g. Vercel) shows broken tiles.
 */
export const HOME_HERO_PRIMARY_TOP_DEFAULT_IMAGE_URL =
  "/assets/home/app-download-banner.webp" as const;
export const HOME_HERO_PRIMARY_BOTTOM_DEFAULT_IMAGE_URL =
  "/assets/home/home-gradient-banner-bg.webp" as const;
export const HOME_HERO_SECONDARY_DEFAULT_IMAGE_URL =
  "/assets/brands/panasonic-figma.webp" as const;
export const HOME_PROMO_PRIMARY_DEFAULT_IMAGE_URL =
  "/assets/home/home-gradient-banner-bg.webp" as const;
export const HOME_PROMO_SECONDARY_DEFAULT_IMAGE_URL = "" as const;

export const HOME_HERO_DEFAULT_BANNER_ITEMS: BannerManagementStorage["banners"] = [
  {
    id: HOME_HERO_PRIMARY_TOP_BANNER_ID,
    slot: "home.hero.primary",
    title: {
      hy: "Home hero top banner",
      ru: "Home hero top banner",
      en: "Home hero top banner",
    },
    imageDesktopUrl: HOME_HERO_PRIMARY_TOP_DEFAULT_IMAGE_URL,
    imageMobileUrl: HERO_MOBILE_PRIMARY_IMAGE_SRC,
    link: {
      href: "/products",
      openInNewTab: false,
    },
    schedule: {
      startsAt: null,
      endsAt: null,
    },
    active: true,
    sortOrder: 0,
  },
  {
    id: HOME_HERO_PRIMARY_BOTTOM_BANNER_ID,
    slot: "home.hero.primary",
    title: {
      hy: "Home hero bottom banner",
      ru: "Home hero bottom banner",
      en: "Home hero bottom banner",
    },
    imageDesktopUrl: HOME_HERO_PRIMARY_BOTTOM_DEFAULT_IMAGE_URL,
    imageMobileUrl: null,
    link: {
      href: "/products",
      openInNewTab: false,
    },
    schedule: {
      startsAt: null,
      endsAt: null,
    },
    active: true,
    sortOrder: 1,
  },
  {
    id: HOME_HERO_SECONDARY_BANNER_ID,
    slot: "home.hero.secondary",
    title: {
      hy: "Home hero secondary banner",
      ru: "Home hero secondary banner",
      en: "Home hero secondary banner",
    },
    imageDesktopUrl: HOME_HERO_SECONDARY_DEFAULT_IMAGE_URL,
    imageMobileUrl: null,
    link: {
      href: "/products",
      openInNewTab: false,
    },
    schedule: {
      startsAt: null,
      endsAt: null,
    },
    active: true,
    sortOrder: 0,
  },
  {
    id: HOME_PROMO_PRIMARY_BANNER_ID,
    slot: "home.promo.strip",
    title: {
      hy: "Home promo primary banner",
      ru: "Home promo primary banner",
      en: "Home promo primary banner",
    },
    imageDesktopUrl: HOME_PROMO_PRIMARY_DEFAULT_IMAGE_URL,
    imageMobileUrl: null,
    link: {
      href: "/products",
      openInNewTab: false,
    },
    schedule: {
      startsAt: null,
      endsAt: null,
    },
    active: true,
    sortOrder: 0,
  },
  {
    id: HOME_PROMO_SECONDARY_BANNER_ID,
    slot: "home.promo.strip",
    title: {
      hy: "Home promo secondary banner",
      ru: "Home promo secondary banner",
      en: "Home promo secondary banner",
    },
    imageDesktopUrl: HOME_PROMO_SECONDARY_DEFAULT_IMAGE_URL,
    imageMobileUrl: null,
    link: {
      href: "/products",
      openInNewTab: false,
    },
    schedule: {
      startsAt: null,
      endsAt: null,
    },
    active: true,
    sortOrder: 1,
  },
];
