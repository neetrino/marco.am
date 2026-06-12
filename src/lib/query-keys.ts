import type { LanguageCode } from "@/lib/language";

export const queryKeys = {
  productDetail: (slug: string, lang: LanguageCode) =>
    ["api", "v1", "products", "detail", slug, lang] as const,
  productVisual: (slug: string, lang: LanguageCode) =>
    ["api", "v1", "products", "visual", slug, lang] as const,
  relatedProducts: (slug: string, lang: LanguageCode, limit: number) =>
    ["api", "v1", "products", "related", slug, lang, String(limit)] as const,
  productsCardVisual: (filter: string, lang: LanguageCode, page: number, limit: number) =>
    ["api", "v1", "products", "card-visual", filter, lang, String(page), String(limit)] as const,
  productsList: (params: Record<string, string | undefined>) =>
    ["api", "v1", "products", "list", params] as const,
  featuredHomeStrip: (filter: string, lang: LanguageCode, limit: number) =>
    ["api", "v1", "products", "featured-home", filter, lang, limit] as const,
  specialOffersPromotion: (lang: LanguageCode, limit: number) =>
    ["api", "v1", "products", "special-offers", "promotion", lang, limit] as const,
  homeWhyChooseUs: (lang: LanguageCode) =>
    ["api", "v1", "home", "why-choose-us", lang] as const,
  homeBrandPartners: (locale: LanguageCode) =>
    ["api", "v1", "home", "brand-partners", locale] as const,
  bannersBySlot: (slot: string, locale: LanguageCode) =>
    ["api", "v1", "banners", "slot", slot, locale] as const,
  categoriesTreeRoot: () => ["api", "v1", "categories", "tree"] as const,
  categoriesTree: (lang: LanguageCode) =>
    ["api", "v1", "categories", "tree", lang] as const,
  wishlistProductIdsRoot: () => ["api", "v1", "wishlist", "ids"] as const,
  wishlistProductIds: (lang: LanguageCode) =>
    ["api", "v1", "wishlist", "ids", lang] as const,
  compareProductIdsRoot: () => ["api", "v1", "compare", "ids"] as const,
  compareProductIds: (lang: LanguageCode) =>
    ["api", "v1", "compare", "ids", lang] as const,
  cartRoot: () => ["api", "v1", "cart"] as const,
  cartByAuth: (isLoggedIn: boolean) => ["api", "v1", "cart", isLoggedIn ? "user" : "guest"] as const,
};
