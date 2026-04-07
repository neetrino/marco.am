'use client';

export function LoadingState() {
  return (
    <div className="page-shell py-12">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
        <div className="h-96 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}




