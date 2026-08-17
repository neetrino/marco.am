'use client';

import { useRef } from 'react';
import { Button } from '@shop/ui';

import { ADMIN_IMAGE_ACCEPT } from '@/lib/constants/admin-image-upload';
import { HOME_HERO_MOBILE_SLIDES_MAX } from '@/lib/constants/home-hero-mobile-slides';
import { useTranslation } from '../../../lib/i18n-client';
import type { HeroBannerUploadingField } from './hero-banner-form';

/** Matches mobile hero — Figma 399×288. */
const HERO_MOBILE_PREVIEW_CLASS = 'aspect-[399/288] w-full';
const PREVIEW_RADIUS_CLASS = 'rounded-[24px]';

type HeroBannerMobileSlidesSectionProps = {
  slideUrls: string[];
  uploadingField: HeroBannerUploadingField;
  onUploadSlide: (index: number, file: File) => Promise<void>;
  onRemoveSlide: (index: number) => Promise<void>;
  onAddSlide: () => void;
};

function MobileSlideUploadCard({
  index,
  url,
  uploadingField,
  onUpload,
  onRemove,
  canRemove,
}: {
  index: number;
  url: string;
  uploadingField: HeroBannerUploadingField;
  onUpload: (index: number, file: File) => Promise<void>;
  onRemove: (index: number) => Promise<void>;
  canRemove: boolean;
}) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const fieldKey = `mobileSlide:${index}` as const;
  const isUploading = uploadingField === fieldKey;
  const isDisabled = uploadingField !== null;
  const hasImage = url.trim().length > 0;
  const label = t('admin.heroBanner.mobileHeroSlideLabel').replace(
    '{n}',
    String(index + 1),
  );

  return (
    <div className="space-y-2" aria-label={label}>
      <p className="text-sm font-medium text-slate-700">{label}</p>
      <div
        className={`group relative w-full overflow-hidden ${PREVIEW_RADIUS_CLASS} ${HERO_MOBILE_PREVIEW_CLASS}`}
      >
        {hasImage ? (
          <>
            <img
              src={url}
              alt={label}
              className={`w-full object-cover transition duration-200 group-hover:scale-[1.01] group-hover:brightness-[0.92] ${HERO_MOBILE_PREVIEW_CLASS} ${PREVIEW_RADIUS_CLASS}`}
            />
            <div
              className={`absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-black/45 px-4 opacity-0 backdrop-blur-[2px] transition duration-200 group-hover:opacity-100 group-focus-within:opacity-100 ${PREVIEW_RADIUS_CLASS} ${isUploading ? 'opacity-100' : ''}`}
            >
              {isUploading ? (
                <div className="flex flex-col items-center gap-2 text-white">
                  <span className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-amber-400" />
                  <span className="text-sm font-medium">{t('admin.heroBanner.uploading')}</span>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={isDisabled}
                    onClick={() => inputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-5 py-2.5 text-sm font-bold text-slate-900 shadow-lg shadow-amber-500/30 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {t('admin.heroBanner.changeImage')}
                  </button>
                  {canRemove ? (
                    <button
                      type="button"
                      disabled={isDisabled}
                      onClick={() => void onRemove(index)}
                      className="text-xs font-medium text-red-200 transition hover:text-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {t('admin.heroBanner.removeMobileSlide')}
                    </button>
                  ) : null}
                </>
              )}
            </div>
          </>
        ) : (
          <button
            type="button"
            disabled={isDisabled}
            onClick={() => inputRef.current?.click()}
            className={`flex w-full cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-slate-300/80 bg-slate-100/60 text-slate-500 transition hover:border-amber-300 hover:bg-amber-50/50 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 ${HERO_MOBILE_PREVIEW_CLASS} ${PREVIEW_RADIUS_CLASS} min-h-[120px]`}
          >
            {isUploading ? (
              <>
                <span className="inline-block h-7 w-7 animate-spin rounded-full border-2 border-slate-300 border-t-amber-500" />
                <span className="text-sm font-medium">{t('admin.heroBanner.uploading')}</span>
              </>
            ) : (
              <span className="text-sm font-medium">{t('admin.heroBanner.clickToUpload')}</span>
            )}
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ADMIN_IMAGE_ACCEPT}
          className="hidden"
          disabled={isDisabled}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void onUpload(index, file);
            event.target.value = '';
          }}
        />
      </div>
    </div>
  );
}

export function HeroBannerMobileSlidesSection({
  slideUrls,
  uploadingField,
  onUploadSlide,
  onRemoveSlide,
  onAddSlide,
}: HeroBannerMobileSlidesSectionProps) {
  const { t } = useTranslation();
  const canAdd = slideUrls.length < HOME_HERO_MOBILE_SLIDES_MAX;
  const canRemove = slideUrls.length > 1;

  return (
    <div className="space-y-4">
      {slideUrls.map((url, index) => (
        <MobileSlideUploadCard
          key={`mobile-slide-${index}`}
          index={index}
          url={url}
          uploadingField={uploadingField}
          onUpload={onUploadSlide}
          onRemove={onRemoveSlide}
          canRemove={canRemove}
        />
      ))}

      {canAdd ? (
        <Button
          type="button"
          variant="ghost"
          onClick={onAddSlide}
          disabled={uploadingField !== null}
          className="w-full border border-dashed border-slate-300"
        >
          {t('admin.heroBanner.addMobileSlide')}
        </Button>
      ) : (
        <p className="text-center text-xs text-slate-500">
          {t('admin.heroBanner.mobileSlidesMaxHint').replace(
            '{max}',
            String(HOME_HERO_MOBILE_SLIDES_MAX),
          )}
        </p>
      )}
    </div>
  );
}
