/** Shared checkout form field styles — aligned with Contact page tokens. */
export const CHECKOUT_FIELD_LABEL_CLASS =
  'mb-1 block text-sm font-medium text-[var(--app-text)] dark:text-slate-200';

export const CHECKOUT_FIELD_ROW_CLASS = 'grid grid-cols-1 gap-4 md:grid-cols-2 md:items-start';

export const CHECKOUT_FIELD_CELL_CLASS = 'min-w-0 w-full';

export const CHECKOUT_INPUT_FIELD_CLASS =
  '!h-11 !rounded-xl !border-[var(--app-border)] !bg-[var(--app-surface)] !px-4 !py-0 !text-sm !shadow-[0_1px_2px_rgba(16,16,16,0.05)] focus:!border-marco-yellow/55 focus:!outline-none focus:!ring-2 focus:!ring-marco-yellow/30 dark:!border-[var(--app-border-strong)] dark:!bg-[var(--app-surface-muted)]/60';

export const CHECKOUT_SELECT_TRIGGER_BASE_CLASS =
  'flex h-11 w-full items-center gap-3 rounded-xl border bg-[var(--app-surface)] px-4 text-left text-sm shadow-[0_1px_2px_rgba(16,16,16,0.05)] transition-[border-color,box-shadow,background-color] hover:border-marco-yellow/45 hover:shadow-[0_4px_16px_rgba(16,16,16,0.07)] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[var(--app-surface-muted)]/60 sm:text-[15px]';

export const CHECKOUT_SELECT_TRIGGER_BORDER_CLASS =
  'border-[var(--app-border)] dark:border-[var(--app-border-strong)]';

export const CHECKOUT_SELECT_TRIGGER_OPEN_CLASS =
  'border-marco-yellow/60 shadow-[0_6px_20px_rgba(234,179,8,0.14)] ring-2 ring-marco-yellow/25';

export const CHECKOUT_SELECT_MENU_PANEL_CLASS =
  'absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] py-2 shadow-[0_20px_56px_rgba(16,16,16,0.16)] backdrop-blur-md dark:border-[var(--app-border-strong)] dark:bg-[var(--app-bg)] dark:shadow-[0_20px_56px_rgba(0,0,0,0.5)]';

export const CHECKOUT_SELECT_MENU_HEADER_CLASS =
  'px-4 pb-2 pt-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--app-text-soft)]';

export const CHECKOUT_SELECT_OPTION_BASE_CLASS =
  'mx-1.5 flex w-[calc(100%-0.75rem)] items-start gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm leading-snug transition-colors';

export const CHECKOUT_SELECT_OPTION_ACTIVE_CLASS =
  'bg-marco-yellow/14 font-medium text-marco-black ring-1 ring-marco-yellow/35 dark:text-white';

export const CHECKOUT_SELECT_OPTION_IDLE_CLASS =
  'text-[var(--app-text)] hover:bg-marco-yellow/[0.07] dark:hover:bg-marco-yellow/[0.1]';

export const CHECKOUT_SELECT_OPTION_HIGHLIGHT_CLASS =
  'bg-marco-yellow/[0.08] dark:bg-marco-yellow/[0.12]';

/** @deprecated Use CHECKOUT_SELECT_TRIGGER_* classes via CheckoutSelectMenu */
export const CHECKOUT_SELECT_FIELD_CLASS = CHECKOUT_SELECT_TRIGGER_BASE_CLASS;

export const CHECKOUT_SELECT_FIELD_ERROR_CLASS = 'border-error ring-2 ring-error/20';

export const CHECKOUT_FULFILLMENT_TOGGLE_ACTIVE_CLASS =
  'border-marco-yellow bg-marco-yellow/12 text-marco-black ring-1 ring-marco-yellow/35 dark:bg-marco-yellow/14 dark:text-white dark:ring-marco-yellow/45';

export const CHECKOUT_FULFILLMENT_TOGGLE_INACTIVE_CLASS =
  'border-[var(--app-border)] bg-[var(--app-surface-muted)]/80 text-[var(--app-text)] hover:border-marco-yellow/45 hover:bg-marco-yellow/[0.06] dark:border-[var(--app-border-strong)] dark:bg-[var(--app-surface-muted)]/50 dark:hover:border-marco-yellow/40 dark:hover:bg-marco-yellow/[0.08]';

export const CHECKOUT_ORDER_SUMMARY_TITLE_CLASS =
  'text-xl font-semibold text-[var(--app-text)]';

export const CHECKOUT_ORDER_SUMMARY_PROMO_APPLY_CLASS =
  'shrink-0 rounded-xl bg-marco-yellow px-4 text-sm font-bold text-marco-black transition-[filter] hover:brightness-95 active:brightness-90 disabled:cursor-not-allowed disabled:opacity-50 dark:!text-marco-black';

export const CHECKOUT_ORDER_SUMMARY_PRIMARY_BUTTON_CLASS =
  'w-full !min-h-12 !rounded-xl !text-sm !font-bold';

export const CHECKOUT_ORDER_SUMMARY_SECONDARY_BUTTON_CLASS =
  'w-full !min-h-12 !rounded-xl !border-marco-yellow !text-marco-black hover:!bg-marco-yellow/10 dark:!border-marco-yellow dark:!text-white dark:hover:!bg-marco-yellow/10';
