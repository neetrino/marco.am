'use client';

import { t, getProductText } from '../../../lib/i18n';
import type { LanguageCode } from '../../../lib/language';
import { normalizeLiteralNewlinesToLineBreaks } from '../../../lib/utils/normalize-literal-newlines';
import type { Product } from './types';
import {
  parseRowsFromLabeledStrong,
  parseRowsFromLines,
  parseRowsFromTable,
  stripTags,
  type SpecificationRow,
} from './product-spec-description-parsing';
import { SpecificationValueDisplay } from './ProductSpecificationsValue';

interface ProductSpecificationsProps {
  product: Product;
  language: LanguageCode;
}

type MetaLabelKey = 'brand' | 'category' | 'sku' | 'variants' | 'availability';
const MANUFACTURER_COUNTRY_LABEL = 'Արտադրող երկիր';
const MATERIAL_LABEL = 'Նյութ';

function getMetaLabel(language: LanguageCode, key: MetaLabelKey): string {
  const labels: Record<LanguageCode, Record<MetaLabelKey, string>> = {
    en: {
      brand: 'Brand',
      category: 'Category',
      sku: 'SKU',
      variants: 'Variants',
      availability: 'Availability',
    },
    ru: {
      brand: 'Бренд',
      category: 'Категория',
      sku: 'Артикул',
      variants: 'Варианты',
      availability: 'Наличие',
    },
    hy: {
      brand: 'Ապրանքանիշ',
      category: 'Կատեգորիա',
      sku: 'Արտիկուլ',
      variants: 'Տարբերակներ',
      availability: 'Առկայություն',
    },
    ka: {
      brand: 'ბრენდი',
      category: 'კატეგორია',
      sku: 'SKU',
      variants: 'ვარიანტები',
      availability: 'ხელმისაწვდომობა',
    },
  };

  return labels[language]?.[key] || labels.en[key];
}

function getAvailabilityValue(product: Product, language: LanguageCode): string {
  const hasStock = product.variants.some((variant) => variant.stock > 0);
  if (hasStock) {
    return language === 'ru'
      ? 'В наличии'
      : language === 'hy'
        ? 'Առկա է'
        : language === 'ka'
          ? 'ხელმისაწვდომია'
          : 'In stock';
  }
  return t(language, 'product.outOfStock');
}

function parsePlainDescription(descriptionHtml: string, language: LanguageCode, product: Product): SpecificationRow[] {
  const plainText = stripTags(descriptionHtml);
  const firstCategory = product.categories?.[0]?.title || null;
  const firstSku = product.variants.find((variant) => Boolean(variant.sku))?.sku || null;
  const rows: SpecificationRow[] = [];

  if (plainText) {
    rows.push({
      key: t(language, 'product.description_title'),
      value: plainText,
    });
  }

  if (product.brand?.name) {
    rows.push({ key: getMetaLabel(language, 'brand'), value: product.brand.name });
  }
  if (firstCategory) {
    rows.push({ key: getMetaLabel(language, 'category'), value: firstCategory });
  }
  if (firstSku) {
    rows.push({ key: getMetaLabel(language, 'sku'), value: firstSku });
  }

  rows.push({
    key: getMetaLabel(language, 'variants'),
    value: String(product.variants.length),
  });
  rows.push({
    key: getMetaLabel(language, 'availability'),
    value: getAvailabilityValue(product, language),
  });

  return rows;
}

function getAttributeValue(product: Product, keys: string[]): string | null {
  const normalizedKeys = keys.map((key) => key.toLowerCase());
  const matched = product.productAttributes?.find((item) => {
    const attrKey = item.attribute.key.toLowerCase();
    const attrName = item.attribute.name.toLowerCase();
    return normalizedKeys.some((key) => attrKey.includes(key) || attrName.includes(key));
  });
  if (!matched) {
    return null;
  }
  const values = matched.attribute.values.map((value) => value.label || value.value).filter(Boolean);
  return values.length > 0 ? values.join(', ') : null;
}

function ensureRequiredRows(rows: SpecificationRow[], product: Product): SpecificationRow[] {
  const normalizedKeys = new Set(rows.map((row) => row.key.toLowerCase().trim()));
  const manufacturerCountry = getAttributeValue(product, ['country', 'origin', 'manufacturer_country', 'արտադրող երկիր']);
  const material = getAttributeValue(product, ['material', 'composition', 'նյութ']);

  if (!normalizedKeys.has(MANUFACTURER_COUNTRY_LABEL.toLowerCase())) {
    rows.push({ key: MANUFACTURER_COUNTRY_LABEL, value: manufacturerCountry || '-' });
  }
  if (!normalizedKeys.has(MATERIAL_LABEL.toLowerCase())) {
    rows.push({ key: MATERIAL_LABEL, value: material || '-' });
  }

  return rows;
}

function dedupeRows(rows: SpecificationRow[]): SpecificationRow[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = `${row.key.toLowerCase()}::${row.value.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getFallbackRows(product: Product): SpecificationRow[] {
  if (!Array.isArray(product.productAttributes) || product.productAttributes.length === 0) {
    return [];
  }

  return product.productAttributes
    .map((item) => {
      const values = item.attribute.values.map((value) => value.label || value.value).filter(Boolean);
      if (values.length === 0) return null;
      return {
        key: item.attribute.name,
        value: values.join(', '),
      };
    })
    .filter((row): row is SpecificationRow => Boolean(row));
}

function getSpecificationRows(product: Product, language: LanguageCode): SpecificationRow[] {
  const rawDescription = normalizeLiteralNewlinesToLineBreaks(
    getProductText(language, product.id, 'longDescription') || product.description || '',
  );
  if (!rawDescription.trim()) {
    return ensureRequiredRows(getFallbackRows(product), product);
  }

  const fromTable = parseRowsFromTable(rawDescription);
  if (fromTable.length > 0) {
    return ensureRequiredRows(dedupeRows(fromTable), product);
  }

  const fromStrong = parseRowsFromLabeledStrong(rawDescription);
  if (fromStrong.length >= 2) {
    return ensureRequiredRows(dedupeRows(fromStrong), product);
  }

  const fromLines = parseRowsFromLines(rawDescription);
  if (fromLines.length > 0) {
    return ensureRequiredRows(dedupeRows(fromLines), product);
  }

  if (fromStrong.length > 0) {
    return ensureRequiredRows(dedupeRows(fromStrong), product);
  }

  const plainDescription = parsePlainDescription(rawDescription, language, product);
  if (plainDescription.length > 0) {
    return ensureRequiredRows(dedupeRows(plainDescription), product);
  }

  return ensureRequiredRows(getFallbackRows(product), product);
}

export function ProductSpecifications({ product, language }: ProductSpecificationsProps) {
  const rows = getSpecificationRows(product, language);
  if (rows.length === 0) {
    return null;
  }
  const specificationTitle = t(language, 'product.specifications_title');

  return (
    <section className="border-t border-gray-200 pt-10" aria-label={specificationTitle}>
      <h2 className="text-2xl font-bold uppercase tracking-tight text-marco-black md:text-3xl">
        {specificationTitle}
      </h2>
      <dl className="mt-6 divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-sm ring-1 ring-black/[0.02]">
        {rows.map((row, index) => (
          <div
            key={`${row.key}-${index}`}
            className="grid gap-2 px-4 py-4 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] sm:items-start sm:gap-x-8 sm:px-5 sm:py-4"
          >
            <dt className="text-sm font-medium tracking-tight text-gray-500 md:text-base">{row.key}</dt>
            <dd className="min-w-0 text-sm font-medium text-marco-black md:text-base">
              <SpecificationValueDisplay value={row.value} />
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

