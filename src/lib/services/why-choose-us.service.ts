import { db } from "@white-shop/db";
import {
  WHY_CHOOSE_US_SETTINGS_KEY,
  WHY_CHOOSE_US_STORAGE_VERSION,
} from "@/lib/constants/why-choose-us";
import {
  whyChooseUsStorageSchema,
  type WhyChooseUsIconKey,
  type WhyChooseUsStorage,
} from "@/lib/schemas/why-choose-us.schema";
import { logger } from "@/lib/utils/logger";

type HomeLocale = "en" | "hy" | "ru";

export type WhyChooseUsPublicItem = {
  id: string;
  title: string;
  body: string;
  iconKey: WhyChooseUsIconKey;
  sortOrder: number;
};

export type WhyChooseUsPublicPayload = {
  sectionTitle: string;
  items: WhyChooseUsPublicItem[];
};

const DEFAULT_STORAGE: WhyChooseUsStorage = {
  version: WHY_CHOOSE_US_STORAGE_VERSION,
  sectionTitle: {
    en: "Why choose us",
    hy: "Ինչու ընտրել մեզ",
    ru: "Почему мы",
  },
  items: [
    {
      id: "warranty",
      iconKey: "warranty",
      title: {
        en: "Official warranty",
        hy: "Պաշտոնական երաշխիք",
        ru: "Официальная гарантия",
      },
      body: {
        en: "Certified service and warranty on electronics.",
        hy: "Վավերացված սպասարկում և երաշխիք էլեկտրոնիկայի համար։",
        ru: "Сертифицированный сервис и гарантия на электронику.",
      },
      active: true,
      sortOrder: 0,
    },
    {
      id: "fast_delivery",
      iconKey: "fast_delivery",
      title: {
        en: "Fast delivery",
        hy: "Արագ առաքում",
        ru: "Быстрая доставка",
      },
      body: {
        en: "Quick shipping across Armenia.",
        hy: "Առաքում ամբողջ Հայաստանում։",
        ru: "Доставка по всей Армении.",
      },
      active: true,
      sortOrder: 1,
    },
    {
      id: "installment",
      iconKey: "installment",
      title: {
        en: "Installment plans",
        hy: "Ապառիկ վճարում",
        ru: "Рассрочка",
      },
      body: {
        en: "Flexible payment options for your purchase.",
        hy: "Ճկուն վճարման տարբերակներ։",
        ru: "Гибкие способы оплаты.",
      },
      active: true,
      sortOrder: 2,
    },
    {
      id: "original",
      iconKey: "original",
      title: {
        en: "Original products",
        hy: "Բնօրինակ ապրանքներ",
        ru: "Оригинальные товары",
      },
      body: {
        en: "Only genuine brands and official supply.",
        hy: "Միայն բնօրինակ բրենդներ և պաշտոնական մատակարարում։",
        ru: "Только оригинальные бренды и официальные поставки.",
      },
      active: true,
      sortOrder: 3,
    },
  ],
};

function normalizeLocale(raw: string | undefined): HomeLocale {
  if (raw === "en" || raw === "hy" || raw === "ru") {
    return raw;
  }
  return "en";
}

function parseStored(raw: unknown): WhyChooseUsStorage | null {
  const parsed = whyChooseUsStorageSchema.safeParse(raw);
  if (!parsed.success) {
    logger.warn("[whyChooseUs] Invalid stored payload", parsed.error.flatten());
    return null;
  }
  return parsed.data;
}

async function loadStorage(): Promise<WhyChooseUsStorage> {
  const row = await db.settings.findUnique({
    where: { key: WHY_CHOOSE_US_SETTINGS_KEY },
  });
  if (!row) {
    return DEFAULT_STORAGE;
  }
  const valid = parseStored(row.value);
  return valid ?? DEFAULT_STORAGE;
}

function publicItems(
  storage: WhyChooseUsStorage,
  locale: HomeLocale,
): WhyChooseUsPublicItem[] {
  const loc = locale;
  const active = storage.items
    .filter((i) => i.active)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
  const source = active.length > 0 ? active : DEFAULT_STORAGE.items;
  return source.map((i) => ({
    id: i.id,
    title: i.title[loc],
    body: i.body[loc],
    iconKey: i.iconKey,
    sortOrder: i.sortOrder,
  }));
}

export const whyChooseUsService = {
  getDefaultStorage(): WhyChooseUsStorage {
    return DEFAULT_STORAGE;
  },

  async getPublicPayload(
    localeRaw: string | undefined,
  ): Promise<WhyChooseUsPublicPayload> {
    const locale = normalizeLocale(localeRaw);
    const storage = await loadStorage();
    return {
      sectionTitle: storage.sectionTitle[locale],
      items: publicItems(storage, locale),
    };
  },

  async getAdminStorage(): Promise<WhyChooseUsStorage> {
    return loadStorage();
  },

  async updateAdminStorage(
    payload: WhyChooseUsStorage,
  ): Promise<WhyChooseUsStorage> {
    const parsed = whyChooseUsStorageSchema.parse(payload);
    await db.settings.upsert({
      where: { key: WHY_CHOOSE_US_SETTINGS_KEY },
      update: {
        value: parsed as object,
        updatedAt: new Date(),
        description:
          "Home Why choose us — section title (locales), trust items (titles, body, icon preset, active, order)",
      },
      create: {
        key: WHY_CHOOSE_US_SETTINGS_KEY,
        value: parsed as object,
        description:
          "Home Why choose us — section title (locales), trust items (titles, body, icon preset, active, order)",
      },
    });
    return parsed;
  },
};
