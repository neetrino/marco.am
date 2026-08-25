'use client';

import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { useTranslation } from '../../lib/i18n-client';
import { HEADER_CONTACT_PICKER_DROPDOWN_Z_CLASS } from './header.constants';
import {
  HEADER_SOCIAL_MENU_MIN_WIDTH_CLASS,
  type HeaderSocialAccount,
} from './header-social-accounts.constants';

const MENU_ITEM_CLASS =
  'block px-4 py-2.5 text-left text-marco-black hover:bg-marco-gray/80 dark:text-white dark:hover:bg-white/10';

const MENU_ITEM_LABEL_CLASS = 'block whitespace-nowrap text-sm font-medium';

const MENU_ITEM_SUBTITLE_CLASS =
  'mt-0.5 block whitespace-nowrap text-xs font-normal text-marco-text/70 dark:text-white/55';

type MenuPlacement = 'below' | 'above' | 'above-start';

interface HeaderSocialAccountsDropdownProps {
  triggerClassName: string;
  children: ReactNode;
  accounts: readonly HeaderSocialAccount[];
  ariaLabel: string;
  menuPlacement?: MenuPlacement;
  onOpenChange?: (open: boolean) => void;
}

function socialMenuPanelClass(placement: MenuPlacement): string {
  const base = `absolute ${HEADER_CONTACT_PICKER_DROPDOWN_Z_CLASS} w-max ${HEADER_SOCIAL_MENU_MIN_WIDTH_CLASS} overflow-hidden rounded-xl border border-gray-200/90 bg-white py-1.5 shadow-xl dark:border-white/15 dark:bg-[var(--app-bg)]`;
  if (placement === 'above') {
    return `${base} bottom-full left-1/2 mb-2 -translate-x-1/2`;
  }
  if (placement === 'above-start') {
    return `${base} bottom-full left-0 mb-2`;
  }
  return `${base} left-0 top-full mt-2`;
}

function useDismissibleMenu(
  open: boolean,
  setOpen: (open: boolean) => void,
  rootRef: RefObject<HTMLDivElement | null>,
): void {
  useEffect(() => {
    if (!open) {
      return;
    }

    const onDocMouse = (event: MouseEvent) => {
      const node = event.target;
      if (!(node instanceof Node) || rootRef.current?.contains(node)) {
        return;
      }
      setOpen(false);
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onDocMouse);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocMouse);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, rootRef, setOpen]);
}

/** Social circle that opens a multi-account menu instead of a single profile link. */
export function HeaderSocialAccountsDropdown({
  triggerClassName,
  children,
  accounts,
  ariaLabel,
  menuPlacement = 'below',
  onOpenChange,
}: HeaderSocialAccountsDropdownProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useDismissibleMenu(open, setOpen, rootRef);

  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;

  useEffect(() => {
    onOpenChangeRef.current?.(open);
  }, [open]);

  useEffect(() => {
    return () => onOpenChangeRef.current?.(false);
  }, []);

  return (
    <div ref={rootRef} className="relative" role="listitem">
      <button
        type="button"
        className={triggerClassName}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={ariaLabel}
        onClick={() => setOpen((current) => !current)}
      >
        {children}
      </button>
      {open ? (
        <div className={socialMenuPanelClass(menuPlacement)} role="menu" aria-label={ariaLabel}>
          {accounts.map((account) => (
            <a
              key={account.id}
              role="menuitem"
              href={account.href}
              target="_blank"
              rel="noopener noreferrer"
              className={MENU_ITEM_CLASS}
              onClick={() => setOpen(false)}
            >
              <span className={MENU_ITEM_LABEL_CLASS}>{t(account.labelKey)}</span>
              {account.subtitle ? (
                <span className={MENU_ITEM_SUBTITLE_CLASS}>{account.subtitle}</span>
              ) : null}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}
