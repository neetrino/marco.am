'use client';

import Link from 'next/link';
import { formatPrice } from '../lib/currency';
import { useCurrency } from './hooks/useCurrency';
import { useTranslation } from '../lib/i18n-client';
import { ProductImagePlaceholder } from './ProductImagePlaceholder';

export interface HomeProductCardData {
  id: string;
  href: string;
  title: string;
  brand: string;
  image: string | null;
  price: number;
  compareAtPrice?: number | null;
  badge?: string;
}

interface HomeProductCardProps {
  product: HomeProductCardData;
}

export function HomeProductCard({ product }: HomeProductCardProps) {
  const currency = useCurrency();
  const { t } = useTranslation();

  return (
    <Link
      href={product.href}
      className="group flex h-[486px] w-[306px] shrink-0 flex-col overflow-hidden rounded-[32px] bg-[#f6f6f6] p-5 text-[#181111] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(0,0,0,0.12)]"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <span className="rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#2f4b5d]">
          {product.brand}
        </span>
        {product.badge ? (
          <span className="rounded-full bg-[#ffca03] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-black">
            {product.badge}
          </span>
        ) : null}
      </div>

      <div className="relative mb-5 flex min-h-[250px] flex-1 items-center justify-center overflow-hidden rounded-[24px] bg-white px-4 py-6">
        {product.image ? (
          <img
            src={product.image}
            alt={product.title}
            className="max-h-full w-full object-contain transition-transform duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <ProductImagePlaceholder
            className="size-full rounded-[24px]"
            aria-label={product.title}
          />
        )}
      </div>

      <div className="mt-auto">
        <h3 className="font-montserrat text-[24px] font-bold leading-[30px] tracking-[-0.03em] text-[#181111] line-clamp-2">
          {product.title}
        </h3>

        <div className="mt-4 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[28px] font-semibold leading-none text-[#181111]">
              {formatPrice(product.price, currency)}
            </p>
            {product.compareAtPrice && product.compareAtPrice > product.price ? (
              <p className="mt-2 text-[16px] font-medium text-[#7a7a7a] line-through">
                {formatPrice(product.compareAtPrice, currency)}
              </p>
            ) : null}
          </div>

          <span className="inline-flex h-14 min-w-[56px] items-center justify-center rounded-full bg-black px-4 text-[13px] font-bold uppercase tracking-[0.12em] text-white transition-colors duration-300 group-hover:bg-[#2f4b5d]">
            {t('common.buttons.viewDetails')}
          </span>
        </div>
      </div>
    </Link>
  );
}
