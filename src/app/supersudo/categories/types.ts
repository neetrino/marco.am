export interface Category {
  id: string;
  slug: string;
  title: string;
  showInHeader?: boolean;
  promoBannerEnabled?: boolean;
  promoBannerImageUrl?: string | null;
  translations?: Partial<Record<'hy' | 'en' | 'ru', string>>;
  fullPath?: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  media?: string[];
  parentId: string | null;
  requiresSizes?: boolean;
  productCount?: number;
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
  promoBannerEnabled: boolean;
  promoBannerImageUrl: string;
  parentId: string;
  requiresSizes: boolean;
  subcategoryIds: string[];
}




