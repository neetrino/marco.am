'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

import { useTranslation } from '@/lib/i18n-client';
import { getStoredLanguage } from '@/lib/language';
import { prefetchProductPdp } from '@/lib/product-pdp/prefetch-product-pdp';

type NoPriceProductPopupProps = {
  readonly isOpen: boolean;
  readonly productSlug: string;
  readonly onClose: () => void;
};

export function NoPriceProductPopup({
  isOpen,
  productSlug,
  onClose,
}: NoPriceProductPopupProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isMounted, setIsMounted] = useState(false);
  const productHref = `/products/${encodeURIComponent(productSlug.trim())}`;

  const handleOrderClick = () => {
    router.push(productHref);
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    void router.prefetch(productHref);
    void prefetchProductPdp(queryClient, productSlug, getStoredLanguage());
  }, [isOpen, productHref, productSlug, queryClient, router]);

  if (!isOpen || !isMounted) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('products.noPrice.popupTitle')}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <h3 className="text-xl font-bold text-[#181111]">
          {t('products.noPrice.popupTitle')}
        </h3>
        <p className="mt-3 text-sm leading-6 text-[#383838]">
          {t('products.noPrice.popupDescription')}
        </p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[#dedede] px-4 py-2 text-sm font-medium text-[#383838] transition-colors hover:bg-[#fafafa]"
          >
            {t('common.buttons.close')}
          </button>
          <button
            type="button"
            onClick={() => {
              handleOrderClick();
            }}
            className="rounded-full bg-marco-black px-4 py-2 text-sm font-semibold text-white transition-colors hover:brightness-95"
          >
            {t('products.noPrice.orderButton')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
