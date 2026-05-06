export interface Category {
  id: string;
  slug: string;
  title: string;
  translations?: Partial<Record<'hy' | 'en' | 'ru', string>>;
  fullPath?: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  media?: string[];
  parentId: string | null;
  requiresSizes?: boolean;
  children?: Category[];
}

export interface CategoryWithLevel extends Category {
  level: number;
}

export interface CategoryFormData {
  titles: {
    hy: string;
    en: string;
    ru: string;
  };
  seoTitle: string;
  seoDescription: string;
  imageUrl: string;
  parentId: string;
  requiresSizes: boolean;
  subcategoryIds: string[];
}




