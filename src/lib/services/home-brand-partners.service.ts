import { db } from "@white-shop/db";

import { HOME_BRAND_PARTNERS_SETTINGS_KEY } from "@/lib/constants/home-brand-partners";
import {
  homeBrandPartnersStorageSchema,
  type HomeBrandPartnersStorage,
} from "@/lib/schemas/home-brand-partners.schema";
import type {
  HomeBrandPartnerLogoScale,
  HomeBrandPartnerPublicItem,
  HomeBrandPartnersPublicPayload,
} from "@/lib/types/home-brand-partners-public";
import {
  getCachedJson,
  invalidateHomeBrandPartnersPublicCache,
} from "@/lib/services/read-through-json-cache";
import { logger } from "@/lib/utils/logger";

/** Align with home listing strips — fewer DB round-trips on repeat visits. */
const BRAND_PARTNERS_PUBLIC_CACHE_TTL_SEC = 600;

type HomeLocale = "en" | "hy" | "ru";

type BrandRow = {
  id: string;
  slug: string;
  logoUrl: string | null;
  translations: Array<{ locale: string; name: string; description: string | null }>;
};

const DEFAULT_SECTION_TITLE: Record<HomeLocale, string> = {
  en: "BRANDS",
  hy: "ԲՐԵՆԴՆԵՐ",
  ru: "БРЕНДЫ",
};

const DEFAULT_STORAGE: HomeBrandPartnersStorage = {
  version: 1,
  sectionTitle: {
    en: DEFAULT_SECTION_TITLE.en,
    hy: DEFAULT_SECTION_TITLE.hy,
    ru: DEFAULT_SECTION_TITLE.ru,
  },
  entries: [],
};

function normalizeLocale(raw: string | undefined): HomeLocale {
  if (raw === "en" || raw === "hy" || raw === "ru") {
    return raw;
  }
  return "en";
}

function parseStored(raw: unknown): HomeBrandPartnersStorage | null {
  const parsed = homeBrandPartnersStorageSchema.safeParse(raw);
  if (!parsed.success) {
    logger.warn("[homeBrandPartners] Invalid stored payload", parsed.error.flatten());
    return null;
  }
  return parsed.data;
}

function translationForLocale(
  brand: BrandRow,
  locale: HomeLocale,
): { name: string; description: string | null } {
  const tr = brand.translations;
  const pick = (loc: HomeLocale) => tr.find((t) => t.locale === loc);
  const order: HomeLocale[] = [locale, "en", "hy", "ru"];
  for (const loc of order) {
    const row = pick(loc);
    if (row?.name?.trim()) {
      return { name: row.name.trim(), description: row.description };
    }
  }
  return { name: brand.slug, description: null };
}

function hrefForBrand(brandId: string): string {
  const q = new URLSearchParams({ brand: brandId });
  return `/products?${q.toString()}`;
}

function toPublicItem(
  brand: BrandRow,
  locale: HomeLocale,
  entryId: string,
  logoScale?: HomeBrandPartnerLogoScale,
): HomeBrandPartnerPublicItem {
  const { name, description } = translationForLocale(brand, locale);
  return {
    id: entryId,
    slug: brand.slug,
    name,
    description,
    logoUrl: brand.logoUrl,
    href: hrefForBrand(brand.id),
    logoScale,
  };
}

async function loadStorage(): Promise<HomeBrandPartnersStorage> {
  const row = await db.settings.findUnique({
    where: { key: HOME_BRAND_PARTNERS_SETTINGS_KEY },
  });
  if (!row) {
    return DEFAULT_STORAGE;
  }
  const valid = parseStored(row.value);
  return valid ?? DEFAULT_STORAGE;
}

/** Shop-visible products: same baseline as PLP (`buildWhereClause`). */
const LISTED_PRODUCT_RELATION = {
  some: {
    published: true,
    deletedAt: null,
  },
} as const;

async function fetchBrandsWithListedProducts(ids?: string[]): Promise<BrandRow[]> {
  const base = {
    published: true,
    deletedAt: null,
    products: LISTED_PRODUCT_RELATION,
  };
  const where =
    ids !== undefined ? { ...base, id: { in: ids } } : base;

  return db.brand.findMany({
    where,
    include: {
      translations: true,
    },
    orderBy: { slug: "asc" },
  }) as Promise<BrandRow[]>;
}

function buildFromCurated(
  storage: HomeBrandPartnersStorage,
  brandById: Map<string, BrandRow>,
  locale: HomeLocale,
): HomeBrandPartnerPublicItem[] {
  const active = storage.entries
    .filter((e) => e.active)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));

  const out: HomeBrandPartnerPublicItem[] = [];
  for (const e of active) {
    const b = brandById.get(e.brandId);
    if (!b) {
      logger.warn("[homeBrandPartners] Curated brandId not found or unpublished", {
        brandId: e.brandId,
      });
      continue;
    }
    out.push(toPublicItem(b, locale, e.id, e.logoScale));
  }
  return out;
}

function buildFromAll(brands: BrandRow[], locale: HomeLocale): HomeBrandPartnerPublicItem[] {
  return brands.map((b) => toPublicItem(b, locale, b.id, undefined));
}

export const homeBrandPartnersService = {
  getDefaultStorage(): HomeBrandPartnersStorage {
    return DEFAULT_STORAGE;
  },

  async getPublicPayload(localeRaw: string | undefined): Promise<HomeBrandPartnersPublicPayload> {
    const locale = normalizeLocale(localeRaw);
    const cacheKey = `home:brand-partners:public:v4:${locale}`;

    return getCachedJson(cacheKey, BRAND_PARTNERS_PUBLIC_CACHE_TTL_SEC, async () => {
      const storage = await loadStorage();
      const sectionTitle = storage.sectionTitle[locale];

      if (storage.entries.length === 0) {
        const brands = await fetchBrandsWithListedProducts(undefined);
        return {
          sectionTitle,
          brands: buildFromAll(brands, locale),
        };
      }

      const ids = [...new Set(storage.entries.map((e) => e.brandId))];
      const rows = await fetchBrandsWithListedProducts(ids);
      const brandById = new Map(rows.map((b) => [b.id, b]));
      return {
        sectionTitle,
        brands: buildFromCurated(storage, brandById, locale),
      };
    });
  },

  async getAdminStorage(): Promise<HomeBrandPartnersStorage> {
    return loadStorage();
  },

  async updateAdminStorage(payload: HomeBrandPartnersStorage): Promise<HomeBrandPartnersStorage> {
    const parsed = homeBrandPartnersStorageSchema.parse(payload);
    await db.settings.upsert({
      where: { key: HOME_BRAND_PARTNERS_SETTINGS_KEY },
      update: {
        value: parsed as object,
        updatedAt: new Date(),
        description:
          "Home brand partners — section title (locales), curated entries (brandId, active, order, optional logo scale); empty entries = all published brands",
      },
      create: {
        key: HOME_BRAND_PARTNERS_SETTINGS_KEY,
        value: parsed as object,
        description:
          "Home brand partners — section title (locales), curated entries (brandId, active, order, optional logo scale); empty entries = all published brands",
      },
    });
    await invalidateHomeBrandPartnersPublicCache();
    return parsed;
  },
};
