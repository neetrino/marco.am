'use client';

import type { ChangeEvent, RefObject } from 'react';
import { Button } from '@shop/ui';
import { useTranslation } from '../../../../../lib/i18n-client';
import { FormSection } from './FormSection';

interface ProductImagesProps {
  imageUrls: string[];
  featuredImageIndex: number;
  imageUploadLoading: boolean;
  imageUploadError: string | null;
  fileInputRef: RefObject<HTMLInputElement>;
  onUploadImages: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
  onSetFeaturedImage: (index: number) => void;
}

export function ProductImages({
  imageUrls,
  featuredImageIndex,
  imageUploadLoading,
  imageUploadError,
  fileInputRef,
  onUploadImages,
  onRemoveImage,
  onSetFeaturedImage,
}: ProductImagesProps) {
  const { t } = useTranslation();

  return (
    <FormSection
      title={t('admin.products.add.mainProductImage')}
      description={t('admin.products.add.uploadMultipleImages')}
    >
      <div className="space-y-4">
        <div>
          <span className="mb-2 block text-sm font-medium text-gray-700">
            {t('admin.products.add.productImages')}
          </span>

          <div className="mb-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={imageUploadLoading}
              className="inline-flex w-full items-center justify-center gap-2 sm:w-auto"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {imageUploadLoading ? t('admin.products.add.uploading') : t('admin.products.add.uploadImages')}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={onUploadImages}
              className="hidden"
            />
          </div>

          {/* Images Grid */}
          {imageUrls.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {imageUrls.map((imageUrl, index) => (
                <div key={index} className="relative group">
                  <div
                    className={`relative overflow-hidden rounded-lg border-2 ${
                    featuredImageIndex === index
                      ? 'border-marco-black ring-2 ring-marco-yellow/40'
                      : 'border-marco-border/60'
                  }`}
                  >
                    <img
                      src={imageUrl}
                      alt={`Product image ${index + 1}`}
                      className="w-full h-48 object-cover"
                    />
                    
                    {/* Main Checkbox */}
                    <div className="absolute top-2 left-2">
                      <label className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md cursor-pointer hover:bg-white transition-colors">
                        <input
                          type="checkbox"
                          checked={featuredImageIndex === index}
                          onChange={() => onSetFeaturedImage(index)}
                          className="w-4 h-4 text-gray-900 border-gray-300 rounded focus:ring-gray-500"
                        />
                        <span className="text-xs font-medium text-gray-700">
                          {featuredImageIndex === index ? t('admin.products.add.main') : t('admin.products.add.setAsMain')}
                        </span>
                      </label>
                    </div>

                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => onRemoveImage(index)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                      title={t('admin.products.add.removeImage')}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>

                    {/* Main Badge */}
                    {featuredImageIndex === index && (
                      <div className="absolute bottom-2 left-2 rounded bg-marco-yellow px-2 py-1 text-xs font-medium text-marco-black">
                        {t('admin.products.add.main')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {imageUploadError && (
            <div className="mt-2 text-sm text-red-600">
              {imageUploadError}
            </div>
          )}
        </div>
      </div>
    </FormSection>
  );
}


