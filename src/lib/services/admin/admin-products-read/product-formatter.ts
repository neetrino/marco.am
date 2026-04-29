import { pickVariantForListingPrice } from '@/lib/product-variant-listing-pick';

/**
 * Format product for list response
 */
export function formatProductForList(product: {
  id: string;
  primaryCategoryId?: string | null;
  published: boolean;
  featured: boolean | null;
  productClass?: "retail" | "wholesale";
  discountPercent: number | null;
  createdAt: Date;
  translations?: Array<{
    slug: string;
    title: string;
  }>;
  categories?: Array<{
    id: string;
    translations?: Array<{ locale: string; title: string }>;
  }>;
  variants?: Array<{
    price: number;
    stock: number;
    compareAtPrice: number | null;
  }>;
  media?: unknown[];
}) {
  // Безопасное получение translation с проверкой на существование массива
  const translation = Array.isArray(product.translations) && product.translations.length > 0
    ? product.translations[0]
    : null;
  
  const variant = pickVariantForListingPrice(product.variants ?? []);
  
  const image = extractImageFromMedia(product.media);

  const rawCategories = product.categories ?? [];
  const primaryId = product.primaryCategoryId ?? null;
  const sortedCategories = [...rawCategories].sort((a, b) => {
    if (a.id === primaryId) return -1;
    if (b.id === primaryId) return 1;
    return 0;
  });
  const categories = sortedCategories
    .map((cat) => {
      const trs = Array.isArray(cat.translations) ? cat.translations : [];
      const tr = trs.find((t) => t.locale === "en") ?? trs[0];
      const title = tr?.title?.trim() ?? "";
      return { id: cat.id, title };
    })
    .filter((c) => c.title.length > 0);

  return {
    id: product.id,
    slug: translation?.slug || "",
    title: translation?.title || "",
    productClass: product.productClass || "retail",
    published: product.published,
    featured: product.featured || false,
    price: variant?.price || 0,
    stock: variant?.stock || 0,
    discountPercent: product.discountPercent || 0,
    compareAtPrice: variant?.compareAtPrice || null,
    colorStocks: [], // Can be enhanced later
    image,
    createdAt: product.createdAt.toISOString(),
    categories,
  };
}

/**
 * Extract image from media array
 */
function extractImageFromMedia(media: unknown[] | undefined): string | null {
  if (!Array.isArray(media) || media.length === 0) {
    return null;
  }

  const firstMedia = media[0];
  
  if (typeof firstMedia === "string") {
    return firstMedia;
  }
  
  if (firstMedia && typeof firstMedia === "object" && "url" in firstMedia) {
    const mediaObj = firstMedia as { url?: string };
    return mediaObj.url || null;
  }

  return null;
}




