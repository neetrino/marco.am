import type { BannerManagementStorage } from "@/lib/schemas/banner-management.schema";

import { HERO_MOBILE_PRIMARY_IMAGE_SRC } from "@/components/hero.constants";

export const HOME_HERO_PRIMARY_TOP_BANNER_ID = "home-hero-primary-top";
export const HOME_HERO_PRIMARY_BOTTOM_BANNER_ID = "home-hero-primary-bottom";
export const HOME_HERO_SECONDARY_BANNER_ID = "home-hero-secondary-main";

export const HOME_HERO_PRIMARY_TOP_DEFAULT_IMAGE_URL =
  "https://www.figma.com/api/mcp/asset/3791ef5c-cb75-4fdf-b91c-867dfea32623";
export const HOME_HERO_PRIMARY_BOTTOM_DEFAULT_IMAGE_URL =
  "https://www.figma.com/api/mcp/asset/dacdd4e4-d6c3-496f-9f3a-ea1efac284f4";
export const HOME_HERO_SECONDARY_DEFAULT_IMAGE_URL =
  "https://www.figma.com/api/mcp/asset/b7429ac7-5d98-4c42-a62f-f9780ebfda16";

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
];
