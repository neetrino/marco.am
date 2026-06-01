import { cookies } from 'next/headers';

import { HOME_PAGE_SECTION_SHELL_CLASS } from '@/components/home/home-page-section-shell.constants';
import { ReelsPageGrid } from '@/components/reels/ReelsPageGrid';
import { t } from '@/lib/i18n';
import { LANGUAGE_PREFERENCE_KEY, parseLanguageFromServer } from '@/lib/language';
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

  return <ReelsPageGrid items={feed.items} />;
}
