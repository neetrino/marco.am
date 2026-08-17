'use client';

import type { ChangeEvent } from 'react';
import { ADMIN_IMAGE_ACCEPT } from '@/lib/constants/admin-image-upload';
import { processAdminImageFile } from '@/lib/utils/process-admin-image-file';
import { toDomSafeImgSrcString, toSafeImgAttributeSrc } from '@/lib/utils/image-utils';
import { showToast } from '@/components/Toast';
import { logger } from '@/lib/utils/logger';

type PromoBannerFormSlice = {
  promoBannerEnabled: boolean;
  promoBannerImageUrl: string;
};

interface CategoryPromoBannerFieldsProps {
  formData: PromoBannerFormSlice;
  imageUploading: boolean;
  onImageUploadingChange: (uploading: boolean) => void;
  onChange: (next: PromoBannerFormSlice) => void;
  labels: {
    sectionTitle: string;
    enabledLabel: string;
    imageUpload: string;
    imageUploading: string;
    imageRemove: string;
    imageUploadFailed: string;
  };
}

/**
 * Root-category mega-menu promo: star toggle + optional banner image.
 */
export function CategoryPromoBannerFields({
  formData,
  imageUploading,
  onImageUploadingChange,
  onChange,
  labels,
}: CategoryPromoBannerFieldsProps) {
  const safePreview = toSafeImgAttributeSrc(formData.promoBannerImageUrl.trim());

  const handleImageFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const imageFile = event.target.files?.[0];
    if (!imageFile) {
      return;
    }

    try {
      onImageUploadingChange(true);
      const base64 = await processAdminImageFile(imageFile, 'catalog');
      onChange({ ...formData, promoBannerImageUrl: base64 });
    } catch (err: unknown) {
      logger.error('Category promo banner image upload failed', { error: err });
      showToast(labels.imageUploadFailed, 'error');
    } finally {
      onImageUploadingChange(false);
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50/40 p-3">
      <p className="text-sm font-semibold text-slate-800">{labels.sectionTitle}</p>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={formData.promoBannerEnabled}
          onChange={(event) =>
            onChange({ ...formData, promoBannerEnabled: event.target.checked })
          }
          className="h-4 w-4 rounded border-slate-300 text-amber-500 focus:ring-amber-400"
        />
        <span>{labels.enabledLabel}</span>
        <svg
          className={`h-4 w-4 ${formData.promoBannerEnabled ? 'text-amber-500' : 'text-slate-300'}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.044 3.214a1 1 0 00.95.69h3.38c.969 0 1.371 1.24.588 1.81l-2.736 1.988a1 1 0 00-.364 1.118l1.045 3.214c.3.921-.755 1.688-1.539 1.118l-2.737-1.988a1 1 0 00-1.175 0l-2.737 1.988c-.783.57-1.838-.197-1.539-1.118l1.045-3.214a1 1 0 00-.364-1.118L2.087 8.64c-.783-.57-.38-1.81.588-1.81h3.38a1 1 0 00.95-.69l1.044-3.214z" />
        </svg>
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          <input
            type="file"
            accept={ADMIN_IMAGE_ACCEPT}
            className="sr-only"
            disabled={imageUploading}
            onChange={(event) => void handleImageFile(event)}
          />
          {imageUploading ? labels.imageUploading : labels.imageUpload}
        </label>
        {safePreview ? (
          <button
            type="button"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            onClick={() => onChange({ ...formData, promoBannerImageUrl: '' })}
          >
            {labels.imageRemove}
          </button>
        ) : null}
      </div>
      {safePreview ? (
        <div className="flex justify-center rounded-lg border border-slate-200 bg-white p-3">
          <img
            src={toDomSafeImgSrcString(safePreview)}
            alt=""
            className="max-h-28 max-w-full object-contain"
          />
        </div>
      ) : null}
    </div>
  );
}
