'use client';

import { useEffect, useRef, type ReactNode } from 'react';

const FILTER_SCROLLBAR_THUMB_HEIGHT = 88;

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
  const trackRef = useRef<HTMLDivElement | null>(null);
  const thumbRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    const content = contentRef.current;
    const track = trackRef.current;
    const thumb = thumbRef.current;

    if (!viewport || !content || !track || !thumb) {
      return;
    }

    const updateThumb = () => {
      const { clientHeight, scrollHeight, scrollTop } = viewport;
      const maxScrollTop = scrollHeight - clientHeight;
      const shouldShowThumb = maxScrollTop > 0;

      track.hidden = !shouldShowThumb;

      if (!shouldShowThumb) {
        thumb.style.transform = 'translateY(0px)';
        return;
      }

      const maxThumbTop = Math.max(clientHeight - FILTER_SCROLLBAR_THUMB_HEIGHT, 0);
      const nextThumbTop = maxThumbTop * (scrollTop / maxScrollTop);
      thumb.style.transform = `translateY(${nextThumbTop}px)`;
    };

    const handleScroll = () => {
      updateThumb();
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
    };
  }, []);

  return (
    <div className="relative">
      <div
        ref={viewportRef}
        className={`scrollbar-hide overflow-x-hidden overflow-y-auto ${className}`}
      >
        <div ref={contentRef}>{children}</div>
      </div>

      <div
        ref={trackRef}
        hidden
        className="pointer-events-none absolute bottom-0 right-0 top-0 w-[6px] opacity-100"
      >
        <div
          ref={thumbRef}
          className="absolute right-0 w-[6px] rounded-full bg-[#d6dee8]"
          style={{
            height: `${FILTER_SCROLLBAR_THUMB_HEIGHT}px`,
            transform: 'translateY(0px)',
          }}
        />
      </div>
    </div>
  );
}
