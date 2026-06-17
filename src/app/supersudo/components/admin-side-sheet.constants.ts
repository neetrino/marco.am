/** Admin side panel — 90% viewport width, slides in from the right. */
export const ADMIN_SIDE_SHEET_PANEL_CLASS =
  'fixed inset-y-0 right-0 z-[260] flex w-[90vw] max-w-[90vw] flex-col overflow-hidden rounded-l-2xl bg-white shadow-[-8px_0_24px_rgba(16,16,16,0.12)] dark:bg-zinc-950';

export const ADMIN_SIDE_SHEET_OVERLAY_CLASS =
  'fixed inset-0 z-[255] bg-black/40';

/** Close control — sits on the overlay, just left of the sheet edge. */
export const ADMIN_SIDE_SHEET_CLOSE_OUTSIDE_CLASS =
  'fixed top-4 z-[261] flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-white shadow-lg transition-colors hover:bg-slate-700 right-[90vw] -translate-x-3';

export const ADMIN_PRODUCT_EDITOR_FORM_ID = 'admin-product-editor-form';
