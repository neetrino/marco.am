'use client';

import { Fragment } from 'react';
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
      <dl className="mt-6 grid grid-cols-1 gap-x-8 overflow-hidden rounded-2xl border border-gray-200/90 bg-white px-4 shadow-sm ring-1 ring-black/[0.02] sm:grid-cols-[max-content_minmax(0,1fr)] sm:items-center sm:px-5">
        {rows.map((row, index) => (
          <Fragment key={`${row.title}-${index}`}>
            <dt
              className={`py-2 text-sm font-bold tracking-tight text-marco-black sm:whitespace-nowrap md:text-base${
                index > 0 ? ' border-t border-gray-100' : ''
              }`}
            >
              {row.title}
            </dt>
            <dd
              className={`min-w-0 pb-2 text-sm font-normal text-gray-700 sm:py-2 md:text-base${
                index > 0 ? ' sm:border-t sm:border-gray-100' : ''
              }`}
            >
              <SpecificationValueDisplay value={row.value} />
            </dd>
          </Fragment>
        ))}
      </dl>
    </section>
  );
}
