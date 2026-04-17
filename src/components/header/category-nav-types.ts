export interface Category {
  id: string;
  slug: string;
  title: string;
  fullPath: string;
  children: Category[];
}

export interface CategoriesResponse {
  data: Category[];
}
