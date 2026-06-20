/**
 * Product filters interface for admin
 */
export interface ProductFilters {
  page?: number;
  limit?: number;
  lang?: string;
  search?: string;
  category?: string;
  categories?: string[];
  brand?: string[];
  published?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sort?: string;
}




