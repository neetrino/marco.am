'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, MapPin, Phone } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type Ref } from 'react';
import { useTranslation } from '../../lib/i18n-client';
import {
  contactLocationMapHref,
  getContactLocations,
  phoneToTelHref,
} from '../../lib/contact-locations';
import {
  HEADER_FIGMA_CONTACT_ADDRESS_ICON_TEXT_GAP_CLASS,
  HEADER_FIGMA_CONTACT_PHONE_ICON_TEXT_GAP_CLASS,
} from './header.constants';

const DROPDOWN_PANEL_CLASS =
  'absolute right-0 top-full z-[70] mt-2 max-h-[min(24rem,70vh)] w-[min(20rem,calc(100vw-2rem))] overflow-y-auto overflow-x-hidden rounded-xl border border-gray-200/90 bg-white py-2 shadow-xl dark:border-white/15 dark:bg-[var(--app-bg)]';

const TRIGGER_BASE_CLASS =
  'flex h-10 shrink-0 items-center text-marco-text transition-colors hover:text-marco-black dark:text-white/82 dark:hover:text-white';

type PhonePickerProps = {
  pickerRef: Ref<HTMLDivElement>;
  open: boolean;
  onToggle: () => void;
  phoneDisplay: string;
  locations: ReturnType<typeof getContactLocations>;
  triggerClassName: string;
};

function HeaderDesktopPhonePicker({
  pickerRef,
  open,
  onToggle,
  phoneDisplay,
  locations,
  triggerClassName,
}: PhonePickerProps) {
  const { t } = useTranslation();

  return (
    <div ref={pickerRef} className="relative shrink-0">
      <button
        type="button"
        className={triggerClassName}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t('common.ariaLabels.headerChoosePhone')}
        onClick={onToggle}
      >
        <Phone className="size-[19px] shrink-0" strokeWidth={1.75} aria-hidden />
        <span className="inline-flex items-center gap-1">
          <span className="whitespace-nowrap text-[13px] font-medium leading-[13px]">
            {phoneDisplay || t('common.navigation.contact')}
          </span>
          <ChevronDown
            className={`h-3 w-3 shrink-0 text-marco-text opacity-80 transition-transform dark:text-white/70 ${open ? 'rotate-180' : ''}`}
            strokeWidth={2.25}
            aria-hidden
          />
        </span>
      </button>
      {open ? (
        <div
          className={DROPDOWN_PANEL_CLASS}
          role="menu"
          aria-label={t('common.ariaLabels.headerChoosePhone')}
        >
          {locations.map((loc, idx) => (
            <div
              key={loc.id}
              className={`px-3 py-2 ${idx > 0 ? 'border-t border-gray-100 pt-3 dark:border-white/10' : ''}`}
            >
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-marco-text/70 dark:text-white/55">
                {loc.address}
              </p>
              <ul className="flex flex-col gap-0.5">
                {loc.phones.map((phone) => (
                  <li key={`${loc.id}-${phone}`}>
                    <a
                      role="menuitem"
                      href={phoneToTelHref(phone)}
                      className="block rounded-md px-2 py-1.5 text-[13px] font-medium text-marco-black hover:bg-marco-gray/80 dark:text-white dark:hover:bg-white/10"
                    >
                      {phone}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

type AddressPickerProps = {
  pickerRef: Ref<HTMLDivElement>;
  open: boolean;
  onToggle: () => void;
  locations: ReturnType<typeof getContactLocations>;
  triggerClassName: string;
  storesLabel: string;
  mapLinkAriaLabel: string;
  chooseAddressAria: string;
};

function HeaderDesktopAddressPicker({
  pickerRef,
  open,
  onToggle,
  locations,
  triggerClassName,
  storesLabel,
  mapLinkAriaLabel,
  chooseAddressAria,
}: AddressPickerProps) {
  const { t } = useTranslation();

  return (
    <div ref={pickerRef} className="relative shrink-0">
      <button
        type="button"
        className={triggerClassName}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={chooseAddressAria}
        onClick={onToggle}
      >
        <MapPin className="size-[19px] shrink-0" strokeWidth={1.75} aria-hidden />
        <span className="inline-flex items-center gap-1">
          <span className="whitespace-nowrap text-xs font-medium leading-[13px]">
            {t('common.navigation.addresses')}
          </span>
          <ChevronDown
            className={`h-3 w-3 shrink-0 text-marco-text opacity-80 transition-transform dark:text-white/70 ${open ? 'rotate-180' : ''}`}
            strokeWidth={2.25}
            aria-hidden
          />
        </span>
      </button>
      {open ? (
        <div className={DROPDOWN_PANEL_CLASS} role="menu" aria-label={chooseAddressAria}>
          <ul className="flex flex-col gap-0.5 px-2 pb-1">
            {locations.map((loc) => (
              <li key={loc.id} className="rounded-lg border border-transparent">
                <Link
                  role="menuitem"
                  href={contactLocationMapHref(loc.id)}
                  aria-label={mapLinkAriaLabel}
                  className="mx-1 mb-1 mt-1 block rounded-md px-2 py-2 text-left text-xs font-medium leading-snug text-marco-text no-underline transition-colors hover:bg-marco-gray/80 hover:text-marco-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-marco-black/25 dark:text-white/88 dark:hover:bg-white/10 dark:hover:text-white dark:focus-visible:outline-white/30"
                >
                  {loc.address}
                </Link>
              </li>
            ))}
          </ul>
          <div className="border-t border-gray-100 px-2 py-2 dark:border-white/10">
            <Link
              href="/stores"
              role="menuitem"
              className="block rounded-md px-2 py-1.5 text-center text-xs font-bold uppercase tracking-wide text-marco-black hover:bg-marco-gray/80 dark:text-white dark:hover:bg-white/10"
            >
              {storesLabel}
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function HeaderDesktopContactPickers() {
  const pathname = usePathname();
  const { t, lang } = useTranslation();
  const locations = useMemo(() => getContactLocations(lang), [lang]);
  const phoneDisplay = t('contact.phone').trim();
  const [openMenu, setOpenMenu] = useState<'phone' | 'address' | null>(null);
  const phoneRef = useRef<HTMLDivElement | null>(null);
  const addressRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setOpenMenu(null);
  }, [pathname]);

  useEffect(() => {
    const onHash = () => setOpenMenu(null);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    if (!openMenu) {
      return;
    }

    const onDocMouse = (e: MouseEvent) => {
      const node = e.target;
      if (!(node instanceof Node)) {
        return;
      }
      if (phoneRef.current?.contains(node) || addressRef.current?.contains(node)) {
        return;
      }
      setOpenMenu(null);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenMenu(null);
      }
    };

    document.addEventListener('mousedown', onDocMouse);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocMouse);
      document.removeEventListener('keydown', onKey);
    };
  }, [openMenu]);

  return (
    <>
      <HeaderDesktopPhonePicker
        pickerRef={phoneRef}
        open={openMenu === 'phone'}
        onToggle={() => setOpenMenu((m) => (m === 'phone' ? null : 'phone'))}
        phoneDisplay={phoneDisplay}
        locations={locations}
        triggerClassName={`${TRIGGER_BASE_CLASS} ${HEADER_FIGMA_CONTACT_PHONE_ICON_TEXT_GAP_CLASS}`}
      />
      <HeaderDesktopAddressPicker
        pickerRef={addressRef}
        open={openMenu === 'address'}
        onToggle={() => setOpenMenu((m) => (m === 'address' ? null : 'address'))}
        locations={locations}
        triggerClassName={`${TRIGGER_BASE_CLASS} ${HEADER_FIGMA_CONTACT_ADDRESS_ICON_TEXT_GAP_CLASS}`}
        storesLabel={t('common.navigation.stores')}
        mapLinkAriaLabel={t('common.navigation.openInMaps')}
        chooseAddressAria={t('common.ariaLabels.headerChooseAddress')}
      />
    </>
  );
}
