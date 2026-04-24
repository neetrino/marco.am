import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Montserrat } from 'next/font/google';

import { HOME_PAGE_SECTION_SHELL_CLASS } from '../../components/home/home-page-section-shell.constants';
import { LANGUAGE_PREFERENCE_KEY, parseLanguageFromServer } from '../../lib/language';
import { getReelsItemHref } from '../../lib/reels/reels-url';
import { reelsManagementService } from '../../lib/services/reels-management.service';

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Reels — MARCO',
  description: 'Choose a reel to watch',
};

export default async function ReelsPage() {
  const cookieStore = await cookies();
  const locale =
    parseLanguageFromServer(cookieStore.get(LANGUAGE_PREFERENCE_KEY)?.value) ?? 'en';
  const feed = await reelsManagementService.getPublicPayload({
    localeRaw: locale,
  });

  return (
    <section className={`bg-[var(--app-bg)] py-8 sm:py-10 ${montserrat.className}`}>
      <div className={HOME_PAGE_SECTION_SHELL_CLASS}>
        <div className="mb-6 overflow-hidden rounded-3xl border border-marco-border bg-gradient-to-r from-white via-marco-gray/40 to-white p-4 shadow-[0_10px_28px_rgba(16,16,16,0.06)] dark:border-white/10 dark:bg-[linear-gradient(90deg,rgba(16,16,16,0.98)_0%,rgba(24,24,24,0.96)_48%,rgba(16,16,16,0.98)_100%)] dark:shadow-[0_18px_40px_rgba(0,0,0,0.34)] md:mb-8 md:p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="mb-2 inline-flex rounded-full border border-marco-yellow/60 bg-marco-yellow/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-marco-black dark:text-marco-yellow">
                Marco Reels
              </p>
              <h1 className="relative inline-block text-2xl font-bold uppercase text-marco-black dark:text-white md:text-3xl">
                Reels
                <span className="absolute -bottom-1 left-0 h-1 w-[105%] bg-marco-yellow" aria-hidden />
              </h1>
              <p className="mt-3 text-sm text-marco-text/75 dark:text-white/72">
                Tap a reel and watch it in full-screen mode.
              </p>
            </div>
            <div className="hidden rounded-2xl border border-marco-border bg-white/80 px-4 py-2 text-right dark:border-white/10 dark:bg-black/40 sm:block">
              <p className="text-[11px] uppercase tracking-[0.12em] text-marco-text/60 dark:text-white/78">Available reels</p>
              <p className="text-2xl font-bold text-marco-black dark:text-white">{feed.items.length}</p>
            </div>
          </div>
        </div>

        {feed.items.length === 0 ? (
          <div className="rounded-2xl border border-marco-border bg-marco-gray/45 p-6 text-sm text-marco-text/75 dark:border-white/10 dark:bg-white/5 dark:text-white/72">
            Reels are not available yet.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 md:gap-4">
            {feed.items.map((item, index) => (
              <Link
                key={item.id}
                href={getReelsItemHref(index)}
                className="group mx-auto w-full max-w-[11.5rem] overflow-hidden rounded-[1.4rem] border border-marco-border/90 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-marco-yellow/80 hover:shadow-[0_20px_34px_rgba(2,6,25,0.16)] dark:border-white/10 dark:bg-[var(--app-surface)] dark:hover:shadow-[0_20px_34px_rgba(0,0,0,0.34)]"
              >
                <div className="relative aspect-[9/16] overflow-hidden rounded-t-[1.3rem]">
                  <img
                    src={item.posterUrl}
                    alt={item.title}
                    className="h-full w-full object-cover object-center transition duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />
                  <div className="absolute left-2 top-2 rounded-full border border-white/35 bg-black/35 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white backdrop-blur-sm">
                    Reel
                  </div>
                  <div className="absolute bottom-2 left-2 right-2">
                    <p className="line-clamp-2 text-sm font-semibold text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.52)]">
                      {item.title}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-marco-border/70 px-3 py-2.5 text-xs text-marco-text/80 dark:border-white/10 dark:text-white/78">
                  <span className="font-medium">Watch reel</span>
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-marco-yellow text-marco-black transition-transform duration-200 group-hover:scale-110">
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
