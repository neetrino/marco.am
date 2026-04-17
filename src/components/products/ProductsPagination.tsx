'use client';

import Link from 'next/link';
import { useTranslation } from '../../lib/i18n-client';

/** Figma MARCO 218:2304 — control pill (white or grey) */
const PAGINATION_CONTROL_BASE =
  'inline-flex h-9 min-w-0 shrink-0 items-center justify-center gap-1 rounded-[9px] border border-[#e2e2e2] px-3 py-2 text-sm font-normal leading-5 text-[#313131] transition-colors';

const PAGINATION_CONTROL_WHITE = `${PAGINATION_CONTROL_BASE} bg-white hover:bg-[#fafafa]`;
const PAGINATION_CONTROL_GREY = `${PAGINATION_CONTROL_BASE} min-w-[105px] bg-[#f6f6f6] hover:bg-[#efefef]`;

/** Figma 218:2304 — page number cell */
const PAGINATION_PAGE_BASE =
  'inline-flex min-h-9 min-w-[2rem] shrink-0 items-center justify-center rounded-[9px] border border-[#e2e2e2] px-3 py-2 text-sm leading-5';

const ICON_16 = 'h-4 w-4 shrink-0';

/** Heroicons outline chevrons — 16×16 visual */
function IconChevronLeft({ className }: { readonly className?: string }) {
  return (
    <svg className={`${ICON_16} ${className ?? ''}`} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 19.5L8.25 12l7.5-7.5"
      />
    </svg>
  );
}

function IconChevronRight({ className }: { readonly className?: string }) {
  return (
    <svg className={`${ICON_16} ${className ?? ''}`} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.25 4.5l7.5 7.5-7.5 7.5"
      />
    </svg>
  );
}

function IconChevronsLeft({ className }: { readonly className?: string }) {
  return (
    <svg className={`${ICON_16} ${className ?? ''}`} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.25 19.5L4.5 12l6.75-7.5M18.75 19.5L12 12l6.75-7.5"
      />
    </svg>
  );
}

function IconChevronsRight({ className }: { readonly className?: string }) {
  return (
    <svg className={`${ICON_16} ${className ?? ''}`} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12.75 19.5L19.5 12l-6.75-7.5M5.25 19.5L12 12l-6.75-7.5"
      />
    </svg>
  );
}

export type PaginationSlotItem =
  | { readonly kind: 'ellipsis' }
  | { readonly kind: 'page'; readonly page: number; readonly href: string };

export interface ProductsPaginationProps {
  readonly page: number;
  readonly totalPages: number;
  readonly hrefFirst: string;
  readonly hrefBack: string;
  readonly hrefNext: string;
  readonly hrefLast: string;
  /** Precomputed from server — no functions across RSC/client boundary */
  readonly slotItems: readonly PaginationSlotItem[];
}

export function ProductsPagination({
  page,
  totalPages,
  hrefFirst,
  hrefBack,
  hrefNext,
  hrefLast,
  slotItems,
}: ProductsPaginationProps) {
  const { t } = useTranslation();

  const inactiveControl = `${PAGINATION_CONTROL_WHITE} cursor-not-allowed opacity-45`;
  const inactiveGrey = `${PAGINATION_CONTROL_GREY} cursor-not-allowed opacity-45`;

  return (
    <nav
      className="mt-16 flex flex-wrap items-center justify-center gap-[8px] md:mt-24"
      aria-label={t('common.pagination.navAriaLabel')}
    >
      {/* First */}
      {page > 1 ? (
        <Link
          href={hrefFirst}
          className={`${PAGINATION_CONTROL_GREY} gap-1`}
          aria-label={t('common.pagination.firstAria')}
        >
          <IconChevronsLeft className="shrink-0 text-[#313131]" />
          <span>{t('common.pagination.first')}</span>
        </Link>
      ) : (
        <span className={`${inactiveGrey} gap-1`} aria-disabled="true">
          <IconChevronsLeft className="shrink-0" />
          <span>{t('common.pagination.first')}</span>
        </span>
      )}

      {/* Back (previous page) */}
      {page > 1 ? (
        <Link
          href={hrefBack}
          className={`${PAGINATION_CONTROL_WHITE} gap-1`}
          aria-label={t('common.pagination.previousAria')}
        >
          <IconChevronLeft className="shrink-0 text-[#313131]" />
          <span>{t('common.pagination.previous')}</span>
        </Link>
      ) : (
        <span className={`${inactiveControl} gap-1`} aria-disabled="true">
          <IconChevronLeft className="shrink-0" />
          <span>{t('common.pagination.previous')}</span>
        </span>
      )}

      {/* Page numbers + ellipsis */}
      {slotItems.map((item, idx) =>
        item.kind === 'ellipsis' ? (
          <span
            key={`ellipsis-${idx}`}
            className={`${PAGINATION_PAGE_BASE} min-w-[31px] bg-white font-normal text-[#313131]`}
            aria-hidden
          >
            …
          </span>
        ) : (
          <span key={item.page}>
            {item.page === page ? (
              <span
                className={`${PAGINATION_PAGE_BASE} border-0 bg-black font-bold text-white`}
                aria-current="page"
              >
                {item.page}
              </span>
            ) : (
              <Link
                href={item.href}
                className={`${PAGINATION_PAGE_BASE} bg-white font-normal text-[#313131] hover:bg-[#fafafa]`}
              >
                {item.page}
              </Link>
            )}
          </span>
        )
      )}

      {/* Next */}
      {page < totalPages ? (
        <Link
          href={hrefNext}
          className={`${PAGINATION_CONTROL_WHITE} gap-1`}
          aria-label={t('common.pagination.nextAria')}
        >
          <span>{t('common.pagination.next')}</span>
          <IconChevronRight className="shrink-0 text-[#313131]" />
        </Link>
      ) : (
        <span className={`${inactiveControl} gap-1`} aria-disabled="true">
          <span>{t('common.pagination.next')}</span>
          <IconChevronRight className="shrink-0" />
        </span>
      )}

      {/* Last */}
      {page < totalPages ? (
        <Link
          href={hrefLast}
          className={`${PAGINATION_CONTROL_GREY} gap-1`}
          aria-label={t('common.pagination.lastAria')}
        >
          <span>{t('common.pagination.last')}</span>
          <IconChevronsRight className="shrink-0 text-[#313131]" />
        </Link>
      ) : (
        <span className={`${inactiveGrey} gap-1`} aria-disabled="true">
          <span>{t('common.pagination.last')}</span>
          <IconChevronsRight className="shrink-0" />
        </span>
      )}
    </nav>
  );
}
