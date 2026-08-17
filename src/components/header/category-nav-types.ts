export interface Category {
  id: string;
  slug: string;
  title: string;
  showInHeader?: boolean;
  promoBannerEnabled?: boolean;
  promoBannerImageUrl?: string | null;
  fullPath: string;
  media?: string[];
  /** Published products with this category as primary (from `/api/v1/categories/tree`). */
  productCount?: number;
  children: Category[];
}

export interface CategoriesResponse {
  data: Category[];
}
