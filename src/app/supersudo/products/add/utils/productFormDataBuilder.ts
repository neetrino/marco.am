/**
 * Utilities for building product form data
 */

import type { ProductDescriptionEntry } from '@/lib/products/product-description';
import type { Variant, ProductLabel } from '../types';
import type { ProductClass } from '@/lib/constants/product-class';

/** Full add/edit product form state (shared across hooks). */
export interface AddProductFormState {
  title: string;
  slug: string;
  subtitleHtml: string;
  description: ProductDescriptionEntry[];
  productClass: ProductClass;
  brandIds: string[];
  primaryCategoryId: string;
  categoryIds: string[];
  published: boolean;
  featured: boolean;
  imageUrls: string[];
  featuredImageIndex: number;
  mainProductImage: string;
  variants: Variant[];
  labels: ProductLabel[];
  warrantyYears: number | null;
}
