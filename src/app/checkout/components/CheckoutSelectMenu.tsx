'use client';

import { Check, ChevronDown, MapPin } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import {
  CHECKOUT_FIELD_LABEL_CLASS,
  CHECKOUT_SELECT_FIELD_ERROR_CLASS,
  CHECKOUT_SELECT_MENU_HEADER_CLASS,
  CHECKOUT_SELECT_MENU_PANEL_CLASS,
  CHECKOUT_SELECT_OPTION_ACTIVE_CLASS,
  CHECKOUT_SELECT_OPTION_BASE_CLASS,
  CHECKOUT_SELECT_OPTION_HIGHLIGHT_CLASS,
  CHECKOUT_SELECT_OPTION_IDLE_CLASS,
  CHECKOUT_SELECT_TRIGGER_BASE_CLASS,
  CHECKOUT_SELECT_TRIGGER_BORDER_CLASS,
  CHECKOUT_SELECT_TRIGGER_OPEN_CLASS,
} from '../checkout-form.constants';

export type CheckoutSelectOption = {
  value: string;
  label: string;
};

type CheckoutSelectMenuProps = {
  label: string;
  placeholder: string;
  options: readonly CheckoutSelectOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  showMapPin?: boolean;
  menuTitle?: string;
};

function getNextIndex(current: number, direction: 1 | -1, max: number): number {
  if (max <= 0) {
    return -1;
  }
  const next = current + direction;
  if (next < 0) {
    return max - 1;
  }
  if (next >= max) {
    return 0;
  }
  return next;
}

export function CheckoutSelectMenu({
  label,
  placeholder,
  options,
  value,
  onChange,
  disabled = false,
  required = false,
  error,
  showMapPin = false,
  menuTitle,
}: CheckoutSelectMenuProps) {
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxId = useId();
  const selected = options.find((option) => option.value === value);
  const hasError = Boolean(error);

  useEffect(() => {
    if (!open) {
      return;
    }

    const selectedIndex = options.findIndex((option) => option.value === value);
    setHighlightIndex(selectedIndex >= 0 ? selectedIndex : 0);

    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current?.contains(event.target as Node)) {
        return;
      }
      setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [open, options, value]);

  const closeMenu = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const selectOption = (optionValue: string) => {
    onChange(optionValue);
    closeMenu();
  };

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) {
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setOpen(true);
      return;
    }

    if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  const handleListKeyDown = (event: React.KeyboardEvent<HTMLUListElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
      return;
    }

    if (options.length === 0) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightIndex((current) => getNextIndex(current, 1, options.length));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightIndex((current) => getNextIndex(current, -1, options.length));
      return;
    }

    if (event.key === 'Enter' && highlightIndex >= 0) {
      event.preventDefault();
      const option = options[highlightIndex];
      if (option) {
        selectOption(option.value);
      }
    }
  };

  const triggerStateClass = open
    ? CHECKOUT_SELECT_TRIGGER_OPEN_CLASS
    : hasError
      ? CHECKOUT_SELECT_FIELD_ERROR_CLASS
      : CHECKOUT_SELECT_TRIGGER_BORDER_CLASS;

  return (
    <div ref={rootRef} className="relative w-full">
      <label className={CHECKOUT_FIELD_LABEL_CLASS}>
        {label}
        {required ? (
          <span className="text-error" aria-hidden="true">
            {' '}
            *
          </span>
        ) : null}
      </label>

      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        onClick={() => {
          if (!disabled) {
            setOpen((current) => !current);
          }
        }}
        onKeyDown={handleTriggerKeyDown}
        className={`${CHECKOUT_SELECT_TRIGGER_BASE_CLASS} ${triggerStateClass}`}
      >
        {showMapPin ? (
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
              selected
                ? 'bg-marco-yellow/20 text-marco-black dark:text-white'
                : 'bg-[var(--app-surface-muted)] text-[var(--app-text-soft)]'
            }`}
          >
            <MapPin className="h-4 w-4" strokeWidth={2} aria-hidden />
          </span>
        ) : null}
        <span
          className={`min-w-0 flex-1 truncate ${
            selected ? 'font-medium text-[var(--app-text)]' : 'text-[var(--app-text-soft)]'
          }`}
        >
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-[var(--app-text-soft)] transition-transform duration-200 ${
            open ? 'rotate-180 text-marco-black dark:text-marco-yellow' : ''
          }`}
          aria-hidden
        />
      </button>

      {open ? (
        <ul
          id={listboxId}
          role="listbox"
          tabIndex={-1}
          onKeyDown={handleListKeyDown}
          className={`${CHECKOUT_SELECT_MENU_PANEL_CLASS} max-h-64 overflow-y-auto`}
        >
          {menuTitle ? <li className={CHECKOUT_SELECT_MENU_HEADER_CLASS}>{menuTitle}</li> : null}
          {options.length === 0 ? (
            <li className="px-4 py-3 text-sm text-[var(--app-text-soft)]">{placeholder}</li>
          ) : (
            options.map((option, index) => {
              const active = option.value === value;
              const highlighted = index === highlightIndex;
              return (
                <li key={option.value} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onMouseEnter={() => setHighlightIndex(index)}
                    onClick={() => selectOption(option.value)}
                    className={`${CHECKOUT_SELECT_OPTION_BASE_CLASS} ${
                      active
                        ? CHECKOUT_SELECT_OPTION_ACTIVE_CLASS
                        : highlighted
                          ? CHECKOUT_SELECT_OPTION_HIGHLIGHT_CLASS
                          : CHECKOUT_SELECT_OPTION_IDLE_CLASS
                    }`}
                  >
                    {showMapPin ? (
                      <MapPin
                        className={`mt-0.5 h-4 w-4 shrink-0 ${
                          active ? 'text-marco-yellow' : 'text-[var(--app-text-soft)]'
                        }`}
                        strokeWidth={2}
                        aria-hidden
                      />
                    ) : null}
                    <span className="min-w-0 flex-1">{option.label}</span>
                    {active ? (
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-marco-yellow" strokeWidth={2.5} aria-hidden />
                    ) : null}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      ) : null}

      {error ? <p className="mt-1.5 text-sm text-error">{error}</p> : null}
    </div>
  );
}
