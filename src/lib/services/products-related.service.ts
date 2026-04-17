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

class ProductsRelatedService {
  async findBySlug(slug: string, lang: string, requestedLimit?: number): Promise<RelatedProductsResponse> {
    const limit = normalizeLimit(requestedLimit);
    const baseProduct = (await productsService.findBySlug(slug, lang)) as ProductDetailsResponse;
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
