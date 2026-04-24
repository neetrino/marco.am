import Image from 'next/image';
import Link from 'next/link';
import { cookies } from 'next/headers';

import { t } from '../../lib/i18n';
import { LANGUAGE_PREFERENCE_KEY, parseLanguageFromServer, type LanguageCode } from '../../lib/language';

type BrandLogoCard = {
  id: string;
  label: string;
  slug: string;
  logoSrc?: string;
  logoWidth?: number;
  logoHeight?: number;
  logoClassName?: string;
  cardClassName?: string;
  wordmarkClassName?: string;
};

const BRAND_LOGO_CARDS: readonly BrandLogoCard[] = [
  {
    id: 'carino',
    label: 'CARINO',
    slug: 'carino',
    logoSrc: '/assets/brands/carino.svg',
    logoWidth: 520,
    logoHeight: 140,
  },
  {
    id: 'kenwood',
    label: 'KENWOOD',
    slug: 'kenwood',
    logoSrc: '/assets/brands/kenwood.svg',
    logoWidth: 1117,
    logoHeight: 177,
  },
  {
    id: 'panasonic',
    label: 'Panasonic',
    slug: 'panasonic',
    logoSrc: '/assets/brands/panasonic.svg',
    logoWidth: 600,
    logoHeight: 92,
  },
  {
    id: 'franko',
    label: 'FRANKO',
    slug: 'franko',
    wordmarkClassName: 'text-[1.25rem] font-black italic tracking-[0.08em] md:text-[1.45rem]',
  },
  {
    id: 'braun',
    label: 'BRAUN',
    slug: 'braun',
    logoSrc: '/assets/brands/braun.svg',
    logoWidth: 399,
    logoHeight: 169,
  },
  {
    id: 'targen-your-kitchen',
    label: 'TARGEN YOUR KITCHEN',
    slug: 'targen-your-kitchen',
    logoSrc: '/assets/brands/targen-your-kitchen.svg',
    logoWidth: 460,
    logoHeight: 120,
    logoClassName: 'max-h-12 md:max-h-14',
  },
  {
    id: 'bosch',
    label: 'BOSCH',
    slug: 'bosch',
    logoSrc: '/assets/brands/bosch.svg',
    logoWidth: 500,
    logoHeight: 114,
  },
  {
    id: 'kumitel',
    label: 'KUMITEL',
    slug: 'kumitel',
    logoSrc: '/assets/brands/kumitel.svg',
    logoWidth: 1000,
    logoHeight: 150,
  },
  {
    id: 'luxell',
    label: 'LUXELL',
    slug: 'luxell',
    logoSrc: '/assets/brands/luxell.svg',
    logoWidth: 1000,
    logoHeight: 150,
    logoClassName: 'max-h-28 md:max-h-32',
  },
  {
    id: 'marrbaxx',
    label: 'MARRBAXX',
    slug: 'marrbaxx',
    logoSrc: '/assets/brands/marrbaxx.png',
    logoWidth: 1000,
    logoHeight: 350,
  },
  {
    id: 'kastamonu',
    label: 'KASTAMONU',
    slug: 'kastamonu',
    logoSrc: '/assets/brands/kastamonu.svg',
    logoWidth: 1000,
    logoHeight: 300,
  },
  {
    id: 'evo-gloss',
    label: 'EVO GLOSS',
    slug: 'evo-gloss',
    logoSrc: '/assets/brands/evo-gloss.svg',
    logoWidth: 165,
    logoHeight: 69,
  },
  {
    id: 'agt',
    label: 'AGT',
    slug: 'agt',
    logoSrc: '/assets/brands/agt.png',
    logoWidth: 395,
    logoHeight: 121,
  },
  {
    id: 'by-span',
    label: 'BY SPAN',
    slug: 'by-span',
    logoSrc: '/assets/brands/by-span.png',
    logoWidth: 790,
    logoHeight: 158,
  },
  {
    id: 'vestel',
    label: 'VESTEL',
    slug: 'vestel',
    logoSrc: '/assets/brands/vestel.svg',
    logoWidth: 512,
    logoHeight: 111,
  },
  {
    id: 'egida',
    label: 'EGIDA',
    slug: 'egida',
    logoSrc: '/assets/brands/egida.png',
    logoWidth: 256,
    logoHeight: 256,
    logoClassName: 'max-h-24 md:max-h-28',
  },
  {
    id: 'toshiba',
    label: 'TOSHIBA',
    slug: 'toshiba',
    logoSrc: '/assets/brands/toshiba.svg',
    logoWidth: 800,
    logoHeight: 122,
  },
  {
    id: 'philips',
    label: 'PHILIPS',
    slug: 'philips',
    logoSrc: '/assets/brands/philips.svg',
    logoWidth: 500,
    logoHeight: 92,
  },
  {
    id: 'hausberg',
    label: 'HAUSBERG',
    slug: 'hausberg',
    logoSrc: '/assets/brands/hausberg.jpg',
    logoWidth: 320,
    logoHeight: 130,
  },
  {
    id: 'midea',
    label: 'MIDEA',
    slug: 'midea',
    logoSrc: '/assets/brands/midea.svg',
    logoWidth: 114,
    logoHeight: 44,
  },
  {
    id: 'nnobel',
    label: 'NNObel',
    slug: 'nnobel',
    logoSrc: '/assets/brands/nnobel.png',
    logoWidth: 216,
    logoHeight: 214,
    logoClassName: 'max-h-24 md:max-h-28',
  },
  {
    id: 'lex-life-expert',
    label: 'LEX life expert',
    slug: 'lex-life-expert',
    logoSrc: '/assets/brands/lex-life-expert.svg',
    logoWidth: 588,
    logoHeight: 196,
    logoClassName: 'max-h-12 md:max-h-14',
  },
  {
    id: 'hisense',
    label: 'HISENSE',
    slug: 'hisense',
    logoSrc: '/assets/brands/hisense.svg',
    logoWidth: 286,
    logoHeight: 51,
  },
  {
    id: 'geepas',
    label: 'GEEPAS',
    slug: 'geepas',
    logoSrc: '/assets/brands/geepas.png',
    logoWidth: 2000,
    logoHeight: 738,
    logoClassName: 'max-h-24 md:max-h-28',
    cardClassName: 'px-2 py-2',
  },
  {
    id: 'electrolux',
    label: 'ELECTROLUX',
    slug: 'electrolux',
    logoSrc: '/assets/brands/electrolux.svg',
    logoWidth: 1367,
    logoHeight: 177,
  },
  {
    id: 'samsung',
    label: 'SAMSUNG',
    slug: 'samsung',
    logoSrc: '/assets/brands/samsung.svg',
    logoWidth: 1000,
    logoHeight: 332,
  },
  {
    id: 'centek',
    label: 'CENTEK',
    slug: 'centek',
    logoSrc: '/assets/brands/centek.svg',
    logoWidth: 914,
    logoHeight: 170,
  },
  {
    id: 'delonghi',
    label: 'DeLonghi',
    slug: 'delonghi',
    logoSrc: '/assets/brands/delonghi.svg',
    logoWidth: 2337,
    logoHeight: 724,
    logoClassName: 'max-h-12 md:max-h-14',
  },
  {
    id: 'lg',
    label: 'LG',
    slug: 'lg',
    logoSrc: '/assets/brands/lg.svg',
    logoWidth: 512,
    logoHeight: 76,
  },
  {
    id: 'hennson',
    label: 'HENNSON',
    slug: 'hennson',
    wordmarkClassName: 'text-[1.12rem] font-bold tracking-[0.14em] md:text-[1.24rem]',
  },
] as const;

function brandHref(slug: string): string {
  return `/products?brand=${encodeURIComponent(slug)}`;
}

function BrandLogo({ brand }: { brand: BrandLogoCard }) {
  if (brand.logoSrc && brand.logoWidth && brand.logoHeight) {
    return (
      <Image
        src={brand.logoSrc}
        alt={brand.label}
        width={brand.logoWidth}
        height={brand.logoHeight}
        className={`h-auto max-h-14 w-auto max-w-full object-contain md:max-h-16 ${brand.logoClassName ?? ''}`}
      />
    );
  }

  return (
    <span
      className={`text-center text-base font-semibold uppercase tracking-[0.14em] text-[#050505] dark:text-[#050505] md:text-lg ${brand.wordmarkClassName ?? ''}`}
    >
      {brand.label}
    </span>
  );
}

/** Brands landing page from navbar — list all published brands. */
export default async function BrandsPage() {
  const cookieStore = await cookies();
  const language: LanguageCode =
    parseLanguageFromServer(cookieStore.get(LANGUAGE_PREFERENCE_KEY)?.value) ?? 'en';

  return (
    <div className="w-full pb-16 pt-10">
      <div className="marco-header-container">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#050505] dark:text-white md:text-4xl">
            {t(language, 'common.navigation.brands')}
          </h1>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BRAND_LOGO_CARDS.map((brand) => (
            <Link
              key={brand.id}
              href={brandHref(brand.slug)}
              className={`group flex min-h-[136px] items-center justify-center rounded-2xl border border-marco-border bg-[#ffffff] dark:bg-[#ffffff] px-6 py-5 transition-colors hover:border-marco-black/30 hover:bg-[#f8f8f8] dark:hover:bg-[#f8f8f8] ${brand.cardClassName ?? ''}`}
              aria-label={brand.label}
            >
              <BrandLogo brand={brand} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
