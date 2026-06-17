'use client';

import type { ChangeEvent } from 'react';

type InlineSheetFieldVariant = 'title' | 'slug' | 'titleInTab';

interface InlineSheetFieldProps {
  form: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  variant: InlineSheetFieldVariant;
  required?: boolean;
}

const VARIANT_CLASS: Record<InlineSheetFieldVariant, string> = {
  title:
    'w-full bg-transparent border-0 border-b-2 border-transparent px-0 py-0.5 text-2xl font-bold leading-tight text-marco-black placeholder:text-slate-300 focus:border-marco-yellow focus:outline-none focus:ring-0 sm:text-3xl',
  titleInTab:
    'w-full bg-transparent border-0 border-b-2 border-transparent px-0 py-0.5 text-xl font-bold leading-tight text-marco-black placeholder:text-slate-300 focus:border-marco-yellow focus:outline-none focus:ring-0 sm:text-2xl',
  slug:
    'w-full min-w-0 truncate bg-transparent border-0 border-b border-transparent px-0 py-0 text-xs leading-4 text-slate-400 placeholder:text-slate-300 focus:border-slate-300 focus:outline-none focus:ring-0',
};

export function InlineSheetField({
  form,
  value,
  onChange,
  placeholder,
  variant,
  required,
}: InlineSheetFieldProps) {
  return (
    <input
      form={form}
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className={VARIANT_CLASS[variant]}
    />
  );
}
