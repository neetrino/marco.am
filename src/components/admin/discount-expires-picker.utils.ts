const pad = (value: number): string => String(value).padStart(2, '0');

export type DateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

export function parseIsoToParts(iso: string | null | undefined): DateParts | null {
  if (!iso) {
    return null;
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes(),
  };
}

export function partsToIso(parts: DateParts): string {
  const date = new Date(parts.year, parts.month, parts.day, parts.hour, parts.minute, 0, 0);
  return date.toISOString();
}

export function defaultFutureParts(minutesAhead = 60): DateParts {
  const date = new Date(Date.now() + minutesAhead * 60_000);
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate(),
    hour: date.getHours(),
    minute: date.getMinutes(),
  };
}

export function startOfMonth(year: number, month: number): Date {
  return new Date(year, month, 1);
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function weekdayIndex(year: number, month: number, day: number): number {
  const weekday = new Date(year, month, day).getDay();
  return weekday === 0 ? 6 : weekday - 1;
}

export function formatPartsLabel(parts: DateParts, locale: string): string {
  const date = new Date(parts.year, parts.month, parts.day, parts.hour, parts.minute);
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function clampMinute(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(59, Math.max(0, Math.round(value)));
}

export function clampHour(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(23, Math.max(0, Math.round(value)));
}

export const WEEKDAY_LABELS: Record<string, string[]> = {
  en: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
  ru: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
  hy: ['Եկ', 'Եր', 'Չր', 'Հն', 'Ու', 'Շբ', 'Կի'],
};

export function weekdayLabelsForLocale(locale: string): string[] {
  const base = locale.slice(0, 2).toLowerCase();
  return WEEKDAY_LABELS[base] ?? WEEKDAY_LABELS.en;
}

export const MONTH_LABELS: Record<string, string[]> = {
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  ru: ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'],
  hy: ['Հունվար', 'Փետրվար', 'Մարտ', 'Ապրիլ', 'Մայիս', 'Հունիս', 'Հուլիս', 'Օգոստոս', 'Սեպտեմբեր', 'Հոկտեմբեր', 'Նոյեմբեր', 'Դեկտեմբեր'],
};

export function monthLabel(month: number, locale: string): string {
  const base = locale.slice(0, 2).toLowerCase();
  const labels = MONTH_LABELS[base] ?? MONTH_LABELS.en;
  return labels[month] ?? labels[0];
}

export function formatHourMinute(parts: DateParts): string {
  return `${pad(parts.hour)}:${pad(parts.minute)}`;
}

export const DISCOUNT_EXPIRES_POPOVER_WIDTH_PX = 296;
export const DISCOUNT_EXPIRES_POPOVER_ESTIMATED_HEIGHT_PX = 420;
export const DISCOUNT_EXPIRES_POPOVER_GAP_PX = 8;
export const DISCOUNT_EXPIRES_POPOVER_Z_INDEX = 280;

export type PopoverCoords = {
  top: number;
  left: number;
};

/** Fixed viewport coords for a portal popover aligned to the trigger's right edge. */
export function computeDiscountExpiresPopoverCoords(trigger: DOMRect): PopoverCoords {
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;
  const gap = DISCOUNT_EXPIRES_POPOVER_GAP_PX;
  const width = DISCOUNT_EXPIRES_POPOVER_WIDTH_PX;
  const height = DISCOUNT_EXPIRES_POPOVER_ESTIMATED_HEIGHT_PX;

  let left = trigger.right - width;
  left = Math.max(gap, Math.min(left, viewportW - width - gap));

  let top = trigger.bottom + gap;
  if (top + height > viewportH - gap) {
    top = trigger.top - height - gap;
  }
  top = Math.max(gap, top);

  return { top, left };
}
