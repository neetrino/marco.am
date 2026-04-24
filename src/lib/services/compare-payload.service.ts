import { Prisma } from "@prisma/client";
import { db } from "@white-shop/db";
import {
  COMPARE_MAX_LIST_ITEMS,
  COMPARE_MAX_PER_CATEGORY,
} from "@/lib/constants/compare-session";
import {
  COMPARE_UNCATEGORIZED_ID,
  resolveCompareCategoryId,
  uncategorizedCategoryTitle,
} from "@/lib/compare/compare-category";
import { pickLocalizedByApiLocale, type ApiLocale } from "@/lib/i18n/api-locale";
import { extractMediaUrl } from "@/lib/utils/extractMediaUrl";
import {
  buildTechnicalSpecifications,
  type ProductTechnicalSpecification,
} from "@/lib/services/products-slug/technical-specifications";

type CompareProductWithRelations = {
  id: string;
  primaryCategoryId: string | null;
  categoryIds: string[];
  media: Prisma.JsonValue[] | null;
  translations: Array<{ locale: string; title: string; slug: string }>;
  brand:
    | {
        id: string;
        slug: string;
        translations: Array<{ locale: string; name: string }>;
      }
    | null;
  categories: Array<{
    id: string;
    translations: Array<{ locale: string; title: string }>;
  }>;
  variants: Array<{
    published: boolean;
    stock: number;
    price: number;
    compareAtPrice: number | null;
    imageUrl: string | null;
    options: Array<{
      attributeKey: string | null;
      value: string | null;
      attributeValue:
        | {
            value: string;
            translations: Array<{ locale: string; label: string }>;
            attribute: { key: string } | null;
          }
        | null;
    }>;
  }>;
  productAttributes: Array<{
    attribute: {
      key: string;
      translations: Array<{ locale: string; name: string }>;
      values: Array<{
        value: string;
        translations: Array<{ locale: string; label: string }>;
      }>;
    };
  }>;
};

export type CompareApiSpec = {
  key: string;
  name: string;
  value: string;
};

export type CompareApiSpecRow = {
  key: string;
  name: string;
  valuesByProductId: Record<string, string | null>;
  different: boolean;
};

export type CompareApiItem = {
  productId: string;
  title: string;
  slug: string;
  image: string | null;
  brand: {
    id: string;
    name: string;
  } | null;
  price: number;
  originalPrice: number | null;
  compareAtPrice: number | null;
  discountPercent: number | null;
  inStock: boolean;
  addedAt: string;
  specifications: CompareApiSpec[];
  category: {
    id: string;
    name: string;
  };
};

export type CompareApiSection = {
  categoryId: string;
  categoryName: string;
  items: CompareApiItem[];
  specRows: CompareApiSpecRow[];
};

export type CompareApiPayload = {
  compare: {
    id: string;
    /** @deprecated use maxItemsPerCategory */
    maxItems: number;
    maxItemsPerCategory: number;
    maxListItems: number;
    items: CompareApiItem[];
    sections: CompareApiSection[];
  };
  specRows: CompareApiSpecRow[];
};

function normalizeComparableValue(value: string | null): string {
  return (value ?? "").trim().toLowerCase();
}

function resolveCategoryMetaForProduct(
  product: CompareProductWithRelations,
  locale: ApiLocale
): { id: string; name: string } {
  const id = resolveCompareCategoryId({
    primaryCategoryId: product.primaryCategoryId,
    categoryIds: product.categoryIds,
  });
  if (id === COMPARE_UNCATEGORIZED_ID) {
    return { id, name: uncategorizedCategoryTitle(locale) };
  }
  const cat = product.categories.find((c) => c.id === id);
  if (!cat) {
    return { id, name: id };
  }
  const tr = pickLocalizedByApiLocale(cat.translations, locale);
  return { id, name: tr?.title ?? cat.translations[0]?.title ?? id };
}

function buildCompareSpecRows(items: CompareApiItem[]): CompareApiSpecRow[] {
  const specNames = new Map<string, string>();
  const valuesByKey = new Map<string, Record<string, string | null>>();

  for (const item of items) {
    for (const spec of item.specifications) {
      specNames.set(spec.key, spec.name);
      const rowValues = valuesByKey.get(spec.key) ?? {};
      rowValues[item.productId] = spec.value;
      valuesByKey.set(spec.key, rowValues);
    }
  }

  return Array.from(valuesByKey.entries())
    .map(([key, rowValues]) => {
      const completedValues = items.reduce<Record<string, string | null>>(
        (acc, item) => {
          acc[item.productId] = rowValues[item.productId] ?? null;
          return acc;
        },
        {}
      );
      const normalizedUnique = new Set(
        Object.values(completedValues)
          .map((value) => normalizeComparableValue(value))
          .filter((value) => value.length > 0)
      );
      return {
        key,
        name: specNames.get(key) ?? key,
        valuesByProductId: completedValues,
        different: normalizedUnique.size > 1,
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

function buildCompareSections(items: CompareApiItem[]): CompareApiSection[] {
  const buckets = new Map<string, CompareApiItem[]>();
  for (const item of items) {
    const key = item.category.id;
    const list = buckets.get(key) ?? [];
    list.push(item);
    buckets.set(key, list);
  }

  return Array.from(buckets.entries())
    .map(([, group]) => {
      const visible = group.slice(0, COMPARE_MAX_PER_CATEGORY);
      return {
        categoryId: group[0]!.category.id,
        categoryName: group[0]!.category.name,
        items: visible,
        specRows: buildCompareSpecRows(visible),
      };
    })
    .sort((a, b) => a.categoryName.localeCompare(b.categoryName));
}

function mapVariantSpecifications(
  product: CompareProductWithRelations,
  locale: ApiLocale
): ProductTechnicalSpecification[] {
  const variantForSpecs = product.variants.map((variant) => ({
    options: variant.options.map((option) => ({
      key: option.attributeKey ?? undefined,
      value: option.value ?? undefined,
      attributeValue: option.attributeValue
        ? {
            value: option.attributeValue.value,
            translations: option.attributeValue.translations.map((translation) => ({
              locale: translation.locale,
              label: translation.label,
            })),
            attribute: option.attributeValue.attribute
              ? {
                  key: option.attributeValue.attribute.key,
                }
              : undefined,
          }
        : undefined,
    })),
  }));

  const productAttributes = product.productAttributes.map((productAttribute) => ({
    attribute: {
      key: productAttribute.attribute.key,
      translations: productAttribute.attribute.translations.map((translation) => ({
        locale: translation.locale,
        name: translation.name,
      })),
      values: productAttribute.attribute.values.map((attributeValue) => ({
        value: attributeValue.value,
        translations: attributeValue.translations.map((translation) => ({
          locale: translation.locale,
          label: translation.label,
        })),
      })),
    },
  }));

  return buildTechnicalSpecifications(productAttributes, variantForSpecs, locale);
}

function computePricing(product: CompareProductWithRelations): {
  price: number;
  originalPrice: number | null;
  compareAtPrice: number | null;
  discountPercent: number | null;
} {
  const variants = product.variants.filter((variant) => variant.published);
  const source = variants.length > 0 ? variants : product.variants;
  const price = source.length > 0 ? Math.min(...source.map((variant) => variant.price)) : 0;
  const compareAtValues = source
    .map((variant) => variant.compareAtPrice)
    .filter((value): value is number => typeof value === "number" && value > price);
  const originalPrice =
    compareAtValues.length > 0 ? Math.max(...compareAtValues) : null;
  const compareAtPrice = originalPrice;
  const discountPercent =
    originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : null;

  return { price, originalPrice, compareAtPrice, discountPercent };
}

async function fetchCompareProducts(productIds: string[]) {
  const records = await db.product.findMany({
    where: {
      id: { in: productIds },
      published: true,
      deletedAt: null,
    },
    include: {
      translations: true,
      brand: {
        include: {
          translations: true,
        },
      },
      categories: {
        include: {
          translations: true,
        },
      },
      variants: {
        include: {
          options: {
            include: {
              attributeValue: {
                include: {
                  translations: true,
                  attribute: true,
                },
              },
            },
          },
        },
        orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      },
      productAttributes: {
        include: {
          attribute: {
            include: {
              translations: true,
              values: {
                include: {
                  translations: true,
                },
              },
            },
          },
        },
      },
    },
  });
  return records as unknown as CompareProductWithRelations[];
}

export async function buildComparePayload(
  compareListId: string,
  locale: ApiLocale
): Promise<CompareApiPayload> {
  const rows = await db.compareItem.findMany({
    where: { compareListId },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: {
      productId: true,
      createdAt: true,
    },
  });

  if (rows.length === 0) {
    return {
      compare: {
        id: compareListId,
        maxItems: COMPARE_MAX_PER_CATEGORY,
        maxItemsPerCategory: COMPARE_MAX_PER_CATEGORY,
        maxListItems: COMPARE_MAX_LIST_ITEMS,
        items: [],
        sections: [],
      },
      specRows: [],
    };
  }

  const productIds = rows.map((row) => row.productId);
  const products = await fetchCompareProducts(productIds);
  const productById = new Map(products.map((product) => [product.id, product]));

  const items: CompareApiItem[] = rows.flatMap((row) => {
    const product = productById.get(row.productId);
    if (!product) {
      return [];
    }

    const translation = pickLocalizedByApiLocale(product.translations, locale);
    if (!translation) {
      return [];
    }

    const pricing = computePricing(product);
    const specifications = mapVariantSpecifications(product, locale).map((spec) => ({
      key: spec.key,
      name: spec.name,
      value: spec.value,
    }));
    const brandTranslation = product.brand
      ? pickLocalizedByApiLocale(product.brand.translations, locale)
      : null;
    const category = resolveCategoryMetaForProduct(product, locale);

    return [
      {
        productId: product.id,
        title: translation.title,
        slug: translation.slug,
        image:
          extractMediaUrl(product.media) ??
          product.variants.find((variant) => variant.imageUrl)?.imageUrl ??
          null,
        brand: product.brand
          ? {
              id: product.brand.id,
              name: brandTranslation?.name ?? product.brand.slug,
            }
          : null,
        price: pricing.price,
        originalPrice: pricing.originalPrice,
        compareAtPrice: pricing.compareAtPrice,
        discountPercent: pricing.discountPercent,
        inStock: product.variants.some(
          (variant) => variant.published && variant.stock > 0
        ),
        addedAt: row.createdAt.toISOString(),
        specifications,
        category,
      },
    ];
  });

  const specRows = buildCompareSpecRows(items);
  const sections = buildCompareSections(items);

  return {
    compare: {
      id: compareListId,
      maxItems: COMPARE_MAX_PER_CATEGORY,
      maxItemsPerCategory: COMPARE_MAX_PER_CATEGORY,
      maxListItems: COMPARE_MAX_LIST_ITEMS,
      items,
      sections,
    },
    specRows,
  };
}
