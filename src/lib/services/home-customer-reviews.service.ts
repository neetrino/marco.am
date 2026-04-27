import { db } from "@white-shop/db";

import {
  HOME_CUSTOMER_REVIEWS_SETTINGS_KEY,
  HOME_CUSTOMER_REVIEWS_STORAGE_VERSION,
} from "@/lib/constants/home-customer-reviews";
import {
  homeCustomerReviewsStorageSchema,
  type HomeCustomerReviewsStorage,
} from "@/lib/schemas/home-customer-reviews.schema";
import {
  getCachedJson,
  invalidateHomeCustomerReviewsPublicCache,
} from "@/lib/services/read-through-json-cache";
import { logger } from "@/lib/utils/logger";

const CUSTOMER_REVIEWS_PUBLIC_CACHE_TTL_SEC = 300;

type HomeLocale = "en" | "hy" | "ru";

export type HomeCustomerReviewsPublicItem = {
  id: string;
  rating: number;
  text: string;
  authorName: string;
  photoUrls: string[];
  sortOrder: number;
};

export type HomeCustomerReviewsPublicPayload = {
  sectionTitle: string;
  items: HomeCustomerReviewsPublicItem[];
};

const DEFAULT_STORAGE: HomeCustomerReviewsStorage = {
  version: HOME_CUSTOMER_REVIEWS_STORAGE_VERSION,
  sectionTitle: {
    en: "What customers say",
    hy: "Ինչ են ասում հաճախորդները",
    ru: "Отзывы покупателей",
  },
  items: [
    {
      id: "sample-1",
      rating: 5,
      authorName: {
        en: "A. H.",
        hy: "Ա. Հ.",
        ru: "А. А.",
      },
      text: {
        en: "Fast delivery and genuine products. Support answered all my questions.",
        hy: "Արագ առաքում և բնօրինակ ապրանքներ։ Աջակցությունը պատասխանեց բոլոր հարցերին։",
        ru: "Быстрая доставка и оригинальные товары. Поддержка ответила на все вопросы.",
      },
      photoUrls: [],
      active: true,
      sortOrder: 0,
    },
    {
      id: "sample-2",
      rating: 4,
      authorName: {
        en: "M. K.",
        hy: "Մ. Կ.",
        ru: "М. К.",
      },
      text: {
        en: "Great prices on electronics. Packaging was solid.",
        hy: "Լավ գներ էլեկտրոնիկայի համար։ Փաթեթավորումը հուսալի էր։",
        ru: "Отличные цены на электронику. Упаковка надёжная.",
      },
      photoUrls: [],
      active: true,
      sortOrder: 1,
    },
    {
      id: "sample-3",
      rating: 5,
      authorName: {
        en: "S. T.",
        hy: "Ս. Թ.",
        ru: "С. Т.",
      },
      text: {
        en: "Easy checkout and clear order status updates.",
        hy: "Հեշտ պատվեր և հասկանալի կարգավիճակի թարմացումներ։",
        ru: "Удобное оформление заказа и понятные статусы.",
      },
      photoUrls: [],
      active: true,
      sortOrder: 2,
    },
  ],
};

function normalizeLocale(raw: string | undefined): HomeLocale {
  if (raw === "en" || raw === "hy" || raw === "ru") {
    return raw;
  }
  return "en";
}

function parseStored(raw: unknown): HomeCustomerReviewsStorage | null {
  const parsed = homeCustomerReviewsStorageSchema.safeParse(raw);
  if (!parsed.success) {
    logger.warn(
      "[homeCustomerReviews] Invalid stored payload",
      parsed.error.flatten(),
    );
    return null;
  }
  return parsed.data;
}

async function loadStorage(): Promise<HomeCustomerReviewsStorage> {
  const row = await db.settings.findUnique({
    where: { key: HOME_CUSTOMER_REVIEWS_SETTINGS_KEY },
  });
  if (!row) {
    return DEFAULT_STORAGE;
  }
  const valid = parseStored(row.value);
  return valid ?? DEFAULT_STORAGE;
}

function publicItems(
  storage: HomeCustomerReviewsStorage,
  locale: HomeLocale,
): HomeCustomerReviewsPublicItem[] {
  const loc = locale;
  return storage.items
    .filter((i) => i.active)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id))
    .map((i) => ({
      id: i.id,
      rating: i.rating,
      text: i.text[loc],
      authorName: i.authorName[loc].trim(),
      photoUrls: [...i.photoUrls],
      sortOrder: i.sortOrder,
    }));
}

export const homeCustomerReviewsService = {
  getDefaultStorage(): HomeCustomerReviewsStorage {
    return DEFAULT_STORAGE;
  },

  async getPublicPayload(
    localeRaw: string | undefined,
  ): Promise<HomeCustomerReviewsPublicPayload> {
    const locale = normalizeLocale(localeRaw);
    const cacheKey = `home:reviews:public:v1:${locale}`;

    return getCachedJson(cacheKey, CUSTOMER_REVIEWS_PUBLIC_CACHE_TTL_SEC, async () => {
      const storage = await loadStorage();
      return {
        sectionTitle: storage.sectionTitle[locale],
        items: publicItems(storage, locale),
      };
    });
  },

  async getAdminStorage(): Promise<HomeCustomerReviewsStorage> {
    return loadStorage();
  },

  async updateAdminStorage(
    payload: HomeCustomerReviewsStorage,
  ): Promise<HomeCustomerReviewsStorage> {
    const parsed = homeCustomerReviewsStorageSchema.parse(payload);
    await db.settings.upsert({
      where: { key: HOME_CUSTOMER_REVIEWS_SETTINGS_KEY },
      update: {
        value: parsed as object,
        updatedAt: new Date(),
        description:
          "Home customer reviews — section title (locales), testimonials (rating, text, author, photo URLs, active, order)",
      },
      create: {
        key: HOME_CUSTOMER_REVIEWS_SETTINGS_KEY,
        value: parsed as object,
        description:
          "Home customer reviews — section title (locales), testimonials (rating, text, author, photo URLs, active, order)",
      },
    });
    await invalidateHomeCustomerReviewsPublicCache();
    return parsed;
  },
};
