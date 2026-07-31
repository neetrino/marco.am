import type { Metadata } from 'next';
import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { Montserrat } from 'next/font/google';

import { t } from '@/lib/i18n';
import { LANGUAGE_PREFERENCE_KEY, parseLanguageFromServer } from '@/lib/language';
import { ReelsPageCacheFallback } from './ReelsPageCacheFallback';
import { ReelsPageContent } from './ReelsPageContent';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['600', '700'],
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const locale =
    parseLanguageFromServer(cookieStore.get(LANGUAGE_PREFERENCE_KEY)?.value) ?? 'en';
  return {
    title: t(locale, 'home.reels_page.meta_title'),
    description: t(locale, 'home.reels_page.meta_description'),
  };
}

export default async function ReelsPage() {
  const cookieStore = await cookies();
  const locale =
    parseLanguageFromServer(cookieStore.get(LANGUAGE_PREFERENCE_KEY)?.value) ?? 'en';
  const tr = (key: string) => t(locale, key);

  return (
    <section
      className={`min-h-screen bg-white pb-3 text-marco-black sm:pb-4 ${montserrat.className}`}
      aria-label={tr('home.reels_feed_region_aria')}
    >
      <Suspense fallback={<ReelsPageCacheFallback />}>
        <ReelsPageContent />
      </Suspense>
    </section>
  );
}
