export const PRODUCT_EDITOR_TAB_IDS = [
  'general',
  'description',
  'media',
  'catalog',
  'pricing',
] as const;

export type ProductEditorTabId = (typeof PRODUCT_EDITOR_TAB_IDS)[number];

/** API section keys mirror editor tabs. */
export type ProductEditorSection = ProductEditorTabId;

export const PRODUCT_EDITOR_DEFAULT_TAB: ProductEditorTabId = 'general';

export function isProductEditorTabId(value: string): value is ProductEditorTabId {
  return PRODUCT_EDITOR_TAB_IDS.includes(value as ProductEditorTabId);
}

export function isProductEditorSection(value: string | null): value is ProductEditorSection {
  return value !== null && isProductEditorTabId(value);
}
