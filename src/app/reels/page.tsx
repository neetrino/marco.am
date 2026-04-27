import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Montserrat } from 'next/font/google';

import { HOME_PAGE_SECTION_SHELL_CLASS } from '../../components/home/home-page-section-shell.constants';
import { t } from '../../lib/i18n';
import { LANGUAGE_PREFERENCE_KEY, parseLanguageFromServer } from '../../lib/language';
import { getReelsItemHref } from '../../lib/reels/reels-url';
import { reelsManagementService } from '../../lib/services/reels-management.service';

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
  const feed = await reelsManagementService.getPublicPayload({
    localeRaw: locale,
  });
  const tr = (key: string) => t(locale, key);

  return (
    <section
      className={`bg-[var(--app-bg)] pb-10 text-[var(--app-text)] md:pb-12 ${montserrat.className}`}
      aria-label={tr('home.reels_feed_region_aria')}
    >
      <div className={`${HOME_PAGE_SECTION_SHELL_CLASS} pt-8 pb-6 md:pt-10 md:pb-8`}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="relative inline-block text-2xl font-bold uppercase tracking-tight text-marco-black dark:text-white md:text-3xl">
              {tr('home.reels_page.heading')}
              <span
                className="absolute -bottom-1 left-0 h-0.5 w-full bg-marco-yellow"
                aria-hidden
              />
            </h1>
            <p className="mt-3 max-w-xl text-sm text-marco-text/75 dark:text-white/70">
              {tr('home.reels_page.subtitle')}
            </p>
          </div>
          {feed.items.length > 0 ? (
            <div className="shrink-0 text-right">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-marco-text/55 dark:text-white/50">
                {tr('home.reels_page.available_count_label')}
              </p>
              <p className="text-2xl font-bold tabular-nums text-marco-black dark:text-white">
                {feed.items.length}
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {feed.items.length === 0 ? (
        <div className={HOME_PAGE_SECTION_SHELL_CLASS}>
          <div className="rounded-2xl border border-marco-border bg-marco-gray/50 px-5 py-8 text-center text-sm text-marco-text/80 dark:border-white/10 dark:bg-white/[0.06] dark:text-white/75">
            {tr('home.reels_page.empty')}
          </div>
        </div>
      ) : (
        <div className={HOME_PAGE_SECTION_SHELL_CLASS}>
          <div
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 md:gap-5 lg:grid-cols-5 lg:gap-5"
            role="list"
          >
            {feed.items.map((item, index) => (
              <Link
                key={item.id}
                role="listitem"
                href={getReelsItemHref(index)}
                aria-label={`${item.title} — ${tr('home.reels_page.watch_cta')}`}
                className="group relative block aspect-[9/16] w-full overflow-hidden rounded-2xl border border-marco-border/90 bg-marco-gray shadow-sm outline-none ring-black/[0.04] transition-[filter,transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-marco-yellow/70 hover:shadow-md focus-visible:z-[1] focus-visible:ring-2 focus-visible:ring-marco-yellow focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--app-bg)] dark:border-white/10 dark:bg-zinc-900 dark:ring-white/10 dark:focus-visible:ring-offset-[var(--app-bg)]"
              >
                <img
                  src={item.posterUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover object-center transition duration-500 ease-out group-hover:scale-[1.03]"
                  loading="lazy"
                />
                <div
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/88 via-black/20 to-transparent opacity-95 transition-opacity duration-300 group-hover:opacity-100"
                  aria-hidden
                />
                <div
                  className="pointer-events-none absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-md bg-black/50 text-white shadow-md ring-1 ring-white/20 backdrop-blur-[2px] sm:right-2 sm:top-2 sm:h-7 sm:w-7"
                  aria-hidden
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3 w-3 translate-x-px sm:h-3.5 sm:w-3.5"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path d="M8 5v14l11-7-11-7z" />
                  </svg>
                </div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent px-2 pb-2 pt-8 sm:px-2 sm:pb-2 sm:pt-9">
                  <p className="line-clamp-2 text-left text-[10px] font-semibold leading-snug tracking-tight text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.75)] sm:text-[11px]">
                    {item.title}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
