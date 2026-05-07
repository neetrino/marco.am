'use client';

import { useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  ChevronRight,
  Clapperboard,
  Mail,
  Phone,
  ShoppingBag,
  Tag,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { MOBILE_FLOOR_NAV_HREFS } from '../mobile-bottom-nav.constants';
import { LanguagePreferenceContext } from '../../lib/language-context';
import { HeaderSocialCircleLinks } from './HeaderSocialCircleLinks';
import { useShouldHideHeaderSocialLinks } from './useShouldHideHeaderSocialLinks';
import { isPrimaryNavHrefActive, primaryNavLinks, type PrimaryNavLink } from './nav-config';
import { ThemeToggleButton } from '../theme/ThemeToggleButton';
import { useTheme } from '../theme/ThemeProvider';
import type { useHeaderData } from './useHeaderData';
import {
  contactLocationMapHref,
  getContactLocations,
  phoneToTelHref,
  type ContactLocationId,
} from '../../lib/contact-locations';
import {
  MOBILE_DRAWER_CLOSE_BTN_CLASS,
  MOBILE_DRAWER_CONTACT_COMPACT_CLASS,
  MOBILE_DRAWER_CTA_COMPACT_CLASS,
  MOBILE_DRAWER_CTA_PILL_CLASS,
  MOBILE_DRAWER_MENU_HEADER_ROW_CLASS,
  MOBILE_DRAWER_CONTENT_MAX_CLASS,
  MOBILE_DRAWER_PANEL_CLASS,
  mobileDrawerCompactPillClass,
  mobileDrawerNavPillClass,
} from './header-mobile-drawer.classes';

type Props = {
  data: ReturnType<typeof useHeaderData>;
  compactPrimaryNav: boolean;
};

const PRIMARY_NAV_ICONS: Record<string, LucideIcon> = {
  'common.navigation.about': Building2,
  'common.navigation.shop': ShoppingBag,
  'common.navigation.brands': Tag,
  'common.navigation.contact': Mail,
  'common.navigation.reels': Clapperboard,
};

function PrimaryNavRowIcon({ translationKey }: { translationKey: string }) {
  const Icon = PRIMARY_NAV_ICONS[translationKey];
  if (!Icon) {
    return null;
  }
  return <Icon className="h-6 w-6 shrink-0" size={24} strokeWidth={2} aria-hidden />;
}

function renderPrimaryNavLink(
  link: PrimaryNavLink,
  pathname: string,
  t: (key: string) => string,
  onClose: () => void,
  rowClass: string
) {
  const active = isPrimaryNavHrefActive(pathname, link.href);
  const content = (
    <>
      <span className="flex min-w-0 flex-1 items-center gap-3.5">
        <PrimaryNavRowIcon translationKey={link.translationKey} />
        <span className="truncate">{t(link.translationKey)}</span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 opacity-50" aria-hidden />
    </>
  );
  if (link.external === true) {
    return (
      <a
        key={link.translationKey}
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClose}
        className={rowClass}
        aria-current={active ? 'page' : undefined}
      >
        {content}
      </a>
    );
  }
  return (
    <Link
      key={link.translationKey}
      href={link.href}
      onClick={onClose}
      className={rowClass}
      aria-current={active ? 'page' : undefined}
    >
      {content}
    </Link>
  );
}

export function HeaderMobileDrawer({ data, compactPrimaryNav }: Props) {
  const pathname = usePathname() ?? '';
  const { theme, mounted: themeMounted } = useTheme();
  const drawerThemeDark = themeMounted && theme === 'dark';
  const lang = useContext(LanguagePreferenceContext);
  const [callFlow, setCallFlow] = useState<'idle' | 'branches' | 'phones'>('idle');
  const [callBranchId, setCallBranchId] = useState<ContactLocationId | null>(null);
  const hideHeaderSocialLinks = useShouldHideHeaderSocialLinks();
  const {
    t,
    mobileMenuOpen,
    setMobileMenuOpen,
    isLoggedIn,
    isAdmin,
    currentYear,
  } = data;
  const floorNavHrefSet = new Set<string>(MOBILE_FLOOR_NAV_HREFS);
  const drawerPrimaryNavLinks = primaryNavLinks.filter((link) => !floorNavHrefSet.has(link.href));
  const reelsLink = drawerPrimaryNavLinks.find((l) => l.translationKey === 'common.navigation.reels');
  const otherPrimaryLinks = drawerPrimaryNavLinks.filter(
    (l) =>
      l.translationKey !== 'common.navigation.reels' &&
      l.translationKey !== 'common.navigation.shop'
  );
  const closeDrawer = () => setMobileMenuOpen(false);

  useEffect(() => {
    if (!mobileMenuOpen) {
      setCallFlow('idle');
      setCallBranchId(null);
    }
  }, [mobileMenuOpen]);

  useEffect(() => {
    document.body.dataset.mobileMenuOpen = mobileMenuOpen ? 'true' : 'false';
    return () => {
      delete document.body.dataset.mobileMenuOpen;
    };
  }, [mobileMenuOpen]);

  if (!mobileMenuOpen) {
    return null;
  }

  const contactLocations = getContactLocations(lang);
  const callSelectedLocation =
    callFlow === 'phones' && callBranchId !== null
      ? (contactLocations.find((l) => l.id === callBranchId) ?? null)
      : null;

  const drawer = (
    <div
      className={`pointer-events-auto fixed inset-0 z-[200] ${MOBILE_DRAWER_PANEL_CLASS} ${compactPrimaryNav ? '' : 'md:hidden'}`}
      role="dialog"
      aria-modal="true"
    >
        <div
          className="relative flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-y-contain px-3 min-[400px]:px-4"
        >
            <div className="flex flex-col gap-y-[clamp(0.35rem,1.2dvh,0.75rem)] pb-2 text-marco-black dark:text-white">
              <div className={MOBILE_DRAWER_MENU_HEADER_ROW_CLASS}>
                <h2 className="text-base font-bold text-marco-black dark:text-white">
                  {t('common.menu.title')}
                </h2>
                <button
                  type="button"
                  onClick={closeDrawer}
                  className={`${MOBILE_DRAWER_CLOSE_BTN_CLASS} absolute right-0 top-1/2 -translate-y-1/2`}
                  aria-label={t('common.ariaLabels.closeMenu')}
                >
                  <svg className="mx-auto h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className={`${MOBILE_DRAWER_CONTENT_MAX_CLASS} flex flex-col`}>
            <nav
              className="flex flex-col gap-y-[clamp(0.3rem,1.1dvh,0.5rem)]"
              aria-label={t('common.menu.title')}
            >
              {otherPrimaryLinks.map((link) =>
                renderPrimaryNavLink(
                  link,
                  pathname,
                  t,
                  closeDrawer,
                  mobileDrawerNavPillClass(isPrimaryNavHrefActive(pathname, link.href))
                )
              )}

              {reelsLink
                ? renderPrimaryNavLink(
                    reelsLink,
                    pathname,
                    t,
                    closeDrawer,
                    mobileDrawerNavPillClass(isPrimaryNavHrefActive(pathname, reelsLink.href))
                  )
                : null}

              <div className="overflow-hidden rounded-full border border-marco-black/12 dark:border-white/12">
                <ThemeToggleButton
                  className={
                    drawerThemeDark
                      ? 'flex min-h-[3.5rem] w-full items-center justify-between bg-zinc-900 px-6 py-3.5 text-left text-white transition-[background-color] duration-200 hover:bg-zinc-800'
                      : 'flex min-h-[3.5rem] w-full items-center justify-between bg-marco-gray px-6 py-3.5 text-left text-marco-black transition-[background-color] duration-200 hover:bg-marco-border dark:bg-zinc-800 dark:text-white'
                  }
                  iconClassName="h-6 w-6 shrink-0"
                  labelClassName="text-xs font-bold uppercase tracking-wide"
                  showLabel
                />
              </div>

              {isLoggedIn ? (
                <>
                  {isAdmin ? (
                    <Link
                      href="/supersudo"
                      onClick={closeDrawer}
                      className="flex min-h-[3.5rem] w-full items-center justify-between gap-3.5 rounded-full border-2 border-blue-600 bg-transparent px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wide text-blue-700 transition-colors hover:bg-blue-50 dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-950/40"
                    >
                      <span>{t('common.navigation.adminPanel')}</span>
                      <ChevronRight className="h-5 w-5 shrink-0" aria-hidden />
                    </Link>
                  ) : null}
                </>
              ) : (
                <>
                  <Link
                    href="/register"
                    onClick={closeDrawer}
                    className={MOBILE_DRAWER_CTA_PILL_CLASS}
                  >
                    {t('register.form.createAccount')}
                  </Link>
                  <Link
                    href="/login"
                    onClick={closeDrawer}
                    className={`${mobileDrawerNavPillClass(false)} normal-case font-semibold`}
                  >
                    <span>{t('common.navigation.login')}</span>
                    <ChevronRight className="h-5 w-5 shrink-0 opacity-50" aria-hidden />
                  </Link>
                </>
              )}
            </nav>

              <footer className="flex shrink-0 flex-col">
                {!hideHeaderSocialLinks ? (
                  <div className="mt-5 flex shrink-0 justify-center pb-2 pt-1 sm:mt-6">
                    <HeaderSocialCircleLinks comfortableTouch />
                  </div>
                ) : null}

                <div className="w-full space-y-3 border-t border-marco-black/10 px-0 pb-2 pt-3 dark:border-white/10">
                  {callFlow === 'idle' ? (
                    <>
                      <p className="text-center text-[11px] font-bold uppercase tracking-wide text-marco-black dark:text-white">
                        {t('contact.pageTitle')}
                      </p>
                      <p className="text-center text-[10px] leading-snug text-marco-text/75 dark:text-zinc-400">
                        {t('contact.callToUs.description')}
                      </p>
                      <button
                        type="button"
                        onClick={() => setCallFlow('branches')}
                        className={MOBILE_DRAWER_CTA_COMPACT_CLASS}
                      >
                        <Phone className="h-5 w-5 shrink-0" strokeWidth={2} aria-hidden />
                        <span>{t('contact.drawerCall.cta')}</span>
                      </button>
                    </>
                  ) : (
                    <div className="space-y-2.5" role="region" aria-label={t('contact.drawerCall.cta')}>
                      {callFlow === 'branches' ? (
                        <div className="space-y-2.5">
                          <p className="text-center text-[11px] font-bold uppercase leading-tight tracking-wide text-marco-black dark:text-white">
                            {t('contact.drawerCall.chooseBranchTitle')}
                          </p>
                          <div className="flex flex-col gap-2">
                            {contactLocations.map((loc) => (
                              <button
                                key={loc.id}
                                type="button"
                                onClick={() => {
                                  setCallBranchId(loc.id);
                                  setCallFlow('phones');
                                }}
                                className={mobileDrawerCompactPillClass(false)}
                              >
                                <span className="min-w-0 flex-1 whitespace-normal text-left leading-snug">
                                  {loc.address}
                                </span>
                                <ChevronRight className="h-5 w-5 shrink-0 opacity-50" aria-hidden />
                              </button>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => setCallFlow('idle')}
                            className="w-full py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-marco-text/75 underline-offset-2 hover:text-marco-black hover:underline dark:text-zinc-400 dark:hover:text-white"
                          >
                            {t('contact.drawerCall.cancel')}
                          </button>
                        </div>
                      ) : null}

                      {callSelectedLocation ? (
                        <div className="space-y-2.5">
                          <p className="text-left text-xs font-bold leading-snug text-marco-black dark:text-white">
                            {callSelectedLocation.address}
                          </p>
                          <Link
                            href={contactLocationMapHref(callSelectedLocation.id)}
                            onClick={closeDrawer}
                            className="inline-flex text-[10px] font-semibold uppercase tracking-wide text-marco-yellow underline-offset-2 hover:underline"
                          >
                            {t('contact.mapSectionTitle')}
                          </Link>
                          <div className="flex flex-col gap-2">
                            {callSelectedLocation.phones.map((phone) => (
                              <a
                                key={`${callSelectedLocation.id}-${phone}`}
                                href={phoneToTelHref(phone)}
                                onClick={closeDrawer}
                                className={`${MOBILE_DRAWER_CONTACT_COMPACT_CLASS} normal-case`}
                                aria-label={`${callSelectedLocation.address} — ${phone}`}
                              >
                                <Phone className="h-6 w-6 shrink-0" strokeWidth={2} aria-hidden />
                                <span>{phone}</span>
                              </a>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setCallBranchId(null);
                              setCallFlow('branches');
                            }}
                            className={mobileDrawerCompactPillClass(false, true)}
                          >
                            {t('contact.drawerCall.changeBranch')}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>

                <div className="border-t border-marco-black/10 py-3 text-center text-[10px] font-medium uppercase tracking-wide text-marco-text/60 dark:border-white/10 dark:text-zinc-500">
                  © {currentYear} MARCO GROUP
                </div>
              </footer>
              </div>
            </div>
        </div>
    </div>
  );

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(drawer, document.body);
}
