'use client';

import { useTranslation } from '@/lib/i18n-client';
import { AdminSideSheet } from '../../../components/AdminSideSheet';
import { ProductEditorPanel } from './ProductEditorPanel';

interface ProductEditorSheetProps {
  open: boolean;
  productId: string | null;
  onClose: () => void;
  onSaved: () => void;
}

export function ProductEditorSheet({ open, productId, onClose, onSaved }: ProductEditorSheetProps) {
  const { t } = useTranslation();
  const isEditMode = Boolean(productId);
  const editorKey = productId ?? 'create';

  return (
    <AdminSideSheet
      open={open}
      onClose={onClose}
      title={
        isEditMode
          ? t('admin.products.add.editProduct')
          : t('admin.products.add.addNewProduct')
      }
      closeLabel={t('admin.common.close')}
    >
      <ProductEditorPanel
        key={editorKey}
        productId={productId}
        onCancel={onClose}
        onSaved={onSaved}
      />
    </AdminSideSheet>
  );
}
