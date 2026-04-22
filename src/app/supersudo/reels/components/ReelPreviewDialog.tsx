'use client';

type ReelPreviewDialogProps = {
  isOpen: boolean;
  title: string;
  videoUrl: string;
  posterUrl: string | null;
  closeLabel: string;
  onClose: () => void;
};

export function ReelPreviewDialog({
  isOpen,
  title,
  videoUrl,
  posterUrl,
  closeLabel,
  onClose,
}: ReelPreviewDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-black p-4 text-white shadow-2xl">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="truncate text-sm font-semibold">{title}</p>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 items-center rounded-lg border border-white/25 px-2.5 text-xs font-semibold text-white transition hover:bg-white/10"
          >
            {closeLabel}
          </button>
        </div>
        <div className="overflow-hidden rounded-xl border border-white/10 bg-black">
          <video
            src={videoUrl}
            poster={posterUrl ?? undefined}
            className="h-auto w-full object-contain"
            controls
            playsInline
            preload="metadata"
          />
        </div>
      </div>
    </div>
  );
}
