import type { ProductClass } from "@/lib/constants/product-class";

export interface ProductListCategory {
  id: string;
  title: string;
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  productClass?: ProductClass;
  published: boolean;
  featured?: boolean;
  /** Current selling price (standard price with any active discount applied). */
  price: number;
  stock: number;
  /** Resolved discount percentage for the struck-price badge. */
  discountPercent?: number;
  discountExpiresAt?: string | null;
  /** Standard price shown struck-through when a discount applies; null otherwise. */
  originalPrice?: number | null;
  colorStocks?: Array<{
    color: string;
    stock: number;
  }>;
  image: string | null;
  createdAt: string;
  categories?: ProductListCategory[];
  /** True while an optimistic create/update is still being persisted on the backend. */
  pendingSync?: boolean;
}

export interface ProductsResponse {
  data: Product[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface Category {
  id: string;
  title: string;
  slug: string;
  parentId: string | null;
  requiresSizes: boolean;
}






