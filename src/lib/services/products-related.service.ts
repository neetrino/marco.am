import { Prisma } from "@white-shop/db/prisma";
import { db } from "@white-shop/db";
import { getAllChildCategoryIds } from "./products-find-query/category-utils";
import { executePlpLeanListingQuery } from "./products-find-query/plp-lean-listing-query";
import { productsFindTransformService } from "./products-find-transform.service";

const DEFAULT_RELATED_LIMIT = 10;
const MAX_RELATED_LIMIT = 24;
/** Extra rows fetched so we can skip the current product and still fill the page. */
const RELATED_FETCH_BUFFER = 1;

type RelatedRule = "category" | "brand" | "other";

type RelatedProduct = {
  id: string;
  slug: string;
  title: string;
  price: number;
  defaultVariantId?: string | null;
  originalPrice?: number | null;
  compareAtPrice: number | null;
  discountPercent?: number | null;
  isSpecialPrice?: boolean;
  image: string | null;
  inStock: boolean;
  brand?: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
  } | null;
  categories?: Array<{ id: string; slug: string; title: string }>;
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

async function buildCategoryScopeWhere(categoryId: string): Promise<Prisma.ProductWhereInput> {
  const childCategoryIds = await getAllChildCategoryIds(categoryId);
  const allCategoryIds = [categoryId, ...childCategoryIds];
  const categoryConditions = allCategoryIds.flatMap((catId) => [
    { primaryCategoryId: catId },
    { categoryIds: { has: catId } },
  ]);
  return { OR: categoryConditions };
}

class ProductsRelatedService {
  private async loadRelatedAnchor(slug: string): Promise<RelatedAnchor> {
    const row = await db.product.findFirst({
      where: {
        published: true,
        deletedAt: null,
        translations: { some: { slug } },
      },
      select: {
        id: true,
        primaryCategoryId: true,
        brandId: true,
      },
    });

    if (!row) {
      throw productNotFoundError(slug);
    }

    return {
      id: row.id,
      primaryCategoryId: row.primaryCategoryId,
      brandId: row.brandId,
    };
  }

  private async fetchLeanCandidates(
    lang: string,
    limit: number,
    excludeIds: Set<string>,
    scopeWhere: Prisma.ProductWhereInput,
  ): Promise<RelatedProduct[]> {
    const products = await executePlpLeanListingQuery(
      {
        published: true,
        deletedAt: null,
        id: { notIn: Array.from(excludeIds) },
        ...scopeWhere,
      },
      limit,
      0,
      { lang },
    );
    if (products.length === 0) {
      return [];
    }
    const transformed = await productsFindTransformService.transformProducts(products, lang);
    return transformed as RelatedProduct[];
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

    const tryAppendProducts = (products: RelatedProduct[], rule: RelatedRule): void => {
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
      const categoryWhere = await buildCategoryScopeWhere(baseProduct.primaryCategoryId);
      const categoryBatch = await this.fetchLeanCandidates(
        lang,
        batchLimit,
        seenProductIds,
        categoryWhere,
      );
      tryAppendProducts(categoryBatch, "category");
    }

    if (baseProduct.brandId && needsMoreCandidates()) {
      const brandBatch = await this.fetchLeanCandidates(
        lang,
        batchLimit,
        seenProductIds,
        { brandId: baseProduct.brandId },
      );
      tryAppendProducts(brandBatch, "brand");
    }

    if (needsMoreCandidates()) {
      const otherBatch = await this.fetchLeanCandidates(lang, batchLimit, seenProductIds, {});
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
