import { db } from "@white-shop/db";

import {
  SITE_CONTENT_SETTINGS_KEY,
  SUPPORTED_SITE_LOCALES,
  type SiteLocale,
} from "@/lib/constants/site-content";
import {
  SITE_CONTENT_DEFAULT_STORAGE,
  SITE_CONTENT_MAP_EMBED_ALLOWED_HOSTS,
} from "@/lib/constants/site-content.defaults";
import {
  siteContentStorageSchema,
  type SiteContentStorage,
} from "@/lib/schemas/site-content.schema";
import { AppError } from "@/lib/types/errors";
import type { LocaleResolution, SiteAboutPublicPayload, SiteBrandPagePublicPayload, SiteContactPublicPayload } from "@/lib/types/site-content";
import { logger } from "@/lib/utils/logger";

type BrandRow = { readonly id: string; readonly slug: string; readonly logoUrl: string | null; readonly translations: ReadonlyArray<{ readonly locale: string; readonly name: string; readonly description: string | null }> };

type LocalizedMap = SiteContentStorage["about"]["title"];

function parseAcceptLanguage(acceptLanguageRaw: string | null): SiteLocale | null {
  if (!acceptLanguageRaw) {
    return null;
  }
  const chunks = acceptLanguageRaw.split(",");
  for (const chunk of chunks) {
    const token = chunk.split(";")[0]?.trim().toLowerCase();
    if (!token) {
      continue;
    }
    if (token.startsWith("hy")) {
      return "hy";
    }
    if (token.startsWith("ru")) {
      return "ru";
    }
    if (token.startsWith("en")) {
      return "en";
    }
  }
  return null;
}

function normalizeLocale(localeRaw: string | null, acceptLanguageRaw: string | null): LocaleResolution {
  if (localeRaw === "hy" || localeRaw === "ru" || localeRaw === "en") {
    return { requestedLocale: localeRaw, resolvedLocale: localeRaw, fallbackUsed: false };
  }
  const headerLocale = parseAcceptLanguage(acceptLanguageRaw);
  if (headerLocale) {
    return {
      requestedLocale: localeRaw,
      resolvedLocale: headerLocale,
      fallbackUsed: localeRaw !== null,
    };
  }
  return {
    requestedLocale: localeRaw,
    resolvedLocale: "hy",
    fallbackUsed: localeRaw !== null,
  };
}

function pickLocalized(value: LocalizedMap, locale: SiteLocale): string {
  return value[locale];
}

function parseStored(raw: unknown): SiteContentStorage | null {
  const parsed = siteContentStorageSchema.safeParse(raw);
  if (!parsed.success) {
    logger.warn("[siteContent] Invalid stored payload", parsed.error.flatten());
    return null;
  }
  return parsed.data;
}

async function loadStorage(): Promise<SiteContentStorage> {
  const row = await db.settings.findUnique({
    where: { key: SITE_CONTENT_SETTINGS_KEY },
  });
  if (!row) {
    return SITE_CONTENT_DEFAULT_STORAGE;
  }
  return parseStored(row.value) ?? SITE_CONTENT_DEFAULT_STORAGE;
}

function toPublicMapEmbed(
  mapEmbed: SiteContentStorage["contact"]["mapEmbed"],
): SiteContactPublicPayload["mapEmbed"] {
  if (!mapEmbed.enabled || !mapEmbed.iframeSrc) {
    return { enabled: false, iframeSrc: null };
  }
  const src = mapEmbed.iframeSrc.trim();
  if (!isAllowedMapEmbedUrl(src)) {
    logger.warn("[siteContent] Public map embed URL rejected", { src });
    return { enabled: false, iframeSrc: null };
  }
  return { enabled: true, iframeSrc: src };
}

function isAllowedMapEmbedUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:") {
      return false;
    }
    return SITE_CONTENT_MAP_EMBED_ALLOWED_HOSTS.has(u.hostname);
  } catch {
    return false;
  }
}

async function findPublishedBrandBySlug(slug: string): Promise<BrandRow | null> {
  const row = await db.brand.findFirst({
    where: {
      slug,
      published: true,
      deletedAt: null,
    },
    include: {
      translations: true,
    },
  });
  return row as BrandRow | null;
}

function resolveBrandTranslation(brand: BrandRow, locale: SiteLocale): { readonly name: string; readonly description: string | null } {
  const order: readonly SiteLocale[] = [locale, "hy", "en", "ru"];
  for (const loc of order) {
    const translation = brand.translations.find((item) => item.locale === loc);
    if (translation?.name.trim()) {
      return {
        name: translation.name.trim(),
        description: translation.description?.trim() ?? null,
      };
    }
  }
  return { name: brand.slug, description: null };
}

function resolveBrandCatalogHref(storage: SiteContentStorage, brandId: string): string {
  const basePath = storage.brandPages.catalogPath;
  const query = new URLSearchParams({ brand: brandId });
  return `${basePath}?${query.toString()}`;
}

export const siteContentService = {
  async getAboutPublicPayload(args: {
    readonly localeRaw: string | null;
    readonly acceptLanguageRaw: string | null;
  }): Promise<SiteAboutPublicPayload> {
    const localeResolution = normalizeLocale(args.localeRaw, args.acceptLanguageRaw);
    const storage = await loadStorage();
    return {
      locale: localeResolution.resolvedLocale,
      i18n: { ...localeResolution, availableLocales: SUPPORTED_SITE_LOCALES },
      heroImageUrl: storage.about.heroImageUrl,
      subtitle: pickLocalized(storage.about.subtitle, localeResolution.resolvedLocale),
      title: pickLocalized(storage.about.title, localeResolution.resolvedLocale),
      paragraphs: [
        pickLocalized(storage.about.paragraph1, localeResolution.resolvedLocale),
        pickLocalized(storage.about.paragraph2, localeResolution.resolvedLocale),
        pickLocalized(storage.about.paragraph3, localeResolution.resolvedLocale),
      ],
      team: {
        subtitle: pickLocalized(storage.about.teamSubtitle, localeResolution.resolvedLocale),
        title: pickLocalized(storage.about.teamTitle, localeResolution.resolvedLocale),
        description: pickLocalized(
          storage.about.teamDescription,
          localeResolution.resolvedLocale,
        ),
      },
    };
  },

  async getContactPublicPayload(args: { readonly localeRaw: string | null; readonly acceptLanguageRaw: string | null }): Promise<SiteContactPublicPayload> {
    const localeResolution = normalizeLocale(args.localeRaw, args.acceptLanguageRaw);
    const storage = await loadStorage();
    const locale = localeResolution.resolvedLocale;
    return {
      locale,
      i18n: { ...localeResolution, availableLocales: SUPPORTED_SITE_LOCALES },
      phoneDisplay: pickLocalized(storage.contact.phoneDisplay, locale),
      phoneTel: storage.contact.phoneTel,
      email: storage.contact.email,
      address: pickLocalized(storage.contact.address, locale),
      workingHours: {
        weekdays: pickLocalized(storage.contact.workingHours.weekdays, locale),
        saturday: pickLocalized(storage.contact.workingHours.saturday, locale),
      },
      callToUs: {
        title: pickLocalized(storage.contact.callToUs.title, locale),
        description: pickLocalized(storage.contact.callToUs.description, locale),
      },
      writeToUs: {
        title: pickLocalized(storage.contact.writeToUs.title, locale),
        description: pickLocalized(storage.contact.writeToUs.description, locale),
        emailLabel: pickLocalized(storage.contact.writeToUs.emailLabel, locale),
      },
      headquarterTitle: pickLocalized(storage.contact.headquarterTitle, locale),
      socialLinks: storage.contact.socialLinks,
      mapEmbed: toPublicMapEmbed(storage.contact.mapEmbed),
    };
  },

  async getBrandPagePublicPayload(args: { readonly slug: string; readonly localeRaw: string | null; readonly acceptLanguageRaw: string | null }): Promise<SiteBrandPagePublicPayload | null> {
    const localeResolution = normalizeLocale(args.localeRaw, args.acceptLanguageRaw);
    const storage = await loadStorage();
    const brand = await findPublishedBrandBySlug(args.slug);
    if (!brand) {
      return null;
    }
    const translation = resolveBrandTranslation(brand, localeResolution.resolvedLocale);
    const fallbackDescriptionTemplate = pickLocalized(
      storage.brandPages.fallbackDescriptionTemplate,
      localeResolution.resolvedLocale,
    );
    const fallbackDescription = fallbackDescriptionTemplate.replace(
      /\{brandName\}/g,
      translation.name,
    );
    return {
      locale: localeResolution.resolvedLocale,
      i18n: { ...localeResolution, availableLocales: SUPPORTED_SITE_LOCALES },
      brand: {
        id: brand.id,
        slug: brand.slug,
        name: translation.name,
        description: translation.description ?? fallbackDescription,
        logoUrl: brand.logoUrl,
      },
      content: {
        sectionTitle: pickLocalized(
          storage.brandPages.sectionTitle,
          localeResolution.resolvedLocale,
        ),
        descriptionSource:
          translation.description === null
            ? "fallback_template"
            : "brand_translation",
        ctaLabel: pickLocalized(storage.brandPages.ctaLabel, localeResolution.resolvedLocale),
        href: resolveBrandCatalogHref(storage, brand.id),
      },
    };
  },

  async getAdminStorage(): Promise<SiteContentStorage> {
    return loadStorage();
  },

  async updateAdminStorage(payload: SiteContentStorage): Promise<SiteContentStorage> {
    const parsed = siteContentStorageSchema.parse(payload);
    if (parsed.contact.mapEmbed.enabled) {
      const src = parsed.contact.mapEmbed.iframeSrc;
      if (!src || src.trim().length === 0) {
        throw new AppError(
          "Map embed enabled but iframeSrc is missing",
          400,
          "https://api.shop.am/problems/validation-error",
          "Validation Error",
          "Enable map only with a valid iframe URL",
        );
      }
      if (!isAllowedMapEmbedUrl(src)) {
        throw new AppError(
          "Invalid map embed URL",
          400,
          "https://api.shop.am/problems/validation-error",
          "Validation Error",
          "Map iframe URL must be HTTPS from an allowed provider (Google Maps or OpenStreetMap embed)",
        );
      }
    }
    await db.settings.upsert({
      where: { key: SITE_CONTENT_SETTINGS_KEY },
      update: {
        value: parsed as object,
        updatedAt: new Date(),
        description:
          "Site content pages — About, Contact, Brand page copy (per-locale CMS/static API document)",
      },
      create: {
        key: SITE_CONTENT_SETTINGS_KEY,
        value: parsed as object,
        description:
          "Site content pages — About, Contact, Brand page copy (per-locale CMS/static API document)",
      },
    });
    return parsed;
  },
};
