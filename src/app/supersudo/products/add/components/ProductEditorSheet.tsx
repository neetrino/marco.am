'use client';

import { ProductEditorPanel } from './ProductEditorPanel';

interface ProductEditorSheetProps {
  open: boolean;
  productId: string | null;
  onClose: () => void;
  onSaved: () => void;
}

export function ProductEditorSheet({ open, productId, onClose, onSaved }: ProductEditorSheetProps) {
  if (!open) {
    return null;
  }

  const editorKey = productId ?? 'create';

  return (
    <ProductEditorPanel
      key={editorKey}
      open
      productId={productId}
      onCancel={onClose}
      onSaved={onSaved}
    />
  );
}
