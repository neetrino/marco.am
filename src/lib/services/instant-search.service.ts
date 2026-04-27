import { Prisma } from '@white-shop/db/prisma';
import { db } from '@white-shop/db';
import {
  pickLocalizedByApiLocale,
  resolveApiLocale,
  type ApiLocale,
} from '@/lib/i18n/api-locale';
import { extractMediaUrl } from '@/lib/utils/extractMediaUrl';
import { processImageUrl } from '@/lib/utils/image-utils';

const DEFAULT_PRODUCT_LIMIT = 8;
const DEFAULT_CATEGORY_LIMIT = 4;
const MAX_LIMIT = 20;
const MIN_LIMIT = 1;
type ProductSearchRecord = {
  id: string;
  primaryCategoryId: string | null;
  media: Prisma.JsonValue[] | null;
  translations: Array<{ locale: string; slug: string; title: string }>;
  variants: Array<{ price: number; compareAtPrice: number | null; imageUrl: string | null }>;
  categories: Array<{
    id: string;
    translations: Array<{ locale: string; title: string }>;
  }>;
};

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

export interface InstantSearchProductResult {
  id: string;
  slug: string;
  title: string;
  price: number;
  compareAtPrice: number | null;
  image: string | null;
  category: string | null;
  href: string;
}

export interface InstantSearchCategoryResult {
  id: string;
  slug: string;
  title: string;
  fullPath: string;
  href: string;
}

export interface InstantSearchSuggestionItem {
  id: string;
  type: 'product' | 'category';
  title: string;
  subtitle: string | null;
  href: string;
}

export interface InstantSearchResponse {
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

export interface InstantSearchRequestParams {
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

function buildProductSearchWhere(query: string): Prisma.ProductWhereInput {
  const term = query.trim();
  if (!term) {
    return {};
  }

  return {
    OR: [
      {
        translations: {
          some: {
            title: { contains: term, mode: 'insensitive' },
          },
        },
      },
      {
        translations: {
          some: {
            subtitle: { contains: term, mode: 'insensitive' },
          },
        },
      },
      {
        variants: {
          some: {
            sku: { contains: term, mode: 'insensitive' },
          },
        },
      },
    ],
  };
}

function buildCategorySearchWhere(query: string): Prisma.CategoryWhereInput {
  const term = query.trim();
  if (!term) {
    return {};
  }

  return {
    translations: {
      some: {
        OR: [
          { title: { contains: term, mode: 'insensitive' } },
          { slug: { contains: term, mode: 'insensitive' } },
          { fullPath: { contains: term, mode: 'insensitive' } },
        ],
      },
    },
  };
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
  let image = extractMediaUrl(product.media);
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
    price: firstVariant?.price ?? 0,
    compareAtPrice: firstVariant?.compareAtPrice ?? null,
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
        ...buildProductSearchWhere(params.query),
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
        ...buildCategorySearchWhere(params.query),
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
