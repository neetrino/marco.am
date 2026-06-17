'use client';

import { ProductEditorPanel } from './ProductEditorPanel';
import type { Product } from '../../types';

interface ProductEditorSheetProps {
  open: boolean;
  productId: string | null;
  listProduct?: Product | null;
  onClose: () => void;
  onSaved: () => void;
}

export function ProductEditorSheet({
  open,
  productId,
  listProduct = null,
  onClose,
  onSaved,
}: ProductEditorSheetProps) {
  if (!open) {
    return null;
  }

  const editorKey = productId ?? 'create';

  return (
    <ProductEditorPanel
      key={editorKey}
      open
      productId={productId}
      listProduct={listProduct}
      onCancel={onClose}
      onSaved={onSaved}
    />
  );
}
