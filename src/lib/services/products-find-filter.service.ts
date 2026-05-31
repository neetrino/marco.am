import { getAttributeBucket, isColorAttributeKey, isSizeAttributeKey } from "@/lib/attribute-keys";
import type { ProductFilters, ProductWithRelations } from "./products-find-query/types";
import { productMatchesTechnicalSpecs } from "./products-technical-filters";

/**
 * Normalize comma-separated filter values and drop placeholders like "undefined" or "null".
 */
const normalizeFilterList = (
  value?: string,
  transform?: (v: string) => string
): string[] => {
  if (!value || typeof value !== "string") return [];

  const invalidTokens = new Set(["undefined", "null", ""]);
  const items = value
    .split(",")
    .map((v) => v.trim())
    .filter((v) => !invalidTokens.has(v.toLowerCase()));

  if (transform) {
    return items.map(transform);
  }

  return items;
};

const normalizeBrandTokens = (brand?: string): { raw: Set<string>; normalized: Set<string> } => {
  const rawList = normalizeFilterList(brand);
  const normalizedList = normalizeFilterList(brand, (token) => token.toLowerCase());
  return {
    raw: new Set(rawList),
    normalized: new Set(normalizedList),
  };
};

function normalizeTechnicalSpecsForFastCheck(
  specs?: ProductFilters["technicalSpecs"],
): Record<string, Set<string>> {
  if (!specs || typeof specs !== "object") {
    return {};
  }
  const out: Record<string, Set<string>> = {};
  for (const [k, values] of Object.entries(specs)) {
    if (!Array.isArray(values) || values.length === 0) {
      continue;
    }
    const key = k.trim().toLowerCase();
    if (!key) {
      continue;
    }
    out[key] = new Set(values.map((v) => String(v).trim().toLowerCase()).filter(Boolean));
  }
  return out;
}

function productFastMatchesTechnicalSpecs(
  product: ProductWithRelations,
  normalizedSpecs: Record<string, Set<string>>,
): boolean {
  const entries = Object.entries(normalizedSpecs);
  if (entries.length === 0) {
    return true;
  }
  const variants = Array.isArray(product.variants) ? product.variants : [];
  if (variants.length === 0) {
    return false;
  }

  const bucketsByKey = new Map<string, Set<string>>();
  for (const variant of variants) {
    const options = Array.isArray(variant.options) ? variant.options : [];
    for (const opt of options) {
      const option = opt as VariantOptionLike;
      const keyRaw =
        option.attributeValue?.attribute?.key ??
        option.attributeKey ??
        option.key ??
        option.attribute;
      const key = typeof keyRaw === "string" ? keyRaw.trim().toLowerCase() : "";
      if (!key || key === "color" || key === "size") {
        continue;
      }

      const bucket = bucketsByKey.get(key) ?? new Set<string>();
      const translated =
        option.attributeValue?.translations
          ?.map((tr) => tr.label?.trim().toLowerCase())
          .filter((v): v is string => Boolean(v)) ?? [];
      translated.forEach((v) => bucket.add(v));

      const valueRaw =
        option.attributeValue?.value ??
        option.value ??
        option.label;
      if (typeof valueRaw === "string") {
        const val = valueRaw.trim().toLowerCase();
        if (val) {
          bucket.add(val);
        }
      }
      bucketsByKey.set(key, bucket);
    }

    const attrsRaw = (variant as { attributes?: unknown }).attributes;
    if (attrsRaw && typeof attrsRaw === "object" && !Array.isArray(attrsRaw)) {
      for (const [rawKey, rawVal] of Object.entries(attrsRaw as Record<string, unknown>)) {
        const key = rawKey.trim().toLowerCase();
        if (!key || key === "color" || key === "size") {
          continue;
        }
        const bucket = bucketsByKey.get(key) ?? new Set<string>();
        const arr = Array.isArray(rawVal) ? rawVal : rawVal == null ? [] : [rawVal];
        for (const entry of arr) {
          if (entry && typeof entry === "object" && !Array.isArray(entry)) {
            const obj = entry as { label?: unknown; value?: unknown };
            const fromLabel = typeof obj.label === "string" ? obj.label.trim().toLowerCase() : "";
            const fromValue = typeof obj.value === "string" ? obj.value.trim().toLowerCase() : "";
            if (fromLabel) bucket.add(fromLabel);
            if (fromValue) bucket.add(fromValue);
          } else if (entry != null) {
            const str = String(entry).trim().toLowerCase();
            if (str) bucket.add(str);
          }
        }
        bucketsByKey.set(key, bucket);
      }
    }
  }

  for (const [key, wanted] of entries) {
    const got = bucketsByKey.get(key);
    if (!got) {
      return false;
    }
    let ok = false;
    for (const candidate of wanted) {
      if (got.has(candidate)) {
        ok = true;
        break;
      }
    }
    if (!ok) {
      return false;
    }
  }
  return true;
}

type SupportedSort = "newest" | "popular" | "price-asc" | "price-desc";

function resolveSort(sort?: string): SupportedSort {
  switch (sort) {
    case "price-asc":
      return "price-asc";
    case "price-desc":
    case "price":
      return "price-desc";
    case "popular":
    case "bestseller":
      return "popular";
    case "createdAt":
    case "createdAt-desc":
    case "newest":
    default:
      return "newest";
  }
}

function getMinVariantPrice(product: ProductWithRelations): number {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  if (variants.length === 0) return Number.POSITIVE_INFINITY;
  return Math.min(...variants.map((variant: { price: number }) => variant.price));
}

type VariantRow = ProductWithRelations["variants"][number];
type VariantOptionLike = VariantRow["options"][number] & {
  attributeKey?: string | null;
  key?: string | null;
  attribute?: string | null;
  value?: string | null;
  label?: string | null;
  attributeValue?: {
    value?: string | null;
    translations?: Array<{ locale?: string; label?: string | null }>;
    attribute?: { key?: string | null } | null;
  } | null;
};

function labelFromAttributeValue(
  attr: VariantOptionLike["attributeValue"] extends infer U
    ? U
    : never,
  lang: string,
): string {
  if (!attr) {
    return "";
  }
  const t =
    attr.translations?.find((tr) => tr.locale === lang) ??
    attr.translations?.find((tr) => Boolean(tr?.label)) ??
    null;
  return (t?.label || (attr as { value?: string | null }).value || "").trim();
}

function colorFromOption(opt: VariantOptionLike, lang: string): string | null {
  if (opt.attributeValue && isColorAttributeKey(opt.attributeValue.attribute?.key)) {
    return labelFromAttributeValue(opt.attributeValue, lang).toLowerCase() || null;
  }
  if (isColorAttributeKey(opt.attributeKey) || isColorAttributeKey(opt.key) || isColorAttributeKey(opt.attribute)) {
    const v = (opt.value || opt.label || "").trim().toLowerCase();
    return v || null;
  }
  return null;
}

function sizeFromOption(opt: VariantOptionLike, lang: string): string | null {
  if (opt.attributeValue && isSizeAttributeKey(opt.attributeValue.attribute?.key)) {
    return labelFromAttributeValue(opt.attributeValue, lang).toUpperCase() || null;
  }
  if (isSizeAttributeKey(opt.attributeKey) || isSizeAttributeKey(opt.key) || isSizeAttributeKey(opt.attribute)) {
    const v = (opt.value || opt.label || "").trim().toUpperCase();
    return v || null;
  }
  return null;
}

function colorLabelsFromAttributeBucket(
  raw: Record<string, unknown> | null | undefined,
): string[] {
  const out: string[] = [];
  for (const entry of getAttributeBucket(raw, "color")) {
    const label = String(
      (entry as { label?: string; value?: string }).label ?? (entry as { label?: string; value?: string }).value ?? "",
    )
      .trim()
      .toLowerCase();
    if (label) {
      out.push(label);
    }
  }
  return out;
}

function sizeLabelsFromAttributeBucket(raw: Record<string, unknown> | null | undefined): string[] {
  const out: string[] = [];
  for (const entry of getAttributeBucket(raw, "size")) {
    const label = String(
      (entry as { label?: string; value?: string }).label ?? (entry as { label?: string; value?: string }).value ?? "",
    )
      .trim()
      .toUpperCase();
    if (label) {
      out.push(label);
    }
  }
  return out;
}

function variantColorMatchesList(
  variant: VariantRow,
  colorList: string[],
  lang: string,
): boolean {
  const options = Array.isArray(variant.options) ? variant.options : [];
  for (const opt of options) {
    const c = colorFromOption(opt as VariantOptionLike, lang);
    if (c && colorList.includes(c)) {
      return true;
    }
  }
  const att = variant as { attributes?: unknown };
  if (att.attributes && typeof att.attributes === "object" && !Array.isArray(att.attributes)) {
    for (const label of colorLabelsFromAttributeBucket(att.attributes as Record<string, unknown>)) {
      if (colorList.includes(label)) {
        return true;
      }
    }
  }
  return false;
}

function variantSizeMatchesList(variant: VariantRow, sizeList: string[], lang: string): boolean {
  const options = Array.isArray(variant.options) ? variant.options : [];
  for (const opt of options) {
    const s = sizeFromOption(opt as VariantOptionLike, lang);
    if (s && sizeList.includes(s)) {
      return true;
    }
  }
  const att = variant as { attributes?: unknown };
  if (att.attributes && typeof att.attributes === "object" && !Array.isArray(att.attributes)) {
    for (const label of sizeLabelsFromAttributeBucket(att.attributes as Record<string, unknown>)) {
      if (sizeList.includes(label)) {
        return true;
      }
    }
  }
  return false;
}

function productMatchesColorListFromProductAttributes(
  product: ProductWithRelations,
  colorList: string[],
  lang: string,
): boolean {
  type PaValue = { value?: string | null; translations?: Array<{ locale?: string; label?: string | null }> };
  const rows = (product as ProductWithRelations & { productAttributes?: Array<{
    attribute?: { key?: string | null; values?: PaValue[] } | null;
  }> }).productAttributes;
  if (!Array.isArray(rows)) {
    return false;
  }
  for (const pa of rows) {
    if (!isColorAttributeKey(pa.attribute?.key) || !pa.attribute?.values) {
      continue;
    }
    for (const attrValue of pa.attribute.values) {
      const t =
        attrValue?.translations?.find((tr) => tr.locale === lang) ??
        attrValue?.translations?.find((tr) => Boolean(tr?.label)) ??
        null;
      const label = (t?.label || attrValue?.value || "").trim().toLowerCase();
      if (label && colorList.includes(label)) {
        return true;
      }
    }
  }
  return false;
}

class ProductsFindFilterService {
  /**
   * Filter products by price, colors, sizes, brand in memory
   */
  filterProducts(
    products: ProductWithRelations[],
    filters: ProductFilters,
    bestsellerProductIds: string[]
  ): ProductWithRelations[] {
    const { minPrice, maxPrice, colors, sizes, brand, technicalSpecs } = filters;

    // Filter by price
    if (minPrice || maxPrice) {
      const min = minPrice || 0;
      const max = maxPrice || Infinity;
      products = products.filter((product: ProductWithRelations) => {
        const variants = Array.isArray(product.variants) ? product.variants : [];
        if (variants.length === 0) return false;
        const prices = variants.map((v: { price: number }) => v.price).filter((p: number | undefined) => p !== undefined);
        if (prices.length === 0) return false;
        const minPrice = Math.min(...prices);
        return minPrice >= min && minPrice <= max;
      });
    }

    // Filter by brand(s) - support multiple brands (comma-separated)
    const brandTokens = normalizeBrandTokens(brand);
    if (brandTokens.raw.size > 0 || brandTokens.normalized.size > 0) {
      products = products.filter((product: ProductWithRelations) => {
        if (product.brandId && brandTokens.raw.has(product.brandId)) {
          return true;
        }

        const brandTranslations = product.brand?.translations ?? [];
        const brandSlug = product.brand?.slug?.trim().toLowerCase();
        const matchesSlug = brandSlug
          ? brandTokens.normalized.has(brandSlug)
          : false;

        if (matchesSlug) {
          return true;
        }

        const fallbackBrandName = brandTranslations
          .find((translation) => translation.name?.trim())
          ?.name?.trim()
          .toLowerCase();
        if (!fallbackBrandName) {
          return false;
        }
        return brandTokens.normalized.has(fallbackBrandName);
      });
    }

    // Filter by colors and sizes together if both are provided.
    // Skip filtering when only placeholder values (e.g., "undefined") are passed.
    const colorList = normalizeFilterList(colors, (v) => v.toLowerCase());
    const sizeList = normalizeFilterList(sizes, (v) => v.toUpperCase());

    if (colorList.length > 0 || sizeList.length > 0) {
      const lang = filters.lang || "en";
      products = products.filter((product: ProductWithRelations) => {
        const variants = Array.isArray(product.variants) ? product.variants : [];

        if (variants.length === 0) {
          return false;
        }

        const matchingVariants = variants.filter((variant: VariantRow) => {
          if (colorList.length > 0 && !variantColorMatchesList(variant, colorList, lang)) {
            return false;
          }
          if (sizeList.length > 0 && !variantSizeMatchesList(variant, sizeList, lang)) {
            return false;
          }
          return true;
        });

        if (matchingVariants.length > 0) {
          return true;
        }
        if (colorList.length > 0 && sizeList.length === 0) {
          return productMatchesColorListFromProductAttributes(product, colorList, lang);
        }
        return false;
      });
    }

    const normalizedSpecs = normalizeTechnicalSpecsForFastCheck(technicalSpecs);
    if (Object.keys(normalizedSpecs).length > 0) {
      products = products.filter((product: ProductWithRelations) => {
        if (productFastMatchesTechnicalSpecs(product, normalizedSpecs)) {
          return true;
        }
        return productMatchesTechnicalSpecs(product, technicalSpecs);
      });
    }

    // Sort
    const { filter } = filters;
    const sort = resolveSort(filters.sort);
    if (filter === "promotion" || filter === "special_offer") {
      products.sort((a: ProductWithRelations, b: ProductWithRelations) => {
        const aD = a.discountPercent ?? 0;
        const bD = b.discountPercent ?? 0;
        if (bD !== aD) return bD - aD;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } else if (filter === "bestseller" && bestsellerProductIds.length > 0) {
      const rank = new Map<string, number>();
      bestsellerProductIds.forEach((id, index) => rank.set(id, index));
      products.sort((a: ProductWithRelations, b: ProductWithRelations) => {
        const aRank = rank.get(a.id) ?? Number.MAX_SAFE_INTEGER;
        const bRank = rank.get(b.id) ?? Number.MAX_SAFE_INTEGER;
        return aRank - bRank;
      });
    } else if (sort === "price-desc" || sort === "price-asc") {
      products.sort((a: ProductWithRelations, b: ProductWithRelations) => {
        const aPrice = getMinVariantPrice(a);
        const bPrice = getMinVariantPrice(b);
        if (sort === "price-asc") {
          return aPrice - bPrice;
        }
        return bPrice - aPrice;
      });
    } else if (sort === "popular" && bestsellerProductIds.length > 0) {
      const rank = new Map<string, number>();
      bestsellerProductIds.forEach((id, index) => rank.set(id, index));
      products.sort((a: ProductWithRelations, b: ProductWithRelations) => {
        const aRank = rank.get(a.id) ?? Number.MAX_SAFE_INTEGER;
        const bRank = rank.get(b.id) ?? Number.MAX_SAFE_INTEGER;
        if (aRank !== bRank) {
          return aRank - bRank;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } else {
      products.sort((a: ProductWithRelations, b: ProductWithRelations) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

    return products;
  }
}

export const productsFindFilterService = new ProductsFindFilterService();






