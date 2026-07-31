import { HOME_PAGE_SECTION_SHELL_CLASS } from '@/components/home/home-page-section-shell.constants';
import { ReelsPageGrid } from '@/components/reels/ReelsPageGrid';
import { getReelsPageDataCached } from '@/lib/reels-page-server-data';

/** Reels grid — streamed from deduped server payload. */
export async function ReelsPageContent() {
  const { language, feed, watchCtaLabel, emptyMessage } = await getReelsPageDataCached();

  if (feed.items.length === 0) {
    return (
      <div className={HOME_PAGE_SECTION_SHELL_CLASS}>
        <div className="rounded-2xl border border-marco-border bg-marco-gray/40 px-5 py-8 text-center text-sm text-marco-text/80">
          {emptyMessage}
        </div>
      </div>
    );
  }

  return (
    <ReelsPageGrid
      items={feed.items}
      watchCtaLabel={watchCtaLabel}
      language={language}
    />
  );
}
