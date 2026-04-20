import Link from 'next/link';
import { cookies } from 'next/headers';
import {
  LANGUAGE_PREFERENCE_KEY,
  parseLanguageFromServer,
  type LanguageCode,
} from '../../lib/language';
import { t } from '../../lib/i18n';

type BrandItem = {
  id: string;
  name: string;
  count: number;
};

type FiltersResponse = {
  brands: BrandItem[];
};

async function getBrands(language: LanguageCode): Promise<BrandItem[]> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    const params = new URLSearchParams({ lang: language });
    const res = await fetch(`${baseUrl}/api/v1/products/filters?${params.toString()}`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      return [];
    }
    const data = (await res.json()) as FiltersResponse;
    return Array.isArray(data.brands) ? data.brands : [];
  } catch {
    return [];
  }
}

/** Brands landing page from navbar — list all published brands. */
export default async function BrandsPage() {
  const cookieStore = await cookies();
  const language: LanguageCode =
    parseLanguageFromServer(cookieStore.get(LANGUAGE_PREFERENCE_KEY)?.value) ?? 'en';
  const brands = await getBrands(language);

  return (
    <div className="w-full pb-16 pt-10">
      <div className="marco-header-container">
        <div className="mb-8 flex items-end justify-between gap-3">
          <h1 className="text-3xl font-bold text-marco-black md:text-4xl">
            {t(language, 'common.navigation.brands')}
          </h1>
          <span className="shrink-0 text-sm text-[#5d7285]">
            {brands.length}
          </span>
        </div>

        {brands.length === 0 ? (
          <div className="rounded-xl border border-marco-border bg-white p-6 text-sm text-[#5d7285]">
            {t(language, 'common.messages.noProductsFound')}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {brands.map((brand) => (
              <Link
                key={brand.id}
                href={`/products?brand=${brand.id}`}
                className="group flex items-center justify-between rounded-xl border border-marco-border bg-white px-4 py-3 transition-colors hover:border-marco-black/30 hover:bg-gray-50"
              >
                <span className="min-w-0 truncate text-base font-medium text-marco-black">
                  {brand.name}
                </span>
                <span className="ml-3 shrink-0 text-sm text-[#90a1b9]">
                  ({brand.count})
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
