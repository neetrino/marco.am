import { db } from "@white-shop/db";
import { productsService } from "./products.service";

const DEFAULT_RELATED_LIMIT = 10;
const MAX_RELATED_LIMIT = 24;
const QUERY_BATCH_MULTIPLIER = 4;

type RelatedRule = "category" | "brand" | "other";

type RelatedCategory = {
  id: string;
  slug: string;
  title: string;
};

type RelatedBrand = {
  id: string;
  slug: string;
  name: string;
  logo: string | null;
};

type RelatedProduct = {
  id: string;
  slug: string;
  title: string;
  price: number;
  originalPrice?: number | null;
  compareAtPrice: number | null;
  discountPercent?: number | null;
  image: string | null;
  inStock: boolean;
  brand?: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
  } | null;
  categories?: RelatedCategory[];
  variants?: Array<{
    options?: Array<{
      key: string;
      value: string;
    }>;
  }>;
};

type RelatedProductWithRule = RelatedProduct & {
  recommendationRule: RelatedRule;
};

type ProductListResponse = {
  data: RelatedProduct[];
};

type ProductDetailsResponse = {
  id: string;
  slug: string;
  brand: RelatedBrand | null;
  categories: RelatedCategory[];
};

type RelatedProductsResponse = {
  data: RelatedProductWithRule[];
  meta: {
    total: number;
    limit: number;
    rules: {
      category: number;
      brand: number;
      other: number;
    };
  };
};

function normalizeLimit(limit?: number): number {
  if (!Number.isInteger(limit) || (limit ?? 0) <= 0) {
    return DEFAULT_RELATED_LIMIT;
  }
  return Math.min(limit ?? DEFAULT_RELATED_LIMIT, MAX_RELATED_LIMIT);
}

function productNotFoundError(slug: string) {
  return {
    status: 404 as const,
    type: "https://api.shop.am/problems/not-found",
    title: "Product not found",
    detail: `Product with slug '${slug}' does not exist or is not published`,
  };
}

function pickLocalizedString<T extends { locale: string }>(
  rows: T[],
  lang: string,
  pick: (row: T) => string,
): string {
  const exact = rows.find((r) => r.locale === lang);
  if (exact) return pick(exact);
  const en = rows.find((r) => r.locale === "en");
  if (en) return pick(en);
  const first = rows[0];
  return first ? pick(first) : "";
}

function mapCategoryFromTranslations(
  categoryId: string,
  translations: Array<{ locale: string; slug: string; title: string }>,
  lang: string,
): RelatedCategory | null {
  if (translations.length === 0) {
    return null;
  }
  const slug = pickLocalizedString(translations, lang, (t) => t.slug);
  const title = pickLocalizedString(translations, lang, (t) => t.title);
  return { id: categoryId, slug, title };
}

function resolvePrimaryCategoryForRelated(
  primaryCategoryId: string | null,
  linkedCategories: Array<{
    id: string;
    translations: Array<{ locale: string; slug: string; title: string }>;
  }>,
  lang: string,
): RelatedCategory | null {
  if (primaryCategoryId) {
    const primary = linkedCategories.find((c) => c.id === primaryCategoryId);
    if (primary) {
      return mapCategoryFromTranslations(primary.id, primary.translations, lang);
    }
  }
  for (const c of linkedCategories) {
    const mapped = mapCategoryFromTranslations(c.id, c.translations, lang);
    if (mapped) {
      return mapped;
    }
  }
  return null;
}

async function fetchCategoryAnchorIfMissing(
  primaryCategoryId: string,
  lang: string,
): Promise<RelatedCategory | null> {
  const cat = await db.category.findFirst({
    where: { id: primaryCategoryId, deletedAt: null },
    select: {
      id: true,
      translations: {
        select: { locale: true, slug: true, title: true },
        take: 24,
      },
    },
  });
  if (!cat) {
    return null;
  }
  return mapCategoryFromTranslations(cat.id, cat.translations, lang);
}

class ProductsRelatedService {
  private async loadRelatedAnchor(slug: string, lang: string): Promise<ProductDetailsResponse> {
    const row = await db.product.findFirst({
      where: {
        published: true,
        deletedAt: null,
        translations: { some: { slug } },
      },
      select: {
        id: true,
        primaryCategoryId: true,
        brand: {
          select: {
            id: true,
            slug: true,
            logoUrl: true,
            translations: {
              select: { locale: true, name: true },
              take: 24,
            },
          },
        },
        categories: {
          take: 16,
          select: {
            id: true,
            translations: {
              select: { locale: true, slug: true, title: true },
              take: 24,
            },
          },
        },
      },
    });

    if (!row) {
      throw productNotFoundError(slug);
    }

    let primaryCategory = resolvePrimaryCategoryForRelated(
      row.primaryCategoryId,
      row.categories,
      lang,
    );
    if (!primaryCategory && row.primaryCategoryId) {
      primaryCategory = await fetchCategoryAnchorIfMissing(row.primaryCategoryId, lang);
    }

    const brand: RelatedBrand | null = row.brand
      ? {
          id: row.brand.id,
          slug: row.brand.slug,
          name: pickLocalizedString(row.brand.translations, lang, (t) => t.name),
          logo: row.brand.logoUrl,
        }
      : null;

    return {
      id: row.id,
      slug: "",
      brand,
      categories: primaryCategory ? [primaryCategory] : [],
    };
  }

  async findBySlug(slug: string, lang: string, requestedLimit?: number): Promise<RelatedProductsResponse> {
    const limit = normalizeLimit(requestedLimit);
    const baseProduct = await this.loadRelatedAnchor(slug, lang);
    const selectedProducts: RelatedProductWithRule[] = [];
    const seenProductIds = new Set<string>([baseProduct.id]);

    const tryAppendProducts = (products: RelatedProduct[], rule: RelatedRule): void => {
      for (const candidate of products) {
        if (selectedProducts.length >= limit) {
          return;
        }
        if (!candidate.id || seenProductIds.has(candidate.id)) {
          continue;
        }
        seenProductIds.add(candidate.id);
        selectedProducts.push({
          ...candidate,
          recommendationRule: rule,
        });
      }
    };

    const fetchCandidates = async (
      filters: Record<string, string | number | undefined>,
      rule: RelatedRule
    ): Promise<void> => {
      if (selectedProducts.length >= limit) {
        return;
      }

      const batchLimit = Math.max(limit * QUERY_BATCH_MULTIPLIER, limit);
      const response = (await productsService.findAll({
        ...filters,
        lang,
        limit: batchLimit,
        page: 1,
      })) as ProductListResponse;
      tryAppendProducts(response.data, rule);
    };

    const primaryCategorySlug = baseProduct.categories?.[0]?.slug;
    if (primaryCategorySlug) {
      await fetchCandidates(
        {
          category: primaryCategorySlug,
          sort: "popular",
        },
        "category"
      );
    }

    const brandId = baseProduct.brand?.id;
    if (brandId) {
      await fetchCandidates(
        {
          brand: brandId,
          sort: "popular",
        },
        "brand"
      );
    }

    await fetchCandidates(
      {
        sort: "popular",
      },
      "other"
    );

    const data = selectedProducts.slice(0, limit);
    const rules = data.reduce(
      (acc, item) => {
        acc[item.recommendationRule] += 1;
        return acc;
      },
      {
        category: 0,
        brand: 0,
        other: 0,
      }
    );

    return {
      data,
      meta: {
        total: data.length,
        limit,
        rules,
      },
    };
  }
}

export const productsRelatedService = new ProductsRelatedService();
