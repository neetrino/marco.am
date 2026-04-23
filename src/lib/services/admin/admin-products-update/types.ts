import type { ProductClass } from "@/lib/constants/product-class";

/**
 * Update product data interface
 */
export interface UpdateProductData {
  title?: string;
  slug?: string;
  subtitle?: string;
  descriptionHtml?: string;
  brandId?: string;
  productClass?: ProductClass;
  primaryCategoryId?: string;
  categoryIds?: string[];
  published?: boolean;
  featured?: boolean;
  locale?: string;
  media?: unknown[];
  mainProductImage?: string;
  labels?: Array<{
    id?: string;
    type: string;
    value: string;
    position: string;
    color?: string | null;
  }>;
  attributeIds?: string[];
  variants?: Array<{
    id?: string;
    price: string | number;
    compareAtPrice?: string | number;
    stock: string | number;
    sku?: string;
    productClass?: ProductClass;
    color?: string;
    size?: string;
    imageUrl?: string;
    published?: boolean;
    options?: Array<{
      attributeKey: string;
      value: string;
      valueId?: string;
    }>;
  }>;
}




