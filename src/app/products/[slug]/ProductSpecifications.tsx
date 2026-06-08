'use client';

import { t } from '../../../lib/i18n';
import type { LanguageCode } from '../../../lib/language';
import {
  getProductDescriptionSpecs,
  type ProductDescriptionEntry,
} from '../../../lib/products/product-description';
import type { Product } from './types';
import { isPopulatedSpecificationValue } from './product-specifications-value';
import { SpecificationValueDisplay } from './ProductSpecificationsValue';

interface ProductSpecificationsProps {
  product: Product;
  language: LanguageCode;
}

function filterPopulatedRows(rows: ProductDescriptionEntry[]): ProductDescriptionEntry[] {
  return rows.filter(
    (row) => row.title.trim().length > 0 && isPopulatedSpecificationValue(row.value),
  );
}

function dedupeRows(rows: ProductDescriptionEntry[]): ProductDescriptionEntry[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = `${row.title.toLowerCase()}::${row.value.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getFallbackRows(product: Product): ProductDescriptionEntry[] {
  if (!Array.isArray(product.productAttributes) || product.productAttributes.length === 0) {
    return [];
  }

  return product.productAttributes
    .map((item) => {
      const values = item.attribute.values.map((value) => value.label || value.value).filter(Boolean);
      if (values.length === 0) return null;
      return {
        title: item.attribute.name,
        value: values.join(', '),
      };
    })
    .filter((row): row is ProductDescriptionEntry => Boolean(row));
}

function resolveDescriptionEntries(product: Product, language: LanguageCode): ProductDescriptionEntry[] {
  const localizedEntries = product.i18n?.descriptions[language]?.entries;
  if (localizedEntries && localizedEntries.length > 0) {
    return localizedEntries;
  }
  return product.description ?? [];
}

function getSpecificationRows(product: Product, language: LanguageCode): ProductDescriptionEntry[] {
  const descriptionEntries = getProductDescriptionSpecs(resolveDescriptionEntries(product, language));
  if (descriptionEntries.length > 0) {
    return filterPopulatedRows(dedupeRows(descriptionEntries));
  }

  return filterPopulatedRows(getFallbackRows(product));
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
            key={`${row.title}-${index}`}
            className="grid gap-2 px-4 py-4 sm:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] sm:items-start sm:gap-x-8 sm:px-5 sm:py-4"
          >
            <dt className="text-sm font-medium tracking-tight text-gray-500 md:text-base">{row.title}</dt>
            <dd className="min-w-0 text-sm font-medium text-marco-black md:text-base">
              <SpecificationValueDisplay value={row.value} />
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
