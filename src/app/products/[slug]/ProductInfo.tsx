'use client';

import { formatCatalogPrice } from '../../../lib/currency';
import type { CurrencyCode } from '../../../lib/currency';
import { getProductText } from '../../../lib/i18n';
import type { LanguageCode } from '../../../lib/language';
import { normalizeLiteralNewlinesToLineBreaks } from '../../../lib/utils/normalize-literal-newlines';
import { sanitizeHtml } from '../../../lib/utils/sanitize';
import { ProductPartialStar } from './ProductPartialStar';
import type { Product } from './types';

interface ProductInfoProps {
  product: Product;
  price: number;
  originalPrice: number | null | undefined;
  compareAtPrice: number | undefined;
  discountPercent: number | null;
  currency: CurrencyCode;
  language: LanguageCode;
  averageRating: number;
  reviewsCount: number;
  scrollToReviews: () => void;
  t: (lang: LanguageCode, key: string) => string;
}

export function ProductInfo({
  product,
  price,
  originalPrice,
  compareAtPrice,
  discountPercent: _discountPercent,
  currency,
  language,
  averageRating,
  reviewsCount,
  scrollToReviews,
  t,
}: ProductInfoProps) {
  const rawDescription = getProductText(language, product.id, 'longDescription') || product.description || '';
  const sanitizedDescription = sanitizeHtml(normalizeLiteralNewlinesToLineBreaks(rawDescription));
  const hasDescription = sanitizedDescription
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .trim().length > 0;

  const hasProductReviews = reviewsCount > 0;
  const displayRatingScore = hasProductReviews
    ? Math.min(5, Math.max(0, averageRating))
    : 5;
  const starFillRatio = displayRatingScore / 5;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1">
        {product.brand && <p className="text-sm text-gray-500 mb-2">{product.brand.name}</p>}
        <h1 className="mb-4 text-2xl font-bold text-marco-black sm:text-3xl md:text-4xl">
          {getProductText(language, product.id, 'title') || product.title}
        </h1>
        <div className="-mt-2 mb-6 flex flex-wrap items-center gap-x-2 gap-y-1">
          <ProductPartialStar fillRatio={starFillRatio} />
          <span className="text-sm font-semibold tabular-nums text-marco-black">
            {displayRatingScore.toFixed(1)}
          </span>
          <span className="text-sm text-gray-400" aria-hidden>
            ·
          </span>
          <button
            type="button"
            onClick={scrollToReviews}
            className="text-sm text-gray-600 underline-offset-2 transition-colors hover:text-marco-black hover:underline"
          >
            {reviewsCount}{' '}
            {reviewsCount === 1
              ? t(language, 'common.reviews.review')
              : t(language, 'common.reviews.reviews')}
          </button>
        </div>
        <div className="mb-6">
          <div className="flex flex-col gap-1">
            {/* Discounted price with discount percentage */}
            <div className="flex items-center gap-2">
              <p className="text-3xl font-bold text-marco-black">{formatCatalogPrice(price, currency)}</p>
            </div>
            {/* Original price below discounted price - full width, not inline */}
            {(originalPrice || (compareAtPrice && compareAtPrice > price)) && (
              <p className="text-xl text-gray-500 line-through decoration-gray-400 mt-1">
                {formatCatalogPrice(originalPrice || compareAtPrice || 0, currency)}
              </p>
            )}
          </div>
        </div>
        {hasDescription && (
          <div
            className="text-gray-600 mb-8 prose prose-sm"
            dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
          />
        )}

      </div>
    </div>
  );
}



