import type { MouseEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';

import type { CompareClientItem } from '@/lib/compare/compare-client';
import { formatCatalogPrice, type CurrencyCode } from '@/lib/currency';
import { ProductImagePlaceholder } from '@/components/ProductImagePlaceholder';

export type CompareTableProduct = {
  id: string;
  slug: string;
  title: string;
  price: number;
  originalPrice: number | null;
  compareAtPrice: number | null;
  discountPercent: number | null;
  image: string | null;
  inStock: boolean;
  brand: {
    id: string;
    name: string;
  } | null;
};

export function mapCompareItemToProduct(item: CompareClientItem): CompareTableProduct {
  return {
    id: item.productId,
    slug: item.slug,
    title: item.title,
    price: item.price,
    originalPrice: item.originalPrice,
    compareAtPrice: item.compareAtPrice,
    discountPercent: item.discountPercent,
    image: item.image,
    inStock: item.inStock,
    brand: item.brand,
  };
}

export type CompareCategoryTableProps = {
  products: CompareTableProduct[];
  currency: CurrencyCode;
  t: (key: string) => string;
  addingToCart: Set<string>;
  handleRemove: (e: MouseEvent, productId: string) => void;
  handleAddToCart: (e: MouseEvent, product: CompareTableProduct) => void;
};

export function CompareCategoryTable({
  products,
  currency,
  t,
  addingToCart,
  handleRemove,
  handleAddToCart,
}: CompareCategoryTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200 dark:border-white/40">
            <th className="sticky left-0 z-10 min-w-[150px] bg-gray-50 px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:!bg-[#202020] dark:!text-white">
              {t('common.compare.characteristic')}
            </th>
            {products.map((product) => (
              <th
                key={product.id}
                className="relative min-w-[220px] bg-gray-50 px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:!bg-[#202020] dark:text-white/85"
              >
                <button
                  type="button"
                  onClick={(e) => handleRemove(e, product.id)}
                  className="group absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full transition-all hover:bg-marco-yellow"
                  title={t('common.buttons.remove')}
                  aria-label={t('common.buttons.remove')}
                >
                  <svg
                    className="h-4 w-4 !text-[#9ca3af] transition-colors group-hover:!text-[#050505] dark:group-hover:!text-[#050505]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-white/40">
          <tr className="transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">
            <td className="sticky left-0 z-10 bg-gray-50 px-4 py-4 text-sm font-medium text-gray-700 dark:!bg-[#202020] dark:!text-white">
              {t('common.compare.image')}
            </td>
            {products.map((product) => (
              <td key={product.id} className="px-4 py-4 text-center">
                <Link href={`/products/${product.slug}`} className="inline-block">
                  <div className="relative mx-auto h-32 w-32 overflow-hidden rounded-lg !bg-gray-100 dark:!bg-gray-100">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.title}
                        fill
                        className="object-cover"
                        sizes="128px"
                        unoptimized
                      />
                    ) : (
                      <ProductImagePlaceholder
                        className="h-full w-full !bg-gray-200 !text-gray-400 dark:!bg-gray-200 dark:!text-gray-400"
                        aria-label={product.title ? `No image for ${product.title}` : 'No image'}
                      />
                    )}
                  </div>
                </Link>
              </td>
            ))}
          </tr>
          <tr className="transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">
            <td className="sticky left-0 z-10 bg-gray-50 px-4 py-4 text-sm font-medium text-gray-700 dark:!bg-[#202020] dark:!text-white">
              {t('common.compare.name')}
            </td>
            {products.map((product) => (
              <td key={product.id} className="px-4 py-4">
                <Link
                  href={`/products/${product.slug}`}
                  className="block text-center text-base font-semibold text-gray-900 transition-colors hover:text-blue-600 dark:text-white/90 dark:hover:text-marco-yellow"
                >
                  {product.title}
                </Link>
              </td>
            ))}
          </tr>
          <tr className="transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">
            <td className="sticky left-0 z-10 bg-gray-50 px-4 py-4 text-sm font-medium text-gray-700 dark:!bg-[#202020] dark:!text-white">
              {t('common.compare.brand')}
            </td>
            {products.map((product) => (
              <td
                key={product.id}
                className="px-4 py-4 text-center text-sm text-gray-600 dark:text-white/75"
              >
                {product.brand ? product.brand.name : '-'}
              </td>
            ))}
          </tr>
          <tr className="transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">
            <td className="sticky left-0 z-10 bg-gray-50 px-4 py-4 text-sm font-medium text-gray-700 dark:!bg-[#202020] dark:!text-white">
              {t('common.compare.price')}
            </td>
            {products.map((product) => (
              <td key={product.id} className="px-4 py-4 text-center">
                <div className="flex flex-col items-center justify-center gap-1">
                  <p className="select-none text-lg font-bold text-gray-900 dark:text-white/90">
                    {formatCatalogPrice(product.price, currency)}
                  </p>
                  {product.originalPrice && product.originalPrice > product.price ? (
                    <p className="select-none text-sm text-gray-500 line-through dark:text-white/55">
                      {formatCatalogPrice(product.originalPrice, currency)}
                    </p>
                  ) : null}
                  {!product.originalPrice &&
                  product.compareAtPrice &&
                  product.compareAtPrice > product.price ? (
                    <p className="select-none text-sm text-gray-500 line-through dark:text-white/55">
                      {formatCatalogPrice(product.compareAtPrice, currency)}
                    </p>
                  ) : null}
                </div>
              </td>
            ))}
          </tr>
          <tr className="transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">
            <td className="sticky left-0 z-10 bg-gray-50 px-4 py-4 text-sm font-medium text-gray-700 dark:!bg-[#202020] dark:!text-white">
              {t('common.compare.availability')}
            </td>
            {products.map((product) => (
              <td key={product.id} className="px-4 py-4 text-center">
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                    product.inStock
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {product.inStock
                    ? t('common.stock.inStock')
                    : t('common.stock.outOfStock')}
                </span>
              </td>
            ))}
          </tr>
          <tr className="transition-colors hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">
            <td className="sticky left-0 z-10 bg-gray-50 px-4 py-4 text-sm font-medium text-gray-700 dark:!bg-[#202020] dark:!text-white">
              {t('common.compare.actions')}
            </td>
            {products.map((product) => (
              <td key={product.id} className="px-4 py-4 text-center">
                <div className="flex flex-col items-center gap-3">
                  <Link
                    href={`/products/${product.slug}`}
                    className="text-sm font-medium text-marco-black transition-opacity hover:opacity-80 dark:text-white/85 dark:hover:text-marco-yellow"
                  >
                    {t('common.compare.viewDetails')}
                  </Link>
                  {product.inStock ? (
                    <button
                      type="button"
                      onClick={(e) => handleAddToCart(e, product)}
                      disabled={addingToCart.has(product.id)}
                      className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-full bg-marco-yellow px-6 text-sm font-bold !text-[#050505] transition-[filter] hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 dark:!text-[#050505]"
                    >
                      {addingToCart.has(product.id)
                        ? t('common.messages.adding')
                        : t('common.buttons.addToCart')}
                    </button>
                  ) : null}
                </div>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
