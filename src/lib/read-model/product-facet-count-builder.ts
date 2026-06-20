import { Prisma } from '@white-shop/db/prisma';

export type ProductFacetSourceRow = {
  productId: string;
  locale: string;
  brandId: string | null;
  brandSlug: string | null;
  brandName: string | null;
  brandLogoUrl: string | null;
  categoryIds: string[];
  colors: Prisma.JsonValue;
  sizeTokens: string[];
  technicalSpecs: Prisma.JsonValue;
  priceSort: number;
};

export type CategoryFacetLabel = {
  id: string;
  parentId: string | null;
  locale: string;
  slug: string;
  title: string;
  position: number;
};

export type ProductFacetScopeFilter = {
  includeCatalog?: boolean;
  categoryScopeKeys?: readonly string[];
};

type FacetAccumulator = {
  locale: string;
  scopeType: string;
  scopeKey: string;
  facetType: string;
  facetKey: string;
  value: string;
  label: string;
  count: number;
  position: number;
  meta: Prisma.InputJsonValue;
  productIds: Set<string>;
};

type PriceAccumulator = {
  locale: string;
  scopeType: string;
  scopeKey: string;
  min: number;
  max: number;
  productIds: Set<string>;
};

const DEFAULT_SCOPE_TYPE = 'catalog';
const DEFAULT_SCOPE_KEY = 'default';

function facetMapKey(input: {
  locale: string;
  scopeType: string;
  scopeKey: string;
  facetType: string;
  facetKey: string;
  value: string;
}): string {
  return [
    input.locale,
    input.scopeType,
    input.scopeKey,
    input.facetType,
    input.facetKey,
    input.value,
  ].join('\u0000');
}

function priceMapKey(input: {
  locale: string;
  scopeType: string;
  scopeKey: string;
}): string {
  return [input.locale, input.scopeType, input.scopeKey].join('\u0000');
}

function readColorRows(colors: Prisma.JsonValue): Array<{
  value: string;
  label: string;
  imageUrl: string | null;
  colors: string[] | null;
}> {
  if (!Array.isArray(colors)) {
    return [];
  }
  return colors
    .map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return null;
      }
      const row = item as { value?: unknown; imageUrl?: unknown; colors?: unknown };
      const label = typeof row.value === 'string' ? row.value.trim() : '';
      if (!label) {
        return null;
      }
      return {
        value: label.toLowerCase(),
        label,
        imageUrl: typeof row.imageUrl === 'string' ? row.imageUrl : null,
        colors: Array.isArray(row.colors)
          ? row.colors.filter((color): color is string => typeof color === 'string')
          : null,
      };
    })
    .filter(
      (item): item is { value: string; label: string; imageUrl: string | null; colors: string[] | null } =>
        item !== null,
    );
}

function addFacet(
  facets: Map<string, FacetAccumulator>,
  input: Omit<FacetAccumulator, 'count' | 'productIds'> & { productId: string },
) {
  const key = facetMapKey(input);
  const existing = facets.get(key);
  if (existing) {
    if (!existing.productIds.has(input.productId)) {
      existing.productIds.add(input.productId);
      existing.count += 1;
    }
    return;
  }
  facets.set(key, {
    locale: input.locale,
    scopeType: input.scopeType,
    scopeKey: input.scopeKey,
    facetType: input.facetType,
    facetKey: input.facetKey,
    value: input.value,
    label: input.label,
    count: 1,
    position: input.position,
    meta: input.meta,
    productIds: new Set([input.productId]),
  });
}

function addPrice(
  prices: Map<string, PriceAccumulator>,
  input: {
    locale: string;
    scopeType: string;
    scopeKey: string;
    productId: string;
    price: number;
  },
) {
  const key = priceMapKey(input);
  const existing = prices.get(key);
  if (existing) {
    if (!existing.productIds.has(input.productId)) {
      existing.productIds.add(input.productId);
      existing.min = Math.min(existing.min, input.price);
      existing.max = Math.max(existing.max, input.price);
    }
    return;
  }
  prices.set(key, {
    locale: input.locale,
    scopeType: input.scopeType,
    scopeKey: input.scopeKey,
    min: input.price,
    max: input.price,
    productIds: new Set([input.productId]),
  });
}

function buildCategoryLabelMap(labels: readonly CategoryFacetLabel[]) {
  const map = new Map<string, CategoryFacetLabel>();
  for (const label of labels) {
    map.set(`${label.locale}\u0000${label.id}`, label);
  }
  return map;
}

function buildCategoryParentMap(labels: readonly CategoryFacetLabel[]) {
  const parentById = new Map<string, string | null>();
  for (const label of labels) {
    if (!parentById.has(label.id)) {
      parentById.set(label.id, label.parentId);
    }
  }
  return parentById;
}

function expandCategoryIdsWithAncestors(
  categoryIds: readonly string[],
  parentById: ReadonlyMap<string, string | null>,
): string[] {
  const expanded = new Set<string>();
  for (const categoryId of categoryIds) {
    let current: string | null | undefined = categoryId;
    let guard = 0;
    while (current && guard < 40) {
      guard += 1;
      if (expanded.has(current)) {
        break;
      }
      expanded.add(current);
      current = parentById.get(current) ?? null;
    }
  }
  return [...expanded];
}

function readTechnicalSpecs(specs: Prisma.JsonValue): Array<{
  key: string;
  label: string;
  type: string;
  value: string;
  valueLabel: string;
}> {
  if (!Array.isArray(specs)) {
    return [];
  }
  return specs
    .map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return null;
      }
      const row = item as {
        key?: unknown;
        label?: unknown;
        type?: unknown;
        value?: unknown;
        valueLabel?: unknown;
      };
      const key = typeof row.key === 'string' ? row.key.trim().toLowerCase() : '';
      const value = typeof row.value === 'string' ? row.value.trim().toLowerCase() : '';
      const label = typeof row.label === 'string' ? row.label.trim() : key;
      const valueLabel = typeof row.valueLabel === 'string' ? row.valueLabel.trim() : value;
      if (!key || !value || !label || !valueLabel) {
        return null;
      }
      return {
        key,
        label,
        type: typeof row.type === 'string' && row.type.trim() ? row.type.trim() : 'select',
        value,
        valueLabel,
      };
    })
    .filter(
      (
        item,
      ): item is {
        key: string;
        label: string;
        type: string;
        value: string;
        valueLabel: string;
      } => item !== null,
    );
}

function addRowFacets(args: {
  facets: Map<string, FacetAccumulator>;
  prices: Map<string, PriceAccumulator>;
  row: ProductFacetSourceRow;
  scopeType: string;
  scopeKey: string;
  categoryLabelMap: Map<string, CategoryFacetLabel>;
  expandedCategoryIds: readonly string[];
}) {
  const { facets, prices, row, scopeType, scopeKey, categoryLabelMap, expandedCategoryIds } = args;
  addPrice(prices, {
    locale: row.locale,
    scopeType,
    scopeKey,
    productId: row.productId,
    price: row.priceSort,
  });

  if (row.brandSlug && row.brandName) {
    addFacet(facets, {
      locale: row.locale,
      scopeType,
      scopeKey,
      facetType: 'brand',
      facetKey: 'brand',
      value: row.brandSlug,
      label: row.brandName,
      position: 0,
      meta: {
        brandId: row.brandId,
        logoUrl: row.brandLogoUrl,
      },
      productId: row.productId,
    });
  }

  for (const color of readColorRows(row.colors)) {
    addFacet(facets, {
      locale: row.locale,
      scopeType,
      scopeKey,
      facetType: 'color',
      facetKey: 'color',
      value: color.value,
      label: color.label,
      position: 0,
      meta: {
        imageUrl: color.imageUrl,
        colors: color.colors,
      },
      productId: row.productId,
    });
  }

  for (const size of row.sizeTokens) {
    const normalized = size.trim().toUpperCase();
    if (!normalized) {
      continue;
    }
    addFacet(facets, {
      locale: row.locale,
      scopeType,
      scopeKey,
      facetType: 'size',
      facetKey: 'size',
      value: normalized,
      label: normalized,
      position: 0,
      meta: {},
      productId: row.productId,
    });
  }

  for (const spec of readTechnicalSpecs(row.technicalSpecs)) {
    addFacet(facets, {
      locale: row.locale,
      scopeType,
      scopeKey,
      facetType: 'attribute',
      facetKey: spec.key,
      value: spec.value,
      label: spec.valueLabel,
      position: 0,
      meta: {
        attributeLabel: spec.label,
        attributeType: spec.type,
      },
      productId: row.productId,
    });
  }

  for (const categoryId of expandedCategoryIds) {
    const category = categoryLabelMap.get(`${row.locale}\u0000${categoryId}`);
    if (!category?.slug) {
      continue;
    }
    addFacet(facets, {
      locale: row.locale,
      scopeType,
      scopeKey,
      facetType: 'category',
      facetKey: 'category',
      value: category.slug,
      label: category.title,
      position: category.position,
      meta: {
        categoryId,
        parentId: category.parentId,
      },
      productId: row.productId,
    });
  }
}

export function buildProductFacetCountRows(args: {
  rows: readonly ProductFacetSourceRow[];
  categoryLabels: readonly CategoryFacetLabel[];
  rebuiltAt?: Date;
  scopeFilter?: ProductFacetScopeFilter;
}): Prisma.ProductFacetCountCreateManyInput[] {
  const facets = new Map<string, FacetAccumulator>();
  const prices = new Map<string, PriceAccumulator>();
  const categoryLabelMap = buildCategoryLabelMap(args.categoryLabels);
  const categoryParentMap = buildCategoryParentMap(args.categoryLabels);
  const rebuiltAt = args.rebuiltAt ?? new Date();
  const includeCatalog = args.scopeFilter?.includeCatalog !== false;
  const categoryScopeKeys = args.scopeFilter?.categoryScopeKeys
    ? new Set(args.scopeFilter.categoryScopeKeys)
    : null;

  for (const row of args.rows) {
    const expandedCategoryIds = expandCategoryIdsWithAncestors(row.categoryIds, categoryParentMap);
    if (includeCatalog) {
      addRowFacets({
        facets,
        prices,
        row,
        scopeType: DEFAULT_SCOPE_TYPE,
        scopeKey: DEFAULT_SCOPE_KEY,
        categoryLabelMap,
        expandedCategoryIds,
      });
    }

    for (const categoryId of expandedCategoryIds) {
      const category = categoryLabelMap.get(`${row.locale}\u0000${categoryId}`);
      if (!category?.slug) {
        continue;
      }
      if (categoryScopeKeys && !categoryScopeKeys.has(category.slug)) {
        continue;
      }
      addRowFacets({
        facets,
        prices,
        row,
        scopeType: 'category',
        scopeKey: category.slug,
        categoryLabelMap,
        expandedCategoryIds,
      });
    }
  }

  const facetRows = [...facets.values()].map((facet) => ({
    locale: facet.locale,
    scopeType: facet.scopeType,
    scopeKey: facet.scopeKey,
    facetType: facet.facetType,
    facetKey: facet.facetKey,
    value: facet.value,
    label: facet.label,
    count: facet.count,
    position: facet.position,
    meta: facet.meta,
    rebuiltAt,
  }));

  const priceRows = [...prices.values()].map((price) => ({
    locale: price.locale,
    scopeType: price.scopeType,
    scopeKey: price.scopeKey,
    facetType: 'price',
    facetKey: 'range',
    value: 'range',
    label: 'Price',
    count: price.productIds.size,
    position: 0,
    meta: {
      min: price.min,
      max: price.max,
    },
    rebuiltAt,
  }));

  return [...facetRows, ...priceRows];
}
