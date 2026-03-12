import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Breadcrumb } from '../../../components/Breadcrumb';
import { ProductCardGrid } from '../../../components/ProductCard/ProductCardGrid';
import { getStoredLanguage } from '../../../lib/language';

const PAGE_CONTAINER = 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8';

async function getBrand(slug: string, lang: string) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  const res = await fetch(`${baseUrl}/api/v1/brands/${encodeURIComponent(slug)}?lang=${lang}`, {
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data ?? null;
}

async function getProductsByBrand(brandId: string, page: number = 1, limit: number = 12, lang: string) {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    lang,
    brand: brandId,
  });
  const res = await fetch(`${baseUrl}/api/v1/products?${params}`, { cache: 'no-store' });
  if (!res.ok) return { data: [], meta: { total: 0, page: 1, limit: 12, totalPages: 0 } };
  const json = await res.json();
  return {
    data: json.data ?? [],
    meta: json.meta ?? { total: 0, page: 1, limit: 12, totalPages: 0 },
  };
}

export default async function BrandPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const lang = getStoredLanguage();
  const brand = await getBrand(slug, lang);
  if (!brand) notFound();

  const page = Math.max(1, parseInt(String(pageParam || '1'), 10));
  const limit = 12;
  const { data: productsData, meta } = await getProductsByBrand(brand.id, page, limit, lang);

  const normalizedProducts = productsData.map((p: Record<string, unknown>) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    price: p.price,
    compareAtPrice: p.compareAtPrice ?? p.originalPrice ?? null,
    image: p.image ?? null,
    inStock: p.inStock ?? true,
    brand: p.brand ?? { id: brand.id, name: brand.name },
    defaultVariantId: p.defaultVariantId ?? null,
    colors: p.colors ?? [],
    labels: p.labels ?? [],
  }));

  return (
    <div className="w-full overflow-x-hidden max-w-full">
      <div className={PAGE_CONTAINER}>
        <Breadcrumb />
        <div className="py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
            {brand.logoUrl && (
              <img
                src={brand.logoUrl}
                alt={brand.name}
                className="w-24 h-24 object-contain border border-gray-200 rounded-lg"
              />
            )}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{brand.name}</h1>
              {brand.description && (
                <p className="mt-2 text-gray-600 max-w-2xl">{brand.description}</p>
              )}
            </div>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Products ({meta.total})
          </h2>
          {normalizedProducts.length === 0 ? (
            <p className="text-gray-500 py-8">No products in this brand yet.</p>
          ) : (
            <>
              <ProductCardGrid products={normalizedProducts} sortBy="default" />
              {meta.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                  {page > 1 && (
                    <Link
                      href={`/brands/${slug}?page=${page - 1}`}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Previous
                    </Link>
                  )}
                  <span className="px-4 py-2 text-gray-600">
                    Page {page} of {meta.totalPages}
                  </span>
                  {page < meta.totalPages && (
                    <Link
                      href={`/brands/${slug}?page=${page + 1}`}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Next
                    </Link>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
