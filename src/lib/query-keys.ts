import type { LanguageCode } from "@/lib/language";

export const queryKeys = {
  productDetail: (slug: string, lang: LanguageCode) =>
    ["api", "v1", "products", "detail", slug, lang] as const,
  productsList: (params: Record<string, string | undefined>) =>
    ["api", "v1", "products", "list", params] as const,
  featuredHomeStrip: (filter: string, lang: LanguageCode, limit: number) =>
    ["api", "v1", "products", "featured-home", filter, lang, limit] as const,
  specialOffersPromotion: (lang: LanguageCode, limit: number) =>
    ["api", "v1", "products", "special-offers", "promotion", lang, limit] as const,
};
