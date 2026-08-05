'use client';

import { useRef } from 'react';
import type { ChangeEvent } from 'react';
import { Film, Upload, X } from 'lucide-react';
import { ADMIN_VIDEO_ACCEPT } from '@/lib/constants/admin-video-upload';

type VideoUploadLabels = {
  field: string;
  hint: string;
  select: string;
  replace: string;
  remove: string;
  uploading: string;
  ready: string;
};

type VideoUploadFieldProps = {
  videoUrl: string;
  fileName: string;
  uploading: boolean;
  labels: VideoUploadLabels;
  onSelect: (file: File) => void;
  onRemove: () => void;
};

type VideoPreviewProps = Pick<VideoUploadFieldProps, 'videoUrl' | 'fileName' | 'uploading' | 'labels'>;

type VideoUploadActionsProps = Pick<
  VideoUploadFieldProps,
  'videoUrl' | 'uploading' | 'labels' | 'onRemove'
> & {
  onChoose: () => void;
};

function VideoPreview({ videoUrl, fileName, uploading, labels }: VideoPreviewProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-[9rem_1fr]">
      <div className="relative aspect-[9/14] overflow-hidden rounded-xl bg-black shadow-sm">
        <video src={videoUrl} className="h-full w-full object-cover" muted playsInline preload="metadata" />
        {uploading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/65 text-xs font-semibold text-white">
            {labels.uploading}
          </div>
        ) : null}
      </div>
      <div className="min-w-0 self-center">
        <p className="text-sm font-semibold text-gray-900">{labels.ready}</p>
        <p className="mt-1 truncate text-xs text-gray-500">{fileName}</p>
        <p className="mt-3 text-xs leading-5 text-gray-500">{labels.hint}</p>
      </div>
    </div>
  );
}

function VideoUploadActions({
  videoUrl,
  uploading,
  labels,
  onChoose,
  onRemove,
}: VideoUploadActionsProps) {
  return (
    <div className="mt-4 flex flex-wrap justify-center gap-2">
      <button
        type="button"
        onClick={onChoose}
        disabled={uploading}
        className="inline-flex h-10 items-center gap-2 rounded-lg bg-marco-yellow px-4 text-sm font-semibold text-marco-black transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Upload aria-hidden size={16} />
        {uploading ? labels.uploading : videoUrl ? labels.replace : labels.select}
      </button>
      {videoUrl && !uploading ? (
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex h-10 items-center gap-2 rounded-lg border border-marco-border bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          <X aria-hidden size={16} />
          {labels.remove}
        </button>
      ) : null}
    </div>
  );
}

export function VideoUploadField({
  videoUrl,
  fileName,
  uploading,
  labels,
  onSelect,
  onRemove,
}: VideoUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (file) {
      onSelect(file);
    }
  };

  return (
    <div className="space-y-2 md:col-span-2">
      <span className="text-xs font-medium text-gray-600">{labels.field}</span>
      <div className="rounded-2xl border border-dashed border-marco-yellow/70 bg-gradient-to-br from-marco-yellow/10 via-white to-white p-4">
        <input ref={inputRef} type="file" accept={ADMIN_VIDEO_ACCEPT} onChange={handleChange} className="hidden" />
        {videoUrl ? (
          <VideoPreview videoUrl={videoUrl} fileName={fileName} uploading={uploading} labels={labels} />
        ) : (
          <div className="flex flex-col items-center py-6 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-marco-yellow/25 text-marco-black">
              <Film aria-hidden size={22} />
            </span>
            <p className="mt-3 max-w-md text-xs leading-5 text-gray-500">{labels.hint}</p>
          </div>
        )}
        <VideoUploadActions
          videoUrl={videoUrl}
          uploading={uploading}
          labels={labels}
          onChoose={() => inputRef.current?.click()}
          onRemove={onRemove}
        />
      </div>
    </div>
  );
}
