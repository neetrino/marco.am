'use client';

import { ProductEditorPanel } from './ProductEditorPanel';
import type { OptimisticSaveRequest } from '../hooks/useProductPayloadCreation';
import type { Product } from '../../types';

interface ProductEditorSheetProps {
  open: boolean;
  productId: string | null;
  listProduct?: Product | null;
  onClose: () => void;
  onSubmit: (request: OptimisticSaveRequest) => void;
  onFeaturedChange?: (productId: string, featured: boolean) => void;
}

export function ProductEditorSheet({
  open,
  productId,
  listProduct = null,
  onClose,
  onSubmit,
  onFeaturedChange,
}: ProductEditorSheetProps) {
  const editorKey = productId ?? 'create';

  return (
    <ProductEditorPanel
      key={editorKey}
      open={open}
      productId={productId}
      listProduct={listProduct}
      onCancel={onClose}
      onSubmit={onSubmit}
      onFeaturedChange={onFeaturedChange}
    />
  );
}
