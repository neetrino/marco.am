export const SITE_CONTENT_SETTINGS_KEY = "siteContentPages";
export const SITE_CONTENT_STORAGE_VERSION = 1;

export const SUPPORTED_SITE_LOCALES = ["hy", "ru", "en"] as const;

export type SiteLocale = (typeof SUPPORTED_SITE_LOCALES)[number];
