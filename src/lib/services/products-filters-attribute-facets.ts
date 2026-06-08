import { isColorAttributeKey, isSizeAttributeKey } from "@/lib/attribute-keys";
import {
  isReservedShopAttributeFilterKey,
  normalizeTechnicalFilterToken,
  type TechnicalSpecFacet,
} from "./products-technical-filters";
import type { ProductWithRelations } from "./products-find-query.service";

type ExtraAttributeFacetAgg = {
  key: string;
  label: string;
  labelFromDb: boolean;
  type: string;
  values: Map<string, { value: string; label: string; count: number }>;
};

function humanizeAttributeKeyTitle(key: string): string {
  const normalized = key.trim();
  if (!normalized) {
    return "";
  }
  return normalized
    .replace(/[-_]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function getLocalizedAttributeValueLabel(
  attributeValue: {
    value?: string | null;
    translations?: Array<{ locale?: string | null; label?: string | null }>;
  } | null | undefined,
  lang: string,
): string {
  if (!attributeValue) {
    return "";
  }
  const translation =
    attributeValue.translations?.find((row) => row.locale === lang) ??
    attributeValue.translations?.find((row) => Boolean(row?.label)) ??
    null;
  return (translation?.label || attributeValue.value || "").trim();
}

function getLocalizedAttributeName(
  attribute:
    | {
        translations?: Array<{ locale: string; name: string }> | null;
        key?: string | null;
      }
    | null
    | undefined,
  lang: string,
  fallbackKey: string,
): string {
  const trList = attribute?.translations;
  if (trList && trList.length > 0) {
    const tr =
      trList.find((row) => row.locale === lang) ??
      trList.find((row) => Boolean(row?.name?.trim())) ??
      trList[0];
    const name = tr?.name?.trim();
    if (name) {
      return name;
    }
  }
  return humanizeAttributeKeyTitle(fallbackKey);
}

function upsertExtraAttributeFacet(
  facetByKey: Map<string, ExtraAttributeFacetAgg>,
  keyNorm: string,
  sectionLabel: string,
  sectionLabelFromDb: boolean,
  attrType: string,
  displayLabel: string,
): void {
  const trimmed = displayLabel.trim();
  if (!trimmed || !keyNorm) {
    return;
  }
  const token = normalizeTechnicalFilterToken(trimmed);
  if (!token) {
    return;
  }

  let facet = facetByKey.get(keyNorm);
  if (!facet) {
    facet = {
      key: keyNorm,
      label: sectionLabel,
      labelFromDb: sectionLabelFromDb,
      type: attrType,
      values: new Map(),
    };
    facetByKey.set(keyNorm, facet);
  } else if (sectionLabelFromDb && !facet.labelFromDb) {
    facet.label = sectionLabel;
    facet.labelFromDb = true;
    facet.type = attrType;
  }

  const existingVal = facet.values.get(token);
  if (existingVal) {
    existingVal.count += 1;
    if (trimmed.length > existingVal.label.length) {
      existingVal.label = trimmed;
    }
  } else {
    facet.values.set(token, { value: token, label: trimmed, count: 1 });
  }
}

function collectExtraFacetsFromVariantJson(
  attrs: Record<string, unknown> | null | undefined,
  facetByKey: Map<string, ExtraAttributeFacetAgg>,
): void {
  if (!attrs || typeof attrs !== "object") {
    return;
  }
  for (const [rawKey, rawVal] of Object.entries(attrs)) {
    const keyNorm = normalizeTechnicalFilterToken(rawKey);
    if (!keyNorm || isReservedShopAttributeFilterKey(keyNorm)) {
      continue;
    }
    const title = humanizeAttributeKeyTitle(rawKey);
    const entries = Array.isArray(rawVal) ? rawVal : rawVal != null ? [rawVal] : [];
    for (const entry of entries) {
      let displayLabel = "";
      if (entry && typeof entry === "object" && !Array.isArray(entry)) {
        const objectEntry = entry as { label?: unknown; value?: unknown };
        const fromLabel = typeof objectEntry.label === "string" ? objectEntry.label.trim() : "";
        const fromValue = typeof objectEntry.value === "string" ? objectEntry.value.trim() : "";
        displayLabel = (fromLabel || fromValue).trim();
      } else if (entry != null) {
        displayLabel = String(entry).trim();
      }
      if (!displayLabel) {
        continue;
      }
      upsertExtraAttributeFacet(facetByKey, keyNorm, title, false, "select", displayLabel);
    }
  }
}

export function collectAttributeFacetsFromSampleProducts(
  products: ProductWithRelations[],
  lang: string,
): TechnicalSpecFacet[] {
  const extraAttributeFacetByKey = new Map<string, ExtraAttributeFacetAgg>();

  for (const product of products) {
    if (!product?.variants || !Array.isArray(product.variants)) {
      continue;
    }
    for (const variant of product.variants) {
      if (!variant?.options || !Array.isArray(variant.options)) {
        collectExtraFacetsFromVariantJson(
          variant.attributes && typeof variant.attributes === "object"
            ? (variant.attributes as Record<string, unknown>)
            : null,
          extraAttributeFacetByKey,
        );
        continue;
      }

      for (const option of variant.options) {
        if (!option) {
          continue;
        }

        const isColor =
          isColorAttributeKey(option.attributeKey) ||
          (option.attributeValue && isColorAttributeKey(option.attributeValue.attribute?.key));
        const isSize =
          isSizeAttributeKey(option.attributeKey) ||
          (option.attributeValue && isSizeAttributeKey(option.attributeValue.attribute?.key));
        if (isColor || isSize) {
          continue;
        }

        const attrEntity = option.attributeValue?.attribute as
          | {
              key?: string | null;
              type?: string | null;
              filterable?: boolean | null;
              translations?: Array<{ locale: string; name: string }> | null;
            }
          | null
          | undefined;

        if (attrEntity && attrEntity.filterable === false) {
          continue;
        }

        const attrKeyRaw =
          (typeof attrEntity?.key === "string" && attrEntity.key.trim()
            ? attrEntity.key
            : null) ??
          (typeof option.attributeKey === "string" ? option.attributeKey : null);

        if (!attrKeyRaw) {
          continue;
        }

        const keyNorm = normalizeTechnicalFilterToken(attrKeyRaw);
        if (!keyNorm || isReservedShopAttributeFilterKey(keyNorm)) {
          continue;
        }

        let displayLabel = "";
        if (option.attributeValue) {
          displayLabel = getLocalizedAttributeValueLabel(option.attributeValue, lang);
        } else if (option.value) {
          displayLabel = option.value.trim();
        }
        if (!displayLabel) {
          continue;
        }

        const sectionLabel = getLocalizedAttributeName(attrEntity, lang, attrKeyRaw);
        const attrType = typeof attrEntity?.type === "string" ? attrEntity.type : "select";
        const labelFromDb = Boolean(attrEntity?.translations && attrEntity.translations.length > 0);
        upsertExtraAttributeFacet(
          extraAttributeFacetByKey,
          keyNorm,
          sectionLabel,
          labelFromDb,
          attrType,
          displayLabel,
        );
      }

      collectExtraFacetsFromVariantJson(
        variant.attributes && typeof variant.attributes === "object"
          ? (variant.attributes as Record<string, unknown>)
          : null,
        extraAttributeFacetByKey,
      );
    }
  }

  return Array.from(extraAttributeFacetByKey.values())
    .map((facet) => ({
      key: facet.key,
      label: facet.label,
      type: facet.type,
      values: Array.from(facet.values.values()).sort((a, b) => a.label.localeCompare(b.label)),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
