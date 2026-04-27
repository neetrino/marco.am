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
  price: number;
  stock: number;
  discountPercent?: number;
  compareAtPrice?: number | null;
  colorStocks?: Array<{
    color: string;
    stock: number;
  }>;
  image: string | null;
  createdAt: string;
  categories?: ProductListCategory[];
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






