'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { apiClient } from '../lib/api-client';
import { getStoredLanguage, type LanguageCode } from '../lib/language';
import { logger } from '../lib/utils/logger';
import { getFallbackTopCategories } from './homeFallbackData';

// ─── Figma section-header arrow assets ────────────────────────────────────────
const ARROW_LEFT = 'https://www.figma.com/api/mcp/asset/f6619936-dbc1-441e-8c11-81b0dcc6d826';
const ARROW_RIGHT = 'https://www.figma.com/api/mcp/asset/4e001f43-a87e-4fdc-92d3-18d465e422da';

interface TopCategoryItem {
  id: string;
  slug: string;
  title: string;
  productCount: number;
  image: string | null;
}

interface TopCategoriesResponse {
  data: TopCategoryItem[];
}

export function TopCategories() {
  const router = useRouter();
  const [topCategories, setTopCategories] = useState<TopCategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState<LanguageCode>('en');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateLanguage = () => setLanguage(getStoredLanguage());

    updateLanguage();
    window.addEventListener('language-updated', updateLanguage);

    return () => window.removeEventListener('language-updated', updateLanguage);
  }, []);

  useEffect(() => {
    fetchTopCategories(language);
  }, [language]);

  const fetchTopCategories = async (currentLanguage: LanguageCode) => {
    try {
      setLoading(true);
      const response = await apiClient.get<TopCategoriesResponse>('/api/v1/categories/top', {
        params: { lang: currentLanguage, limit: '8' },
      });
      const nextCategories = response.data?.length
        ? response.data
        : getFallbackTopCategories(currentLanguage);

      setTopCategories(nextCategories);
    } catch (err) {
      logger.warn('[TopCategories] fetch failed', { err });
      setTopCategories(getFallbackTopCategories(currentLanguage));
    } finally {
      setLoading(false);
    }
  };

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' });
    }
  };

  return (
    <section className="bg-white py-10 px-4 sm:px-6 lg:px-[80px] xl:px-[120px] 2xl:px-[151px]">
      {/* ── Section header ── */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2
            className="font-montserrat font-bold uppercase text-[#181111] leading-none"
            style={{ fontSize: 'clamp(24px, 2.813vw, 54px)', letterSpacing: '-0.6px' }}
          >
            REELS
          </h2>
          <div className="h-[4px] w-[104px] bg-[#ffca03] mt-2" />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => scroll('left')}
            className="flex items-center justify-center rounded-full border border-[#e5e7eb] hover:bg-[#ffca03] hover:border-[#ffca03] transition-colors"
            style={{ width: 51, height: 40 }}
            aria-label="Scroll left"
          >
            <img src={ARROW_LEFT} alt="" aria-hidden className="w-[7px] h-[12px]" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="flex items-center justify-center rounded-full border border-[#e5e7eb] hover:bg-[#ffca03] hover:border-[#ffca03] transition-colors"
            style={{ width: 51, height: 40 }}
            aria-label="Scroll right"
          >
            <img src={ARROW_RIGHT} alt="" aria-hidden className="w-[7px] h-[12px]" />
          </button>
        </div>
      </div>

      {/* ── Category circles ── */}
      {loading ? (
        <div className="flex gap-[62px] overflow-hidden">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex flex-col items-center gap-3 flex-shrink-0">
              <div className="w-[145px] h-[145px] rounded-full bg-gray-200 animate-pulse" />
              <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : topCategories.length === 0 ? null : (
        <div
          ref={scrollRef}
          className="flex gap-[40px] lg:gap-[62px] overflow-x-auto scrollbar-hide pb-2"
        >
          {topCategories.map((item) => (
            <Link
              key={item.id}
              href={`/products?category=${item.slug}`}
              onClick={(e) => { e.preventDefault(); router.push(`/products?category=${item.slug}`); }}
              className="flex flex-col items-center gap-3 group cursor-pointer flex-shrink-0 outline-none"
            >
              {/* Circle image — Figma: 145×145px */}
              <div
                className="rounded-full overflow-hidden bg-gray-100 shadow-sm flex-shrink-0 transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-1"
                style={{ width: 145, height: 145 }}
              >
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.title}
                    width={145}
                    height={145}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                )}
              </div>
              {/* Category label — Figma: 18px, text-center */}
              <span
                className="font-montserrat text-[#050401] text-center"
                style={{ fontSize: 18, lineHeight: '28px' }}
              >
                {item.title}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
