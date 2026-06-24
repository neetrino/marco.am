import { Prisma } from '@white-shop/db/prisma';
import { isColorAttributeKey, isSizeAttributeKey } from '@/lib/attribute-keys';
import { productRequiresAttributeSelection } from '@/lib/product-requires-attribute-selection';
import { pickVariantForListingPrice } from '@/lib/product-variant-listing-pick';
import { resolveProductPrice } from '@/lib/pricing/product-price';
import { buildProductGalleryUrls } from '@/lib/products/product-gallery-urls';
import {
  buildTechnicalSpecFilterToken,
  isReservedShopAttributeFilterKey,
  normalizeTechnicalFilterToken,
} from '@/lib/services/products-technical-filters';
import { toProductSubtitlePlainText } from '@/lib/security/sanitize-product-html';

import {
  resolveEffectiveDiscount,
  type AppliedDiscount,
  type TypedDiscountInput,
} from '@/lib/discount/discount-expiry';

export type ProductListingReadModelDiscountSettings = {
  globalDiscount: number;
  categoryDiscounts: Record<string, number>;
  brandDiscounts: Record<string, number>;
};

/**
 * Category tree closure used to denormalize ancestor categories into each listing row,
 * so a parent-category filter matches subcategory products via a direct GIN array match
 * (no operational `categories` slug/descendant lookup on the storefront hot path).
 */
export type CategoryAncestry = {
  parentById: ReadonlyMap<string, string | null>;
  /** key `${categoryId}:${locale}` → slug */
  slugByIdLocale: ReadonlyMap<string, string>;
};

const CATEGORY_ANCESTRY_WALK_GUARD = 64;

function expandCategoryIdsWithAncestors(
  ids: Iterable<string>,
  parentById: ReadonlyMap<string, string | null>,
): string[] {
  const closure = new Set<string>();
  for (const id of ids) {
    let current: string | null | undefined = id;
    let guard = 0;
    while (current && !closure.has(current) && guard < CATEGORY_ANCESTRY_WALK_GUARD) {
      closure.add(current);
      current = parentById.get(current) ?? null;
      guard += 1;
    }
  }
  return [...closure];
}

type TranslationRow = {
  locale: string;
  title?: string | null;
  slug?: string | null;
  subtitle?: string | null;
  name?: string | null;
  label?: string | null;
};

type ProductListingReadModelInput = {
  id: string;
  brandId?: string | null;
  primaryCategoryId?: string | null;
  categoryIds?: string[] | null;
  media?: unknown;
  discountType?: string | null;
  discountValue?: number | null;
  discountExpiresAt?: Date | null;
  warrantyYears?: number | null;
  published?: boolean | null;
  publishedAt?: Date | null;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  translations?: TranslationRow[] | null;
  brand?: {
    id: string;
    slug?: string | null;
    logoUrl?: string | null;
    translations?: TranslationRow[] | null;
  } | null;
  variants?: Array<{
    id: string;
    imageUrl?: string | null;
    price: number;
    discountType?: string | null;
    discountValue?: number | null;
    discountExpiresAt?: Date | null;
    stock?: number | null;
    published?: boolean | null;
    attributes?: Prisma.JsonValue | null;
    options?: Array<{
      attributeKey?: string | null;
      value?: string | null;
      attributeValue?: {
        value?: string | null;
        imageUrl?: string | null;
        colors?: Prisma.JsonValue | null;
        translations?: TranslationRow[] | null;
        attribute?: {
          key?: string | null;
          type?: string | null;
          filterable?: boolean | null;
          translations?: TranslationRow[] | null;
        } | null;
      } | null;
    }> | null;
  }> | null;
  attributeValues?: Array<{
    attributeValue?: {
      value?: string | null;
      imageUrl?: string | null;
      colors?: Prisma.JsonValue | null;
      translations?: TranslationRow[] | null;
      attribute?: {
        key?: string | null;
        type?: string | null;
        filterable?: boolean | null;
        translations?: TranslationRow[] | null;
      } | null;
    } | null;
  }> | null;
  labels?: Array<{
    id: string;
    type: string;
    value: string;
    position: string;
    color?: string | null;
  }> | null;
  categories?: Array<{
    id: string;
    translations?: TranslationRow[] | null;
  }> | null;
};

function resolveTranslation<T extends TranslationRow>(
  rows: readonly T[] | null | undefined,
  locale: string,
): T | null {
  const list = Array.isArray(rows) ? rows : [];
  return list.find((row) => row.locale === locale) ?? list[0] ?? null;
}

function trimString(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function resolveAppliedDiscount(
  product: ProductListingReadModelInput,
  variant: { discountType?: string | null; discountValue?: number | null; discountExpiresAt?: Date | null } | null | undefined,
  settings: ProductListingReadModelDiscountSettings,
): AppliedDiscount {
  const toTyped = (source: {
    discountType?: string | null;
    discountValue?: number | null;
    discountExpiresAt?: Date | null;
  }): TypedDiscountInput => ({
    type: (source.discountType ?? 'NONE') as TypedDiscountInput['type'],
    value: source.discountValue ?? null,
    expiresAt: source.discountExpiresAt ?? null,
  });

  return resolveEffectiveDiscount({
    variant: variant ? toTyped(variant) : null,
    product: toTyped(product),
    categoryPercent:
      (product.primaryCategoryId && settings.categoryDiscounts[product.primaryCategoryId]) || 0,
    brandPercent: (product.brandId && settings.brandDiscounts[product.brandId]) || 0,
    globalPercent: settings.globalDiscount,
  });
}

function collectCategoryIds(product: ProductListingReadModelInput): string[] {
  const ids = new Set<string>();
  if (product.primaryCategoryId) {
    ids.add(product.primaryCategoryId);
  }
  for (const id of product.categoryIds ?? []) {
    if (id) {
      ids.add(id);
    }
  }
  for (const category of product.categories ?? []) {
    if (category.id) {
      ids.add(category.id);
    }
  }
  return [...ids];
}

function collectCategorySlugs(product: ProductListingReadModelInput, locale: string): string[] {
  const slugs = new Set<string>();
  for (const category of product.categories ?? []) {
    const translation = resolveTranslation(category.translations, locale);
    const slug = trimString(translation?.slug);
    if (slug) {
      slugs.add(slug);
    }
  }
  return [...slugs];
}

function readLocalizedAttributeValueLabel(
  attributeValue:
    | {
        value?: string | null;
        translations?: TranslationRow[] | null;
      }
    | null
    | undefined,
  locale: string,
): string | null {
  const translation = resolveTranslation(attributeValue?.translations, locale);
  return trimString(translation?.label) ?? trimString(attributeValue?.value);
}

function normalizeColorHexList(value: Prisma.JsonValue | null | undefined): string[] | null {
  if (!Array.isArray(value)) {
    return null;
  }
  const colors = value.filter((item): item is string => typeof item === 'string' && item.trim() !== '');
  return colors.length > 0 ? colors : null;
}

function humanizeAttributeKeyTitle(key: string): string {
  const trimmed = key.trim();
  if (!trimmed) {
    return '';
  }
  return trimmed
    .replace(/[-_]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function getLocalizedAttributeName(
  attribute:
    | {
        translations?: TranslationRow[] | null;
        key?: string | null;
      }
    | null
    | undefined,
  locale: string,
  fallbackKey: string,
): string {
  const translation = resolveTranslation(attribute?.translations, locale);
  return trimString(translation?.name) ?? humanizeAttributeKeyTitle(fallbackKey);
}

function collectColors(product: ProductListingReadModelInput, locale: string) {
  const colorMap = new Map<string, { value: string; imageUrl: string | null; colors: string[] | null }>();
  for (const row of product.attributeValues ?? []) {
    const attributeValue = row.attributeValue;
    const key = attributeValue?.attribute?.key ?? '';
    if (!isColorAttributeKey(key)) {
      continue;
    }
    const label = readLocalizedAttributeValueLabel(attributeValue, locale);
    if (!label) {
      continue;
    }
    const normalized = label.toLowerCase();
    if (colorMap.has(normalized)) {
      continue;
    }
    colorMap.set(normalized, {
      value: label,
      imageUrl: attributeValue?.imageUrl ?? null,
      colors: normalizeColorHexList(attributeValue?.colors),
    });
  }
  if (colorMap.size > 0) {
    return [...colorMap.values()];
  }

  for (const variant of product.variants ?? []) {
    for (const option of variant.options ?? []) {
      const key = option.attributeValue?.attribute?.key ?? option.attributeKey ?? '';
      if (!isColorAttributeKey(key)) {
        continue;
      }
      const label =
        readLocalizedAttributeValueLabel(option.attributeValue, locale) ?? trimString(option.value);
      if (!label) {
        continue;
      }
      const normalized = label.toLowerCase();
      if (colorMap.has(normalized)) {
        continue;
      }
      colorMap.set(normalized, {
        value: label,
        imageUrl: option.attributeValue?.imageUrl ?? null,
        colors: normalizeColorHexList(option.attributeValue?.colors),
      });
    }
  }
  return [...colorMap.values()];
}

function collectSizeTokens(product: ProductListingReadModelInput, locale: string): string[] {
  const sizes = new Set<string>();
  for (const row of product.attributeValues ?? []) {
    const attributeValue = row.attributeValue;
    const key = attributeValue?.attribute?.key ?? '';
    if (!isSizeAttributeKey(key)) {
      continue;
    }
    const label = readLocalizedAttributeValueLabel(attributeValue, locale);
    if (label) {
      sizes.add(label.toUpperCase());
    }
  }
  if (sizes.size > 0) {
    return [...sizes];
  }

  for (const variant of product.variants ?? []) {
    for (const option of variant.options ?? []) {
      const key = option.attributeValue?.attribute?.key ?? option.attributeKey ?? '';
      if (!isSizeAttributeKey(key)) {
        continue;
      }
      const label =
        readLocalizedAttributeValueLabel(option.attributeValue, locale) ?? trimString(option.value);
      if (label) {
        sizes.add(label.toUpperCase());
      }
    }
  }
  return [...sizes];
}

type TechnicalSpecProjectionRow = {
  key: string;
  label: string;
  type: string;
  value: string;
  valueLabel: string;
};

function readVariantAttributeEntries(value: unknown): Array<{ label: string; value: string }> {
  const entries = Array.isArray(value) ? value : value != null ? [value] : [];
  const out: Array<{ label: string; value: string }> = [];
  for (const entry of entries) {
    if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
      const row = entry as { label?: unknown; value?: unknown };
      const label = typeof row.label === 'string' ? row.label.trim() : '';
      const rawValue = typeof row.value === 'string' ? row.value.trim() : '';
      const display = label || rawValue;
      if (display) {
        out.push({ label: display, value: normalizeTechnicalFilterToken(display) });
      }
    } else if (entry != null && entry !== '') {
      const display = String(entry).trim();
      if (display) {
        out.push({ label: display, value: normalizeTechnicalFilterToken(display) });
      }
    }
  }
  return out.filter((entry) => entry.value.length > 0);
}

function collectTechnicalSpecs(
  product: ProductListingReadModelInput,
  locale: string,
): TechnicalSpecProjectionRow[] {
  const specs = new Map<string, TechnicalSpecProjectionRow>();

  function addSpec(input: TechnicalSpecProjectionRow) {
    const key = normalizeTechnicalFilterToken(input.key);
    const value = normalizeTechnicalFilterToken(input.value);
    if (!key || !value || isReservedShopAttributeFilterKey(key)) {
      return;
    }
    specs.set(buildTechnicalSpecFilterToken(key, value), {
      key,
      label: input.label,
      type: input.type || 'select',
      value,
      valueLabel: input.valueLabel,
    });
  }

  for (const row of product.attributeValues ?? []) {
    const attributeValue = row.attributeValue;
    const attribute = attributeValue?.attribute;
    const rawKey = attribute?.key ?? '';
    if (!rawKey || isColorAttributeKey(rawKey) || isSizeAttributeKey(rawKey)) {
      continue;
    }
    if (attribute?.filterable === false) {
      continue;
    }
    const key = normalizeTechnicalFilterToken(rawKey);
    if (!key || isReservedShopAttributeFilterKey(key)) {
      continue;
    }
    const valueLabel = readLocalizedAttributeValueLabel(attributeValue, locale);
    if (!valueLabel) {
      continue;
    }
    addSpec({
      key,
      label: getLocalizedAttributeName(attribute, locale, rawKey),
      type: attribute?.type ?? 'select',
      value: valueLabel,
      valueLabel,
    });
  }
  if (specs.size > 0) {
    return [...specs.values()].sort((a, b) => a.label.localeCompare(b.label));
  }

  for (const variant of product.variants ?? []) {
    if (variant.attributes && typeof variant.attributes === 'object' && !Array.isArray(variant.attributes)) {
      for (const [rawKey, rawValue] of Object.entries(variant.attributes as Record<string, unknown>)) {
        const key = normalizeTechnicalFilterToken(rawKey);
        if (!key || isReservedShopAttributeFilterKey(key)) {
          continue;
        }
        for (const entry of readVariantAttributeEntries(rawValue)) {
          addSpec({
            key,
            label: humanizeAttributeKeyTitle(rawKey),
            type: 'select',
            value: entry.value,
            valueLabel: entry.label,
          });
        }
      }
    }

    for (const option of variant.options ?? []) {
      const attribute = option.attributeValue?.attribute;
      const rawKey = attribute?.key ?? option.attributeKey ?? '';
      if (!rawKey || isColorAttributeKey(rawKey) || isSizeAttributeKey(rawKey)) {
        continue;
      }
      if (attribute?.filterable === false) {
        continue;
      }
      const key = normalizeTechnicalFilterToken(rawKey);
      if (!key || isReservedShopAttributeFilterKey(key)) {
        continue;
      }
      const valueLabel =
        readLocalizedAttributeValueLabel(option.attributeValue, locale) ?? trimString(option.value);
      if (!valueLabel) {
        continue;
      }
      addSpec({
        key,
        label: getLocalizedAttributeName(attribute, locale, rawKey),
        type: attribute?.type ?? 'select',
        value: valueLabel,
        valueLabel,
      });
    }
  }

  return [...specs.values()].sort((a, b) => a.label.localeCompare(b.label));
}

function buildSearchText(parts: Array<string | null | undefined>): string {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(' ')
    .toLowerCase();
}

export function buildProductListingRowsForLocales(args: {
  product: ProductListingReadModelInput;
  locales: readonly string[];
  discountSettings: ProductListingReadModelDiscountSettings;
  categoryAncestry: CategoryAncestry;
  rebuiltAt?: Date;
}): Prisma.ProductListingRowCreateManyInput[] {
  const { product, locales, discountSettings, categoryAncestry } = args;
  const rebuiltAt = args.rebuiltAt ?? new Date();
  const variants = product.variants ?? [];
  const variantsForPricing = variants.map((variant) => ({
    ...variant,
    published: variant.published ?? undefined,
  }));
  const variant = pickVariantForListingPrice(variantsForPricing);
  const appliedDiscount = resolveAppliedDiscount(product, variant, discountSettings);
  const pricing = resolveProductPrice({
    standardPrice: variant?.price ?? 0,
    discount: appliedDiscount,
  });
  const images = buildProductGalleryUrls(product.media, variants).slice(0, 1);
  const categoryIds = expandCategoryIdsWithAncestors(
    collectCategoryIds(product),
    categoryAncestry.parentById,
  );
  const stock = variant?.stock ?? 0;

  const rows: Array<Prisma.ProductListingRowCreateManyInput | null> = locales.map((locale) => {
      const translation = resolveTranslation(product.translations, locale);
      const slug = trimString(translation?.slug);
      const title = trimString(translation?.title);
      if (!slug || !title) {
        return null;
      }

      const brandTranslation = resolveTranslation(product.brand?.translations, locale);
      const brandName = trimString(brandTranslation?.name);
      const categorySlugSet = new Set(collectCategorySlugs(product, locale));
      for (const categoryId of categoryIds) {
        const ancestorSlug = categoryAncestry.slugByIdLocale.get(`${categoryId}:${locale}`);
        if (ancestorSlug) {
          categorySlugSet.add(ancestorSlug);
        }
      }
      const categorySlugs = [...categorySlugSet];
      const colors = collectColors(product, locale);
      const colorTokens = colors.map((color) => color.value.toLowerCase());
      const sizeTokens = collectSizeTokens(product, locale);
      const technicalSpecs = collectTechnicalSpecs(product, locale);
      const technicalSpecTokens = technicalSpecs.map((spec) =>
        buildTechnicalSpecFilterToken(spec.key, spec.value),
      );
      const categoryTitles =
        product.categories
          ?.map((category) => trimString(resolveTranslation(category.translations, locale)?.title))
          .filter((value): value is string => Boolean(value)) ?? [];

      return {
        productId: product.id,
        locale,
        slug,
        title,
        subtitle: trimString(translation?.subtitle),
        brandId: product.brandId ?? null,
        brandSlug: product.brand?.slug ?? null,
        brandName,
        brandLogoUrl: product.brand?.logoUrl ?? null,
        primaryCategoryId: product.primaryCategoryId ?? null,
        categoryIds,
        categorySlugs,
        price: pricing.currentPrice,
        compareAtPrice: pricing.compareAtPrice,
        originalPrice: pricing.oldPrice,
        priceSort: pricing.currentPrice,
        hasPrice: pricing.currentPrice > 0,
        discountPercent: pricing.discountPercent ?? 0,
        discountExpiresAt: product.discountExpiresAt ?? null,
        isSpecialPrice: pricing.isSpecialPrice,
        defaultVariantId: variant?.id ?? null,
        stock,
        inStock: stock > 0,
        image: images[0] ?? null,
        images,
        labels: (product.labels ?? []) as Prisma.InputJsonValue,
        colors: colors as Prisma.InputJsonValue,
        colorTokens,
        sizeTokens,
        technicalSpecs: technicalSpecs as Prisma.InputJsonValue,
        technicalSpecTokens,
        warrantyYears: product.warrantyYears ?? null,
        requiresAttributeSelection: productRequiresAttributeSelection(variants),
        searchText: buildSearchText([
          title,
          toProductSubtitlePlainText(translation?.subtitle),
          slug,
          brandName,
          product.brand?.slug,
          ...categorySlugs,
          ...categoryTitles,
        ]),
        publishedAt: product.publishedAt ?? null,
        productCreatedAt: product.createdAt,
        productUpdatedAt: product.updatedAt,
        isPublished: product.published !== false,
        deletedAt: product.deletedAt ?? null,
        rebuiltAt,
      } satisfies Prisma.ProductListingRowCreateManyInput;
    });
  return rows.filter((row): row is Prisma.ProductListingRowCreateManyInput => row !== null);
}
