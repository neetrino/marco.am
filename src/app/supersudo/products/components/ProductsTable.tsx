'use client';

import { useRouter } from 'next/navigation';
import { Card, Button } from '@shop/ui';
import { useTranslation } from '../../../../lib/i18n-client';
import { AdminTablePagination } from '../../components/AdminTablePagination';
import { formatCatalogPrice, type CurrencyCode } from '../../../../lib/currency';
import type { Product, ProductsResponse } from '../types';

interface ProductsTableProps {
  loading: boolean;
  sortedProducts: Product[];
  products: Product[];
  selectedIds: Set<string>;
  toggleSelect: (id: string) => void;
  toggleSelectAll: () => void;
  sortBy: string;
  handleHeaderSort: (field: 'price' | 'createdAt' | 'title' | 'stock') => void;
  currency: CurrencyCode;
  handleDeleteProduct: (productId: string, productTitle: string) => void;
  handleTogglePublished: (productId: string, currentStatus: boolean, productTitle: string) => void;
  handleToggleFeatured: (productId: string, currentStatus: boolean, productTitle: string) => void;
  deletingIds: Set<string>;
  updatingPublishedIds: Set<string>;
  updatingFeaturedIds: Set<string>;
  meta: ProductsResponse['meta'] | null;
  page: number;
  setPage: (page: number | ((prev: number) => number)) => void;
}

/**
 * Helper function to process image URLs
 * Handles relative paths, absolute URLs and base64
 */
const processImageUrl = (url: string | null) => {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  // For relative paths, ensure they start with a slash
  return url.startsWith('/') ? url : `/${url}`;
};

export function ProductsTable({
  loading,
  sortedProducts,
  products,
  selectedIds,
  toggleSelect,
  toggleSelectAll,
  sortBy,
  handleHeaderSort,
  currency,
  handleDeleteProduct,
  handleTogglePublished,
  handleToggleFeatured,
  deletingIds,
  updatingPublishedIds,
  updatingFeaturedIds,
  meta,
  page,
  setPage,
}: ProductsTableProps) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <Card className="admin-table-card overflow-hidden rounded-2xl border-slate-200/80 shadow-md shadow-slate-200/60">
      {loading ? (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('admin.products.loadingProducts')}</p>
        </div>
      ) : sortedProducts.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-gray-600">{t('admin.products.noProducts')}</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50/85">
                <tr>
                  <th className="px-3 py-2.5">
                    <input
                      type="checkbox"
                      aria-label={t('admin.products.selectAll')}
                      checked={products.length > 0 && products.every(p => selectedIds.has(p.id))}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                    />
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <button
                      type="button"
                      onClick={() => handleHeaderSort('title')}
                      className="inline-flex items-center gap-1 text-slate-500 transition-colors hover:text-slate-800"
                    >
                      <span>{t('admin.products.product')}</span>
                      <span className="flex flex-col gap-0.5">
                        <svg
                          className={`w-2.5 h-2.5 ${
                            sortBy === 'title-asc'
                              ? 'text-gray-900'
                              : 'text-gray-400'
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                        <svg
                          className={`w-2.5 h-2.5 ${
                            sortBy === 'title-desc'
                              ? 'text-gray-900'
                              : 'text-gray-400'
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                    </button> 
                  </th>
                  <th className="max-w-[11rem] px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {t('admin.products.categories')}
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <button
                      type="button"
                      onClick={() => handleHeaderSort('stock')}
                      className="inline-flex items-center gap-1 text-slate-500 transition-colors hover:text-slate-800"
                    >
                      <span>{t('admin.products.stock')}</span>
                      <span className="flex flex-col gap-0.5">
                        <svg
                          className={`w-2.5 h-2.5 ${
                            sortBy === 'stock-asc'
                              ? 'text-gray-900'
                              : 'text-gray-400'
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                        <svg
                          className={`w-2.5 h-2.5 ${
                            sortBy === 'stock-desc'
                              ? 'text-gray-900'
                              : 'text-gray-400'
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                    </button>
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <button
                      type="button"
                      onClick={() => handleHeaderSort('price')}
                      className="inline-flex items-center gap-1 text-slate-500 transition-colors hover:text-slate-800"
                    >
                      <span>{t('admin.products.price')}</span>
                      <span className="flex flex-col gap-0.5">
                        <svg
                          className={`w-2.5 h-2.5 ${
                            sortBy === 'price-asc'
                              ? 'text-gray-900'
                              : 'text-gray-400'
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                        <svg
                          className={`w-2.5 h-2.5 ${
                            sortBy === 'price-desc'
                              ? 'text-gray-900'
                              : 'text-gray-400'
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                    </button>
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {t('admin.products.featured')}
                  </th>
                  <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {t('admin.products.actions')}
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <button
                      type="button"
                      onClick={() => handleHeaderSort('createdAt')}
                      className="inline-flex items-center gap-1 text-slate-500 transition-colors hover:text-slate-800"
                    >
                      <span>{t('admin.products.created')}</span>
                      <span className="flex flex-col gap-0.5">
                        <svg
                          className={`w-2.5 h-2.5 ${
                            sortBy === 'createdAt-asc'
                              ? 'text-gray-900'
                              : 'text-gray-400'
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                        <svg
                          className={`w-2.5 h-2.5 ${
                            sortBy === 'createdAt-desc'
                              ? 'text-gray-900'
                              : 'text-gray-400'
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {sortedProducts.map((product) => (
                  <tr key={product.id} className="group transition-colors hover:bg-amber-50/50">
                    <td className="py-3 pl-6 pr-3">
                      <input
                        type="checkbox"
                        aria-label={t('admin.products.selectProduct').replace('{title}', product.title)}
                        checked={selectedIds.has(product.id)}
                        onChange={() => toggleSelect(product.id)}
                        className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                      />
                    </td>
                    <td className="max-w-xs py-3 pl-6 pr-3 align-top">
                      <div className="flex items-start gap-2.5">
                        {product.image && (
                          <img
                            src={processImageUrl(product.image)}
                            alt={product.title}
                            className="h-10 w-10 shrink-0 rounded-lg border border-slate-200 object-cover shadow-sm"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="whitespace-normal break-words text-sm font-semibold text-slate-900 transition-colors group-hover:text-amber-900">
                            {product.title}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-[11rem] py-3 pl-6 pr-3 align-top">
                      {product.categories && product.categories.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {product.categories.map((cat) => (
                            <span
                              key={cat.id}
                              className="inline-block max-w-full truncate rounded-full border border-amber-200/80 bg-amber-50/90 px-2 py-0.5 text-xs font-medium text-amber-950"
                              title={cat.title}
                            >
                              {cat.title}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3 pl-6 pr-3">
                      {product.colorStocks && product.colorStocks.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {product.colorStocks.map((colorStock) => (
                            <div
                              key={colorStock.color}
                              className="rounded-full border border-slate-200 bg-slate-100/80 px-3 py-1 text-xs"
                            >
                              <span className="font-semibold text-slate-900">{colorStock.color}:</span>
                              <span className="ml-1 text-slate-600">{colorStock.stock} {t('admin.products.pcs')}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm font-medium text-slate-600">
                          {product.stock > 0 ? `${product.stock} ${t('admin.products.pcs')}` : `0 ${t('admin.products.pcs')}`}
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap py-3 pl-6 pr-3">
                      <div className="flex flex-col">
                        <div className="text-sm font-semibold text-slate-900">
                          {formatCatalogPrice(product.price, currency)}
                        </div>
                        {(product.compareAtPrice && product.compareAtPrice > product.price) || 
                         (product.discountPercent && product.discountPercent > 0) ? (
                          <div className="mt-0.5 text-xs text-slate-500 line-through">
                            {formatCatalogPrice(
                              product.compareAtPrice && product.compareAtPrice > product.price
                                ? product.compareAtPrice
                                : product.price / (1 - (product.discountPercent || 0) / 100),
                              currency
                            )}
                          </div>
                        ) : null}
                      </div>
                    </td>
                    <td className="whitespace-nowrap py-3 pl-6 pr-3 text-center">
                      {updatingFeaturedIds.has(product.id) ? (
                        <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
                          <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-slate-700" />
                        </div>
                      ) : (
                      <button
                        onClick={() => handleToggleFeatured(product.id, product.featured || false, product.title)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 transition-all duration-200 hover:scale-105 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
                        title={product.featured ? t('admin.products.clickToRemoveFeatured') : t('admin.products.clickToMarkFeatured')}
                      >
                        <svg
                          className={`w-6 h-6 transition-all duration-200 ${
                            product.featured
                              ? 'fill-marco-black text-marco-black drop-shadow-sm'
                              : 'fill-none stroke-gray-400 text-gray-400 opacity-50 hover:opacity-75'
                          }`}
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                          />
                        </svg>
                      </button>
                      )}
                    </td>
                    <td className="whitespace-nowrap py-3 px-3 text-center text-sm font-medium">
                      <div className="flex flex-nowrap items-center justify-center gap-2 whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          onClick={() => router.push(`/supersudo/products/add?id=${product.id}`)}
                          aria-label={t('admin.products.edit')}
                          className="!h-5 !min-h-5 !w-5 !max-w-none shrink-0 !px-0 !py-0 gap-0 rounded-md border border-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                        >
                          <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          onClick={() => handleDeleteProduct(product.id, product.title)}
                          disabled={deletingIds.has(product.id)}
                          aria-label={deletingIds.has(product.id) ? t('admin.products.deleting') : t('admin.products.delete')}
                          className="!h-5 !min-h-5 !w-5 !max-w-none shrink-0 !px-0 !py-0 gap-0 rounded-md border border-transparent text-red-600 hover:border-red-100 hover:bg-red-50 hover:text-red-700 disabled:opacity-70"
                        >
                          {deletingIds.has(product.id) ? (
                            <span className="inline-flex h-full w-full items-center justify-center" aria-hidden>
                              <span className="h-3.5 w-3.5 animate-spin rounded-full border-b-2 border-red-600" />
                            </span>
                          ) : (
                            <svg className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </Button>
                        {updatingPublishedIds.has(product.id) ? (
                          <div className="inline-flex h-5 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200">
                            <div className="h-3.5 w-3.5 animate-spin rounded-full border-b-2 border-slate-700" />
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleTogglePublished(product.id, product.published, product.title)}
                            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 ${
                              product.published
                                ? 'bg-emerald-500'
                                : 'bg-slate-300'
                            }`}
                            title={product.published ? t('admin.products.clickToDraft') : t('admin.products.clickToPublished')}
                            aria-label={product.published ? `${t('admin.products.published')} - ${t('admin.products.clickToDraft')}` : `${t('admin.products.draft')} - ${t('admin.products.clickToPublished')}`}
                          >
                            <span
                              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 ${
                                product.published ? 'translate-x-[18px]' : 'translate-x-0.5'
                              }`}
                            />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap py-3 pl-6 pr-3 text-sm text-slate-600">
                      {new Date(product.createdAt).toLocaleDateString('hy-AM')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta && (
            <AdminTablePagination
              embedded
              currentPage={page}
              totalPages={meta.totalPages}
              totalItems={meta.total}
              onPageChange={(next) => setPage(next)}
            />
          )}
        </>
      )}
    </Card>
  );
}






