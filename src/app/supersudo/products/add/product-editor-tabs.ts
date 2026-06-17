export const PRODUCT_EDITOR_TAB_IDS = [
  'general',
  'description',
  'media',
  'catalog',
  'pricing',
] as const;

export type ProductEditorTabId = (typeof PRODUCT_EDITOR_TAB_IDS)[number];

export const PRODUCT_EDITOR_DEFAULT_TAB: ProductEditorTabId = 'general';

export function isProductEditorTabId(value: string): value is ProductEditorTabId {
  return PRODUCT_EDITOR_TAB_IDS.includes(value as ProductEditorTabId);
}
