import { Prisma } from '@white-shop/db/prisma';
import { db } from '@white-shop/db';
import {
  pickLocalizedByApiLocale,
  resolveApiLocale,
  type ApiLocale,
} from '@/lib/i18n/api-locale';
import { resolveListingHeroImageUrl } from '@/lib/products/product-gallery-urls';
import { processImageUrl } from '@/lib/utils/image-utils';
import { resolveProductPrice } from '@/lib/pricing/product-price';
import { resolveEffectiveDiscount, type TypedDiscountInput } from '@/lib/discount/discount-expiry';
import {
  buildOperationalCategorySearchWhere,
  buildOperationalProductSearchWhere,
} from '@/lib/product-search/operational-where';

const DEFAULT_PRODUCT_LIMIT = 8;
const DEFAULT_CATEGORY_LIMIT = 4;
const MAX_LIMIT = 20;
const MIN_LIMIT = 1;
type DiscountFields = {
  discountType?: string | null;
  discountValue?: number | null;
  discountExpiresAt?: Date | null;
};

type ProductSearchRecord = DiscountFields & {
  id: string;
  primaryCategoryId: string | null;
  media: Prisma.JsonValue[] | null;
  translations: Array<{ locale: string; slug: string; title: string }>;
  variants: Array<DiscountFields & { price: number; imageUrl: string | null }>;
  categories: Array<{
    id: string;
    translations: Array<{ locale: string; title: string }>;
  }>;
};

function toTypedDiscount(source: DiscountFields | null | undefined): TypedDiscountInput {
  return {
    type: (source?.discountType ?? 'NONE') as TypedDiscountInput['type'],
    value: source?.discountValue ?? null,
    expiresAt: source?.discountExpiresAt ?? null,
  };
}

type CategorySearchRecord = {
  id: string;
  translations: Array<{ locale: string; slug: string; title: string; fullPath: string }>;
};

export interface InstantSearchDbClient {
  product: {
    findMany: (_args: Prisma.ProductFindManyArgs) => Promise<ProductSearchRecord[]>;
  };
  category: {
    findMany: (_args: Prisma.CategoryFindManyArgs) => Promise<CategorySearchRecord[]>;
  };
}

interface InstantSearchProductResult {
  id: string;
  slug: string;
  title: string;
  price: number;
  compareAtPrice: number | null;
  image: string | null;
  category: string | null;
  href: string;
}

interface InstantSearchCategoryResult {
  id: string;
  slug: string;
  title: string;
  fullPath: string;
  href: string;
}

interface InstantSearchSuggestionItem {
  id: string;
  type: 'product' | 'category';
  title: string;
  subtitle: string | null;
  href: string;
}

interface InstantSearchResponse {
  query: string;
  locale: ApiLocale;
  results: InstantSearchProductResult[];
  categories: InstantSearchCategoryResult[];
  suggestions: InstantSearchSuggestionItem[];
  meta: {
    productLimit: number;
    categoryLimit: number;
  };
}

interface InstantSearchRequestParams {
  query: string;
  locale: ApiLocale;
  productLimit: number;
  categoryLimit: number;
}

function pickTranslation<T extends { locale: string }>(
  items: T[],
  locale: ApiLocale,
): T | null {
  return pickLocalizedByApiLocale(items, locale);
}

function parseLimit(rawLimit: string | null, fallback: number): number {
  const parsed = Number(rawLimit);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  const rounded = Math.floor(parsed);
  if (rounded < MIN_LIMIT) {
    return fallback;
  }
  return Math.min(rounded, MAX_LIMIT);
}

function mapProductResult(
  product: ProductSearchRecord,
  locale: ApiLocale,
): InstantSearchProductResult | null {
  const translation = pickTranslation(product.translations, locale);
  if (!translation) {
    return null;
  }

  const firstVariant = product.variants[0];
  const pricing = resolveProductPrice({
    standardPrice: firstVariant?.price ?? 0,
    discount: resolveEffectiveDiscount({
      variant: toTypedDiscount(firstVariant),
      product: toTypedDiscount(product),
    }),
  });
  let image = resolveListingHeroImageUrl(product.media, product.variants);
  if (!image && firstVariant?.imageUrl) {
    image = processImageUrl(firstVariant.imageUrl);
  }

  const primaryCategory = product.primaryCategoryId
    ? product.categories.find((category) => category.id === product.primaryCategoryId)
    : undefined;
  const category = primaryCategory ?? product.categories[0];
  const categoryTranslation = category
    ? pickTranslation(category.translations, locale)
    : undefined;

  return {
    id: product.id,
    slug: translation.slug,
    title: translation.title,
    price: pricing.currentPrice,
    compareAtPrice: pricing.compareAtPrice ?? pricing.oldPrice,
    image,
    category: categoryTranslation?.title ?? null,
    href: `/products/${translation.slug}`,
  };
}

function mapCategoryResult(
  category: CategorySearchRecord,
  locale: ApiLocale
): InstantSearchCategoryResult | null {
  const translation = pickTranslation(category.translations, locale);
  if (!translation) {
    return null;
  }

  return {
    id: category.id,
    slug: translation.slug,
    title: translation.title,
    fullPath: translation.fullPath,
    href: `/products?category=${encodeURIComponent(translation.slug)}`,
  };
}

function createEmptyResponse(params: InstantSearchRequestParams): InstantSearchResponse {
  return {
    query: params.query,
    locale: params.locale,
    results: [],
    categories: [],
    suggestions: [],
    meta: {
      productLimit: params.productLimit,
      categoryLimit: params.categoryLimit,
    },
  };
}

export function parseInstantSearchRequest(args: {
  searchParams: URLSearchParams;
  acceptLanguageRaw?: string | null;
}): InstantSearchRequestParams {
  const { searchParams } = args;
  const query = searchParams.get('q')?.trim() ?? '';
  const localeResolution = resolveApiLocale({
    localeRaw: searchParams.get('locale'),
    langRaw: searchParams.get('lang'),
    acceptLanguageRaw: args.acceptLanguageRaw,
    fallbackLocale: 'hy',
  });
  const locale = localeResolution.resolvedLocale;
  const explicitLimit = searchParams.get('limit');
  const productLimit = parseLimit(
    searchParams.get('productLimit') ?? explicitLimit,
    DEFAULT_PRODUCT_LIMIT
  );
  const categoryLimit = parseLimit(
    searchParams.get('categoryLimit'),
    Math.min(productLimit, DEFAULT_CATEGORY_LIMIT)
  );

  return {
    query,
    locale,
    productLimit,
    categoryLimit,
  };
}

export async function searchInstant(
  params: InstantSearchRequestParams,
  client: InstantSearchDbClient = db as unknown as InstantSearchDbClient
): Promise<InstantSearchResponse> {
  if (!params.query) {
    return createEmptyResponse(params);
  }

  const [products, categories] = await Promise.all([
    client.product.findMany({
      where: {
        published: true,
        deletedAt: null,
        ...buildOperationalProductSearchWhere(params.query),
      },
      take: params.productLimit,
      include: {
        translations: true,
        variants: {
          where: { published: true },
          orderBy: { price: 'asc' },
          take: 1,
        },
        categories: {
          include: {
            translations: true,
          },
        },
      },
    }),
    client.category.findMany({
      where: {
        published: true,
        deletedAt: null,
        ...buildOperationalCategorySearchWhere(params.query),
      },
      take: params.categoryLimit,
      include: {
        translations: true,
      },
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
    }),
  ]);

  const productResults = products
    .map((product) => mapProductResult(product, params.locale))
    .filter((result): result is InstantSearchProductResult => result !== null);

  const categoryResults = categories
    .map((category) => mapCategoryResult(category, params.locale))
    .filter((result): result is InstantSearchCategoryResult => result !== null);

  const suggestions: InstantSearchSuggestionItem[] = [
    ...productResults.map((item) => ({
      id: item.id,
      type: 'product' as const,
      title: item.title,
      subtitle: item.category,
      href: item.href,
    })),
    ...categoryResults.map((item) => ({
      id: item.id,
      type: 'category' as const,
      title: item.title,
      subtitle: item.fullPath,
      href: item.href,
    })),
  ];

  return {
    query: params.query,
    locale: params.locale,
    results: productResults,
    categories: categoryResults,
    suggestions,
    meta: {
      productLimit: params.productLimit,
      categoryLimit: params.categoryLimit,
    },
  };
}
