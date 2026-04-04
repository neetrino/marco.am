'use client';

import { useState, useEffect, useCallback, useRef, type RefObject } from 'react';
import { apiClient } from '../lib/api-client';
import { getStoredLanguage, type LanguageCode } from '../lib/language';
import { HomeProductCard, type HomeProductCardData } from './HomeProductCard';
import {
  getFallbackFeaturedProducts,
  getFallbackNewProducts,
} from './homeFallbackData';

// ─── Figma nav-arrow images ────────────────────────────────────────────────────
const ARROW_LEFT_PREV = 'https://www.figma.com/api/mcp/asset/9689c1cd-8859-41bf-aaec-23b7d6156653';
const ARROW_RIGHT_NEXT = 'https://www.figma.com/api/mcp/asset/dce468f9-403c-402e-8b3c-2bf55e318ee5';
const ARROW_LEFT_NEW = 'https://www.figma.com/api/mcp/asset/0b8c6403-7a34-4445-9426-0d6b4c6b15c3';
const ARROW_RIGHT_NEW = 'https://www.figma.com/api/mcp/asset/2a87d54e-fc1e-471d-8c20-69d3342079f4';

interface Product {
  id: string;
  slug: string;
  title: string;
  price: number;
  compareAtPrice?: number | null;
  image: string | null;
  inStock: boolean;
  brand: { id: string; name: string } | null;
  originalPrice?: number | null;
  discountPercent?: number | null;
}

interface ProductsResponse {
  data: Product[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const PRODUCTS_PER_PAGE = 10;

function mapProductToCard(product: Product): HomeProductCardData {
  const price = product.price || 0;
  const compareAtPrice =
    (product.originalPrice && product.originalPrice > price && product.originalPrice) ||
    (product.compareAtPrice && product.compareAtPrice > price && product.compareAtPrice) ||
    null;

  const computedDiscount =
    product.discountPercent ||
    (compareAtPrice
      ? Math.max(1, Math.round(((compareAtPrice - price) / compareAtPrice) * 100))
      : null);

  return {
    id: product.id,
    href: `/products/${product.slug}`,
    title: product.title,
    brand: product.brand?.name || 'Marco',
    image: product.image,
    price,
    compareAtPrice,
    badge: computedDiscount ? `-${computedDiscount}%` : undefined,
  };
}

// ── Section header — Figma 119:2052 / 119:2079 (title + primary rule + arrows) ──
function SectionHeader({
  title,
  onPrev,
  onNext,
  arrowLeft,
  arrowRight,
}: {
  title: string;
  onPrev: () => void;
  onNext: () => void;
  arrowLeft: string;
  arrowRight: string;
}) {
  return (
    <div className="flex justify-between items-end mb-8">
      <div>
        <h2
          className="font-montserrat font-bold uppercase text-[#181111] leading-none"
          style={{ fontSize: 'clamp(22px, 2.813vw, 54px)', letterSpacing: '-0.6px' }}
        >
          {title}
        </h2>
        <div className="h-[4px] w-[104px] bg-[#ffca03] mt-2" />
      </div>
      <div className="flex gap-2">
        <button
          onClick={onPrev}
          className="flex items-center justify-center rounded-full border border-[#e5e7eb] hover:bg-[#ffca03] hover:border-[#ffca03] transition-colors"
          style={{ width: 51, height: 40 }}
          aria-label="Previous"
        >
          <img src={arrowLeft} alt="" aria-hidden className="w-[7px] h-[12px]" />
        </button>
        <button
          onClick={onNext}
          className="flex items-center justify-center rounded-full border border-[#e5e7eb] hover:bg-[#ffca03] hover:border-[#ffca03] transition-colors"
          style={{ width: 51, height: 40 }}
          aria-label="Next"
        >
          <img src={arrowRight} alt="" aria-hidden className="w-[7px] h-[12px]" />
        </button>
      </div>
    </div>
  );
}


export function FeaturedProductsTabs() {
  const [language, setLanguage] = useState<LanguageCode>('en');
  const [specialProducts, setSpecialProducts] = useState<HomeProductCardData[]>([]);
  const [newProducts, setNewProducts] = useState<HomeProductCardData[]>([]);
  const [loadingSpecial, setLoadingSpecial] = useState(true);
  const [loadingNew, setLoadingNew] = useState(true);

  const specialScrollRef = useRef<HTMLDivElement>(null);
  const newScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateLanguage = () => setLanguage(getStoredLanguage());
    updateLanguage();
    window.addEventListener('language-updated', updateLanguage);
    return () => window.removeEventListener('language-updated', updateLanguage);
  }, []);

  const fetchProducts = useCallback(
    async (
      filter: 'featured' | 'new',
      setter: (products: HomeProductCardData[]) => void,
      setLoading: (value: boolean) => void
    ) => {
      try {
        setLoading(true);
        const res = await apiClient.get<ProductsResponse>('/api/v1/products', {
          params: { page: '1', limit: String(PRODUCTS_PER_PAGE), lang: language, filter },
        });
        const fetchedProducts = (res.data || []).slice(0, PRODUCTS_PER_PAGE).map(mapProductToCard);

        setter(
          fetchedProducts.length > 0
            ? fetchedProducts
            : filter === 'featured'
              ? getFallbackFeaturedProducts(language)
              : getFallbackNewProducts(language)
        );
      } catch {
        setter(
          filter === 'featured'
            ? getFallbackFeaturedProducts(language)
            : getFallbackNewProducts(language)
        );
      } finally {
        setLoading(false);
      }
    },
    [language]
  );

  useEffect(() => {
    fetchProducts('featured', setSpecialProducts, setLoadingSpecial);
    fetchProducts('new', setNewProducts, setLoadingNew);
  }, [fetchProducts]);

  const scrollSection = (ref: RefObject<HTMLDivElement | null>, dir: 'left' | 'right') => {
    if (ref.current) {
      ref.current.scrollBy({ left: dir === 'left' ? -350 : 350, behavior: 'smooth' });
    }
  };

  return (
    <>
      {/* Figma 119:2052 — Հատուկ առաջարկներ */}
      <section className="bg-white py-10 px-4 sm:px-6 lg:px-[80px] xl:px-[120px] 2xl:px-[151px]">
        <SectionHeader
          title="Հատուկ առաջարկներ"
          onPrev={() => scrollSection(specialScrollRef, 'left')}
          onNext={() => scrollSection(specialScrollRef, 'right')}
          arrowLeft={ARROW_LEFT_PREV}
          arrowRight={ARROW_RIGHT_NEXT}
        />
        <div ref={specialScrollRef} className="flex gap-5 overflow-x-auto scrollbar-hide pb-2">
          {loadingSpecial
            ? [...Array(4)].map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[306px] h-[486px] bg-[#f6f6f6] rounded-[32px] animate-pulse" />
              ))
            : specialProducts.map((product) => (
                <div key={product.id} className="flex-shrink-0 w-[306px]">
                  <HomeProductCard product={product} />
                </div>
              ))}
        </div>
      </section>

      {/* Figma 119:2079 — ՆՈՐՈՒՅԹՆԵՐ */}
      <section className="bg-white py-10 px-4 sm:px-6 lg:px-[80px] xl:px-[120px] 2xl:px-[151px]">
        <SectionHeader
          title="ՆՈՐՈՒՅԹՆԵՐ"
          onPrev={() => scrollSection(newScrollRef, 'left')}
          onNext={() => scrollSection(newScrollRef, 'right')}
          arrowLeft={ARROW_LEFT_NEW}
          arrowRight={ARROW_RIGHT_NEW}
        />
        <div ref={newScrollRef} className="flex gap-5 overflow-x-auto scrollbar-hide pb-2">
          {loadingNew
            ? [...Array(4)].map((_, i) => (
                <div key={i} className="flex-shrink-0 w-[306px] h-[486px] bg-[#f6f6f6] rounded-[32px] animate-pulse" />
              ))
            : newProducts.map((product) => (
                <div key={product.id} className="flex-shrink-0 w-[306px]">
                  <HomeProductCard product={product} />
                </div>
              ))}
        </div>
      </section>
    </>
  );
}
