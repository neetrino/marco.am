/**
 * Utility functions for product management
 */

export const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-|]/g, '') // Allow pipe character (|) in slug
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Check if a category requires sizes
 */
export const isClothingCategory = (primaryCategoryId: string, categories: Array<{ id: string; requiresSizes?: boolean }>): boolean => {
  if (!primaryCategoryId) {
    return false;
  }
  
  const selectedCategory = categories.find((cat) => cat.id === primaryCategoryId);
  if (!selectedCategory) {
    return false;
  }
  
  return selectedCategory.requiresSizes === true;
};


