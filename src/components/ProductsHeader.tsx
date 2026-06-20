'use client';

import { Montserrat } from 'next/font/google';
import { useTranslation } from '../lib/i18n-client';
import { useProductsShopPlpShell } from '@/lib/products-shop-plp-shell-context';

/** Figma MARCO 218:2275 — wordmark «ԽԱՆՈՒԹ» (Montserrat Bold) */
const productsShopTitleFont = Montserrat({
  weight: '700',
  subsets: ['latin', 'latin-ext', 'cyrillic'],
});

/** Figma 218:2275 — wordmark, slightly smaller than 54px spec */
const PRODUCTS_PAGE_TITLE_CLASS = `${productsShopTitleFont.className} text-[#181111] dark:text-white uppercase font-bold leading-none tracking-[-0.6px] whitespace-nowrap text-[clamp(1.25rem,3.2vw,1.75rem)] sm:text-3xl lg:text-[36px]`;

/** Figma 218:2274 — yellow bar under title: h-1 w-20, marco yellow, mt-2 */
const PRODUCTS_PAGE_TITLE_UNDERLINE_CLASS =
  'mt-2 h-1 w-20 shrink-0 rounded-sm bg-marco-yellow';

/** PLP page title (SHOP wordmark) — no breadcrumb; total is sr-only when streamed from listing. */
export function ProductsShopPageTitle() {
  const { t } = useTranslation();
  const { total } = useProductsShopPlpShell();

  return (
    <div className="flex flex-col items-start">
      <div className="flex flex-col items-start gap-3">
        <h1 className={PRODUCTS_PAGE_TITLE_CLASS}>
          <span aria-hidden className="block">
            {t('products.header.shopWordmark')}
          </span>
          {total !== undefined ? (
            <span className="sr-only">
              {t('products.header.allProducts').replace('{total}', String(total))}
            </span>
          ) : null}
        </h1>
        <span className={PRODUCTS_PAGE_TITLE_UNDERLINE_CLASS} aria-hidden />
      </div>
    </div>
  );
}
