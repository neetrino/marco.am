import { db } from "@white-shop/db";

import {
  HOME_SITE_FOOTER_SETTINGS_KEY,
  HOME_SITE_FOOTER_STORAGE_VERSION,
} from "@/lib/constants/site-footer";
import {
  siteFooterStorageSchema,
  type SiteFooterStorage,
} from "@/lib/schemas/site-footer.schema";
import { AppError } from "@/lib/types/errors";
import { logger } from "@/lib/utils/logger";

type HomeLocale = "en" | "hy" | "ru";

export type SiteFooterPublicNavLink = {
  readonly id: string;
  readonly label: string;
  readonly href: string;
  readonly sortOrder: number;
};

export type SiteFooterPublicSocialLink = {
  readonly id: string;
  readonly platform: SiteFooterStorage["socialLinks"][number]["platform"];
  readonly href: string;
  readonly sortOrder: number;
};

export type SiteFooterPublicPayload = {
  readonly companyColumnTitle: string;
  readonly supportColumnTitle: string;
  readonly contactsColumnTitle: string;
  readonly contact: {
    readonly address: string;
    readonly phoneDisplay: string;
    readonly phoneTel: string;
    readonly email: string;
  };
  readonly mapEmbed: {
    readonly enabled: boolean;
    readonly iframeSrc: string | null;
  };
  readonly companyLinks: readonly SiteFooterPublicNavLink[];
  readonly supportLinks: readonly SiteFooterPublicNavLink[];
  readonly legalLinks: readonly SiteFooterPublicNavLink[];
  readonly socialLinks: readonly SiteFooterPublicSocialLink[];
};

/** Hostnames allowed for footer map iframe `src` (admin PUT + public response). */
const MAP_EMBED_ALLOWED_HOSTS = new Set([
  "www.google.com",
  "google.com",
  "maps.google.com",
  "www.openstreetmap.org",
  "openstreetmap.org",
]);

export function isAllowedMapEmbedUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:") {
      return false;
    }
    return MAP_EMBED_ALLOWED_HOSTS.has(u.hostname);
  } catch {
    return false;
  }
}

const DEFAULT_STORAGE: SiteFooterStorage = {
  version: HOME_SITE_FOOTER_STORAGE_VERSION,
  companyColumnTitle: {
    en: "Company",
    hy: "Ընկերություն",
    ru: "Компания",
  },
  supportColumnTitle: {
    en: "Support",
    hy: "Աջակցություն",
    ru: "Поддержка",
  },
  contactsColumnTitle: {
    en: "Contacts",
    hy: "Կոնտակտներ",
    ru: "Контакты",
  },
  contact: {
    address: {
      en: "1/1 Abovyan St., Yerevan,\nArmenia",
      hy: "Աբովյան փող. 1/1, Երևան,\nՀայաստան",
      ru: "ул. Абовяна 1/1, Ереван,\nАрмения",
    },
    phoneDisplay: {
      en: "+374 XX XXX XXX",
      hy: "+374 XX XXX XXX",
      ru: "+374 XX XXX XXX",
    },
    phoneTel: "+37400000000",
    email: "marcofurniture@mail.ru",
  },
  mapEmbed: {
    enabled: false,
    iframeSrc: undefined,
  },
  companyLinks: [
    {
      id: "company-about",
      label: {
        en: "About us",
        hy: "Մեր մասին",
        ru: "О нас",
      },
      href: "/about",
      active: true,
      sortOrder: 0,
    },
    {
      id: "company-stores",
      label: {
        en: "Our stores",
        hy: "Մեր խանութները",
        ru: "Наши магазины",
      },
      href: "/stores",
      active: true,
      sortOrder: 1,
    },
    {
      id: "company-careers",
      label: {
        en: "Careers",
        hy: "Աշխատանք մեզ մոտ",
        ru: "Работа у нас",
      },
      href: "/contact",
      active: true,
      sortOrder: 2,
    },
    {
      id: "company-news",
      label: {
        en: "News & blog",
        hy: "Նորություններ և բլոգ",
        ru: "Новости и блог",
      },
      href: "/about",
      active: true,
      sortOrder: 3,
    },
    {
      id: "company-feedback",
      label: {
        en: "Contact us",
        hy: "Հետադարձ կապ",
        ru: "Обратная связь",
      },
      href: "/contact",
      active: true,
      sortOrder: 4,
    },
  ],
  supportLinks: [
    {
      id: "support-delivery",
      label: {
        en: "Delivery & returns",
        hy: "Առաքում և վերադարձ",
        ru: "Доставка и возврат",
      },
      href: "/delivery",
      active: true,
      sortOrder: 0,
    },
    {
      id: "support-installment",
      label: {
        en: "Installment terms",
        hy: "Ապառիկի պայմաններ",
        ru: "Условия рассрочки",
      },
      href: "/delivery-terms",
      active: true,
      sortOrder: 1,
    },
    {
      id: "support-warranty",
      label: {
        en: "Official warranty",
        hy: "Պաշտոնական երաշխիք",
        ru: "Официальная гарантия",
      },
      href: "/support",
      active: true,
      sortOrder: 2,
    },
    {
      id: "support-faq",
      label: {
        en: "FAQ",
        hy: "Հաճախ տրվող հարցեր",
        ru: "Частые вопросы",
      },
      href: "/faq",
      active: true,
      sortOrder: 3,
    },
    {
      id: "support-service",
      label: {
        en: "Service centers",
        hy: "Սպասարկման կենտրոններ",
        ru: "Сервисные центры",
      },
      href: "/stores",
      active: true,
      sortOrder: 4,
    },
  ],
  legalLinks: [
    {
      id: "legal-privacy",
      label: {
        en: "Privacy Policy",
        hy: "Գաղտնիության քաղաքականություն",
        ru: "Политика конфиденциальности",
      },
      href: "/privacy",
      active: true,
      sortOrder: 0,
    },
    {
      id: "legal-terms",
      label: {
        en: "Terms of Service",
        hy: "Ծառայությունների պայմաններ",
        ru: "Условия использования",
      },
      href: "/terms",
      active: true,
      sortOrder: 1,
    },
    {
      id: "legal-refund",
      label: {
        en: "Refund Policy",
        hy: "Փոխհատուցման քաղաքականություն",
        ru: "Политика возврата",
      },
      href: "/refund-policy",
      active: true,
      sortOrder: 2,
    },
    {
      id: "legal-delivery",
      label: {
        en: "Delivery Terms",
        hy: "Առաքման պայմաններ",
        ru: "Условия доставки",
      },
      href: "/delivery-terms",
      active: true,
      sortOrder: 3,
    },
  ],
  socialLinks: [
    {
      id: "social-instagram",
      platform: "instagram",
      active: false,
      sortOrder: 0,
    },
    {
      id: "social-facebook",
      platform: "facebook",
      active: false,
      sortOrder: 1,
    },
    {
      id: "social-telegram",
      platform: "telegram",
      active: false,
      sortOrder: 2,
    },
    {
      id: "social-whatsapp",
      platform: "whatsapp",
      active: false,
      sortOrder: 3,
    },
    {
      id: "social-viber",
      platform: "viber",
      active: false,
      sortOrder: 4,
    },
  ],
};

function normalizeLocale(raw: string | undefined): HomeLocale {
  if (raw === "en" || raw === "hy" || raw === "ru") {
    return raw;
  }
  return "en";
}

function parseStored(raw: unknown): SiteFooterStorage | null {
  const parsed = siteFooterStorageSchema.safeParse(raw);
  if (!parsed.success) {
    logger.warn("[siteFooter] Invalid stored payload", parsed.error.flatten());
    return null;
  }
  return parsed.data;
}

async function loadStorage(): Promise<SiteFooterStorage> {
  const row = await db.settings.findUnique({
    where: { key: HOME_SITE_FOOTER_SETTINGS_KEY },
  });
  if (!row) {
    return DEFAULT_STORAGE;
  }
  const valid = parseStored(row.value);
  return valid ?? DEFAULT_STORAGE;
}

function resolveNav(
  items: SiteFooterStorage["companyLinks"],
  locale: HomeLocale,
): SiteFooterPublicNavLink[] {
  return items
    .filter((i) => i.active)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id))
    .map((i) => ({
      id: i.id,
      label: i.label[locale],
      href: i.href,
      sortOrder: i.sortOrder,
    }));
}

function resolveSocial(
  items: SiteFooterStorage["socialLinks"],
): SiteFooterPublicSocialLink[] {
  return items
    .filter((s) => s.active && s.href !== undefined && s.href.length > 0)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id))
    .map((s) => ({
      id: s.id,
      platform: s.platform,
      href: s.href as string,
      sortOrder: s.sortOrder,
    }));
}

function publicMapEmbed(
  storage: SiteFooterStorage,
): SiteFooterPublicPayload["mapEmbed"] {
  const { enabled, iframeSrc } = storage.mapEmbed;
  if (!enabled || iframeSrc === undefined || iframeSrc.trim() === "") {
    return { enabled: false, iframeSrc: null };
  }
  if (!isAllowedMapEmbedUrl(iframeSrc)) {
    logger.warn("[siteFooter] Map embed URL rejected for public payload", {
      iframeSrc,
    });
    return { enabled: false, iframeSrc: null };
  }
  return { enabled: true, iframeSrc };
}

export const siteFooterService = {
  getDefaultStorage(): SiteFooterStorage {
    return DEFAULT_STORAGE;
  },

  async getPublicPayload(
    localeRaw: string | undefined,
  ): Promise<SiteFooterPublicPayload> {
    const locale = normalizeLocale(localeRaw);
    const storage = await loadStorage();
    return {
      companyColumnTitle: storage.companyColumnTitle[locale],
      supportColumnTitle: storage.supportColumnTitle[locale],
      contactsColumnTitle: storage.contactsColumnTitle[locale],
      contact: {
        address: storage.contact.address[locale],
        phoneDisplay: storage.contact.phoneDisplay[locale],
        phoneTel: storage.contact.phoneTel,
        email: storage.contact.email,
      },
      mapEmbed: publicMapEmbed(storage),
      companyLinks: resolveNav(storage.companyLinks, locale),
      supportLinks: resolveNav(storage.supportLinks, locale),
      legalLinks: resolveNav(storage.legalLinks, locale),
      socialLinks: resolveSocial(storage.socialLinks),
    };
  },

  async getAdminStorage(): Promise<SiteFooterStorage> {
    return loadStorage();
  },

  async updateAdminStorage(
    payload: SiteFooterStorage,
  ): Promise<SiteFooterStorage> {
    const parsed = siteFooterStorageSchema.parse(payload);
    if (parsed.mapEmbed.enabled) {
      const src = parsed.mapEmbed.iframeSrc;
      if (src === undefined || src.trim() === "") {
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
      where: { key: HOME_SITE_FOOTER_SETTINGS_KEY },
      update: {
        value: parsed as object,
        updatedAt: new Date(),
        description:
          "Site footer — contact, social, map embed, nav + legal links (per-locale copy)",
      },
      create: {
        key: HOME_SITE_FOOTER_SETTINGS_KEY,
        value: parsed as object,
        description:
          "Site footer — contact, social, map embed, nav + legal links (per-locale copy)",
      },
    });
    return parsed;
  },
};
