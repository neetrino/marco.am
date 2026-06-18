'use client';

import { Montserrat } from 'next/font/google';
import Link from 'next/link';
import { useTranslation } from '../lib/i18n-client';

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

/** Figma 218:2270 — breadcrumb above wordmark: #afafaf home link, #333 « / » + current */
const PRODUCTS_PAGE_BREADCRUMB_CLASS = `${productsShopTitleFont.className} text-xs font-bold leading-snug`;

function ProductsShopTitleBlock({ total }: { readonly total?: number }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-start">
      <nav
        aria-label={t('products.header.breadcrumbNavLabel')}
        className="mb-[12px] w-full min-w-0 md:mb-[16px]"
      >
        <p className={PRODUCTS_PAGE_BREADCRUMB_CLASS}>
          <Link
            href="/"
            className="text-[#afafaf] dark:text-white/78 transition-colors hover:text-[#333] dark:hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-marco-black/20 focus-visible:ring-offset-2"
          >
            {t('products.header.breadcrumbHome')}
          </Link>
          <span className="text-[#333] dark:text-white/44">
            {' '}
            / {t('products.header.breadcrumbShop')}
          </span>
        </p>
      </nav>
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

interface ProductsHeaderProps {
  /**
   * Ընդհանուր ապրանքների քանակը՝ բոլոր էջերում (from API meta.total).
   * Undefined until PLP listing streams (header still paints first).
   */
  total?: number;
}

/** Page title + breadcrumb only. Listing controls live in `ProductsListingToolbar`. */
export function ProductsHeader({ total }: ProductsHeaderProps) {
  return (
    <div className="marco-header-container pb-2 pt-[58px] sm:pb-4">
      <ProductsShopTitleBlock total={total} />
    </div>
  );
}
