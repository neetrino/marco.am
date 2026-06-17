import { db } from "@white-shop/db";

const DEFAULT_LOCALE = "en";

type AttributeValueRow = {
  id: string;
  value: string;
  colors: unknown;
  imageUrl: string | null;
  translations: Array<{ label: string }>;
};

type AttributeRow = {
  id: string;
  key: string;
  type: string;
  filterable: boolean;
  translations: Array<{ name: string }>;
  values: AttributeValueRow[];
};

function parseColors(colorsData: unknown): string[] {
  if (!colorsData) {
    return [];
  }
  if (Array.isArray(colorsData)) {
    return colorsData.filter((color): color is string => typeof color === "string");
  }
  if (typeof colorsData === "string") {
    try {
      const parsed: unknown = JSON.parse(colorsData);
      return Array.isArray(parsed)
        ? parsed.filter((color): color is string => typeof color === "string")
        : [];
    } catch {
      return [];
    }
  }
  return [];
}

function mapAttribute(attribute: AttributeRow) {
  const translation = attribute.translations[0];
  return {
    id: attribute.id,
    key: attribute.key,
    name: translation?.name ?? attribute.key,
    type: attribute.type,
    filterable: attribute.filterable,
    values: attribute.values.map((value) => {
      const valueTranslation = value.translations[0];
      return {
        id: value.id,
        value: value.value,
        label: valueTranslation?.label ?? value.value,
        colors: parseColors(value.colors),
        imageUrl: value.imageUrl,
      };
    }),
  };
}

class AdminAttributesReadService {
  /** Admin attributes list with values (locale-scoped labels). */
  async getAttributes(locale: string = DEFAULT_LOCALE) {
    const attributes = await db.attribute.findMany({
      include: {
        translations: {
          where: { locale },
          take: 1,
        },
        values: {
          include: {
            translations: {
              where: { locale },
              take: 1,
            },
          },
          orderBy: { position: "asc" },
        },
      },
      orderBy: { position: "asc" },
    });

    return {
      data: attributes.map((attribute) => mapAttribute(attribute as AttributeRow)),
    };
  }
}

export const adminAttributesReadService = new AdminAttributesReadService();
