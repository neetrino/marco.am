import { Prisma } from "@white-shop/db/prisma";
import { db } from "@white-shop/db";
import {
  LISTING_CARD_SELECT,
  mapListingRowToCard,
  type PlpReadModelProduct,
} from "@/lib/read-model/product-listing-card-mapper";

const DEFAULT_RELATED_LIMIT = 10;
const MAX_RELATED_LIMIT = 24;
/** Extra rows fetched so we can skip the current product and still fill the page. */
const RELATED_FETCH_BUFFER = 1;

type RelatedRule = "category" | "brand" | "other";

type RelatedProductWithRule = PlpReadModelProduct & {
  recommendationRule: RelatedRule;
};

type RelatedAnchor = {
  id: string;
  primaryCategoryId: string | null;
  brandId: string | null;
};

type RelatedProductsResponse = {
  data: RelatedProductWithRule[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
    rules: {
      category: number;
      brand: number;
      other: number;
    };
  };
};

function normalizeOffset(offset?: number): number {
  if (!Number.isInteger(offset) || (offset ?? 0) < 0) {
    return 0;
  }
  return offset ?? 0;
}

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

/**
 * Related products served entirely from the listing read-model. Ancestor categories
 * are denormalized into each row's `categoryIds`, so the "same category subtree"
 * scope is a single GIN array match — no operational category-tree walk.
 */
class ProductsRelatedService {
  private async loadRelatedAnchor(slug: string): Promise<RelatedAnchor> {
    const row = await db.productListingRow.findFirst({
      where: {
        slug,
        isPublished: true,
        deletedAt: null,
      },
      select: {
        productId: true,
        primaryCategoryId: true,
        brandId: true,
      },
    });

    if (!row) {
      throw productNotFoundError(slug);
    }

    return {
      id: row.productId,
      primaryCategoryId: row.primaryCategoryId,
      brandId: row.brandId,
    };
  }

  private async fetchCandidates(
    lang: string,
    limit: number,
    excludeIds: Set<string>,
    scope: Prisma.ProductListingRowWhereInput,
  ): Promise<PlpReadModelProduct[]> {
    const rows = await db.productListingRow.findMany({
      where: {
        locale: lang,
        isPublished: true,
        deletedAt: null,
        productId: { notIn: Array.from(excludeIds) },
        ...scope,
      },
      orderBy: [{ hasPrice: "desc" }, { productCreatedAt: "desc" }],
      take: limit,
      select: LISTING_CARD_SELECT,
    });
    return rows.map(mapListingRowToCard);
  }

  async findBySlug(
    slug: string,
    lang: string,
    requestedLimit?: number,
    requestedOffset?: number,
  ): Promise<RelatedProductsResponse> {
    const limit = normalizeLimit(requestedLimit);
    const offset = normalizeOffset(requestedOffset);
    const targetCount = offset + limit;
    const batchLimit = targetCount + RELATED_FETCH_BUFFER;
    const baseProduct = await this.loadRelatedAnchor(slug);
    const selectedProducts: RelatedProductWithRule[] = [];
    const seenProductIds = new Set<string>([baseProduct.id]);

    const tryAppendProducts = (products: PlpReadModelProduct[], rule: RelatedRule): void => {
      for (const candidate of products) {
        if (selectedProducts.length >= targetCount) {
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

    const needsMoreCandidates = () => selectedProducts.length < targetCount;

    if (baseProduct.primaryCategoryId && needsMoreCandidates()) {
      const categoryBatch = await this.fetchCandidates(lang, batchLimit, seenProductIds, {
        categoryIds: { has: baseProduct.primaryCategoryId },
      });
      tryAppendProducts(categoryBatch, "category");
    }

    if (baseProduct.brandId && needsMoreCandidates()) {
      const brandBatch = await this.fetchCandidates(lang, batchLimit, seenProductIds, {
        brandId: baseProduct.brandId,
      });
      tryAppendProducts(brandBatch, "brand");
    }

    if (needsMoreCandidates()) {
      const otherBatch = await this.fetchCandidates(lang, batchLimit, seenProductIds, {});
      tryAppendProducts(otherBatch, "other");
    }

    const data = selectedProducts.slice(offset, offset + limit);
    const rules = data.reduce(
      (acc, item) => {
        acc[item.recommendationRule] += 1;
        return acc;
      },
      {
        category: 0,
        brand: 0,
        other: 0,
      },
    );

    return {
      data,
      meta: {
        total: selectedProducts.length,
        limit,
        offset,
        hasMore: selectedProducts.length >= targetCount,
        rules,
      },
    };
  }
}

export const productsRelatedService = new ProductsRelatedService();
