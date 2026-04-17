type ProductAttributeTranslation = {
  locale?: string;
  name?: string;
};

type ProductAttributeValueTranslation = {
  locale?: string;
  label?: string;
};

type ProductAttributeValue = {
  id?: string;
  value?: string;
  translations?: ProductAttributeValueTranslation[];
};

export type ProductAttributeForTechnicalSpecification = {
  attribute?: {
    key?: string;
    translations?: ProductAttributeTranslation[];
    values?: ProductAttributeValue[];
  };
};

type VariantOptionAttributeValue = {
  value?: string;
  translations?: ProductAttributeValueTranslation[];
  attribute?: {
    key?: string;
  };
};

type VariantOption = {
  key?: string;
  attribute?: string;
  value?: string;
  attributeValue?: VariantOptionAttributeValue;
};

export type ProductVariantForTechnicalSpecification = {
  options?: VariantOption[];
};

export type ProductTechnicalSpecification = {
  key: string;
  name: string;
  values: string[];
  value: string;
};

const IGNORED_SPEC_KEYS = new Set(["color", "size"]);

function normalizeSpecValue(value: string): string {
  return value.trim().toLowerCase();
}

function getLocalizedLabel(
  translations: ProductAttributeValueTranslation[] | undefined,
  fallbackValue: string,
  lang: string
): string {
  if (!Array.isArray(translations) || translations.length === 0) {
    return fallbackValue;
  }

  const exactMatch = translations.find((item) => item.locale === lang && typeof item.label === "string");
  if (exactMatch?.label) {
    return exactMatch.label;
  }

  const englishFallback = translations.find((item) => item.locale === "en" && typeof item.label === "string");
  if (englishFallback?.label) {
    return englishFallback.label;
  }

  return translations[0]?.label ?? fallbackValue;
}

function getLocalizedAttributeName(
  translations: ProductAttributeTranslation[] | undefined,
  fallbackKey: string,
  lang: string
): string {
  if (!Array.isArray(translations) || translations.length === 0) {
    return fallbackKey;
  }

  const exactMatch = translations.find((item) => item.locale === lang && typeof item.name === "string");
  if (exactMatch?.name) {
    return exactMatch.name;
  }

  const englishFallback = translations.find((item) => item.locale === "en" && typeof item.name === "string");
  if (englishFallback?.name) {
    return englishFallback.name;
  }

  return translations[0]?.name ?? fallbackKey;
}

export function buildTechnicalSpecifications(
  productAttributes: ProductAttributeForTechnicalSpecification[] | undefined,
  variants: ProductVariantForTechnicalSpecification[] | undefined,
  lang: string
): ProductTechnicalSpecification[] {
  const specsByKey = new Map<
    string,
    {
      key: string;
      name: string;
      values: string[];
      seenValues: Set<string>;
    }
  >();

  const upsert = (key: string, name: string, value: string) => {
    const trimmedValue = value.trim();
    if (!key || !trimmedValue || IGNORED_SPEC_KEYS.has(key)) {
      return;
    }

    if (!specsByKey.has(key)) {
      specsByKey.set(key, { key, name: name || key, values: [], seenValues: new Set<string>() });
    }

    const spec = specsByKey.get(key);
    if (!spec) {
      return;
    }

    const normalized = normalizeSpecValue(trimmedValue);
    if (spec.seenValues.has(normalized)) {
      return;
    }

    spec.seenValues.add(normalized);
    spec.values.push(trimmedValue);
  };

  if (Array.isArray(productAttributes)) {
    for (const productAttribute of productAttributes) {
      const key = productAttribute.attribute?.key?.trim() ?? "";
      const name = getLocalizedAttributeName(productAttribute.attribute?.translations, key, lang);
      const values = Array.isArray(productAttribute.attribute?.values)
        ? productAttribute.attribute.values
        : [];

      for (const valueItem of values) {
        const fallbackValue = valueItem.value?.trim() ?? "";
        if (!fallbackValue) {
          continue;
        }
        upsert(key, name, getLocalizedLabel(valueItem.translations, fallbackValue, lang));
      }
    }
  }

  if (Array.isArray(variants)) {
    for (const variant of variants) {
      if (!Array.isArray(variant.options)) {
        continue;
      }

      for (const option of variant.options) {
        const key = (option.attributeValue?.attribute?.key ?? option.key ?? option.attribute ?? "").trim();
        const fallbackValue = (option.attributeValue?.value ?? option.value ?? "").trim();
        if (!key || !fallbackValue) {
          continue;
        }

        const localizedValue = getLocalizedLabel(
          option.attributeValue?.translations,
          fallbackValue,
          lang
        );

        upsert(key, key, localizedValue);
      }
    }
  }

  return Array.from(specsByKey.values())
    .map((spec) => ({
      key: spec.key,
      name: spec.name,
      values: spec.values,
      value: spec.values.join(", "),
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}
