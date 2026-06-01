import Link from 'next/link';
import { cookies } from 'next/headers';

import { HOME_PAGE_SECTION_SHELL_CLASS } from '@/components/home/home-page-section-shell.constants';
import { t } from '@/lib/i18n';
import { LANGUAGE_PREFERENCE_KEY, parseLanguageFromServer } from '@/lib/language';
import { getReelsItemHref } from '@/lib/reels/reels-url';
import { reelsManagementService } from '@/lib/services/reels-management.service';

/** Reels grid — streamed so navigation shows the page shell immediately. */
export async function ReelsPageContent() {
  const cookieStore = await cookies();
  const locale =
    parseLanguageFromServer(cookieStore.get(LANGUAGE_PREFERENCE_KEY)?.value) ?? 'en';
  const feed = await reelsManagementService.getPublicPayload({
    localeRaw: locale,
  });
  const tr = (key: string) => t(locale, key);

  if (feed.items.length === 0) {
    return (
      <div className={HOME_PAGE_SECTION_SHELL_CLASS}>
        <div className="rounded-2xl border border-marco-border bg-marco-gray/40 px-5 py-8 text-center text-sm text-marco-text/80">
          {tr('home.reels_page.empty')}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-screen-2xl px-1 pt-1 sm:px-2 sm:pt-2">
      <div
        className="grid grid-cols-3 gap-px sm:gap-1 md:grid-cols-4 lg:grid-cols-5"
        role="list"
      >
        {feed.items.map((item, index) => (
          <Link
            key={item.id}
            role="listitem"
            href={getReelsItemHref(index)}
            aria-label={`${item.title} — ${tr('home.reels_page.watch_cta')}`}
            className="group relative block aspect-[9/16] w-full overflow-hidden bg-zinc-900 outline-none transition-transform duration-200 hover:scale-[1.015] focus-visible:z-[1] focus-visible:ring-2 focus-visible:ring-marco-black/80 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
          >
            <img
              src={item.posterUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center transition duration-500 ease-out group-hover:scale-[1.03]"
              loading="lazy"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent opacity-95 transition-opacity duration-300 group-hover:opacity-100"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-[2px] sm:right-2 sm:top-2 sm:h-7 sm:w-7"
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
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent px-1.5 pb-1.5 pt-8 sm:px-2 sm:pb-2 sm:pt-9">
              <p className="line-clamp-2 text-left text-[9px] font-semibold leading-snug tracking-tight text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.75)] sm:text-[10px]">
                {item.title}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
