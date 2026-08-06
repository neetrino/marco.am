import { nanoid } from 'nanoid';
import { apiClient } from '@/lib/api-client';
import { processAdminImageFile } from '@/lib/utils/process-admin-image-file';

export type UploadedProductImage = {
  url: string;
  objectKey: string;
  mimeType: string;
  size: number;
};

type UploadImagesApiResponse = {
  urls?: string[];
  images?: Array<{
    url: string;
    objectKey?: string;
    mimeType?: string;
    size?: number;
  }>;
};

const UPLOAD_SESSION_STORAGE_KEY = 'admin_product_image_upload_session';

/**
 * Stable draft session id for orphan-friendly R2 keys (drafts/{sessionId}/…).
 */
export function getOrCreateProductImageUploadSessionId(): string {
  if (typeof window === 'undefined') {
    return nanoid(16);
  }
  try {
    const existing = window.sessionStorage.getItem(UPLOAD_SESSION_STORAGE_KEY);
    if (existing && existing.trim()) {
      return existing.trim();
    }
    const created = nanoid(16);
    window.sessionStorage.setItem(UPLOAD_SESSION_STORAGE_KEY, created);
    return created;
  } catch {
    return nanoid(16);
  }
}

/**
 * Compress a catalog image to WebP, upload via admin API, return R2 HTTPS metadata.
 * The temporary data URL is transport-only and never kept in form state.
 */
export async function uploadProductCatalogImageFile(
  file: File,
  uploadSessionId: string = getOrCreateProductImageUploadSessionId(),
): Promise<UploadedProductImage> {
  const dataUrl = await processAdminImageFile(file, 'catalog');
  const response = await apiClient.post<UploadImagesApiResponse>(
    '/api/v1/supersudo/products/upload-images',
    {
      images: [dataUrl],
      uploadSessionId,
    },
  );

  const firstMeta = response.images?.[0];
  const url = firstMeta?.url ?? response.urls?.[0];
  if (!url || !url.startsWith('http')) {
    throw new Error('Upload did not return a valid HTTPS image URL');
  }

  return {
    url,
    objectKey: firstMeta?.objectKey ?? '',
    mimeType: firstMeta?.mimeType ?? 'image/webp',
    size: firstMeta?.size ?? 0,
  };
}

export async function uploadProductCatalogImageFiles(
  files: readonly File[],
  uploadSessionId: string = getOrCreateProductImageUploadSessionId(),
): Promise<UploadedProductImage[]> {
  const uploaded: UploadedProductImage[] = [];
  for (const file of files) {
    uploaded.push(await uploadProductCatalogImageFile(file, uploadSessionId));
  }
  return uploaded;
}
