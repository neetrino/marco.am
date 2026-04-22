'use client';

import { Button } from '@shop/ui';
import { useTranslation } from '../../../../../lib/i18n-client';
import { useRouter } from 'next/navigation';

interface FormActionsProps {
  loading: boolean;
  isEditMode: boolean;
}

export function FormActions({ loading, isEditMode }: FormActionsProps) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <div className="sticky bottom-0 left-0 right-0 z-50 -mx-5 -mb-5 mt-6 border-t border-marco-border/60 bg-gradient-to-b from-white to-marco-gray/20 px-5 py-4 shadow-[0_-8px_30px_rgba(16,16,16,0.06)] backdrop-blur-sm sm:-mx-8 sm:-mb-5 sm:px-8 sm:mt-8">
      <div className="flex max-w-full flex-col gap-3 sm:flex-row sm:gap-4">
        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          className="flex-1 w-full sm:w-auto order-2 sm:order-1"
        >
          {loading
            ? isEditMode
              ? t('admin.products.add.updating')
              : t('admin.products.add.creating')
            : isEditMode
              ? t('admin.products.add.updateProduct')
              : t('admin.products.add.createProduct')}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/supersudo/products')}
          className="w-full sm:w-auto order-1 sm:order-2"
        >
          {t('admin.common.cancel')}
        </Button>
      </div>
    </div>
  );
}


