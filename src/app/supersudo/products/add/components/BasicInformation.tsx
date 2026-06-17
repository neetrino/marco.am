'use client';

import type { ChangeEvent } from 'react';
import { Input } from '@shop/ui';
import { useTranslation } from '../../../../../lib/i18n-client';
import type { ProductDescriptionEntry } from '../../../../../lib/products/product-description';
import { FormSection } from './FormSection';
import { ProductDescriptionFields } from './ProductDescriptionFields';

interface BasicInformationProps {
  title: string;
  slug: string;
  description: ProductDescriptionEntry[];
  onTitleChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onSlugChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onDescriptionChange: (entries: ProductDescriptionEntry[]) => void;
}

export function BasicInformation({
  title,
  slug,
  description,
  onTitleChange,
  onSlugChange,
  onDescriptionChange,
}: BasicInformationProps) {
  const { t } = useTranslation();

  return (
    <FormSection title={t('admin.products.add.basicInformation')}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('admin.products.add.title')} *
          </label>
          <Input
            type="text"
            value={title}
            onChange={onTitleChange}
            required
            placeholder={t('admin.products.add.productTitlePlaceholder')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('admin.products.add.slug')} *
          </label>
          <Input
            type="text"
            value={slug}
            onChange={onSlugChange}
            required
            placeholder={t('admin.products.add.productSlugPlaceholder')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('admin.products.add.description')}
          </label>
          <ProductDescriptionFields entries={description} onChange={onDescriptionChange} />
        </div>
      </div>
    </FormSection>
  );
}
