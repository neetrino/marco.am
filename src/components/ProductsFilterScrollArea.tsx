'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

const FILTER_SCROLLBAR_THUMB_HEIGHT = 88;
const FILTER_SCROLLBAR_VISIBILITY_TIMEOUT_MS = 700;

interface ProductsFilterScrollAreaProps {
  children: ReactNode;
  className?: string;
}

export function ProductsFilterScrollArea({
  children,
  className = '',
}: ProductsFilterScrollAreaProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const hideThumbTimeoutRef = useRef<number | null>(null);
  const [thumbTop, setThumbTop] = useState(0);
  const [showThumb, setShowThumb] = useState(false);
  const [thumbVisible, setThumbVisible] = useState(false);

  useEffect(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;

    if (!viewport || !content) {
      return;
    }

    const updateThumb = () => {
      const { clientHeight, scrollHeight, scrollTop } = viewport;
      const maxScrollTop = scrollHeight - clientHeight;
      const shouldShowThumb = maxScrollTop > 0;

      setShowThumb(shouldShowThumb);

      if (!shouldShowThumb) {
        setThumbTop(0);
        return;
      }

      const maxThumbTop = Math.max(clientHeight - FILTER_SCROLLBAR_THUMB_HEIGHT, 0);
      const nextThumbTop = maxThumbTop * (scrollTop / maxScrollTop);
      setThumbTop(nextThumbTop);
    };

    const revealThumb = () => {
      setThumbVisible(true);

      if (hideThumbTimeoutRef.current !== null) {
        window.clearTimeout(hideThumbTimeoutRef.current);
      }

      hideThumbTimeoutRef.current = window.setTimeout(() => {
        setThumbVisible(false);
      }, FILTER_SCROLLBAR_VISIBILITY_TIMEOUT_MS);
    };

    const handleScroll = () => {
      updateThumb();
      revealThumb();
    };

    updateThumb();

    viewport.addEventListener('scroll', handleScroll, { passive: true });

    const resizeObserver = new ResizeObserver(() => {
      updateThumb();
    });

    resizeObserver.observe(viewport);
    resizeObserver.observe(content);

    window.addEventListener('resize', updateThumb);

    return () => {
      viewport.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateThumb);

      if (hideThumbTimeoutRef.current !== null) {
        window.clearTimeout(hideThumbTimeoutRef.current);
      }
    };
  }, [children]);

  return (
    <div className="relative">
      <div
        ref={viewportRef}
        className={`scrollbar-hide overflow-x-hidden overflow-y-auto ${className}`}
      >
        <div ref={contentRef}>{children}</div>
      </div>

      {showThumb ? (
        <div
          className={`pointer-events-none absolute bottom-0 right-0 top-0 w-[6px] transition-opacity duration-200 ${
            thumbVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div
            className="absolute right-0 w-[6px] rounded-full bg-[#9ca3af]"
            style={{
              height: `${FILTER_SCROLLBAR_THUMB_HEIGHT}px`,
              transform: `translateY(${thumbTop}px)`,
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
