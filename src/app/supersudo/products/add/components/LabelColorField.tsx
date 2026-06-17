'use client';

import { useTranslation } from '@/lib/i18n-client';

const DEFAULT_PICKER_COLOR = '#FF0000';

function normalizeHexColor(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }
  if (/^[0-9A-Fa-f]{6}$/.test(trimmed)) {
    return `#${trimmed.toUpperCase()}`;
  }
  return null;
}

function toPickerValue(value: string | null): string {
  return normalizeHexColor(value) ?? DEFAULT_PICKER_COLOR;
}

interface LabelColorFieldProps {
  id: string;
  value: string | null;
  onChange: (color: string | null) => void;
}

/** Optional label color — native picker with swatch preview and clear. */
export function LabelColorField({ id, value, onChange }: LabelColorFieldProps) {
  const { t } = useTranslation();
  const normalized = normalizeHexColor(value);

  return (
    <div className="flex items-center gap-3">
      <div className="relative h-10 w-10 shrink-0">
        <div
          className={`h-10 w-10 rounded-lg border-2 shadow-sm ${
            normalized
              ? 'border-slate-200'
              : 'border-dashed border-slate-300 bg-slate-50'
          }`}
          style={normalized ? { backgroundColor: normalized } : undefined}
          title={normalized ?? t('admin.products.add.pickLabelColor')}
        />
        <input
          id={id}
          type="color"
          value={toPickerValue(normalized)}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          aria-label={t('admin.products.add.pickLabelColor')}
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-xs text-slate-600">
          {normalized ?? t('admin.products.add.noLabelColor')}
        </p>
      </div>

      {normalized ? (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="shrink-0 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
        >
          {t('admin.products.add.clearLabelColor')}
        </button>
      ) : null}
    </div>
  );
}
