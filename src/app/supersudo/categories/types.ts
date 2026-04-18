export interface Category {
  id: string;
  slug: string;
  title: string;
  fullPath?: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  parentId: string | null;
  requiresSizes?: boolean;
  children?: Category[];
}

export interface CategoryWithLevel extends Category {
  level: number;
}

export interface CategoryFormData {
  title: string;
  seoTitle: string;
  seoDescription: string;
  parentId: string;
  requiresSizes: boolean;
  subcategoryIds: string[];
}




