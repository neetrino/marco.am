import Link from 'next/link';
import { cookies } from 'next/headers';

const NOT_FOUND_COPY = {
  en: {
    title: 'Page Not Found',
    description: 'The page you are looking for does not exist or has been moved.',
    goHome: 'Go Home',
    browseProducts: 'Browse Products',
  },
  hy: {
    title: 'Էջը չի գտնվել',
    description: 'Ձեր փնտրած էջը գոյություն չունի կամ տեղափոխվել է:',
    goHome: 'Գնալ գլխավոր էջ',
    browseProducts: 'Դիտել ապրանքները',
  },
} as const;

type NotFoundLocale = keyof typeof NOT_FOUND_COPY;

function resolveNotFoundLocale(raw: string | undefined): NotFoundLocale {
  return raw === 'hy' ? 'hy' : 'en';
}

/**
 * Root 404 — no storefront chrome, no i18n client bundle, no /api/v1/* fan-out.
 */
export default async function NotFound() {
  const cookieStore = await cookies();
  const locale = resolveNotFoundLocale(cookieStore.get('shop_language')?.value);
  const copy = NOT_FOUND_COPY[locale];

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center px-4 text-black">
        <h1 className="text-8xl md:text-9xl font-bold text-black mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-black mb-4">{copy.title}</h2>
        <p className="text-black mb-8 max-w-md mx-auto">{copy.description}</p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/"
            className="px-6 py-3 bg-yellow-400 text-black rounded-full hover:bg-yellow-300 transition-colors font-medium"
          >
            {copy.goHome}
          </Link>
          <Link
            href="/products"
            className="px-6 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-colors font-medium"
          >
            {copy.browseProducts}
          </Link>
        </div>
      </div>
    </div>
  );
}
