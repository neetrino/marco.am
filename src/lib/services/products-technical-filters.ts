import type { ProductWithRelations, TechnicalSpecFilters } from "./products-find-query/types";

const TECHNICAL_SPEC_PREFIX = "spec.";
const RESERVED_ATTRIBUTE_KEYS = new Set(["color", "size"]);
const INVALID_FILTER_TOKENS = new Set(["", "null", "undefined"]);

export interface TechnicalSpecFacetValue {
  value: string;
  label: string;
  count: number;
}

export interface TechnicalSpecFacet {
  key: string;
  label: string;
  type: string;
  values: TechnicalSpecFacetValue[];
}

interface VariantOptionLike {
  attributeKey?: string | null;
  key?: string | null;
  attribute?: string | null;
  value?: string | null;
  label?: string | null;
  attributeValue?: {
    value?: string | null;
    translations?: Array<{ locale: string; label?: string | null }> | null;
    attribute?: {
      key?: string | null;
    } | null;
  } | null;
}

const normalizeToken = (token: string): string => token.trim().toLowerCase();

const splitFilterValue = (value: string): string[] =>
  value
    .split(",")
    .map(normalizeToken)
    .filter((token) => !INVALID_FILTER_TOKENS.has(token));

const mergeFilterValues = (
  current: string[] | undefined,
  incoming: string[]
): string[] => {
  const merged = new Set<string>(current ?? []);
  incoming.forEach((value) => merged.add(value));
  return Array.from(merged);
};

export function parseTechnicalSpecFiltersFromSearchParams(
  searchParams: URLSearchParams
): TechnicalSpecFilters {
  const parsed: TechnicalSpecFilters = {};

  const specsRaw = searchParams.get("specs");
  if (specsRaw) {
    try {
      const specsRecord = JSON.parse(specsRaw) as Record<string, unknown>;
      for (const [attributeKey, attributeValue] of Object.entries(specsRecord)) {
        if (typeof attributeValue !== "string" && !Array.isArray(attributeValue)) {
          continue;
        }
        const key = normalizeToken(attributeKey);
        if (!key || RESERVED_ATTRIBUTE_KEYS.has(key)) {
          continue;
        }
        const rawValues = Array.isArray(attributeValue)
          ? attributeValue.filter((entry): entry is string => typeof entry === "string")
          : [attributeValue];
        const normalizedValues = splitFilterValue(rawValues.join(","));
        if (normalizedValues.length === 0) {
          continue;
        }
        parsed[key] = mergeFilterValues(parsed[key], normalizedValues);
      }
    } catch {
      // Ignore malformed JSON and continue with prefixed query params.
    }
  }

  for (const [rawKey, rawValue] of searchParams.entries()) {
    if (!rawKey.startsWith(TECHNICAL_SPEC_PREFIX)) {
      continue;
    }
    const attributeKey = normalizeToken(rawKey.slice(TECHNICAL_SPEC_PREFIX.length));
    if (!attributeKey || RESERVED_ATTRIBUTE_KEYS.has(attributeKey)) {
      continue;
    }
    const normalizedValues = splitFilterValue(rawValue);
    if (normalizedValues.length === 0) {
      continue;
    }
    parsed[attributeKey] = mergeFilterValues(parsed[attributeKey], normalizedValues);
  }

  return parsed;
}

export function hasTechnicalSpecFilters(filters?: TechnicalSpecFilters): boolean {
  if (!filters) {
    return false;
  }
  return Object.values(filters).some((values) => values.length > 0);
}

function resolveOptionAttributeKey(option: VariantOptionLike): string | null {
  const rawKey =
    option.attributeValue?.attribute?.key ??
    option.attributeKey ??
    option.key ??
    option.attribute;
  if (!rawKey || typeof rawKey !== "string") {
    return null;
  }
  const normalizedKey = normalizeToken(rawKey);
  if (!normalizedKey || RESERVED_ATTRIBUTE_KEYS.has(normalizedKey)) {
    return null;
  }
  return normalizedKey;
}

function resolveOptionLabels(option: VariantOptionLike): string[] {
  const labels = new Set<string>();
  const translatedLabels =
    option.attributeValue?.translations
      ?.map((translation) => translation.label?.trim())
      .filter((label): label is string => Boolean(label)) ?? [];

  translatedLabels.forEach((label) => labels.add(normalizeToken(label)));

  const optionValue = option.attributeValue?.value?.trim();
  if (optionValue) {
    labels.add(normalizeToken(optionValue));
  }
  const rawValue = option.value?.trim();
  if (rawValue) {
    labels.add(normalizeToken(rawValue));
  }
  const fallbackLabel = option.label?.trim();
  if (fallbackLabel) {
    labels.add(normalizeToken(fallbackLabel));
  }

  return Array.from(labels);
}

function buildProductTechnicalSpecIndex(
  product: ProductWithRelations
): Map<string, Set<string>> {
  const index = new Map<string, Set<string>>();
  const variants = Array.isArray(product.variants) ? product.variants : [];

  for (const variant of variants) {
    const options = Array.isArray(variant.options) ? variant.options : [];
    for (const rawOption of options) {
      const option = rawOption as VariantOptionLike;
      const attributeKey = resolveOptionAttributeKey(option);
      if (!attributeKey) {
        continue;
      }
      const labels = resolveOptionLabels(option);
      if (labels.length === 0) {
        continue;
      }
      const existing = index.get(attributeKey) ?? new Set<string>();
      labels.forEach((label) => existing.add(label));
      index.set(attributeKey, existing);
    }
  }

  return index;
}

export function productMatchesTechnicalSpecs(
  product: ProductWithRelations,
  technicalSpecs?: TechnicalSpecFilters
): boolean {
  if (!technicalSpecs || Object.keys(technicalSpecs).length === 0) {
    return true;
  }

  const index = buildProductTechnicalSpecIndex(product);
  for (const [attributeKey, acceptedValues] of Object.entries(technicalSpecs)) {
    if (!acceptedValues || acceptedValues.length === 0) {
      continue;
    }
    const productValues = index.get(attributeKey);
    if (!productValues) {
      return false;
    }
    const hasMatch = acceptedValues.some((value) =>
      productValues.has(normalizeToken(value))
    );
    if (!hasMatch) {
      return false;
    }
  }
  return true;
}
