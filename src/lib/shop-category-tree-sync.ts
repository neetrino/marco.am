/** Fired after admin mutates categories so open shop UI can refetch `/api/v1/categories/tree`. */
export const SHOP_CATEGORY_TREE_UPDATED_EVENT = "shop-category-tree-updated";

export function notifyShopCategoryTreeUpdated(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new CustomEvent(SHOP_CATEGORY_TREE_UPDATED_EVENT));
}

export function subscribeShopCategoryTreeUpdated(listener: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }
  const wrapped = () => {
    listener();
  };
  window.addEventListener(SHOP_CATEGORY_TREE_UPDATED_EVENT, wrapped);
  return () => {
    window.removeEventListener(SHOP_CATEGORY_TREE_UPDATED_EVENT, wrapped);
  };
}
