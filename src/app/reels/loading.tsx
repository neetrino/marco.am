import { StaticPageLoadingSkeleton } from '@/components/navigation/StaticPageLoadingSkeleton';

export default function ReelsLoading() {
  return (
    <section className="min-h-screen bg-white pb-3 sm:pb-4">
      <StaticPageLoadingSkeleton variant="reels" />
    </section>
  );
}
