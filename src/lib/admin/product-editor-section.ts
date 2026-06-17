import type { ProductEditorTabId } from '@/app/supersudo/products/add/product-editor-tabs';

/** API section keys mirror editor tabs. */
export type ProductEditorSection = ProductEditorTabId;

export const PRODUCT_EDITOR_SECTIONS: ProductEditorSection[] = [
  'general',
  'description',
  'media',
  'catalog',
  'pricing',
];

export function isProductEditorSection(value: string | null): value is ProductEditorSection {
  return value !== null && PRODUCT_EDITOR_SECTIONS.includes(value as ProductEditorSection);
}

/** Admin product payload returned by GET /products/:id (subset used for section picking). */
export interface AdminProductSectionSource {
  id: string;
  title?: string;
  slug?: string;
  featured?: boolean;
  productClass?: string;
  warrantyYears?: number | null;
  labels?: unknown[];
  description?: unknown;
  media?: unknown[];
  mainProductImage?: string;
  brandId?: string | null;
  categoryIds?: string[];
  primaryCategoryId?: string | null;
  variants?: unknown[];
  attributeIds?: string[];
}

/** Returns only the fields needed for a given editor section. */
export function pickProductEditorSection(
  product: AdminProductSectionSource,
  section: ProductEditorSection,
): AdminProductSectionSource {
  const base = { id: product.id };

  switch (section) {
    case 'general':
      return {
        ...base,
        title: product.title,
        slug: product.slug,
        featured: product.featured,
        productClass: product.productClass,
        warrantyYears: product.warrantyYears,
        labels: product.labels,
      };
    case 'description':
      return {
        ...base,
        description: product.description,
      };
    case 'media':
      return {
        ...base,
        media: product.media,
        mainProductImage: product.mainProductImage,
        variants: product.variants,
      };
    case 'catalog':
      return {
        ...base,
        brandId: product.brandId,
        categoryIds: product.categoryIds,
        primaryCategoryId: product.primaryCategoryId,
      };
    case 'pricing':
      return {
        ...base,
        variants: product.variants,
        attributeIds: product.attributeIds,
      };
    default:
      return base;
  }
}
