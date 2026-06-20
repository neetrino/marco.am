'use client';

import type { ProductEditorTabId } from '../product-editor-tabs';

interface ProductEditorTabSkeletonProps {
  tabId: ProductEditorTabId;
}

function Block({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-slate-100 ${className ?? ''}`} />;
}

export function ProductEditorTabSkeleton({ tabId }: ProductEditorTabSkeletonProps) {
  if (tabId === 'general' || tabId === 'description' || tabId === 'catalog') {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white p-4 lg:p-5">
        <Block className="h-4 w-32" />
        <Block className="mt-2 h-3 w-64 max-w-full" />
        <div className="mt-4 space-y-3">
          <Block className="h-9 w-full max-w-md" />
          <Block className="h-9 w-full max-w-md" />
          <Block className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (tabId === 'media') {
    return (
      <div className="space-y-4">
        <Block className="h-4 w-28" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Block key={index} className="aspect-square w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Block className="h-4 w-36" />
      <Block className="h-10 w-full max-w-sm" />
      <Block className="h-48 w-full rounded-xl" />
    </div>
  );
}
